// src/controllers/grupo.controller.js
const { Op, fn, col, literal } = require('sequelize');
const {
  sequelize,
  Usuario,
  Vehiculo,
  GrupoViaje,
  GrupoMiembro,
  Viaje, // puede venir undefined si no mapeaste viaje_maestro
} = require('../models');

/* ======================= Helpers ======================= */

const toNumber = (v) => (v === '' || v === null || v === undefined ? NaN : Number(v));
const isPosInt = (v) => Number.isInteger(toNumber(v)) && toNumber(v) > 0;
const isFiniteNum = (v) => Number.isFinite(toNumber(v));

/** Normaliza el payload que viene del cliente (pasajero/conductor) a los campos que usamos */
function normalizeCreatePayload(body = {}) {
  const {
    // nombres posibles desde el front
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
  } = body;

  // admitir "destino" o "destino_nombre"
  const dest = (destino_nombre ?? destino ?? '').toString().trim();

  // admitir "cupos_totales" o "capacidad_total"
  const capacidad = isPosInt(cupos_totales)
    ? Number(cupos_totales)
    : isPosInt(capacidad_total)
    ? Number(capacidad_total)
    : NaN;

  return {
    conductor_id: isPosInt(conductor_id) ? Number(conductor_id) : NaN,
    destino_nombre: dest || '',
    cupos_totales: capacidad,
    fecha_salida: fecha_salida ? new Date(fecha_salida) : null,
    lat_destino:
      lat_destino === null || lat_destino === undefined ? null : Number(lat_destino),
    lon_destino:
      lon_destino === null || lon_destino === undefined ? null : Number(lon_destino),
    costo_estimado:
      costo_estimado === null || costo_estimado === undefined
        ? null
        : Number(costo_estimado),
    notas: notas || null,
  };
}

/* ======================= Controllers ======================= */

/**
 * POST /api/grupos
 * Crea un viaje_maestro (mínimo) y el grupo asociado.
 * También agrega al conductor como miembro (rol=conductor, estado_solicitud=aprobado).
 */
exports.crearGrupo = async (req, res) => {
  console.log('[grupos] 🟢 crearGrupo payload RAW:', req.body);
  const p = normalizeCreatePayload(req.body);
  console.log('[grupos] 🟢 crearGrupo payload NORMALIZED:', p);

  // Validaciones
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

  const t = await sequelize.transaction();
  try {
    // 1) Validar que el usuario es conductor y tiene vehículo
    const conductor = await Usuario.findOne({
      where: { id_usuario: p.conductor_id, tipo_usuario: { [Op.iLike]: 'conductor' } },
      include: [{ model: Vehiculo, as: 'vehiculos', required: true, attributes: ['id_vehiculo'] }],
      transaction: t,
    });
    if (!conductor) {
      await t.rollback();
      return res
        .status(400)
        .json({ error: 'Conductor inválido o sin vehículos registrados' });
    }

    // 2) Crear viaje_maestro mínimo (si tienes el modelo Viaje mapeado)
    // Requisitos NOT NULL: origen, destino, costo_total
    let viaje = null;
    if (Viaje) {
      viaje = await Viaje.create(
        {
          origen: 'Punto de salida', // puedes mejorar esto
          destino: p.destino_nombre,
          lat_destino: p.lat_destino,
          lon_destino: p.lon_destino,
          costo_total: p.costo_estimado ?? 0,
          fecha_inicio: p.fecha_salida, // opcional
          estado_viaje: 'pendiente',
          conductor_id: p.conductor_id,
        },
        { transaction: t }
      );
    } else {
      // Si no tienes el modelo Viaje en Sequelize, no podemos FK.
      await t.rollback();
      return res.status(500).json({
        error:
          'Modelo Viaje (viaje_maestro) no está disponible en Sequelize. Mapea el modelo o ajusta el flujo.',
      });
    }

    // 3) Crear el grupo
    const grupo = await GrupoViaje.create(
      {
        id_viaje_maestro: viaje.id_viaje_maestro,
        conductor_id: p.conductor_id,
        capacidad_total: p.cupos_totales,
        precio_base: p.costo_estimado ?? 0,
        estado_grupo: 'abierto',
        notas: p.notas,
      },
      { transaction: t }
    );

    // 4) Agregar al conductor como miembro aprobado
    await GrupoMiembro.create(
      {
        id_grupo: grupo.id_grupo,
        id_usuario: p.conductor_id,
        rol: 'conductor',
        estado_solicitud: 'aprobado',
        // joined_at -> default NOW()
      },
      { transaction: t }
    );

    await t.commit();
    return res.status(201).json({
      message: 'Grupo creado',
      data: {
        id_grupo: grupo.id_grupo,
        id_viaje_maestro: grupo.id_viaje_maestro,
      },
    });
  } catch (err) {
    await t.rollback();
    console.error('[grupos] ❌ Error creando grupo:', err);
    return res.status(500).json({ error: 'Error interno al crear el grupo' });
  }
};

