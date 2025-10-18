// src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

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
      if (!allowedOrigins) return callback(null, true); // reflejar origin en dev
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

// Body parsers (nota: uploads multipart los maneja multer, no aquí)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

/* ---------- Static: servir avatares ---------- */
const AVATARS_DIR = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(AVATARS_DIR)) {
  fs.mkdirSync(AVATARS_DIR, { recursive: true });
}
app.use('/static/avatars', express.static(AVATARS_DIR));

/* ---------- helper: require defensivo ---------- */
const tryRequire = (name, relPath) => {
  try {
    console.log(`📦 Cargando rutas: ${name} (${relPath})`);
    // eslint-disable-next-line import/no-dynamic-require, global-require
    const mod = require(relPath);
    console.log(`✅ Rutas cargadas: ${name}`);
    return mod;
  } catch (e) {
    console.error(`❌ Falló al cargar rutas ${name} (${relPath}):`, e?.message || e);
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
const driverRoutes   = tryRequire('driver',    './routes/driver.routes'); // incluye /conductores y ratings simples
const grupoRoutes    = tryRequire('grupos',    './routes/grupo.routes');
const userRoutes     = tryRequire('usuarios',  './routes/user.routes');   // <-- NUEVO: perfil (me, avatar, etc.)

/* ---------- Mount ---------- */
app.use('/api/auth',       authRoutes);
app.use('/api/example',    exampleRoutes);
app.use('/api/viajes',     viajeRoutes);
app.use('/api/favoritos',  favoriteRoutes);
app.use('/api/vehiculos',  vehicleRoutes);
app.use('/api/pagos',      pagoRoutes);
app.use('/api',            driverRoutes); // /api/conductores..., /api/conductores/:id/calificar, etc.
app.use('/api/grupos',     grupoRoutes);
app.use('/api/users',      userRoutes);   // <-- NUEVO

/* ---------- Health & root ---------- */
app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true, uptime: process.uptime() });
});

app.get('/', (_req, res) => {
  res.send('API funcionando ✅');

});

/* ---------- 404 ---------- */
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

/* ---------- Manejador de errores (incluye Multer) ---------- */
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('❌ Error no manejado:', err);

  // Errores comunes de subida de avatar
  if (err && err.message === 'Tipo de archivo no permitido') {
    return res.status(400).json({ error: err.message });
  }
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'El archivo supera 2MB' });
  }

  const code = err.status || 500;
  res.status(code).json({ error: err.message || 'Error interno del servidor' });
});

/* ---------- Levantar servidor tras init DB ---------- */
if (process.env.NODE_ENV !== 'test') {
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
        console.log(`🖼️  Avatares servidos desde /static/avatars (dir: ${AVATARS_DIR})`);
      });
    } catch (err) {
      console.error('❌ No se pudo iniciar el servidor por fallo de DB:', err);
      process.exit(1);
    }
  })();
}

module.exports = app;
