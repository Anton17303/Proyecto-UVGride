// src/routes/viaje.routes.js
const express = require('express');
const router = express.Router();
const viajeController = require('../controllers/viaje.controller');

// Verificar que todas las funciones del controller existan
[
  'obtenerViajesPorUsuario',
  'obtenerViajesProgramados',
  'buscarViajesCercanos',
  'crearViaje',
  'obtenerViajes',
  'obtenerViajePorId',
  'actualizarViaje',
  'eliminarViaje',
].forEach(fn => {
  if (typeof viajeController[fn] !== 'function') {
    throw new Error(`❌ viajeController.${fn} no está definido o no es una función`);
  }
});

// ✅ Middleware de validación flexible
const validateViajeData = (req, res, next) => {
  const {
    origen,
    destino,
    lat_origen,
    lon_origen,
    lat_destino,
    lon_destino,
    id_usuario,
    es_programado,
    fecha_programada,
  } = req.body;

  // 📌 Validación general
  if (!origen?.trim() || !destino?.trim()) {
    return res.status(400).json({ error: 'Origen y destino son requeridos' });
  }

  if (!id_usuario) {
    return res.status(400).json({ error: 'El ID del usuario es requerido' });
  }

  // 📌 Si es programado: solo validar fecha_programada
  if (es_programado) {
    if (!fecha_programada) {
      return res.status(400).json({
        error: 'fecha_programada es requerida para viajes programados',
      });
    }
    return next();
  }

  // 📌 Si NO es programado: validar coordenadas
  const coords = [lat_origen, lon_origen, lat_destino, lon_destino].map((v) =>
    Number(v)
  );

  if (coords.some((v) => !Number.isFinite(v))) {
    return res
      .status(400)
      .json({ error: 'Las coordenadas deben ser números válidos' });
  }

  const [lao, loo, lad, lod] = coords;

  if (lao < -90 || lao > 90 || lad < -90 || lad > 90) {
    return res
      .status(400)
      .json({ error: 'La latitud debe estar entre -90 y 90 grados' });
  }

  if (loo < -180 || loo > 180 || lod < -180 || lod > 180) {
    return res
      .status(400)
      .json({ error: 'La longitud debe estar entre -180 y 180 grados' });
  }

  next();
};

// 📌 Rutas específicas primero
router.get('/usuario/:userId', viajeController.obtenerViajesPorUsuario);
router.get('/programados/:userId', viajeController.obtenerViajesProgramados);
router.get('/buscar/cercanos', viajeController.buscarViajesCercanos);

// 📌 Rutas generales
router.post('/crear', validateViajeData, viajeController.crearViaje);
router.get('/', viajeController.obtenerViajes);
router.get('/:id', viajeController.obtenerViajePorId);
router.put('/:id', viajeController.actualizarViaje); // updates parciales → sin validación estricta
router.delete('/:id', viajeController.eliminarViaje);

module.exports = router;