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
    // ⚠️ No existe updated_at en la tabla -> NO lo declares aquí
  },
  {
    tableName: 'grupo_miembro',
    timestamps: false, // usamos joined_at; no hay updated_at
    indexes: [
      { fields: ['id_grupo'] },
      { fields: ['id_usuario'] },
      { fields: ['estado_solicitud'] },
      { unique: true, fields: ['id_grupo', 'id_usuario'] }, // uq_usuario_en_grupo
    ],
  }
);

module.exports = GrupoMiembro;