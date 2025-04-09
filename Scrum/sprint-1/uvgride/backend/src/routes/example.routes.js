// src/routes/example.routes.js
const express = require('express');
const router = express.Router();

// Ruta de ejemplo
router.get('/', (req, res) => {
  res.json({ message: 'Ruta de ejemplo funcionando correctamente' });
});

// Otra ruta de ejemplo
router.get('/test', (req, res) => {
  res.json({ message: 'Esta es una ruta de prueba' });
});

module.exports = router;