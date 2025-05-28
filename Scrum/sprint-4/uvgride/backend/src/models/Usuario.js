const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const Usuario = sequelize.define('usuario', {
  id_usuario: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  apellido: {
    type: DataTypes.STRING,
    allowNull: false
  },
  correo_institucional: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  contrasenia: {
    type: DataTypes.STRING,
    allowNull: false
  },
  telefono: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tipo_usuario: {
    type: DataTypes.STRING,
    allowNull: false
  },
  foto_perfil: {
  type: DataTypes.STRING,
  allowNull: true,
  defaultValue: 'default-profile.jpg'
},
carrera: {
  type: DataTypes.STRING,
  allowNull: true
},
universidad: {
  type: DataTypes.STRING,
  allowNull: true,
  defaultValue: 'Universidad del Valle de Guatemala'
}
}, {
  tableName: 'usuario',
  timestamps: false
});

module.exports = Usuario;