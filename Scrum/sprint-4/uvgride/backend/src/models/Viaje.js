// src/models/Viaje.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const Viaje = sequelize.define('viaje_maestro', {
  id_viaje_maestro: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  origen: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  destino: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lat_origen: {
    type: DataTypes.DECIMAL(9, 6),
    allowNull: true,
  },
  lon_origen: {
    type: DataTypes.DECIMAL(9, 6),
    allowNull: true,
  },
  lat_destino: {
    type: DataTypes.DECIMAL(9, 6),
    allowNull: true,
  },
  lon_destino: {
    type: DataTypes.DECIMAL(9, 6),
    allowNull: true,
  },
  hora_solicitud: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  costo_total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  estado_viaje: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'pendiente',
  },
}, {
  tableName: 'viaje_maestro',
  timestamps: false,
});

module.exports = Viaje;