/**
 * GET /api/grupos
 * Lista grupos (por defecto abiertos) con conteo de cupos usados/disponibles
 * Query: ?estado=abierto|cerrado|cancelado|finalizado & ?q=texto
 */
exports.listarGrupos = async (req, res) => {
  try {
    console.log('[grupos] 🔵 listarGrupos query:', req.query);
    const { estado = 'abierto', q } = req.query || {};

    const whereGrupo = {};
    if (estado) whereGrupo.estado_grupo = String(estado);

    // Para búsqueda por texto (destino o nombre del conductor)
    const whereConductor = {};
    const whereViaje = {};

    if (q && String(q).trim()) {
      const term = `%${String(q).trim()}%`;
      // conductor
      whereConductor[Op.or] = [
        { nombre: { [Op.iLike]: term } },
        { apellido: { [Op.iLike]: term } },
      ];
      // destino (viaje_maestro.destino)
      if (Viaje) {
        whereViaje.destino = { [Op.iLike]: term };
      }
    }

    // Atributo calculado: cupos aprovados
    const cuposUsadosLiteral = literal(
      `(SELECT COUNT(*) FROM grupo_miembro gm WHERE gm.id_grupo = "GrupoViaje"."id_grupo" AND gm.estado_solicitud = 'aprobado')`
    );

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
        required: true, // si no hay Viaje no mostramos el grupo
        attributes: ['id_viaje_maestro', 'origen', 'destino', 'lat_destino', 'lon_destino', 'fecha_inicio'],
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
        'estado_grupo',
        'created_at',
        'updated_at',
        [cuposUsadosLiteral, 'cupos_usados'],
        [literal(`"GrupoViaje"."capacidad_total" - ${cuposUsadosLiteral.val}`), 'cupos_disponibles'],
      ],
      include,
    });

    return res.json({ data: grupos });
  } catch (err) {
    console.error('[grupos] ❌ Error listando grupos:', err?.message || err);
    console.error('[grupos] STACK:', err);
    return res.status(500).json({ error: 'Error interno al listar grupos' });
  }
};

/**
 * GET /api/grupos/:id
 * Detalle del grupo con sus miembros y viaje asociado.
 */
exports.obtenerGrupo = async (req, res) => {
  try {
    const id = Number(req.params.id);
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
          {
            model: Usuario,
            as: 'usuario',
            attributes: ['id_usuario', 'nombre', 'apellido', 'telefono'],
          },
        ],
      },
    ];

    if (Viaje) {
      include.push({
        model: Viaje,
        as: 'viaje',
        attributes: ['id_viaje_maestro', 'origen', 'destino', 'lat_destino', 'lon_destino', 'fecha_inicio'],
      });
    }

    const grupo = await GrupoViaje.findByPk(id, {
      attributes: [
        'id_grupo',
        'id_viaje_maestro',
        'conductor_id',
        'capacidad_total',
        'precio_base',
        'estado_grupo',
        'notas',
        'created_at',
        'updated_at',
        [
          literal(
            `(SELECT COUNT(*) FROM grupo_miembro gm WHERE gm.id_grupo = "GrupoViaje"."id_grupo" AND gm.estado_solicitud = 'aprobado')`
          ),
          'cupos_usados',
        ],
      ],
      include,
    });

    if (!grupo) return res.status(404).json({ error: 'Grupo no encontrado' });
    return res.json({ data: grupo });
  } catch (err) {
    console.error('[grupos] ❌ Error obteniendo grupo:', err);
    return res.status(500).json({ error: 'Error interno al obtener grupo' });
  }
};

