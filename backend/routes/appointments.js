const express = require('express');
const router = express.Router();
const appointmentsController = require('../controllers/appointmentsCtrl');

// ✅ RUTAS ESPECÍFICAS PRIMERO
router.post('/', appointmentsController.createAppointment);
router.get('/', appointmentsController.getAppointments);
router.get('/my-appointments', appointmentsController.getMyAppointments); // ✅ PRIMERO
router.get('/check-availability', appointmentsController.checkAvailability);

// ✅ RUTAS CON PARÁMETROS AL FINAL
router.get('/:id', appointmentsController.getAppointmentById); // ✅ AL FINAL
router.put('/:id', appointmentsController.updateAppointment);
router.delete('/:id', appointmentsController.deleteAppointment);

module.exports = router;