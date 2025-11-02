// src/controllers/grupo.controller.js
const { Op, literal } = require('sequelize');
const {
  sequelize,
  Usuario,
  Vehiculo,
  GrupoViaje,
  GrupoMiembro,
  Viaje,          // puede venir null/undefined si no mapeaste viaje_maestro
  ViajePasajero,  // si existe el modelo, lo usamos; si no, haremos SQL crudo
} = require('../models');

/* ======================= Helpers ======================= */

const toNumber = (v) => (v === '' || v === null || v === undefined ? NaN : Number(v));
const isPosInt = (v) => Number.isInteger(toNumber(v)) && toNumber(v) > 0;
const isFiniteNum = (v) => Number.isFinite(toNumber(v));
const toBool = (v) => {
  if (typeof v === 'boolean') return v;
  if (v === null || v === undefined) return false;
  const s = String(v).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'on' || s === 'yes' || s === 'si' || s === 'sí';
};

function normalizeCreatePayload(body = {}) {
  const {
    conductor_id,
    destino,
    destino_nombre,
    cupos_totales,
    capacidad_total,
    fecha_salida,
    costo_estimado,
    lat_destino,
    lon_destino,
    notas,
    es_recurrente,              // NUEVO
    miembros_designados,        // NUEVO: array opcional de user IDs
  } = body;

  const dest = (destino_nombre ?? destino ?? '').toString().trim();

  const capacidad = isPosInt(cupos_totales)
    ? Number(cupos_totales)
    : isPosInt(capacidad_total)
    ? Number(capacidad_total)
    : NaN;

  // sanitizar designados
  let designados = Array.isArray(miembros_designados) ? miembros_designados : [];
  designados = [...new Set(designados.map((x) => Number(x)).filter((n) => Number.isInteger(n) && n > 0))];

  return {
    conductor_id: isPosInt(conductor_id) ? Number(conductor_id) : NaN,
    destino_nombre: dest || '',
    cupos_totales: capacidad,
    fecha_salida: fecha_salida ? new Date(fecha_salida) : null,
    lat_destino: lat_destino == null ? null : Number(lat_destino),
    lon_destino: lon_destino == null ? null : Number(lon_destino),
    costo_estimado: costo_estimado == null ? null : Number(costo_estimado),
    notas: notas || null,
    es_recurrente: toBool(es_recurrente),
    miembros_designados: designados,
  };
}

/* ======================= Vínculo viaje_pasajero ======================= */

async function ensureViajePasajero(viajeId, userId, t) {
  if (!Number.isInteger(viajeId) || viajeId <= 0) return;
  if (!Number.isInteger(userId) || userId <= 0) return;

  if (ViajePasajero) {
    await ViajePasajero.findOrCreate({
      where: { id_viaje_maestro: viajeId, id_usuario: userId },
      defaults: { id_viaje_maestro: viajeId, id_usuario: userId },
      transaction: t,
    });
  } else {
    await sequelize.query(
      `
      INSERT INTO viaje_pasajero (id_viaje_maestro, id_usuario)
      VALUES (:viajeId, :userId)
      ON CONFLICT (id_viaje_maestro, id_usuario) DO NOTHING
      `,
      { replacements: { viajeId, userId }, transaction: t }
    );
  }
}

async function removeViajePasajero(viajeId, userId, t) {
  if (!Number.isInteger(viajeId) || viajeId <= 0) return;
  if (!Number.isInteger(userId) || userId <= 0) return;

  if (ViajePasajero) {
    await ViajePasajero.destroy({
      where: { id_viaje_maestro: viajeId, id_usuario: userId },
      transaction: t,
    });
  } else {
    await sequelize.query(
      `
      DELETE FROM viaje_pasajero
      WHERE id_viaje_maestro = :viajeId AND id_usuario = :userId
      `,
      { replacements: { viajeId, userId }, transaction: t }
    );
  }
}

/* ======================= Controllers ======================= */

/**
 * POST /api/grupos
 * Crea viaje_maestro + grupo y agrega al conductor como miembro aprobado.
 * Soporta:
 *  - es_recurrente (boolean) → fuerza estado 'cerrado'
 *  - miembros_designados: number[] (IDs de usuarios), aprobados, respetando capacidad
 */
