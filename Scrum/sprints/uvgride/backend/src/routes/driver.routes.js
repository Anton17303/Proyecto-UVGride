// src/routes/driver.routes.js
const express = require('express');
const router = express.Router();
const {
  listConductoresConVehiculo,
  getDriverPublicProfile,
} = require('../controllers/driver.controller');

// Validador del parámetro :id (solo aplica a rutas con :id)
router.param('id', (req, res, next, id) => {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) {
    return res.status(400).json({ error: 'Parámetro id inválido' });
  }
  // opcional: req.driverId = n;
  next();
});

// Listado de conductores con >=1 vehículo
router.get('/conductores', listConductoresConVehiculo);

// Perfil público de un conductor por id
router.get('/conductores/:id', getDriverPublicProfile);

module.exports = router;