// patients.js (routes)
// [ETIQUETA] Define rutas REST para pacientes
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/patientsCtrl');

router.post('/', ctrl.createPatient);        // CREATE
router.get('/', ctrl.getPatients);           // READ
router.put('/:id', ctrl.updatePatient);      // UPDATE
router.delete('/:id', ctrl.deletePatient);   // DELETE

module.exports = router;
