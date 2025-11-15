// appointments.js (routes)
// [ETIQUETA] Define rutas REST para citas
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/appointmentsCtrl');

router.post('/', ctrl.createAppointment);        // CREATE
router.get('/', ctrl.getAppointments);           // READ
router.put('/:id', ctrl.updateAppointment);      // UPDATE
router.delete('/:id', ctrl.deleteAppointment);   // DELETE

module.exports = router;