exports.crearGrupo = async (req, res) => {
  const p = normalizeCreatePayload(req.body);

  if (!isPosInt(p.conductor_id)) {
    return res.status(400).json({ error: 'conductor_id inválido' });
  }
  if (!p.destino_nombre) {
    return res.status(400).json({ error: 'destino_nombre es requerido' });
  }
  if (!isPosInt(p.cupos_totales)) {
    return res.status(400).json({ error: 'capacidad_total/cupos_totales debe ser > 0' });
  }
  if (p.lat_destino != null && !isFiniteNum(p.lat_destino)) {
    return res.status(400).json({ error: 'lat_destino inválida' });
  }
  if (p.lon_destino != null && !isFiniteNum(p.lon_destino)) {
    return res.status(400).json({ error: 'lon_destino inválida' });
  }

  // validar que designados no incluyan al conductor
  const designadosFiltrados = (p.miembros_designados || []).filter((uid) => uid !== p.conductor_id);
  // validar capacidad: 1 (conductor) + designados <= capacidad_total
  if (1 + designadosFiltrados.length > p.cupos_totales) {
    return res.status(400).json({ error: 'Los miembros designados exceden la capacidad total' });
  }

  const t = await sequelize.transaction();
  try {
    // Validar conductor con vehículo
    const conductor = await Usuario.findOne({
      where: { id_usuario: p.conductor_id, tipo_usuario: { [Op.iLike]: 'conductor' } },
      include: [{ model: Vehiculo, as: 'vehiculos', required: true, attributes: ['id_vehiculo'] }],
      transaction: t,
    });
    if (!conductor) {
      await t.rollback();
      return res.status(400).json({ error: 'Conductor inválido o sin vehículos registrados' });
    }

    // Crear viaje_maestro
    if (!Viaje) {
      await t.rollback();
      return res.status(500).json({ error: 'Modelo Viaje no disponible' });
    }

    const viaje = await Viaje.create(
      {
        origen: 'Punto de salida',
        destino: p.destino_nombre,
        lat_destino: p.lat_destino,
        lon_destino: p.lon_destino,
        costo_total: p.costo_estimado ?? 0,
        fecha_inicio: p.fecha_salida || null,
        estado_viaje: 'pendiente',
        conductor_id: p.conductor_id,
      },
      { transaction: t }
    );

    // Crear grupo (si es recurrente, debe quedar CERRADO)
    const grupo = await GrupoViaje.create(
      {
        id_viaje_maestro: viaje.id_viaje_maestro,
        conductor_id: p.conductor_id,
        capacidad_total: p.cupos_totales,
        precio_base: p.costo_estimado ?? 0,
        estado_grupo: p.es_recurrente ? 'cerrado' : 'abierto',
        es_recurrente: p.es_recurrente,
        notas: p.notas,
      },
      { transaction: t }
    );

    // Agregar conductor como miembro aprobado
    await GrupoMiembro.create(
      { id_grupo: grupo.id_grupo, id_usuario: p.conductor_id, rol: 'conductor', estado_solicitud: 'aprobado' },
      { transaction: t }
    );
    await ensureViajePasajero(viaje.id_viaje_maestro, p.conductor_id, t);

    // Agregar miembros designados (aprobados) respetando capacidad
    for (const uid of designadosFiltrados) {
      await GrupoMiembro.findOrCreate({
        where: { id_grupo: grupo.id_grupo, id_usuario: uid },
        defaults: { id_grupo: grupo.id_grupo, id_usuario: uid, rol: 'pasajero', estado_solicitud: 'aprobado' },
        transaction: t,
      });
      await ensureViajePasajero(viaje.id_viaje_maestro, uid, t);
    }

    await t.commit();
    return res.status(201).json({
      message: 'Grupo creado',
      data: {
        id_grupo: grupo.id_grupo,
        id_viaje_maestro: grupo.id_viaje_maestro,
        es_recurrente: grupo.es_recurrente,
        estado: grupo.estado_grupo,
      },
    });
  } catch (err) {
    await t.rollback();
    console.error('[grupos] Error creando grupo:', err);
    return res.status(500).json({ error: 'Error interno al crear el grupo' });
  }
};

