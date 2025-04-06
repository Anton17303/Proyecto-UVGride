const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rutas
const exampleRoutes = require('./routes/example.routes');
app.use('/api/example', exampleRoutes);

app.get('/', (req, res) => {
    res.send('API funcionando');
  });

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});