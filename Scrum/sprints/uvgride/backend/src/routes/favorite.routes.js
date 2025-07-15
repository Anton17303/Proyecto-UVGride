const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favorite.controller');

// 👉 Crear un nuevo lugar favorito
router.post('/', favoriteController.crearFavorito);

// 👉 Obtener todos los favoritos de un usuario (asegúrate que el ID llegue desde el frontend correctamente)
router.get('/usuario/:id_usuario', favoriteController.obtenerFavoritosPorUsuario);

// 👉 Obtener un favorito específico por ID (opcional)
router.get('/:id_lugar_favorito', favoriteController.obtenerFavoritoPorId);

// 👉 Eliminar un lugar favorito por ID
router.delete('/:id_lugar_favorito', favoriteController.eliminarFavorito);

module.exports = router;