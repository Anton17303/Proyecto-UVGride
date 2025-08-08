// src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// 👉 inicializa DB (auth + asociaciones) antes de levantar server
const { initDB } = require('./models');

const app = express();
const port = process.env.PORT || 3001;

/* ---------- Middlewares ---------- */
app.set('trust proxy', true); // útil si algún día pones un proxy/CDN delante

// CORS: en dev puedes permitir todo, en prod usa CORS_ORIGIN con tu dominio/app
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' })); // evita payloads gigantes accidentales

/* ---------- Rutas ---------- */
const authRoutes = require('./routes/auth.routes');
const exampleRoutes = require('./routes/example.routes');
const viajeRoutes = require('./routes/viaje.routes');
const favoriteRoutes = require('./routes/favorite.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const pagoRoutes = require('./routes/pago.routes');
const driverRoutes = require('./routes/driver.routes');

app.use('/api/auth', authRoutes);
app.use('/api/example', exampleRoutes);
app.use('/api/viajes', viajeRoutes);
app.use('/api/favoritos', favoriteRoutes);
app.use('/api/vehiculos', vehicleRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api', driverRoutes);

// Healthcheck simple
app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true, uptime: process.uptime() });
});

// Ruta raíz
app.get('/', (_req, res) => {
  res.send('API funcionando ✅');
});

/* ---------- 404 y manejador de errores ---------- */
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('❌ Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

/* ---------- Levantar servidor tras init DB ---------- */
(async () => {
  try {
    await initDB(); // autentica/sequelize.sync si lo activaste en models/index.js
    app.listen(port, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
    });
  } catch (err) {
    console.error('❌ No se pudo iniciar el servidor por fallo de DB:', err);
    process.exit(1);
  }
})();

module.exports = app; // útil para tests