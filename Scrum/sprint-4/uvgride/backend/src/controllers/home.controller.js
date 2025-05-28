const Usuario = require('../models/Usuario');

exports.getHomeData = async (req, res) => {
  try {
    const userId = req.user.id_usuario;
    
    // Datos del usuario logueado
    const user = await Usuario.findByPk(userId, {
      attributes: ['id_usuario', 'nombre', 'apellido', 'correo_institucional', 'foto_perfil', 'universidad']
    });

    // Datos de ejemplo
    const nearbyTrips = [];
    const notifications = [];
    const recentActivity = [];

    res.json({
      user,
      nearbyTrips,
      notifications,
      recentActivity,
      stats: {
        completedTrips: 0,
        sharedRides: 0,
        rating: 4.5
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener datos de inicio' });
  }
};