// server.js
// [ETIQUETA] Punto de entrada del servidor: configura Express, rutas y conecta MongoDB

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');


// IMPORTAR RUTAS
const patientRoutes = require('./routes/patients');
const appointmentRoutes = require('./routes/appointments');
const doctorsRoutes = require('./routes/doctors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, '../frontend')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// REGISTRAR RUTAS
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/doctors', doctorsRoutes);

// PUERTO
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Backend escuchando en http://localhost:${PORT}`);
});
