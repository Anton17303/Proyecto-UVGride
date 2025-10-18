// const { DataTypes, Model } = require('sequelize');
// const { sequelize } = require('./index');

// class UsuarioLogro extends Model {}

// UsuarioLogro.init(
//   {
//     id_usuario_logro: {
//       type: DataTypes.INTEGER,
//       primaryKey: true,
//       autoIncrement: true,
//     },
//     id_usuario: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//     },
//     id_logro: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//     },
//     progreso: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       defaultValue: 0,
//     },
//     desbloqueado: {
//       type: DataTypes.BOOLEAN,
//       allowNull: false,
//       defaultValue: false,
//     },
//     desbloqueado_en: {
//       type: DataTypes.DATE,
//       allowNull: true,
//     },
//   },
//   {
//     sequelize,
//     tableName: 'usuario_logro',
//     modelName: 'UsuarioLogro',
//     indexes: [
//       { unique: true, fields: ['id_usuario', 'id_logro'] },
//     ],
//     timestamps: true,
//     createdAt: 'creado_en',
//     updatedAt: 'actualizado_en',
//   }
// );

// module.exports = UsuarioLogro;
