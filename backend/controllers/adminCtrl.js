// =============================================
// 🏥 CONTROLADOR ADMINISTRATIVO - SISTEMA HOSPITALARIO
// =============================================

const { getConnection } = require('../config/mysql');
const bcrypt = require('bcrypt');

// 🔐 ADMIN AUTHENTICATION
exports.loginAdmin = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log('🔐 Intento de login admin:', username);

        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Usuario y contraseña requeridos' 
            });
        }

        const conn = await getConnection();
        const [admins] = await conn.execute(
            'SELECT * FROM admins WHERE username = ? AND status = "active"',
            [username]
        );
        
        await conn.end();

        if (admins.length === 0) {
            console.log('❌ Admin no encontrado:', username);
            return res.status(401).json({ 
                success: false, 
                error: 'Credenciales inválidas' 
            });
        }

        const admin = admins[0];
        
        // 🔒 Verificar contraseña (en producción usar bcrypt)
        if (password !== admin.password) {
            console.log('❌ Contraseña incorrecta para admin:', username);
            return res.status(401).json({ 
                success: false, 
                error: 'Credenciales inválidas' 
            });
        }

        // ✅ Login exitoso
        console.log('✅ Login admin exitoso:', admin.full_name);
        
        // Actualizar último login
        const conn2 = await getConnection();
        await conn2.execute(
            'UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [admin.id]
        );
        await conn2.end();

        res.json({
            success: true,
            message: `Bienvenido, ${admin.full_name}`,
            admin: {
                id: admin.id,
                username: admin.username,
                full_name: admin.full_name,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (err) {
        console.error('❌ Error en loginAdmin:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Error en el servidor' 
        });
    }
};

// 📊 DASHBOARD STATISTICS - VERSIÓN MEJORADA
exports.getDashboardStats = async (req, res) => {
    try {
        const conn = await getConnection();
        
        // 📈 Estadísticas en paralelo - EXCLUYENDO CANCELADAS
        const [
            [totalPatients],
            [totalDoctors],
            [totalAppointments],
            [todayAppointments],
            [pendingAppointments],
            [recentAppointments]
        ] = await Promise.all([
            conn.execute('SELECT COUNT(*) as count FROM patients WHERE status = "active"'),
            conn.execute('SELECT COUNT(*) as count FROM doctors'),
            conn.execute('SELECT COUNT(*) as count FROM appointments WHERE status != "cancelada"'),
            conn.execute('SELECT COUNT(*) as count FROM appointments WHERE DATE(appointment_date) = CURDATE() AND status != "cancelada"'),
            conn.execute('SELECT COUNT(*) as count FROM appointments WHERE status = "pendiente"'),
            conn.execute(`
                SELECT a.*, p.first_name, p.last_name, d.name as doctor_name, d.specialty
                FROM appointments a
                JOIN patients p ON a.patient_id = p.id
                JOIN doctors d ON a.doctor_id = d.id
                WHERE a.status != "cancelada"
                ORDER BY a.appointment_date DESC LIMIT 5
            `)
        ]);
        
        await conn.end();

        res.json({
            success: true,
            stats: {
                total_patients: totalPatients[0].count,
                total_doctors: totalDoctors[0].count,
                total_appointments: totalAppointments[0].count,        // Sin canceladas
                today_appointments: todayAppointments[0].count,        // Sin canceladas
                pending_appointments: pendingAppointments[0].count     // Nuevo: citas pendientes
            },
            recent_appointments: recentAppointments[0]
        });

    } catch (err) {
        console.error('❌ Error en getDashboardStats:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Error obteniendo estadísticas' 
        });
    }
};

// 👥 GESTIÓN DE PACIENTES (ADMIN) - VERSIÓN CORREGIDA
exports.getPatientsAdmin = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const conn = await getConnection();
    
    let queryBase = `
      SELECT p.*, 
             (SELECT COUNT(*) FROM appointments WHERE patient_id = p.id) as total_citas
      FROM patients p
    `;
    
    let countQuery = 'SELECT COUNT(*) as total FROM patients p';
    let params = [];
    let conditions = [];

    if (search) {
      conditions.push('(p.first_name LIKE ? OR p.last_name LIKE ? OR p.email LIKE ? OR p.phone LIKE ?)');
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      queryBase += whereClause;
      countQuery += whereClause;
    }

    // SIN parámetros preparados para LIMIT/OFFSET
    const query = queryBase + ` ORDER BY p.created_at DESC LIMIT ${limitNum} OFFSET ${offset}`;

    console.log('🔍 Query pacientes:', query);
    console.log('🔍 Parámetros:', params);

    const [patients] = await conn.execute(query, params);
    const [totalResult] = await conn.execute(countQuery, params);
    
    await conn.end();

    res.json({
      success: true,
      patients,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalResult[0].total,
        totalPages: Math.ceil(totalResult[0].total / limitNum)
      }
    });

  } catch (err) {
    console.error('❌ Error en getPatientsAdmin:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Error obteniendo pacientes: ' + err.message 
    });
  }
};

