// src/models/GrupoViaje.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const GrupoViaje = sequelize.define(
  'GrupoViaje',
  {
    id_grupo: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'id_grupo',
    },
    id_viaje_maestro: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'id_viaje_maestro',
      unique: 'uq_grupo_por_viaje',
    },
    conductor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'conductor_id',
    },
    capacidad_total: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'capacidad_total',
      validate: {
        isInt: true,
        min: 1,
      },
    },
    precio_base: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'precio_base',
      validate: {
        min: 0,
      },
    },
    estado_grupo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'abierto',
      field: 'estado_grupo',
      validate: { isIn: [['abierto', 'cerrado', 'cancelado', 'finalizado']] },
    },
    notas: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'notas',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    tableName: 'grupo_viaje',
    timestamps: false,       // usamos created_at/updated_at + trigger en SQL
    // underscored: true,    // opcional; ya mapeas con field
    indexes: [
      { fields: ['estado_grupo'] },
      { fields: ['conductor_id'] },
      { fields: ['id_viaje_maestro'] },
    ],
  }
);

module.exports = GrupoViaje;