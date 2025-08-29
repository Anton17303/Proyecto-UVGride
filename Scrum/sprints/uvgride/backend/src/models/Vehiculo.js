// src/models/Vehiculo.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const Vehiculo = sequelize.define(
  'vehiculo',
  {
    id_vehiculo: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    id_usuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    marca: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    modelo: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    placa: {
      type: DataTypes.STRING,
      allowNull: false,
      // OJO: en tu SQL la placa NO es UNIQUE; si quieres que lo sea, agrega la constraint en SQL también.
      validate: { notEmpty: true },
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    capacidad_pasajeros: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: { args: [1], msg: 'La capacidad debe ser al menos 1' },
        isInt: { msg: 'La capacidad debe ser un entero' },
      },
    },
  },
  {
    tableName: 'vehiculo',
    timestamps: false,
    indexes: [
      { fields: ['id_usuario'] },
      { fields: ['placa'] }, // índice para búsquedas por placa
    ],
    hooks: {
      beforeValidate: (veh) => {
        if (veh.marca)  veh.marca  = String(veh.marca).trim();
        if (veh.modelo) veh.modelo = String(veh.modelo).trim();
        if (veh.color)  veh.color  = String(veh.color).trim();
        if (veh.placa)  veh.placa  = String(veh.placa).trim().toUpperCase();
      },
    },
    defaultScope: {
      attributes: { exclude: [] },
    },
  }
);

module.exports = Vehiculo;