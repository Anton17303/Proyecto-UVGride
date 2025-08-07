const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas principales
const authRoutes = require('./routes/auth.routes');
const exampleRoutes = require('./routes/example.routes');
const viajeRoutes = require('./routes/viaje.routes');
const favoriteRoutes = require('./routes/favorite.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const pagoRoutes = require('./routes/pago.routes');

// Prefijo para rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/example', exampleRoutes);
app.use('/api/viajes', viajeRoutes);
app.use('/api/favoritos', favoriteRoutes);
app.use('/api/vehiculos', vehicleRoutes);
app.use('/api/pagos', pagoRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.send('API funcionando ✅');
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});