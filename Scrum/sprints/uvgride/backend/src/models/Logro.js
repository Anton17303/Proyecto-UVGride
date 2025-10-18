// const { DataTypes, Model } = require('sequelize');
// const { sequelize } = require('./index'); // usa la misma instancia

// class Logro extends Model {}

// Logro.init(
//   {
//     id_logro: {
//       type: DataTypes.INTEGER,
//       primaryKey: true,
//       autoIncrement: true,
//     },
//     codigo: {
//       type: DataTypes.STRING(64),
//       allowNull: false,
//       unique: true, // p.ej. 'PRIMER_VIAJE', 'FAVORITO_1', 'VIAJES_5'
//     },
//     titulo: {
//       type: DataTypes.STRING(120),
//       allowNull: false,
//     },
//     descripcion: {
//       type: DataTypes.STRING(300),
//       allowNull: false,
//     },
//     icono: {
//       type: DataTypes.STRING(200),
//       allowNull: true, // URL o nombre del icono
//     },
//     // criterio simple para disparo por evento
//     evento: {
//       type: DataTypes.STRING(64), // p.ej. 'viaje_creado', 'viaje_completado', 'favorito_creado'
//       allowNull: false,
//     },
//     umbral: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//       defaultValue: 1, // cuántas veces debe darse el evento
//     },
//     activo: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: true,
//     },
//   },
//   {
//     sequelize,
//     tableName: 'logro',
//     modelName: 'Logro',
//     timestamps: true,
//     createdAt: 'creado_en',
//     updatedAt: 'actualizado_en',
//   }
// );

// module.exports = Logro;