/**
 * POST /api/grupos/:id/join
 * Un usuario se une al grupo si hay cupos. Pasa a estado_solicitud='aprobado'
 * Body: { id_usuario, monto_acordado? }  (monto_acordado no está en el esquema actual)
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
    // 1) Bloqueamos SOLO la fila del grupo (para estado y capacidad)
    const grupo = await GrupoViaje.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!grupo) {
      await t.rollback();
      return res.status(404).json({ error: 'Grupo no encontrado' });
    }
    if (grupo.estado_grupo !== 'abierto') {
      await t.rollback();
      return res.status(400).json({ error: 'El grupo no está abierto' });
    }

    // 2) ¿Ya es miembro?
    const ya = await GrupoMiembro.findOne({
      where: { id_grupo: id, id_usuario },
      transaction: t,
      lock: t.LOCK.UPDATE, // lock solo sobre esta fila (si existe)
    });

    // 3) Chequeo de cupos (sin FOR UPDATE). El trigger de BD refuerza este límite igualmente.
    const aprobados = await GrupoMiembro.count({
      where: { id_grupo: id, estado_solicitud: 'aprobado' },
      transaction: t,
      // ¡no usar lock aquí! Postgres prohíbe FOR UPDATE con agregados
    });
    if (aprobados >= grupo.capacidad_total) {
      await t.rollback();
      return res.status(400).json({ error: 'No hay cupos disponibles' });
    }

    // 4) Aceptar/crear la membresía
    if (ya) {
      if (ya.estado_solicitud === 'aprobado') {
        await t.rollback();
        return res.status(409).json({ error: 'Ya eres miembro de este grupo' });
      }
      await ya.update({ estado_solicitud: 'aprobado' }, { transaction: t });
    } else {
      await GrupoMiembro.create(
        {
          id_grupo: id,
          id_usuario,
          rol: 'pasajero',
          estado_solicitud: 'aprobado',
        },
        { transaction: t }
      );
    }

    await t.commit();
    return res.json({ message: 'Te uniste al grupo' });
  } catch (err) {
    await t.rollback();

    // Si el trigger de BD lanzó "El grupo ya no tiene cupos disponibles"
    const msg = String(err?.parent?.message || err?.message || '').toLowerCase();
    if (msg.includes('no tiene cupos') || msg.includes('cupos')) {
      return res.status(400).json({ error: 'No hay cupos disponibles' });
    }

    console.error('[grupos] ❌ Error unirseAGrupo:', err);
    return res.status(500).json({ error: 'Error interno al unirse al grupo' });
  }
};

/**
 * POST /api/grupos/:id/leave
 * Un miembro aprobado pasa a 'baja' (liberando cupo).
 * Body: { id_usuario }
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
    await t.commit();
    return res.json({ message: 'Saliste del grupo' });
  } catch (err) {
    await t.rollback();
    console.error('[grupos] ❌ Error salirDeGrupo:', err);
    return res.status(500).json({ error: 'Error interno al salir del grupo' });
  }
};

/**
 * POST /api/grupos/:id/cerrar
 * Cerrar o cancelar un grupo (solo conductor creador)
 * Body: { conductor_id, estado? = 'cerrado'|'cancelado'|'finalizado' }
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
    return res
      .status(400)
      .json({ error: 'estado inválido (cerrado|cancelado|finalizado)' });
  }

  try {
    const grupo = await GrupoViaje.findByPk(id);
    if (!grupo) return res.status(404).json({ error: 'Grupo no encontrado' });
    if (grupo.conductor_id !== Number(conductor_id)) {
      return res.status(403).json({ error: 'No autorizado para cerrar este grupo' });
    }
    if (!['abierto'].includes(grupo.estado_grupo) && estado !== 'finalizado') {
      // permitir finalizar aunque estuviera cerrado?
      // ajusta esta lógica si te conviene
      return res.status(400).json({ error: 'El grupo no está en un estado cerrable' });
    }

    await grupo.update({ estado_grupo: estado, updated_at: new Date() });
    return res.json({ message: `Grupo ${estado}`, data: grupo });
  } catch (err) {
    console.error('[grupos] ❌ Error cerrarGrupo:', err);
    return res.status(500).json({ error: 'Error interno al cerrar grupo' });
  }
};