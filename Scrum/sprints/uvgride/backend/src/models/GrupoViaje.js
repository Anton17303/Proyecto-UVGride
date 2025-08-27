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
    },

    // Conductor que crea el grupo
    conductor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // Vehículo usado
    id_vehiculo: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // Ubicaciones
    origen: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    destino: {
      type: DataTypes.STRING(255),
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

    // Capacidad
    cupos_totales: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 4,
    },
    cupos_disponibles: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 4,
    },

    // Horarios
    fecha_salida: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    // Estado del grupo
    estado: {
      type: DataTypes.ENUM('abierto', 'en_curso', 'cerrado', 'cancelado'),
      allowNull: false,
      defaultValue: 'abierto',
    },

    // Metadatos
    precio_compartido: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    notas: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // Timestamps manuales
    creado_en: {
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
    tableName: 'grupo_viaje',
    timestamps: false,
  }
);

module.exports = GrupoViaje;