const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rutas principales
const authRoutes = require('./routes/auth.routes');
const exampleRoutes = require('./routes/example.routes');
const viajeRoutes = require('./routes/viaje.routes'); // ✅ Rutas de viajes

app.use('/api/auth', authRoutes);
app.use('/api/example', exampleRoutes);
app.use('/api/viajes', viajeRoutes);

// Endpoint raíz
app.get('/', (req, res) => {
  res.send('API funcionando');
});

// 🔥 Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});