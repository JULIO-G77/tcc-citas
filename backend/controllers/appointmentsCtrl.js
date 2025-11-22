// appointmentsCtrl.js
// [ETIQUETA] Controlador para gestionar citas con validaciones y mensajes específicos
const { getConnection } = require('../config/mysql');

// [ETIQUETA] Crear cita con validaciones por área e intervalos de 1 hora
exports.createAppointment = async (req, res) => {
  let conn;
  try {
    const { patient_id, doctor_id, appointment_date, reason } = req.body;
    
    console.log('🔄 createAppointment - Datos recibidos:', req.body);

    // [ETIQUETA] Validaciones básicas
    if (!patient_id || !doctor_id || !appointment_date || !reason) {
      return res.status(400).json({ 
        success: false,
        error: 'Todos los campos son requeridos: paciente, doctor, fecha y motivo' 
      });
    }

    const appointmentTime = new Date(appointment_date);
    if (isNaN(appointmentTime.getTime())) {
      return res.status(400).json({ 
        success: false,
        error: 'Formato de fecha incorrecto. Use: YYYY-MM-DDTHH:MM' 
      });
    }

    conn = await getConnection();

    // 1. VALIDAR QUE LA CITA NO SEA EN EL PASADO
    const now = new Date();
    if (appointmentTime < now) {
      return res.status(400).json({ 
        success: false,
        error: '❌ No se pueden agendar citas en fechas pasadas' 
      });
    }

    // 2. VALIDAR HORARIO LABORAL (8:00 - 18:00)
    const appointmentHour = appointmentTime.getHours();
    if (appointmentHour < 8 || appointmentHour > 18) {
      return res.status(400).json({ 
        success: false,
        error: '❌ El horario debe ser entre 8:00 AM y 6:00 PM' 
      });
    }

    // 3. VALIDAR QUE EL DOCTOR EXISTA
    const [doctorCheck] = await conn.execute(
      'SELECT id, name FROM doctors WHERE id = ?',
      [doctor_id]
    );
    
    if (doctorCheck.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: '❌ El doctor seleccionado no existe' 
      });
    }

    // 4. VALIDAR QUE EL DOCTOR NO TENGA CITAS EN EL MISMO HORARIO
    const appointmentDateStr = appointmentTime.toISOString().split('T')[0];
    
    const [existingAppointments] = await conn.execute(
      `SELECT * FROM appointments 
       WHERE doctor_id = ? AND DATE(appointment_date) = ? 
       AND ABS(TIMESTAMPDIFF(MINUTE, appointment_date, ?)) < 60
       AND status != 'cancelada'`,
      [doctor_id, appointmentDateStr, appointment_date]
    );

    if (existingAppointments.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: '❌ El doctor ya tiene una cita programada en este horario' 
      });
    }

    // 5. VALIDAR QUE EL PACIENTE NO TENGA CITAS EN EL MISMO HORARIO
    const [existingPatientAppointments] = await conn.execute(
      `SELECT * FROM appointments 
       WHERE patient_id = ? AND DATE(appointment_date) = ? 
       AND ABS(TIMESTAMPDIFF(MINUTE, appointment_date, ?)) < 60
       AND status != 'cancelada'`,
      [patient_id, appointmentDateStr, appointment_date]
    );

    if (existingPatientAppointments.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: '❌ Ya tienes una cita programada en este horario' 
      });
    }

    // ✅ SI PASÓ TODAS LAS VALIDACIONES, CREAR LA CITA
    const [result] = await conn.execute(
      `INSERT INTO appointments (patient_id, doctor_id, appointment_date, reason, status) 
       VALUES (?, ?, ?, ?, 'pendiente')`,
      [patient_id, doctor_id, appointment_date, reason]
    );

    await conn.end();

    res.json({ 
      success: true,
      id: result.insertId,
      message: '✅ Cita agendada exitosamente' 
    });

  } catch (err) {
    if (conn) await conn.end();
    console.error('❌ Error creando cita:', err);
    
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor al crear la cita' 
    });
  }
};

