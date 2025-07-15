const { DataTypes } = require("sequelize");
const { sequelize } = require("./index");

const LugarFavorito = sequelize.define("LugarFavorito", {
  id_lugar_favorito: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_usuario: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: "usuario",
      key: "id_usuario",
    },
  },
  nombre_lugar: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  color_hex: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fecha_agregado: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "lugar_favorito",
  timestamps: false,
});

module.exports = LugarFavorito;