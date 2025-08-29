// src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Inicializa DB (auth + asociaciones) antes de levantar server
const { initDB } = require('./models');

const app = express();
const port = process.env.PORT || 3001;

/* ---------- Middlewares base ---------- */
app.disable('x-powered-by');
app.set('trust proxy', true);

// CORS: si no defines CORS_ORIGIN, reflejamos el origin (válido con credenciales)
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : null;

app.use(
  cors({
    origin: (origin, callback) => {
      // requests sin Origin (curl/healthchecks) => permitir
      if (!origin) return callback(null, true);
      if (!allowedOrigins) return callback(null, true); // reflect origin
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origin bloqueado por CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

// Body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

/* ---------- helper: require defensivo ---------- */
const tryRequire = (name, path) => {
  try {
    console.log(`📦 Cargando rutas: ${name} (${path})`);
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const mod = require(path);
    console.log(`✅ Rutas cargadas: ${name}`);
    return mod;
  } catch (e) {
    console.error(`❌ Falló al cargar rutas ${name} (${path}):`, e?.message || e);
    throw e;
  }
};

/* ---------- Rutas (carga defensiva) ---------- */
const authRoutes     = tryRequire('auth',      './routes/auth.routes');
const exampleRoutes  = tryRequire('example',   './routes/example.routes');
const viajeRoutes    = tryRequire('viajes',    './routes/viaje.routes');
const favoriteRoutes = tryRequire('favoritos', './routes/favorite.routes');
const vehicleRoutes  = tryRequire('vehiculos', './routes/vehicle.routes');
const pagoRoutes     = tryRequire('pagos',     './routes/pago.routes');
const driverRoutes   = tryRequire('driver',    './routes/driver.routes');
const grupoRoutes    = tryRequire('grupos',    './routes/grupo.routes');

/* ---------- Mount ---------- */
app.use('/api/auth',       authRoutes);
app.use('/api/example',    exampleRoutes);
app.use('/api/viajes',     viajeRoutes);
app.use('/api/favoritos',  favoriteRoutes);
app.use('/api/vehiculos',  vehicleRoutes);
app.use('/api/pagos',      pagoRoutes);
app.use('/api',            driverRoutes);
app.use('/api/grupos',     grupoRoutes);

/* ---------- Health & root ---------- */
app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true, uptime: process.uptime() });
});

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
  const code = err.status || 500;
  res.status(code).json({ error: err.message || 'Error interno del servidor' });
});

/* ---------- Levantar servidor tras init DB ---------- */
(async () => {
  try {
    await initDB();
    app.listen(port, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
      if (allowedOrigins && allowedOrigins.length) {
        console.log(`🌐 CORS permitido para: ${allowedOrigins.join(', ')}`);
      } else {
        console.log('🌐 CORS origin reflejado (dev friendly)');
      }
    });
  } catch (err) {
    console.error('❌ No se pudo iniciar el servidor por fallo de DB:', err);
    process.exit(1);
  }
})();

module.exports = app;