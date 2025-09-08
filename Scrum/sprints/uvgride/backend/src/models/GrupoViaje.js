// src/models/GrupoViaje.js
const { DataTypes, QueryTypes } = require('sequelize');
const { sequelize } = require('./index');

const GrupoViaje = sequelize.define(
  'GrupoViaje',
  {
    id_grupo: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, field: 'id_grupo' },
    id_viaje_maestro: { type: DataTypes.INTEGER, allowNull: false, field: 'id_viaje_maestro', unique: 'uq_grupo_por_viaje' },
    conductor_id: { type: DataTypes.INTEGER, allowNull: false, field: 'conductor_id' },
    capacidad_total: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'capacidad_total',
      validate: { isInt: true, min: 1 },
    },
    precio_base: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'precio_base',
      validate: { min: 0 },
    },
    estado_grupo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'abierto',
      field: 'estado_grupo',
      validate: { isIn: [['abierto', 'cerrado', 'cancelado', 'finalizado']] },
    },
    precio_base: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {min : 0},
    },

    notas: { type: DataTypes.TEXT, allowNull: true, field: 'notas' },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' },
  },
  {
    tableName: 'grupo_viaje',
    timestamps: false,
    indexes: [
      { fields: ['estado_grupo'] },
      { fields: ['conductor_id'] },
      { fields: ['id_viaje_maestro'] },
    ],
  }
);

/* ===== Helpers internos ===== */
async function assertMiembroAprobadoPasajero(grupoId, usuarioId) {
  const rows = await sequelize.query(
    `
    SELECT 1
    FROM grupo_miembro
    WHERE id_grupo = :grupoId
      AND id_usuario = :usuarioId
      AND estado_solicitud = 'aprobado'
      AND rol = 'pasajero'
    LIMIT 1
    `,
    { replacements: { grupoId, usuarioId }, type: QueryTypes.SELECT }
  );
  if (rows.length === 0) {
    const err = new Error('No eres miembro aprobado como pasajero en este grupo');
    err.status = 403;
    throw err;
  }
}

async function getGrupoConViaje(grupoId) {
  const [row] = await sequelize.query(
    `
    SELECT g.id_grupo, g.id_viaje_maestro, g.conductor_id, v.estado_viaje
    FROM grupo_viaje g
    JOIN viaje_maestro v ON v.id_viaje_maestro = g.id_viaje_maestro
    WHERE g.id_grupo = :grupoId
    `,
    { replacements: { grupoId }, type: QueryTypes.SELECT }
  );
  if (!row) {
    const err = new Error('Grupo no encontrado');
    err.status = 404;
    throw err;
  }
  return row;
}

/* ===== Métodos estáticos públicos ===== */

/**
 * Crea una calificación al CONDUCTOR del grupo (a partir de grupoId)
 * Valida: pasajero miembro aprobado, viaje finalizado, no duplicado, no self-rating.
 * Devuelve la fila insertada de calificacion_maestro.
 */
GrupoViaje.calificarConductor = async function ({ grupoId, pasajeroId, puntuacion, comentario }) {
  if (!(Number.isInteger(puntuacion) && puntuacion >= 1 && puntuacion <= 5)) {
    const err = new Error('La puntuación debe estar entre 1 y 5');
    err.status = 400;
    throw err;
  }

  await assertMiembroAprobadoPasajero(grupoId, pasajeroId);
  const g = await getGrupoConViaje(grupoId);

  if (!['finalizado', 'completado'].includes(g.estado_viaje)) {
    const err = new Error('Solo se puede calificar un viaje finalizado');
    err.status = 400;
    throw err;
  }
  if (pasajeroId === g.conductor_id) {
    const err = new Error('No puedes calificarte a ti mismo');
    err.status = 400;
    throw err;
  }

  try {
    // ⚠️ No usar QueryTypes.INSERT aquí; deja que devuelva las filas del RETURNING
    const [rows] = await sequelize.query(
      `
      INSERT INTO calificacion_maestro
        (id_viaje_maestro, id_usuario, puntuacion, objetivo_usuario_id, comentario, created_at, updated_at)
      VALUES
        (:viajeId, :raterId, :score, :driverId, :comment, NOW(), NOW())
      RETURNING id_calificacion_maestro, id_viaje_maestro, id_usuario, puntuacion, objetivo_usuario_id, comentario, created_at
      `,
      {
        replacements: {
          viajeId: g.id_viaje_maestro,
          raterId: pasajeroId,
          score: puntuacion,
          driverId: g.conductor_id,
          comment: comentario ?? null,
        },
      }
    );
    return rows?.[0] || null;
  } catch (e) {
    // Violación de UNIQUE (id_viaje_maestro, id_usuario, objetivo_usuario_id)
    if (e?.original?.code === '23505') {
      const err = new Error('Ya calificaste este viaje');
      err.status = 409;
      throw err;
    }
    throw e;
  }
};

/**
 * Lista calificaciones asociadas al conductor del grupo
 */
GrupoViaje.listarCalificaciones = async function (grupoId, { limit = 10, offset = 0 } = {}) {
  const g = await getGrupoConViaje(grupoId);

  const rows = await sequelize.query(
    `
    SELECT cm.id_calificacion_maestro, cm.puntuacion, cm.comentario, cm.created_at,
           u.nombre AS rater_nombre, u.apellido AS rater_apellido
    FROM calificacion_maestro cm
    JOIN usuario u ON u.id_usuario = cm.id_usuario
    WHERE cm.id_viaje_maestro = :viajeId
      AND cm.objetivo_usuario_id = :driverId
    ORDER BY cm.created_at DESC
    LIMIT :limit OFFSET :offset
    `,
    {
      replacements: { viajeId: g.id_viaje_maestro, driverId: g.conductor_id, limit, offset },
      type: QueryTypes.SELECT,
    }
  );

  const [{ total }] = await sequelize.query(
    `
    SELECT COUNT(*)::int AS total
    FROM calificacion_maestro
    WHERE id_viaje_maestro = :viajeId
      AND objetivo_usuario_id = :driverId
    `,
    { replacements: { viajeId: g.id_viaje_maestro, driverId: g.conductor_id }, type: QueryTypes.SELECT }
  );

  return { count: total, rows, limit, offset };
};

/**
 * Devuelve el resumen del conductor del grupo desde el cache en usuario
 */
GrupoViaje.obtenerResumenConductor = async function (grupoId) {
  const g = await getGrupoConViaje(grupoId);
  const rows = await sequelize.query(
    `
    SELECT id_usuario, nombre, apellido,
           calif_conductor_avg::float AS avg,
           calif_conductor_count::int AS count
    FROM usuario
    WHERE id_usuario = :driverId
    `,
    { replacements: { driverId: g.conductor_id }, type: QueryTypes.SELECT }
  );
  if (!rows || rows.length === 0) {
    const err = new Error('Conductor no encontrado');
    err.status = 404;
    throw err;
  }
  const u = rows[0];
  return {
    conductorId: u.id_usuario,
    nombre: u.nombre,
    apellido: u.apellido,
    avg: u.avg || 0,
    count: u.count || 0,
  };
};

module.exports = GrupoViaje;