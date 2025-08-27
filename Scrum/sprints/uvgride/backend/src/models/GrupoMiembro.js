// src/models/GrupoMiembro.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const GrupoMiembro = sequelize.define(
  'GrupoMiembro',
  {
    id_miembro: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    id_grupo: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // rol dentro del grupo
    rol: {
      type: DataTypes.ENUM('conductor', 'pasajero'),
      allowNull: false,
      defaultValue: 'pasajero',
    },

    // estado de la membresía
    estado: {
      type: DataTypes.ENUM('pendiente', 'aceptado', 'rechazado', 'salido'),
      allowNull: false,
      defaultValue: 'aceptado',
    },

    // Timestamps manuales
    unido_en: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    actualizado_en: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'grupo_miembro',
    timestamps: false,
    indexes: [
      { fields: ['id_grupo'] },
      { fields: ['id_usuario'] },
      { unique: true, fields: ['id_grupo', 'id_usuario'] },
    ],
  }
);

module.exports = GrupoMiembro;