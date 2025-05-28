const Categoria = require('../models/Categoria');

exports.getHomeData = async (req, res) => {
  try {
    const usuario = req.user; // info del token por el middleware
    const categorias = await Categoria.findAll();

    res.json({
      usuario: {
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo_institucional
      },
      categorias,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener datos de inicio' });
  }
};
 