/**
 * GET /api/grupos
 * ?estado=&q=&user_id=
 */
exports.listarGrupos = async (req, res) => {
  try {
    const { estado, q } = req.query || {};
    const userId = Number(req.query.user_id);
    const userIdValido = Number.isInteger(userId) && userId > 0;

    const whereGrupo = {};
    if (estado) whereGrupo.estado_grupo = String(estado);

    const whereConductor = {};
    const whereViaje = {};

    if (q && String(q).trim()) {
      const term = `%${String(q).trim()}%`;
      whereConductor[Op.or] = [
        { nombre: { [Op.iLike]: term } },
        { apellido: { [Op.iLike]: term } },
      ];
      if (Viaje) whereViaje.destino = { [Op.iLike]: term };
    }

    const SUB_CUPOS = `(SELECT COUNT(*) FROM grupo_miembro gm 
      WHERE gm.id_grupo = "GrupoViaje"."id_grupo" AND gm.estado_solicitud = 'aprobado')`;

    const LIT_ES_MIEMBRO = userIdValido
      ? literal(`EXISTS (
          SELECT 1 FROM grupo_miembro gm
          WHERE gm.id_grupo = "GrupoViaje"."id_grupo"
            AND gm.id_usuario = ${userId}
            AND gm.estado_solicitud = 'aprobado'
        )`)
      : literal('false');

    const LIT_ES_PROPIETARIO = userIdValido
      ? literal(`("GrupoViaje"."conductor_id" = ${userId})`)
      : literal('false');

    const include = [
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
            required: false,
            separate: true,
            limit: 1,
          },
        ],
      },
    ];

    if (Viaje) {
      include.push({
        model: Viaje,
        as: 'viaje',
        where: whereViaje,
        required: true,
        attributes: ['id_viaje_maestro', 'origen', 'destino', 'lat_destino', 'lon_destino', 'fecha_inicio', 'estado_viaje'],
      });
    }

    const grupos = await GrupoViaje.findAll({
      where: whereGrupo,
      order: [['id_grupo', 'DESC']],
      attributes: [
        'id_grupo',
        'id_viaje_maestro',
        'conductor_id',
        'capacidad_total',
        'precio_base',
        ['estado_grupo', 'estado'], // alias para el frontend
        'es_recurrente',
        'created_at',
        'updated_at',
        [literal(SUB_CUPOS), 'cupos_usados'],
        [literal(`"GrupoViaje"."capacidad_total" - ${SUB_CUPOS}`), 'cupos_disponibles'],
        [LIT_ES_MIEMBRO, 'es_miembro'],
        [LIT_ES_PROPIETARIO, 'es_propietario'],
      ],
      include,
    });

    return res.json({ data: grupos });
  } catch (err) {
    console.error('[grupos] Error listando grupos:', err?.message || err);
    return res.status(500).json({ error: 'Error interno al listar grupos' });
  }
};

/**
 * GET /api/grupos/:id
 * ?user_id=
 */
