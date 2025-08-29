// src/controllers/driver.controller.js
const { Op, fn, col } = require('sequelize');
const {
  sequelize,
  Usuario,
  Vehiculo,
  ConductorRating, // asegúrate de exportarlo en models/index.js
} = require('../models');

/**
 * GET /api/conductores
 * Lista conductores con ≥1 vehículo.
 * Query opcional: ?q=texto
 */
const listConductoresConVehiculo = async (req, res) => {
  try {
    const { q } = req.query;

    const whereUsuario = { tipo_usuario: { [Op.iLike]: 'conductor' } };
    if (q && String(q).trim()) {
      const term = `%${String(q).trim()}%`;
      whereUsuario[Op.or] = [
        { nombre: { [Op.iLike]: term } },
        { apellido: { [Op.iLike]: term } },
        { correo_institucional: { [Op.iLike]: term } },
      ];
    }

    const conductores = await Usuario.findAll({
      where: whereUsuario,
      attributes: [
        'id_usuario',
        'nombre',
        'apellido',
        'telefono',
        'correo_institucional',
        'tipo_usuario',
        // opcionalmente traer cache global:
        'calif_conductor_avg',
        'calif_conductor_count',
      ],
      include: [
        {
          model: Vehiculo,
          as: 'vehiculos',
          required: true,
          attributes: ['id_vehiculo', 'marca', 'modelo', 'placa', 'color', 'capacidad_pasajeros'],
        },
      ],
      order: [['nombre', 'ASC'], ['apellido', 'ASC']],
      limit: 100,
    });

    res.json({ data: conductores });
  } catch (err) {
    console.error('❌ Error en listConductoresConVehiculo:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

/**
 * GET /api/conductores/:id
 * Perfil público de un conductor (≥1 vehículo).
 */
const getDriverPublicProfile = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Parámetro id inválido' });
    }

    const conductor = await Usuario.findOne({
      where: { id_usuario: id, tipo_usuario: { [Op.iLike]: 'conductor' } },
      attributes: [
        'id_usuario',
        'nombre',
        'apellido',
        'telefono',
        'correo_institucional',
        'tipo_usuario',
        // cache global visible en perfil:
        'calif_conductor_avg',
        'calif_conductor_count',
      ],
      include: [
        {
          model: Vehiculo,
          as: 'vehiculos',
          required: true,
          attributes: ['id_vehiculo', 'marca', 'modelo', 'placa', 'color', 'capacidad_pasajeros'],
        },
      ],
      order: [[{ model: Vehiculo, as: 'vehiculos' }, 'id_vehiculo', 'DESC']],
    });

    if (!conductor) {
      return res.status(404).json({ error: 'Conductor no encontrado o sin vehículos' });
    }

    res.json({ data: conductor });
  } catch (err) {
    console.error('❌ Error en getDriverPublicProfile:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

/* ============================================================
   CALIFICACIONES GLOBALES (sin dependencia de viaje/grupo)
   Endpoints:
   - POST /api/conductores/:id/calificar
   - GET  /api/conductores/:id/calificacion-resumen
   - GET  /api/conductores/:id/calificaciones?limit=&offset=
   ============================================================ */

/**
 * POST /api/conductores/:id/calificar
 * Body: { pasajero_id: number, puntuacion: 1..5, comentario?: string }
 * - Regla: pasajero_id != conductor_id
 * - Un pasajero solo tiene una calificación por conductor (unique),
 *   si ya existe se ACTUALIZA (upsert-friendly UX).
 */
const rateDriverSimple = async (req, res) => {
  try {
    const conductorId = Number(req.params.id);
    const pasajeroId = Number(req.body?.pasajero_id);
    const puntuacion = Number(req.body?.puntuacion);
    const comentario = req.body?.comentario?.toString()?.trim() || null;

    if (!Number.isInteger(conductorId) || conductorId <= 0) {
      return res.status(400).json({ error: 'Parámetro id inválido' });
    }
    if (!Number.isInteger(pasajeroId) || pasajeroId <= 0) {
      return res.status(400).json({ error: 'pasajero_id inválido' });
    }
    if (!Number.isInteger(puntuacion) || puntuacion < 1 || puntuacion > 5) {
      return res.status(400).json({ error: 'puntuacion debe ser entero 1..5' });
    }
    if (conductorId === pasajeroId) {
      return res.status(400).json({ error: 'No puedes calificarte a ti mismo' });
    }

    // Validar que el objetivo sea conductor
    const exists = await Usuario.count({
      where: { id_usuario: conductorId, tipo_usuario: { [Op.iLike]: 'conductor' } },
    });
    if (!exists) {
      return res.status(404).json({ error: 'Conductor no encontrado' });
    }

    // Upsert manual: si existe, actualiza; si no, crea.
    const prev = await ConductorRating.findOne({
      where: { conductor_id: conductorId, pasajero_id: pasajeroId },
    });

    if (prev) {
      await prev.update({ puntuacion, comentario });
      return res.status(200).json({ data: prev }); // devuelve la fila actualizada
    }

    const created = await ConductorRating.create({
      conductor_id: conductorId,
      pasajero_id: pasajeroId,
      puntuacion,
      comentario,
    });

    // Nota: el trigger en DB recalcula cache en usuario (avg/count)
    return res.status(201).json({ data: created });
  } catch (err) {
    // Si llegase a golpear la unique y no pasó por prev (race), retornar 409 amigable
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Ya calificaste a este conductor. Puedes actualizar tu calificación.' });
    }
    console.error('❌ Error en rateDriverSimple:', err);
    return res.status(500).json({ error: 'Error del servidor al calificar' });
  }
};

/**
 * GET /api/conductores/:id/calificacion-resumen
 * Devuelve { promedio, total } desde el CACHE de usuario (rápido).
 * Si prefieres cálculo en vivo, puedes leer de ConductorRating con AVG/COUNT.
 */
const getDriverRatingSummary = async (req, res) => {
  try {
    const conductorId = Number(req.params.id);
    if (!Number.isInteger(conductorId) || conductorId <= 0) {
      return res.status(400).json({ error: 'Parámetro id inválido' });
    }

    const row = await Usuario.findOne({
      where: { id_usuario: conductorId },
      attributes: ['calif_conductor_avg', 'calif_conductor_count'],
      raw: true,
    });

    const promedio = Number(row?.calif_conductor_avg ?? 0);
    const total = Number(row?.calif_conductor_count ?? 0);

    return res.json({ promedio, total });
  } catch (err) {
    console.error('❌ Error en getDriverRatingSummary:', err);
    return res.status(500).json({ error: 'Error del servidor' });
  }
};

/**
 * GET /api/conductores/:id/calificaciones?limit=&offset=
 * Lista calificaciones (join con pasajero para nombre/apellido).
 */
const listDriverRatings = async (req, res) => {
  try {
    const conductorId = Number(req.params.id);
    const limit = Number(req.query.limit ?? 20);
    const offset = Number(req.query.offset ?? 0);

    if (!Number.isInteger(conductorId) || conductorId <= 0) {
      return res.status(400).json({ error: 'Parámetro id inválido' });
    }

    const limitSafe = Number.isInteger(limit) && limit > 0 ? limit : 20;
    const offsetSafe = Number.isInteger(offset) && offset >= 0 ? offset : 0;

    const { rows, count } = await ConductorRating.findAndCountAll({
      where: { conductor_id: conductorId },
      attributes: [
        'id_conductor_rating',
        'conductor_id',
        'pasajero_id',
        'puntuacion',
        'comentario',
        'created_at',
      ],
      include: [
        {
          model: Usuario,
          as: 'pasajero', // debe existir la asociación en models/index.js
          attributes: ['id_usuario', 'nombre', 'apellido'],
          required: false,
        },
      ],
      order: [['created_at', 'DESC']],
      limit: limitSafe,
      offset: offsetSafe,
    });

    return res.json({
      total: count,
      limit: limitSafe,
      offset: offsetSafe,
      data: rows.map((r) => ({
        id_calificacion: r.id_conductor_rating,
        conductor_id: r.conductor_id,
        pasajero_id: r.pasajero_id,
        puntuacion: r.puntuacion,
        comentario: r.comentario,
        created_at: r.created_at,
        pasajero: r.pasajero
          ? {
              id_usuario: r.pasajero.id_usuario,
              nombre: r.pasajero.nombre,
              apellido: r.pasajero.apellido,
            }
          : null,
      })),
    });
  } catch (err) {
    console.error('❌ Error en listDriverRatings:', err);
    return res.status(500).json({ error: 'Error del servidor' });
  }
};

module.exports = {
  listConductoresConVehiculo,
  getDriverPublicProfile,
  rateDriverSimple,
  getDriverRatingSummary,
  listDriverRatings,
};