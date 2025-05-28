const express = require('express');
const router = express.Router();
const viajeController = require('../controllers/viaje.controller');

router.post('/crear', viajeController.crearViaje);

router.get('/', viajeController.obtenerViajes);

router.get('/:id', viajeController.obtenerViajePorId);

module.exports = router;