exports.obtenerGrupo = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = Number(req.query.user_id);
    const userIdValido = Number.isInteger(userId) && userId > 0;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Parámetro id inválido' });
    }

    const include = [
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
        attributes: ['id_grupo_miembro', 'id_usuario', 'rol', 'estado_solicitud', 'joined_at'],
        include: [
          { model: Usuario, as: 'usuario', attributes: ['id_usuario', 'nombre', 'apellido', 'telefono'] },
        ],
      },
    ];

    if (Viaje) {
      include.push({
        model: Viaje,
        as: 'viaje',
        attributes: [
          'id_viaje_maestro',
          'origen',
          'destino',
          'lat_destino',
          'lon_destino',
          'fecha_inicio',
          'estado_viaje',
        ],
      });
    }

    const SUB_CUPOS = `(SELECT COUNT(*) FROM grupo_miembro gm 
      WHERE gm.id_grupo = "GrupoViaje"."id_grupo" AND gm.estado_solicitud = 'aprobado')`;

    const attrs = [
      'id_grupo',
      'id_viaje_maestro',
      'conductor_id',
      'capacidad_total',
      'precio_base',
      ['estado_grupo', 'estado'], // alias para el frontend
      'es_recurrente',
      'notas',
      'created_at',
      'updated_at',
      [literal(SUB_CUPOS), 'cupos_usados'],
      [literal(`"GrupoViaje"."capacidad_total" - ${SUB_CUPOS}`), 'cupos_disponibles'],
    ];

    if (userIdValido) {
      attrs.push(
        [
          literal(`EXISTS (
            SELECT 1 FROM grupo_miembro gm
            WHERE gm.id_grupo = "GrupoViaje"."id_grupo"
              AND gm.id_usuario = ${userId}
              AND gm.estado_solicitud = 'aprobado'
          )`),
          'es_miembro',
        ],
        [literal(`("GrupoViaje"."conductor_id" = ${userId})`), 'es_propietario']
      );
    }

    const grupo = await GrupoViaje.findByPk(id, { attributes: attrs, include });

    if (!grupo) return res.status(404).json({ error: 'Grupo no encontrado' });
    return res.json({ data: grupo });
  } catch (err) {
    console.error('[grupos] Error obteniendo grupo:', err);
    return res.status(500).json({ error: 'Error interno al obtener grupo' });
  }
};

/**
 * POST /api/grupos/:id/join
 * Body: { id_usuario }
 * Reglas:
 *  - abierto (o recurrente)
 *  - no conductor
 *  - no estar aprobado en otro grupo activo
 *  - crea vínculo en viaje_pasajero
 */
