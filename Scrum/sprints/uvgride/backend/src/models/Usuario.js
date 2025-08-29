const { DataTypes } = require("sequelize");
const { sequelize } = require("./index");

const Usuario = sequelize.define(
  "usuario",
  {
    id_usuario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    apellido: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    correo_institucional: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    contrasenia: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    telefono: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tipo_usuario: {
      type: DataTypes.STRING, // "Pasajero" | "Conductor"
      allowNull: false,
    },
    licencia_conducir: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    estado_disponibilidad: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    preferencia_tema: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "light",
    },
    // cache de calificación como conductor
    calif_conductor_avg: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 0,
    },
    calif_conductor_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "usuario",
    timestamps: false,
    underscored: false,
  }
);

module.exports = Usuario;