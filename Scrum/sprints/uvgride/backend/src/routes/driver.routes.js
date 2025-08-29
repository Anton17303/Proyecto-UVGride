// src/routes/driver.routes.js
const express = require('express');
const router = express.Router();

const {
  listConductoresConVehiculo,
  getDriverPublicProfile,
  rateDriverSimple,            // POST /conductores/:id/calificar
  getDriverRatingSummary,      // GET  /conductores/:id/calificacion-resumen
  listDriverRatings,           // GET  /conductores/:id/calificaciones
} = require('../controllers/driver.controller');

// Validador y normalizador del parámetro :id
router.param('id', (req, res, next, id) => {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) {
    return res.status(400).json({ error: 'Parámetro id inválido' });
  }
  // Guarda el id como número por conveniencia
  req.conductorId = n;
  next();
});

/* ========================= Conductores ========================= */
// Listado de conductores con ≥1 vehículo
router.get('/conductores', listConductoresConVehiculo);

// Perfil público de un conductor por id
router.get('/conductores/:id', getDriverPublicProfile);

/* ===================== Calificaciones simples ===================== */
// Crear o actualizar calificación para el conductor (global, no por viaje)
router.post('/conductores/:id/calificar', rateDriverSimple);

// Resumen de calificaciones del conductor: { promedio, total }
router.get('/conductores/:id/calificacion-resumen', getDriverRatingSummary);

// Listado paginado de calificaciones del conductor
router.get('/conductores/:id/calificaciones', listDriverRatings);

module.exports = router;