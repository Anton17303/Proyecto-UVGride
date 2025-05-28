const User = require('../models/Usuario');

exports.getHomeData = async (req, res) => {
  try {
    const userId = req.user.id; // Asumiendo que tienes autenticación
    
    // Datos de ejemplo para la pantalla de inicio
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'profileImage']
    });

    const nearbyTrips = []; // Aquí iría la lógica para obtener viajes cercanos
    const recentActivity = []; // Actividad reciente

    res.json({
      user,
      nearbyTrips,
      recentActivity,
      stats: {
        completedTrips: 0,
        sharedRides: 0,
        rating: 4.5
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener datos de inicio' });
  }
};