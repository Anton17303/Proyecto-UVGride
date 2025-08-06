const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicle.controller');

// Crear un nuevo vehículo
router.post('/vehiculos', vehicleController.crearVehiculo);

// Obtener todos los vehículos de un usuario
router.get('/vehiculos/usuario/:id_usuario', vehicleController.obtenerVehiculosPorUsuario);

// Eliminar un vehículo por ID
router.delete('/vehiculos/:id', vehicleController.eliminarVehiculo);

module.exports = router;