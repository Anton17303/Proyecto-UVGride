const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicle.controller');

// Crear un nuevo vehículo
router.post('/', vehicleController.crearVehiculo);

// Obtener todos los vehículos de un usuario
router.get('/usuario/:id_usuario', vehicleController.obtenerVehiculosPorUsuario);

// Eliminar un vehículo por ID
router.delete('/:id', vehicleController.eliminarVehiculo);

module.exports = router;