exports.getAppointments = async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(`
      SELECT a.*, p.first_name, p.last_name, d.name as doctor_name, d.specialty
      FROM appointments a 
      LEFT JOIN patients p ON a.patient_id = p.id 
      LEFT JOIN doctors d ON a.doctor_id = d.id
      ORDER BY a.appointment_date DESC
    `);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Error cargando citas', err);
    res.status(500).json({ error: 'Error obteniendo la lista de citas' });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_id, doctor_id, appointment_date, reason, status } = req.body;
    
    const conn = await getConnection();
    
    // [ETIQUETA] VALIDACIÓN para actualización (excluir la cita actual)
    const [doctorAppointments] = await conn.execute(
      `SELECT a.id, d.name as doctor_name 
       FROM appointments a 
       JOIN doctors d ON a.doctor_id = d.id
       WHERE a.doctor_id = ? AND a.appointment_date = ? AND a.id != ?`,
      [doctor_id, appointment_date, id]
    );
    
    if (doctorAppointments.length > 0) {
      await conn.end();
      const doctorName = doctorAppointments[0].doctor_name;
      const fechaHora = new Date(appointment_date).toLocaleString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      return res.status(400).json({ 
        error: `El ${doctorName} ya tiene otra cita programada para el ${fechaHora}. Por favor, elige otro horario.` 
      });
    }
    
    const [patientAppointments] = await conn.execute(
      `SELECT id, appointment_date 
       FROM appointments 
       WHERE patient_id = ? AND appointment_date = ? AND id != ?`,
      [patient_id, appointment_date, id]
    );
    
    if (patientAppointments.length > 0) {
      await conn.end();
      const fechaHora = new Date(appointment_date).toLocaleString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      return res.status(400).json({ 
        error: `El paciente ya tiene otra cita programada para el ${fechaHora}. Por favor, elige otro horario.` 
      });
    }
    
    await conn.execute(
      'UPDATE appointments SET patient_id=?, doctor_id=?, appointment_date=?, reason=?, status=? WHERE id=?',
      [patient_id, doctor_id, appointment_date, reason, status, id]
    );
    
    await conn.end();
    
    res.json({ 
      message: '✅ Cita actualizada exitosamente' 
    });
    
  } catch (err) {
    console.error('Error actualizando cita', err);
    res.status(500).json({ error: 'Error actualizando la cita: ' + err.message });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await getConnection();
    
    // [ETIQUETA] Obtener información de la cita antes de eliminar
    const [appointmentInfo] = await conn.execute(
      `SELECT a.*, d.name as doctor_name 
       FROM appointments a 
       JOIN doctors d ON a.doctor_id = d.id 
       WHERE a.id = ?`,
      [id]
    );
    
    await conn.execute('DELETE FROM appointments WHERE id=?', [id]);
    await conn.end();
    
    if (appointmentInfo.length > 0) {
      const appointment = appointmentInfo[0];
      const fechaHora = new Date(appointment.appointment_date).toLocaleString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      res.json({ 
        message: `✅ Cita con el ${appointment.doctor_name} para el ${fechaHora} ha sido cancelada exitosamente.` 
      });
    } else {
      res.json({ 
        message: '✅ Cita eliminada exitosamente' 
      });
    }
    
  } catch (err) {
    console.error('Error eliminando cita', err);
    res.status(500).json({ error: 'Error eliminando la cita: ' + err.message });
  }
};

// [ETIQUETA] Obtener citas del paciente actual
exports.getMyAppointments = async (req, res) => {
  try {
    // [ETIQUETA] Obtener patient_id desde query parameters
    const patientId = req.query.patient_id || 1;
    
    console.log('📋 Solicitando citas para paciente ID:', patientId);
    
    const conn = await getConnection();
    const [rows] = await conn.execute(`
      SELECT a.*, d.name as doctor_name, d.specialty
      FROM appointments a 
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE a.patient_id = ?
      ORDER BY a.appointment_date DESC
    `, [patientId]);
    
    await conn.end();
    
    console.log('✅ Citas encontradas:', rows.length);
    res.json(rows);
    
  } catch (err) {
    console.error('❌ Error cargando citas del paciente:', err);
    res.status(500).json({ error: 'Error obteniendo tus citas' });
  }
};

// ✅ VERIFICAR DISPONIBILIDAD DE HORA
async function checkAvailability(req, res) {
    try {
        const { doctor_id, datetime } = req.query;
        
        if (!doctor_id || !datetime) {
            return res.status(400).json({ 
                success: false, 
                error: 'Doctor ID y datetime son requeridos' 
            });
        }

        const conn = await getConnection();
        
        // Verificar si ya existe una cita en esa fecha/hora con ese doctor
        const [existing] = await conn.execute(
            `SELECT id FROM appointments 
             WHERE doctor_id = ? AND appointment_date = ? AND status != 'cancelada'`,
            [doctor_id, datetime]
        );
        
        await conn.end();
        
        res.json({
            success: true,
            available: existing.length === 0,
            message: existing.length === 0 ? 'Hora disponible' : 'Hora no disponible'
        });
        
    } catch (error) {
        console.error('❌ Error verificando disponibilidad:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error verificando disponibilidad' 
        });
    }
}

// ✅ AGREGAR ESTA FUNCIÓN NUEVA - Obtener cita por ID
exports.getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 Solicitando cita ID:', id);
    
    const conn = await getConnection();
    const [rows] = await conn.execute(`
      SELECT a.*, d.name as doctor_name, d.specialty
      FROM appointments a 
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE a.id = ?
    `, [id]);
    
    await conn.end();

    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Cita no encontrada' 
      });
    }
    
    console.log('✅ Cita encontrada:', rows[0].id);
    res.json(rows[0]);
    
  } catch (err) {
    console.error('❌ Error obteniendo cita:', err);
    res.status(500).json({ 
      success: false,
      error: 'Error obteniendo la cita' 
    });
  }
};

//final del archivo
exports.checkAvailability = checkAvailability;