const express = require('express');
const router = express.Router();
const viajeController = require('../controllers/viaje.controller');

// Middleware para validar datos del viaje
const validateViajeData = (req, res, next) => {
  const { origen, destino, lat_origen, lon_origen, lat_destino, lon_destino } = req.body;
  
  if (!origen || !destino) {
    return res.status(400).json({
      error: 'Origen y destino son requeridos'
    });
  }
  
  if (!lat_origen || !lon_origen || !lat_destino || !lon_destino) {
    return res.status(400).json({
      error: 'Las coordenadas de origen y destino son requeridas'
    });
  }
  
  // Validar que las coordenadas sean números válidos
  if (isNaN(lat_origen) || isNaN(lon_origen) || isNaN(lat_destino) || isNaN(lon_destino)) {
    return res.status(400).json({
      error: 'Las coordenadas deben ser números válidos'
    });
  }
  
  // Validar rangos de coordenadas
  if (lat_origen < -90 || lat_origen > 90 || lat_destino < -90 || lat_destino > 90) {
    return res.status(400).json({
      error: 'La latitud debe estar entre -90 y 90 grados'
    });
  }
  
  if (lon_origen < -180 || lon_origen > 180 || lon_destino < -180 || lon_destino > 180) {
    return res.status(400).json({
      error: 'La longitud debe estar entre -180 y 180 grados'
    });
  }
  
  next();
};

router.post('/crear', viajeController.crearViaje);
router.get('/usuario/:userId', viajesController.obtenerViajesPorUsuario);
router.get('/', viajeController.obtenerViajes);
router.delete('/:id', viajesController.eliminarViaje);
router.get('/:id', viajeController.obtenerViajePorId);
router.put('/:id', validateViajeData, viajesController.actualizarViaje);
router.get('/', viajesController.obtenerTodosLosViajes);

module.exports = router;