exports.unirseAGrupo = async (req, res) => {
  const id = Number(req.params.id);
  const { id_usuario } = req.body || {};

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Parámetro id inválido' });
  }
  if (!Number.isInteger(Number(id_usuario)) || Number(id_usuario) <= 0) {
    return res.status(400).json({ error: 'id_usuario inválido' });
  }

  const t = await sequelize.transaction();
  try {
    const grupo = await GrupoViaje.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!grupo) {
      await t.rollback();
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    // Permitir unirse si está ABIERTO, o si es RECURRENTE (aunque esté CERRADO)
    if (!grupo.es_recurrente && grupo.estado_grupo !== 'abierto') {
      await t.rollback();
      return res.status(400).json({ error: 'El grupo no está abierto' });
    }

    // no te unes a tu propio grupo
    if (grupo.conductor_id === Number(id_usuario)) {
      await t.rollback();
      return res.status(400).json({ error: 'No puedes unirte a tu propio grupo' });
    }

    // ya en otro grupo activo (abierto o cerrado)
    const yaEnOtro = await GrupoMiembro.findOne({
      where: { id_usuario: Number(id_usuario), estado_solicitud: 'aprobado' },
      include: [
        {
          model: GrupoViaje,
          as: 'grupo',
          required: true,
          where: { estado_grupo: { [Op.in]: ['abierto', 'cerrado'] } },
          attributes: ['id_grupo'],
        },
      ],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (yaEnOtro && yaEnOtro.id_grupo !== id) {
      await t.rollback();
      return res.status(400).json({ error: 'Ya perteneces a otro grupo activo' });
    }

    // cupos
    const aprobados = await GrupoMiembro.count({
      where: { id_grupo: id, estado_solicitud: 'aprobado' },
      transaction: t,
    });
    if (aprobados >= grupo.capacidad_total) {
      await t.rollback();
      return res.status(400).json({ error: 'No hay cupos disponibles' });
    }

    // crear/actualizar miembro
    const ya = await GrupoMiembro.findOne({
      where: { id_grupo: id, id_usuario },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (ya) {
      if (ya.estado_solicitud === 'aprobado') {
        await t.rollback();
        return res.status(409).json({ error: 'Ya eres miembro de este grupo' });
      }
      await ya.update({ estado_solicitud: 'aprobado', rol: ya.rol || 'pasajero' }, { transaction: t });
    } else {
      await GrupoMiembro.create(
        { id_grupo: id, id_usuario, rol: 'pasajero', estado_solicitud: 'aprobado' },
        { transaction: t }
      );
    }

    // vínculo viaje_pasajero para futuras calificaciones/estadísticas
    const viajeId = Number(grupo.id_viaje_maestro);
    if (Number.isInteger(viajeId) && viajeId > 0) {
      await ensureViajePasajero(viajeId, Number(id_usuario), t);
    }

    await t.commit();
    return res.json({ message: 'Te uniste al grupo' });
  } catch (err) {
    await t.rollback();
    const msg = String(err?.parent?.message || err?.message || '').toLowerCase();
    if (msg.includes('cupos')) {
      return res.status(400).json({ error: 'No hay cupos disponibles' });
    }
    console.error('[grupos] Error unirseAGrupo:', err);
    return res.status(500).json({ error: 'Error interno al unirse al grupo' });
  }
};

/**
 * POST /api/grupos/:id/leave
 * Body: { id_usuario }
 * Pasa a 'baja' y remueve vínculo viaje_pasajero.
 */
exports.salirDeGrupo = async (req, res) => {
  const id = Number(req.params.id);
  const { id_usuario } = req.body || {};
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Parámetro id inválido' });
  }
  if (!isPosInt(id_usuario)) {
    return res.status(400).json({ error: 'id_usuario inválido' });
  }

  const t = await sequelize.transaction();
  try {
    const grupo = await GrupoViaje.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!grupo) {
      await t.rollback();
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }

    const miembro = await GrupoMiembro.findOne({
      where: { id_grupo: id, id_usuario },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!miembro || miembro.estado_solicitud !== 'aprobado') {
      await t.rollback();
      return res.status(404).json({ error: 'No eres miembro aprobado de este grupo' });
    }
    if (miembro.rol === 'conductor') {
      await t.rollback();
      return res.status(400).json({ error: 'El conductor no puede abandonar el grupo' });
    }

    await miembro.update({ estado_solicitud: 'baja' }, { transaction: t });

    // limpiar vínculo viaje_pasajero
    const viajeId = Number(grupo.id_viaje_maestro);
    if (Number.isInteger(viajeId) && viajeId > 0) {
      await removeViajePasajero(viajeId, Number(id_usuario), t);
    }

    await t.commit();
    return res.json({ message: 'Saliste del grupo' });
  } catch (err) {
    await t.rollback();
    console.error('[grupos] Error salirDeGrupo:', err);
    return res.status(500).json({ error: 'Error interno al salir del grupo' });
  }
};

/**
 * POST /api/grupos/:id/cerrar
 * Body: { conductor_id, estado = 'cerrado'|'cancelado'|'finalizado' }
 * Sincroniza estado del viaje (si existe el modelo).
 * ⚠️ Para grupos recurrentes se bloquea cualquier cambio de estado (siempre 'cerrado').
 */
exports.cerrarGrupo = async (req, res) => {
  const id = Number(req.params.id);
  const { conductor_id, estado = 'cerrado' } = req.body || {};

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Parámetro id inválido' });
  }
  if (!isPosInt(conductor_id)) {
    return res.status(400).json({ error: 'conductor_id inválido' });
  }
  if (!['cerrado', 'cancelado', 'finalizado'].includes(String(estado))) {
    return res.status(400).json({ error: 'estado inválido (cerrado|cancelado|finalizado)' });
  }

  const t = await sequelize.transaction();
  try {
    const grupo = await GrupoViaje.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!grupo) {
      await t.rollback();
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    if (grupo.conductor_id !== Number(conductor_id)) {
      await t.rollback();
      return res.status(403).json({ error: 'No autorizado para cerrar este grupo' });
    }

    // Bloquear cambios de estado si es recurrente
    if (grupo.es_recurrente) {
      await t.rollback();
      return res.status(400).json({ error: 'Los grupos recurrentes deben permanecer en estado "cerrado". Solo se permite eliminar.' });
    }

    // reglas de transición
    const from = grupo.estado_grupo;
    if (estado === 'cerrado' && from !== 'abierto') {
      await t.rollback();
      return res.status(400).json({ error: 'Solo grupos abiertos pueden cerrarse' });
    }
    if (estado === 'cancelado' && !['abierto', 'cerrado'].includes(from)) {
      await t.rollback();
      return res.status(400).json({ error: 'Solo grupos abiertos/cerrados pueden cancelarse' });
    }
    if (estado === 'finalizado' && from !== 'cerrado') {
      await t.rollback();
      return res.status(400).json({ error: 'Solo grupos cerrados pueden finalizarse' });
    }

    // 1) actualiza grupo
    await grupo.update({ estado_grupo: estado, updated_at: new Date() }, { transaction: t });

    // 2) sincroniza Viaje (si existe)
    if (Viaje && grupo.id_viaje_maestro) {
      let estadoViaje = null;
      if (estado === 'cerrado') estadoViaje = 'cerrado';
      if (estado === 'cancelado') estadoViaje = 'cancelado';
      if (estado === 'finalizado') estadoViaje = 'finalizado';

      if (estadoViaje) {
        await Viaje.update(
          { estado_viaje: estadoViaje, updated_at: new Date() },
          { where: { id_viaje_maestro: grupo.id_viaje_maestro }, transaction: t }
        );
      }
    }

    await t.commit();
    return res.json({ message: `Grupo ${estado}`, data: grupo });
  } catch (err) {
    await t.rollback();
    console.error('[grupos] Error cerrarGrupo:', err);
    return res.status(500).json({ error: 'Error interno al cerrar grupo' });
  }
};

/**
 * DELETE /api/grupos/:id
 * Body: { conductor_id }
 * Elimina el grupo (recomendado para grupos recurrentes).
 */
exports.eliminarGrupo = async (req, res) => {
  const id = Number(req.params.id);
  const { conductor_id } = req.body || {};
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Parámetro id inválido' });
  }
  if (!Number.isInteger(conductor_id) || conductor_id <= 0) {
    return res.status(400).json({ error: 'conductor_id inválido' });
  }

  const t = await sequelize.transaction();
  try {
    const grupo = await GrupoViaje.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!grupo) {
      await t.rollback();
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    if (grupo.conductor_id !== Number(conductor_id)) {
      await t.rollback();
      return res.status(403).json({ error: 'No autorizado para eliminar este grupo' });
    }

    await grupo.destroy({ transaction: t });
    await t.commit();
    return res.json({ message: 'Grupo eliminado' });
  } catch (err) {
    await t.rollback();
    console.error('[grupos] Error eliminarGrupo:', err);
    return res.status(500).json({ error: 'Error interno al eliminar el grupo' });
  }
};

