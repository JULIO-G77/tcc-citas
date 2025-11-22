// doctors.js (routes)
// [ETIQUETA] Define rutas REST para doctores
const express = require('express');
const router = express.Router();
const doctorsCtrl = require('../controllers/doctorsCtrl');

router.get('/', doctorsCtrl.getDoctors);                    // Obtener todos los doctores
router.get('/available', doctorsCtrl.getAvailableDoctors);  // ✅ Doctores disponibles

module.exports = router;