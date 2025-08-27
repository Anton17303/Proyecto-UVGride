// src/controllers/grupo.controller.js
const { Op } = require('sequelize');
const { sequelize, Usuario, Vehiculo, GrupoViaje, GrupoMiembro } = require('../models');

/* Utils */
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const toNumInt = (v) => {
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
};
const toDateOrNull = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * POST /api/grupos
 * body: { conductor_id, destino_nombre, lat_destino?, lon_destino?, cupos_totales, fecha_salida?, costo_estimado?, notas?, id_viaje_maestro? }
 */
exports.crearGrupo = async (req, res) => {
  const {
    conductor_id,
    destino_nombre,
    lat_destino,
    lon_destino,
    cupos_totales,
    fecha_salida,
    costo_estimado,
    notas,
    id_viaje_maestro,
  } = req.body || {};

  // Validaciones base
  const _conductorId = toNumInt(conductor_id);
  const _cupos = toNumInt(cupos_totales);

  if (!_conductorId || !_cupos || !_cupos > 0 || !destino_nombre?.trim()) {
    return res.status(400).json({
      error: 'conductor_id, destino_nombre y cupos_totales (>0) son requeridos',
    });
  }

  const _lat = lat_destino != null ? toNum(lat_destino) : null;
  const _lon = lon_destino != null ? toNum(lon_destino) : null;
  if ((_lat !== null && (_lat < -90 || _lat > 90)) || (_lon !== null && (_lon < -180 || _lon > 180))) {
    return res.status(400).json({ error: 'Coordenadas destino inválidas' });
  }

  const _fechaSalida = toDateOrNull(fecha_salida);
  if (fecha_salida && !_fechaSalida) {
    return res.status(400).json({ error: 'fecha_salida inválida (use ISO o fecha válida)' });
  }

  const _costo = costo_estimado != null ? toNum(costo_estimado) : null;
  if (costo_estimado != null && _costo === null) {
    return res.status(400).json({ error: 'costo_estimado inválido' });
  }

  const t = await sequelize.transaction();
  try {
    // Verificar que sea conductor con >=1 vehículo
    const conductor = await Usuario.findOne({
      where: { id_usuario: _conductorId, tipo_usuario: { [Op.iLike]: 'conductor' } },
      include: [{ model: Vehiculo, as: 'vehiculos', required: true, attributes: ['id_vehiculo'] }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!conductor) {
      await t.rollback();
      return res.status(400).json({ error: 'Conductor inválido o sin vehículos registrados' });
    }

    // Crear grupo
    const grupo = await GrupoViaje.create(
      {
        conductor_id: _conductorId,
        id_viaje_maestro: id_viaje_maestro || null,
        destino_nombre: destino_nombre.trim(),
        lat_destino: _lat,
        lon_destino: _lon,
        cupos_totales: _cupos,
        cupos_disponibles: _cupos, // comenzamos con todos
        costo_estimado: _costo,
        estado: 'abierto',
        fecha_salida: _fechaSalida,
        notas: notas || null,
      },
      { transaction: t }
    );

    // Registrar conductor como miembro
    await GrupoMiembro.create(
      {
        id_grupo: grupo.id_grupo,
        id_usuario: _conductorId,
        rol: 'conductor',
        estado: 'activo',
        monto_acordado: null,
      },
      { transaction: t }
    );

    // Descontar cupo por el conductor (si tu lógica así lo define)
    const newCupos = Math.max(0, _cupos - 1);
    await grupo.update({ cupos_disponibles: newCupos }, { transaction: t });

    await t.commit();
    return res.status(201).json({ message: 'Grupo creado correctamente', data: grupo });
  } catch (err) {
    await t.rollback();
    console.error('❌ Error creando grupo:', err);
    return res.status(500).json({ error: 'Error interno al crear el grupo' });
  }
};

/**
 * GET /api/grupos?estado=abierto|en_curso|cerrado|cancelado&q=texto
 * Lista grupos con datos del conductor y un vehículo (limit 1).
 */
exports.listarGrupos = async (req, res) => {
  try {
    const estado = req.query.estado ? String(req.query.estado) : 'abierto';
    const q = req.query.q ? String(req.query.q).trim() : '';

    const where = { estado };
    const whereConductor = {};
    if (q) {
      const term = `%${q}%`;
      // búsqueda por destino o nombre/apellido del conductor
      where[Op.or] = [{ destino_nombre: { [Op.iLike]: term } }];
      whereConductor[Op.or] = [{ nombre: { [Op.iLike]: term } }, { apellido: { [Op.iLike]: term } }];
    }

    const grupos = await GrupoViaje.findAll({
      where,
      order: [
        ['fecha_salida', 'ASC'],
        ['id_grupo', 'DESC'],
      ],
      attributes: [
        'id_grupo',
        'destino_nombre',
        'lat_destino',
        'lon_destino',
        'cupos_totales',
        'cupos_disponibles',
        'costo_estimado',
        'estado',
        'fecha_salida',
        'conductor_id',
      ],
      include: [
        {
          model: Usuario,
          as: 'conductor',
          where: whereConductor,
          required: true,
          attributes: ['id_usuario', 'nombre', 'apellido', 'telefono', 'tipo_usuario'],
          include: [
            {
              model: Vehiculo,
              as: 'vehiculos',
              attributes: ['id_vehiculo', 'marca', 'modelo', 'placa', 'color', 'capacidad_pasajeros'],
              required: true,
              separate: true,
              limit: 1, // un vehículo para mostrar en card
            },
          ],
        },
      ],
    });

    return res.json({ data: grupos });
  } catch (err) {
    console.error('❌ Error listando grupos:', err);
    return res.status(500).json({ error: 'Error interno al listar grupos' });
  }
};

/**
 * GET /api/grupos/:id
 * Detalle del grupo + conductor + miembros
 */
exports.obtenerGrupo = async (req, res) => {
  try {
    const id = req.grupoId ?? toNumInt(req.params.id);
    if (!id) return res.status(400).json({ error: 'Parámetro id inválido' });

    const grupo = await GrupoViaje.findByPk(id, {
      attributes: [
        'id_grupo',
        'destino_nombre',
        'lat_destino',
        'lon_destino',
        'cupos_totales',
        'cupos_disponibles',
        'costo_estimado',
        'estado',
        'fecha_salida',
        'conductor_id',
        'notas',
      ],
      include: [
        {
          model: Usuario,
          as: 'conductor',
          attributes: ['id_usuario', 'nombre', 'apellido', 'telefono'],
          include: [
            {
              model: Vehiculo,
              as: 'vehiculos',
              attributes: ['id_vehiculo', 'marca', 'modelo', 'placa', 'color', 'capacidad_pasajeros'],
              separate: true,
              limit: 1,
            },
          ],
        },
        {
          model: GrupoMiembro,
          as: 'miembros',
          attributes: ['id_grupo_miembro', 'id_usuario', 'rol', 'estado', 'monto_acordado', 'fecha_union'],
          include: [
            {
              model: Usuario,
              as: 'usuario',
              attributes: ['id_usuario', 'nombre', 'apellido', 'telefono'],
            },
          ],
        },
      ],
    });

    if (!grupo) return res.status(404).json({ error: 'Grupo no encontrado' });

    return res.json({ data: grupo });
  } catch (err) {
    console.error('❌ Error obteniendo grupo:', err);
    return res.status(500).json({ error: 'Error interno al obtener grupo' });
  }
};

/**
 * POST /api/grupos/:id/join
 * body: { id_usuario, monto_acordado? }
 */
exports.unirseAGrupo = async (req, res) => {
  const id = req.grupoId ?? toNumInt(req.params.id);
  const _userId = toNumInt(req.body?.id_usuario);
  const _monto = req.body?.monto_acordado != null ? toNum(req.body.monto_acordado) : null;

  if (!id) return res.status(400).json({ error: 'Parámetro id inválido' });
  if (!_userId) return res.status(400).json({ error: 'id_usuario es requerido' });
  if (req.body?.monto_acordado != null && _monto === null) {
    return res.status(400).json({ error: 'monto_acordado inválido' });
  }

  const t = await sequelize.transaction();
  try {
    const grupo = await GrupoViaje.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!grupo) {
      await t.rollback();
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    if (grupo.estado !== 'abierto') {
      await t.rollback();
      return res.status(400).json({ error: 'El grupo no está abierto' });
    }
    if (grupo.cupos_disponibles <= 0) {
      await t.rollback();
      return res.status(400).json({ error: 'No hay cupos disponibles' });
    }

    const yaEsMiembro = await GrupoMiembro.findOne({
      where: { id_grupo: id, id_usuario: _userId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (yaEsMiembro) {
      await t.rollback();
      return res.status(409).json({ error: 'El usuario ya es miembro de este grupo' });
    }

    await GrupoMiembro.create(
      {
        id_grupo: id,
        id_usuario: _userId,
        rol: 'pasajero',
        estado: 'activo',
        monto_acordado: _monto,
      },
      { transaction: t }
    );

    await grupo.update({ cupos_disponibles: grupo.cupos_disponibles - 1 }, { transaction: t });

    await t.commit();
    return res.json({ message: 'Te uniste al grupo correctamente' });
  } catch (err) {
    await t.rollback();
    console.error('❌ Error uniéndose al grupo:', err);
    return res.status(500).json({ error: 'Error interno al unirse al grupo' });
  }
};

/**
 * POST /api/grupos/:id/leave
 * body: { id_usuario }
 */
exports.salirDeGrupo = async (req, res) => {
  const id = req.grupoId ?? toNumInt(req.params.id);
  const _userId = toNumInt(req.body?.id_usuario);

  if (!id) return res.status(400).json({ error: 'Parámetro id inválido' });
  if (!_userId) return res.status(400).json({ error: 'id_usuario es requerido' });

  const t = await sequelize.transaction();
  try {
    const grupo = await GrupoViaje.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!grupo) {
      await t.rollback();
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    if (!['abierto', 'en_curso'].includes(grupo.estado)) {
      await t.rollback();
      return res.status(400).json({ error: 'El grupo no está en un estado que permita salir' });
    }

    const miembro = await GrupoMiembro.findOne({
      where: { id_grupo: id, id_usuario: _userId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!miembro || miembro.estado !== 'activo') {
      await t.rollback();
      return res.status(404).json({ error: 'No eres miembro activo de este grupo' });
    }

    if (miembro.rol === 'conductor') {
      await t.rollback();
      return res.status(400).json({ error: 'El conductor no puede abandonar el grupo' });
    }

    await miembro.update({ estado: 'inactivo' }, { transaction: t });

    await grupo.update({ cupos_disponibles: grupo.cupos_disponibles + 1 }, { transaction: t });

    await t.commit();
    return res.json({ message: 'Saliste del grupo' });
  } catch (err) {
    await t.rollback();
    console.error('❌ Error saliendo del grupo:', err);
    return res.status(500).json({ error: 'Error interno al salir del grupo' });
  }
};

/**
 * POST /api/grupos/:id/cerrar
 * body: { conductor_id, estado? = 'cerrado' | 'cancelado' }
 */
exports.cerrarGrupo = async (req, res) => {
  const id = req.grupoId ?? toNumInt(req.params.id);
  const _conductorId = toNumInt(req.body?.conductor_id);
  const estado = req.body?.estado ? String(req.body.estado) : 'cerrado';

  if (!id) return res.status(400).json({ error: 'Parámetro id inválido' });
  if (!_conductorId) return res.status(400).json({ error: 'conductor_id es requerido' });
  if (!['cerrado', 'cancelado'].includes(estado)) {
    return res.status(400).json({ error: 'estado inválido (cerrado|cancelado)' });
  }

  try {
    const grupo = await GrupoViaje.findByPk(id);
    if (!grupo) {
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    if (grupo.conductor_id !== _conductorId) {
      return res.status(403).json({ error: 'No autorizado para cerrar este grupo' });
    }
    if (!['abierto', 'en_curso'].includes(grupo.estado)) {
      return res.status(400).json({ error: 'El grupo no está en un estado cerrable' });
    }

    await grupo.update({ estado, fecha_actualizacion: new Date() });
    return res.json({ message: `Grupo ${estado}`, data: grupo });
  } catch (err) {
    console.error('❌ Error cerrando grupo:', err);
    return res.status(500).json({ error: 'Error interno al cerrar grupo' });
  }
};