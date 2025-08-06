const { DataTypes } = require('sequelize');
const sequelize = require('../database/02-uvgride-script');
const Usuario = require('./Usuario');

const Vehiculo = sequelize.define('Vehiculo', {
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
  },
  modelo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  placa: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  color: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  capacidad_pasajeros: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'vehiculo',
  timestamps: false,
  modelName: 'Vehiculo',
});

Vehiculo.belongsTo(Usuario, {
  foreignKey: 'id_usuario',
  as: 'usuario',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

Usuario.hasMany(Vehiculo, {
  foreignKey: 'id_usuario',
  as: 'vehiculos',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

module.exports = Vehiculo;