// 🩺 GESTIÓN DE DOCTORES (ADMIN)
// 🩺 GESTIÓN DE DOCTORES (ADMIN) - VERSIÓN CORREGIDA
exports.getDoctorsAdmin = async (req, res) => {
  try {
    const { specialty, search, page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const conn = await getConnection();
    
    let queryBase = `
      SELECT d.*, 
             (SELECT COUNT(*) FROM appointments WHERE doctor_id = d.id) as total_citas
      FROM doctors d
    `;
    
    let countQuery = 'SELECT COUNT(*) as total FROM doctors d';
    let params = [];
    let conditions = [];

    if (specialty) {
      conditions.push('d.specialty = ?');
      params.push(specialty);
    }

    if (search) {
      conditions.push('(d.name LIKE ? OR d.email LIKE ?)');
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
    }

    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      queryBase += whereClause;
      countQuery += whereClause;
    }

    // SIN parámetros preparados para LIMIT/OFFSET
    const query = queryBase + ` ORDER BY d.name LIMIT ${limitNum} OFFSET ${offset}`;

    console.log('🔍 Query doctores:', query);
    console.log('🔍 Parámetros:', params);

    const [doctors] = await conn.execute(query, params);
    const [totalResult] = await conn.execute(countQuery, params);
    
    await conn.end();

    res.json({
      success: true,
      doctors,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalResult[0].total,
        totalPages: Math.ceil(totalResult[0].total / limitNum)
      }
    });

  } catch (err) {
    console.error('❌ Error en getDoctorsAdmin:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Error obteniendo doctores: ' + err.message 
    });
  }
};
/// 📅 GESTIÓN DE CITAS (ADMIN) - VERSIÓN CORREGIDA
exports.getAppointmentsAdmin = async (req, res) => {
    try {
        const { status, date, page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const conn = await getConnection();
        
        let query = `
            SELECT a.*, 
                   p.first_name as patient_first_name, 
                   p.last_name as patient_last_name,
                   p.phone as patient_phone,
                   d.name as doctor_name,
                   d.specialty
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN doctors d ON a.doctor_id = d.id
        `;
        
        let countQuery = `
            SELECT COUNT(*) as total 
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id  
            JOIN doctors d ON a.doctor_id = d.id
        `;
        
        let params = [];
        let conditions = [];

        if (status) {
            conditions.push('a.status = ?');
            params.push(status);
        }

        if (date) {
            conditions.push('DATE(a.appointment_date) = ?');
            params.push(date);
        }

        if (conditions.length > 0) {
            const whereClause = ' WHERE ' + conditions.join(' AND ');
            query += whereClause;
            countQuery += whereClause;
        }

        // SIN parámetros preparados para LIMIT/OFFSET
        query += ` ORDER BY a.appointment_date DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

        console.log('🔍 Query citas:', query);
        console.log('🔍 Parámetros:', params);

        const [appointments] = await conn.execute(query, params);
        const [totalResult] = await conn.execute(countQuery, params);
        
        await conn.end();

        res.json({
            success: true,
            appointments,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalResult[0].total,
                totalPages: Math.ceil(totalResult[0].total / limit)
            }
        });

    } catch (err) {
        console.error('❌ Error en getAppointmentsAdmin:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Error obteniendo citas: ' + err.message 
        });
    }
};
// 📈 REPORTES AVANZADOS
exports.getReports = async (req, res) => {
    try {
        const { report_type, start_date, end_date } = req.query;
        const conn = await getConnection();

        let reportData = {};

        switch (report_type) {
            case 'appointments_by_specialty':
                const [specialtyStats] = await conn.execute(`
                    SELECT d.specialty, 
                           COUNT(*) as total_citas,
                           AVG(TIMESTAMPDIFF(MINUTE, a.created_at, a.appointment_date)) as avg_booking_time
                    FROM appointments a
                    JOIN doctors d ON a.doctor_id = d.id
                    WHERE a.appointment_date BETWEEN ? AND ?
                    GROUP BY d.specialty
                    ORDER BY total_citas DESC
                `, [start_date, end_date]);
                reportData = specialtyStats;
                break;

            case 'patient_activity':
                const [patientActivity] = await conn.execute(`
                    SELECT p.first_name, p.last_name, p.email,
                           COUNT(a.id) as total_citas,
                           MAX(a.appointment_date) as last_appointment
                    FROM patients p
                    LEFT JOIN appointments a ON p.id = a.patient_id
                    WHERE a.appointment_date BETWEEN ? AND ?
                    GROUP BY p.id
                    HAVING total_citas > 0
                    ORDER BY total_citas DESC
                    LIMIT 20
                `, [start_date, end_date]);
                reportData = patientActivity;
                break;

            case 'doctor_performance':
                const [doctorPerformance] = await conn.execute(`
                    SELECT d.name, d.specialty, d.email,
                           COUNT(a.id) as total_citas,
                           SUM(CASE WHEN a.status = 'completada' THEN 1 ELSE 0 END) as citas_completadas
                    FROM doctors d
                    LEFT JOIN appointments a ON d.id = a.doctor_id
                    WHERE a.appointment_date BETWEEN ? AND ?
                    GROUP BY d.id
                    ORDER BY total_citas DESC
                `, [start_date, end_date]);
                reportData = doctorPerformance;
                break;

            default:
                return res.status(400).json({
                    success: false,
                    error: 'Tipo de reporte no válido'
                });
        }

        await conn.end();

        res.json({
            success: true,
            report_type,
            period: { start_date, end_date },
            data: reportData
        });

    } catch (err) {
        console.error('❌ Error en getReports:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Error generando reporte' 
        });
    }
};
// 📅 CREAR CITA (ADMIN)
exports.createAppointmentAdmin = async (req, res) => {
    try {
        const { patient_id, doctor_id, appointment_date, reason } = req.body;

        // Validaciones
        if (!patient_id || !doctor_id || !appointment_date) {
            return res.status(400).json({
                success: false,
                error: 'Patient ID, Doctor ID y fecha son obligatorios'
            });
        }

        const conn = await getConnection();

        // Verificar que el paciente existe
        const [patients] = await conn.execute(
            'SELECT id FROM patients WHERE id = ? AND status = "active"',
            [patient_id]
        );

        if (patients.length === 0) {
            await conn.end();
            return res.status(404).json({
                success: false,
                error: 'Paciente no encontrado o inactivo'
            });
        }

        // Verificar que el doctor existe
        const [doctors] = await conn.execute(
            'SELECT id FROM doctors WHERE id = ?',
            [doctor_id]
        );

        if (doctors.length === 0) {
            await conn.end();
            return res.status(404).json({
                success: false,
                error: 'Doctor no encontrado'
            });
        }

        // Verificar disponibilidad del doctor
        const [existingAppointments] = await conn.execute(
            'SELECT id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND status != "cancelada"',
            [doctor_id, appointment_date]
        );

        if (existingAppointments.length > 0) {
            await conn.end();
            return res.status(400).json({
                success: false,
                error: 'El doctor ya tiene una cita programada en esa fecha y hora'
            });
        }

        // Crear la cita
        const [result] = await conn.execute(
            `INSERT INTO appointments (patient_id, doctor_id, appointment_date, reason, status)
             VALUES (?, ?, ?, ?, 'pendiente')`,
            [patient_id, doctor_id, appointment_date, reason || '']
        );

        await conn.end();

        res.json({
            success: true,
            message: 'Cita creada exitosamente',
            appointment: {
                id: result.insertId,
                patient_id,
                doctor_id,
                appointment_date,
                reason: reason || '',
                status: 'pendiente'
            }
        });

    } catch (err) {
        console.error('❌ Error en createAppointmentAdmin:', err);
        res.status(500).json({
            success: false,
            error: 'Error creando cita: ' + err.message
        });
    }
};

// 📅 ACTUALIZAR CITA (ADMIN)
exports.updateAppointmentAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { doctor_id, appointment_date, reason, status } = req.body;

        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'ID de cita es requerido'
            });
        }

        const conn = await getConnection();

        // Verificar que la cita existe
        const [existingAppointments] = await conn.execute(
            'SELECT * FROM appointments WHERE id = ?',
            [id]
        );

        if (existingAppointments.length === 0) {
            await conn.end();
            return res.status(404).json({
                success: false,
                error: 'Cita no encontrada'
            });
        }

        const currentAppointment = existingAppointments[0];

        // Si se cambia doctor o fecha, verificar disponibilidad
        if ((doctor_id && doctor_id !== currentAppointment.doctor_id) || 
            (appointment_date && appointment_date !== currentAppointment.appointment_date)) {
            
            const finalDoctorId = doctor_id || currentAppointment.doctor_id;
            const finalAppointmentDate = appointment_date || currentAppointment.appointment_date;

            const [conflictingAppointments] = await conn.execute(
                'SELECT id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND id != ? AND status != "cancelada"',
                [finalDoctorId, finalAppointmentDate, id]
            );

            if (conflictingAppointments.length > 0) {
                await conn.end();
                return res.status(400).json({
                    success: false,
                    error: 'El doctor ya tiene otra cita programada en esa fecha y hora'
                });
            }
        }

        // Construir query dinámica
        let updateFields = [];
        let params = [];

        if (doctor_id) {
            updateFields.push('doctor_id = ?');
            params.push(doctor_id);
        }

        if (appointment_date) {
            updateFields.push('appointment_date = ?');
            params.push(appointment_date);
        }

        if (reason !== undefined) {
            updateFields.push('reason = ?');
            params.push(reason);
        }

        if (status) {
            updateFields.push('status = ?');
            params.push(status);
        }

        if (updateFields.length === 0) {
            await conn.end();
            return res.status(400).json({
                success: false,
                error: 'No hay campos para actualizar'
            });
        }

        params.push(id);

        const query = `UPDATE appointments SET ${updateFields.join(', ')} WHERE id = ?`;
        
        await conn.execute(query, params);

        // Obtener la cita actualizada
        const [updatedAppointments] = await conn.execute(
            `SELECT a.*, 
                    p.first_name as patient_first_name, 
                    p.last_name as patient_last_name,
                    d.name as doctor_name,
                    d.specialty
             FROM appointments a
             JOIN patients p ON a.patient_id = p.id
             JOIN doctors d ON a.doctor_id = d.id
             WHERE a.id = ?`,
            [id]
        );

        await conn.end();

        res.json({
            success: true,
            message: 'Cita actualizada exitosamente',
            appointment: updatedAppointments[0]
        });

    } catch (err) {
        console.error('❌ Error en updateAppointmentAdmin:', err);
        res.status(500).json({
            success: false,
            error: 'Error actualizando cita: ' + err.message
        });
    }
};

// 📅 ELIMINAR/CANCELAR CITA (ADMIN)
exports.deleteAppointmentAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'ID de cita es requerido'
            });
        }

        const conn = await getConnection();

        // Verificar que la cita existe
        const [existingAppointments] = await conn.execute(
            'SELECT * FROM appointments WHERE id = ?',
            [id]
        );

        if (existingAppointments.length === 0) {
            await conn.end();
            return res.status(404).json({
                success: false,
                error: 'Cita no encontrada'
            });
        }

        // En lugar de eliminar, marcamos como cancelada (mejor práctica)
        await conn.execute(
            'UPDATE appointments SET status = "cancelada" WHERE id = ?',
            [id]
        );

        await conn.end();

        res.json({
            success: true,
            message: 'Cita cancelada exitosamente'
        });

    } catch (err) {
        console.error('❌ Error en deleteAppointmentAdmin:', err);
        res.status(500).json({
            success: false,
            error: 'Error cancelando cita: ' + err.message
        });
    }
};

// 📅 OBTENER UNA CITA ESPECÍFICA (ADMIN)
exports.getAppointmentByIdAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                error: 'ID de cita es requerido'
            });
        }

        const conn = await getConnection();

        const [appointments] = await conn.execute(
            `SELECT a.*, 
                    p.first_name as patient_first_name, 
                    p.last_name as patient_last_name,
                    p.phone as patient_phone,
                    p.email as patient_email,
                    d.name as doctor_name,
                    d.specialty,
                    d.email as doctor_email
             FROM appointments a
             JOIN patients p ON a.patient_id = p.id
             JOIN doctors d ON a.doctor_id = d.id
             WHERE a.id = ?`,
            [id]
        );

        await conn.end();

        if (appointments.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Cita no encontrada'
            });
        }

        res.json({
            success: true,
            appointment: appointments[0]
        });

    } catch (err) {
        console.error('❌ Error en getAppointmentByIdAdmin:', err);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo cita: ' + err.message
        });
    }
};
// 📅 OBTENER DOCTORES PARA SELECT (ADMIN)
exports.getDoctorsForSelect = async (req, res) => {
    try {
        const conn = await getConnection();
        
        const [doctors] = await conn.execute(
            'SELECT id, name, specialty FROM doctors ORDER BY name'
        );
        
        await conn.end();

        res.json({
            success: true,
            doctors
        });

    } catch (err) {
        console.error('❌ Error en getDoctorsForSelect:', err);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo doctores: ' + err.message
        });
    }
};

// 📅 OBTENER PACIENTES PARA SELECT (ADMIN)
exports.getPatientsForSelect = async (req, res) => {
    try {
        const conn = await getConnection();
        
        const [patients] = await conn.execute(
            'SELECT id, first_name, last_name, phone FROM patients WHERE status = "active" ORDER BY first_name, last_name'
        );
        
        await conn.end();

        res.json({
            success: true,
            patients
        });

    } catch (err) {
        console.error('❌ Error en getPatientsForSelect:', err);
        res.status(500).json({
            success: false,
            error: 'Error obteniendo pacientes: ' + err.message
        });
    }
};