/* ======================= Calificaciones (DEPRECADO aquí) ======================= */

/**
 * POST /api/grupos/:id/calificaciones
 * 🔁 DEPRECADO: ahora la calificación se hace en
 * POST /api/conductores/:conductorId/calificar
 */
exports.calificarConductor = (_req, res) => {
  return res.status(410).json({
    error: 'Endpoint deprecado. Usa POST /api/conductores/:id/calificar',
  });
};

/**
 * GET /api/grupos/:id/calificaciones?limit=&offset=
 */
exports.listarCalificaciones = async (req, res) => {
  try {
    const grupoId = Number(req.params.id);
    const limit = Number(req.query.limit ?? 10);
    const offset = Number(req.query.offset ?? 0);

    if (!Number.isInteger(grupoId) || grupoId <= 0) {
      return res.status(400).json({ error: 'Parámetro id inválido' });
    }

    const data = await GrupoViaje.listarCalificaciones(grupoId, {
      limit: Number.isInteger(limit) && limit > 0 ? limit : 10,
      offset: Number.isInteger(offset) && offset >= 0 ? offset : 0,
    });

    return res.json(data);
  } catch (e) {
    const status = e.status || 500;
    return res.status(status).json({ error: e.message || 'Error al listar calificaciones' });
  }
};

/**
 * GET /api/grupos/:id/calificacion-resumen
 */
exports.obtenerResumenConductor = async (req, res) => {
  try {
    const grupoId = Number(req.params.id);
    if (!Number.isInteger(grupoId) || grupoId <= 0) {
      return res.status(400).json({ error: 'Parámetro id inválido' });
    }
    const resumen = await GrupoViaje.obtenerResumenConductor(grupoId);
    return res.json(resumen);
  } catch (e) {
    const status = e.status || 500;
    return res.status(status).json({ error: e.message || 'Error al obtener resumen' });
  }
};
