const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientsCtrl');

console.log('🔄 Inicializando rutas de pacientes...');
console.log('📋 Métodos disponibles en patientController:', Object.keys(patientController));

// Verificar específicamente loginPatient
console.log('🔐 loginPatient existe?:', typeof patientController.loginPatient);
console.log('🔐 loginPatient es función?:', typeof patientController.loginPatient === 'function');

// Rutas de pacientes
router.post('/register', patientController.createPatient);
router.get('/', patientController.getPatients);
router.get('/:id', patientController.getPatientById);
router.put('/:id', patientController.updatePatient);
router.delete('/:id', patientController.deletePatient);
router.post('/login', patientController.loginPatient);

console.log('✅ Todas las rutas de pacientes configuradas');
console.log('📝 Rutas configuradas:');
console.log('  - POST /register');
console.log('  - GET /');
console.log('  - GET /:id'); 
console.log('  - PUT /:id');
console.log('  - DELETE /:id');
console.log('  - POST /login');

module.exports = router;