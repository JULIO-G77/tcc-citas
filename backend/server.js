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
const adminRoutes = require('./routes/admin'); // ✅ LÍNEA 1 NUEVA

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ SERVIR ARCHIVOS ESTÁTICOS del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// ✅ RUTAS PARA LAS PÁGINAS HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/register.html'));
});

app.get('/admin', (req, res) => { // ✅ LÍNEA 2 NUEVA
  res.sendFile(path.join(__dirname, '../frontend/admin.html'));
});

// ✅ DEBUG: Verificar carga de rutas (DESPUÉS de inicializar app)
console.log('🔄 Cargando rutas...');

// ✅ RUTAS DE LA API
app.use('/api/patients', patientRoutes);
console.log('✅ Ruta /api/patients cargada');

app.use('/api/appointments', appointmentRoutes);
console.log('✅ Ruta /api/appointments cargada');

app.use('/api/doctors', doctorsRoutes);
console.log('✅ Ruta /api/doctors cargada');

app.use('/api/admin', adminRoutes); // ✅ LÍNEA 3 NUEVA
console.log('✅ Ruta /api/admin cargada');

// PUERTO
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Backend escuchando en http://localhost:${PORT}`);
});