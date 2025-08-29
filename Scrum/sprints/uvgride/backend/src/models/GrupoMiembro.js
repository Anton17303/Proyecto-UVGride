// src/models/GrupoMiembro.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const GrupoMiembro = sequelize.define(
  'GrupoMiembro',
  {
    id_grupo_miembro: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'id_grupo_miembro',
    },
    id_grupo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'id_grupo',
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'id_usuario',
    },
    rol: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pasajero',
      validate: { isIn: [['conductor', 'pasajero']] },
      field: 'rol',
    },
    estado_solicitud: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pendiente',
      validate: { isIn: [['pendiente', 'aprobado', 'rechazado', 'baja']] },
      field: 'estado_solicitud',
    },
    joined_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'joined_at',
    },
  },
  {
    tableName: 'grupo_miembro',
    timestamps: false,
    indexes: [
      { fields: ['id_grupo'] },
      { fields: ['id_usuario'] },
      { fields: ['estado_solicitud'] },
      { unique: true, fields: ['id_grupo', 'id_usuario'] }, // uq_usuario_en_grupo
    ],
    defaultScope: {
      order: [['joined_at', 'DESC']],
    },
    scopes: {
      aprobados: { where: { estado_solicitud: 'aprobado' } },
      pendientes: { where: { estado_solicitud: 'pendiente' } },
      pasajeros: { where: { rol: 'pasajero' } },
      conductores: { where: { rol: 'conductor' } },
    },
    hooks: {
      beforeValidate: (m) => {
        if (typeof m.rol === 'string') m.rol = m.rol.trim().toLowerCase();
        if (typeof m.estado_solicitud === 'string') m.estado_solicitud = m.estado_solicitud.trim().toLowerCase();
      },
    },
  }
);

module.exports = GrupoMiembro;