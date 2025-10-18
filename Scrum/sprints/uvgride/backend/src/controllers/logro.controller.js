// // src/controllers/logro.controller.js
// const Logro = require('../models/Logro');
// const UsuarioLogro = require('../models/UsuarioLogro');

// exports.catalogo = async (_req, res) => {
//   try {
//     const list = await Logro.findAll({ where: { activo: true }, order: [['id_logro','ASC']] });
//     res.json({ success: true, catalogo: list });
//   } catch (e) {
//     console.error('❌ catalogo logros', e);
//     res.status(500).json({ success: false, error: 'Error al listar catálogo de logros' });
//   }
// };

// exports.misLogros = async (req, res) => {
//   try {
//     const id_usuario = req.user?.id_usuario;
//     if (!id_usuario) return res.status(401).json({ success: false, error: 'No autorizado' });

//     const list = await UsuarioLogro.findAll({
//       where: { id_usuario },
//       include: [{ model: Logro, as: 'logro' }],
//       order: [['desbloqueado','DESC'], ['progreso','DESC']],
//     });

//     res.json({ success: true, logros: list });
//   } catch (e) {
//     console.error('❌ misLogros', e);
//     res.status(500).json({ success: false, error: 'Error al obtener logros del usuario' });
//   }
// };

// // Endpoint opcional para sembrar un catálogo simple
// exports.seedBasico = async (_req, res) => {
//   try {
//     const payload = [
//       {
//         codigo: 'PRIMER_VIAJE',
//         titulo: '¡Primer viaje!',
//         descripcion: 'Creaste tu primer viaje como conductor.',
//         icono: '🚗',
//         evento: 'viaje_creado',
//         umbral: 1,
//       },
//       {
//         codigo: 'FAVORITO_1',
//         titulo: 'Mi lugar favorito',
//         descripcion: 'Guardaste tu primer lugar favorito.',
//         icono: '📍',
//         evento: 'favorito_creado',
//         umbral: 1,
//       },
//       {
//         codigo: 'VIAJES_5',
//         titulo: 'Rutina semanal',
//         descripcion: 'Completaste 5 viajes.',
//         icono: '🏁',
//         evento: 'viaje_completado',
//         umbral: 5,
//       },
//     ];

//     for (const l of payload) {
//       await Logro.findOrCreate({ where: { codigo: l.codigo }, defaults: l });
//     }

//     res.json({ success: true, seeded: payload.length });
//   } catch (e) {
//     console.error('❌ seedBasico', e);
//     res.status(500).json({ success: false, error: 'No se pudo sembrar los logros' });
//   }
// };
