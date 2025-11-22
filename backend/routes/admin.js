// =============================================
// 🏥 RUTAS ADMINISTRATIVAS - SISTEMA HOSPITALARIO
// =============================================

const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/adminCtrl');

// 🔐 RUTAS DE AUTENTICACIÓN
router.post('/login', adminCtrl.loginAdmin);

// 📊 RUTAS DEL DASHBOARD
router.get('/dashboard/stats', adminCtrl.getDashboardStats);

// 👥 RUTAS DE GESTIÓN DE PACIENTES
router.get('/patients', adminCtrl.getPatientsAdmin);

// 🩺 RUTAS DE GESTIÓN DE DOCTORES  
router.get('/doctors', adminCtrl.getDoctorsAdmin);

// 📅 RUTAS DE GESTIÓN DE CITAS
router.get('/appointments', adminCtrl.getAppointmentsAdmin);

// 🔥 NUEVAS RUTAS PARA GESTIÓN COMPLETA DE CITAS
router.post('/appointments', adminCtrl.createAppointmentAdmin);           // Crear cita
router.get('/appointments/:id', adminCtrl.getAppointmentByIdAdmin);       // Obtener cita específica
router.put('/appointments/:id', adminCtrl.updateAppointmentAdmin);        // Actualizar cita
router.delete('/appointments/:id', adminCtrl.deleteAppointmentAdmin);     // Cancelar cita

// 👥 RUTAS PARA SELECTS DE FORMULARIOS
router.get('/doctors-select', adminCtrl.getDoctorsForSelect);             // Doctores para select
router.get('/patients-select', adminCtrl.getPatientsForSelect);           // Pacientes para select

// 📈 RUTAS DE REPORTES AVANZADOS
router.get('/reports', adminCtrl.getReports);

// 🔍 RUTA DE VERIFICACIÓN DE SALUD
router.get('/health', (req, res) => {
    res.json({ 
        success: true, 
        message: '🏥 Sistema Administrativo Hospitalario - Funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

module.exports = router;