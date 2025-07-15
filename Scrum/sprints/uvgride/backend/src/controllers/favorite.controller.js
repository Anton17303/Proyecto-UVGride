const LugarFavorito = require('../models/LugarFavorito');

// ✅ Crear un lugar favorito
exports.crearFavorito = async (req, res) => {
  try {
    const {
      id_usuario,
      nombre_lugar,
      descripcion,
      color_hex,
    } = req.body;

    if (!id_usuario || !nombre_lugar || !color_hex) {
      return res.status(400).json({
        success: false,
        error: 'id_usuario, nombre_lugar y color_hex son requeridos',
      });
    }

    const nuevoFavorito = await LugarFavorito.create({
      id_usuario,
      nombre_lugar,
      descripcion,
      color_hex,
    });

    res.status(201).json({ success: true, favorito: nuevoFavorito });
  } catch (error) {
    console.error('❌ Error al crear lugar favorito:', error);
    res.status(500).json({ success: false, error: 'Error al crear el lugar favorito' });
  }
};

// ✅ Obtener todos los favoritos de un usuario
exports.obtenerFavoritosPorUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;

    const favoritos = await LugarFavorito.findAll({ where: { id_usuario } });

    res.json({ success: true, favoritos });
  } catch (error) {
    console.error('❌ Error al obtener favoritos:', error);
    res.status(500).json({ success: false, error: 'Error al obtener favoritos' });
  }
};

// ✅ Obtener un favorito por su ID
exports.obtenerFavoritoPorId = async (req, res) => {
  try {
    const { id_lugar_favorito } = req.params;

    const favorito = await LugarFavorito.findByPk(id_lugar_favorito);

    if (!favorito) {
      return res.status(404).json({ success: false, error: 'Lugar favorito no encontrado' });
    }

    res.json({ success: true, favorito });
  } catch (error) {
    console.error('❌ Error al obtener favorito por ID:', error);
    res.status(500).json({ success: false, error: 'Error al obtener favorito por ID' });
  }
};

// ✅ Eliminar un lugar favorito por ID
exports.eliminarFavorito = async (req, res) => {
  try {
    const { id_lugar_favorito } = req.params;

    const eliminado = await LugarFavorito.destroy({ where: { id_lugar_favorito } });

    if (!eliminado) {
      return res.status(404).json({ success: false, error: 'Lugar favorito no encontrado' });
    }

    res.json({ success: true, message: 'Lugar favorito eliminado correctamente' });
  } catch (error) {
    console.error('❌ Error al eliminar favorito:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar el lugar favorito' });
  }
};