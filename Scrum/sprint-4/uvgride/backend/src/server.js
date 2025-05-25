const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rutas principales
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

const exampleRoutes = require('./routes/example.routes');
app.use('/api/example', exampleRoutes);

// ✅ Importa sequelize (ajusta la ruta según tu proyecto)
const { sequelize } = require('./models');

// Endpoint raíz
app.get('/', (req, res) => {
    res.send('API funcionando');
});

// ✅ Endpoint para verificar la conexión a la base de datos
app.get('/ping-db', async (req, res) => {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexión a la base de datos exitosa.');
        res.json({ message: 'Conexión a la base de datos OK' });
    } catch (error) {
        console.error('❌ Error al conectar a la base de datos:', error);
        res.status(500).json({ error: 'Error al conectar a la base de datos' });
    }
});

// 🔥 Iniciar servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});