// patientsCtrl.js
// [ETIQUETA] Controlador con funciones CRUD para pacientes (usa MySQL) - VERSIÓN MEJORADA

const { getConnection } = require('../config/mysql');

// [ETIQUETA] Crear nuevo paciente con validaciones MEJORADAS
async function createPatient(req, res) {
  let conn;
  try {
    const { first_name, last_name, birth_date, gender, phone, email, password } = req.body;
    
    console.log('📝 Datos recibidos para registro:', req.body);

    // [ETIQUETA] Validación MEJORADA de campos requeridos
    const camposRequeridos = [
      { campo: first_name, nombre: 'nombre' },
      { campo: last_name, nombre: 'apellido' },
      { campo: phone, nombre: 'teléfono' },
      { campo: email, nombre: 'email' },
      { campo: password, nombre: 'contraseña' }
    ];

    const camposFaltantes = camposRequeridos.filter(item => !item.campo);
    
    if (camposFaltantes.length > 0) {
      const campos = camposFaltantes.map(item => item.nombre).join(', ');
      return res.status(400).json({ 
        success: false,
        error: `Faltan campos requeridos: ${campos}` 
      });
    }

    // [ETIQUETA] Validación de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'El formato del email no es válido'
      });
    }

    conn = await getConnection();
    
    // [ETIQUETA] Verificar si el email ya existe - MEJORADO
    const [existing] = await conn.execute(
      'SELECT id, first_name FROM patients WHERE email = ?', 
      [email]
    );
    
    if (existing.length > 0) {
      await conn.end();
      return res.status(400).json({ 
        success: false,
        error: `El email ${email} ya está registrado por otro paciente` 
      });
    }

    // [ETIQUETA] Validación de fecha de nacimiento
    if (birth_date) {
      const birthDate = new Date(birth_date);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 0 || age > 120) {
        return res.status(400).json({
          success: false,
          error: 'La fecha de nacimiento no es válida'
        });
      }
    }

    // [ETIQUETA] Insertar paciente con manejo de errores específico
    console.log('💾 Insertando nuevo paciente en la base de datos...');
    
    const [result] = await conn.execute(
      `INSERT INTO patients (first_name, last_name, birth_date, gender, phone, email, password)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [first_name.trim(), last_name.trim(), birth_date, gender, phone.trim(), email.trim(), password]
    );
    
    await conn.end();
    
    console.log('✅ Paciente creado exitosamente - ID:', result.insertId);
    
    res.json({ 
      success: true, 
      id: result.insertId,
      message: 'Paciente registrado exitosamente. Ahora puedes iniciar sesión.' 
    });
    
  } catch (err) {
    // [ETIQUETA] Manejo de errores MEJORADO
    if (conn) await conn.end();
    
    console.error('❌ Error en createPatient:', err.message);
    console.error('❌ Código del error:', err.code);
    console.error('❌ SQL Message:', err.sqlMessage);
    
    let errorMessage = 'Error creando paciente';
    let errorDetails = err.sqlMessage || err.message;

    // [ETIQUETA] Mensajes de error específicos por tipo
    if (err.code === 'ER_DUP_ENTRY') {
      errorMessage = 'El email ya está registrado en el sistema';
    } else if (err.code === 'ER_TRUNCATED_WRONG_VALUE') {
      errorMessage = 'Formato de fecha incorrecto. Use: YYYY-MM-DD';
    } else if (err.code === 'ER_DATA_TOO_LONG') {
      errorMessage = 'Algunos datos exceden la longitud permitida';
    } else if (err.code === 'ER_NO_REFERENCED_ROW') {
      errorMessage = 'Error de referencia en la base de datos';
    } else if (err.code === 'ECONNREFUSED') {
      errorMessage = 'Error de conexión a la base de datos';
      errorDetails = 'No se puede conectar al servidor MySQL';
    }
    
    res.status(500).json({ 
      success: false,
      error: errorMessage,
      details: errorDetails
    });
  }
}

// [ETIQUETA] Obtener todos los pacientes - MEJORADO
async function getPatients(req, res) {
  let conn;
  try {
    conn = await getConnection();
    console.log('📋 Solicitando lista de pacientes...');
    
    const [rows] = await conn.execute('SELECT id, first_name, last_name, email, phone, gender, birth_date FROM patients ORDER BY id DESC');
    await conn.end();
    
    console.log(`✅ ${rows.length} pacientes encontrados`);
    res.json({
      success: true,
      data: rows,
      count: rows.length
    });
    
  } catch (err) {
    if (conn) await conn.end();
    console.error('❌ Error en getPatients:', err.message);
    
    res.status(500).json({ 
      success: false,
      error: 'Error obteniendo la lista de pacientes',
      details: err.message
    });
  }
}

// [ETIQUETA] Obtener paciente por ID - MEJORADO
async function getPatientById(req, res) {
  let conn;
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de paciente no válido'
      });
    }

    console.log('👤 Solicitando paciente ID:', id);
    
    conn = await getConnection();
    const [rows] = await conn.execute(
      'SELECT id, first_name, last_name, email, phone, gender, birth_date, created_at FROM patients WHERE id = ?', 
      [id]
    );
    
    await conn.end();

    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: `Paciente con ID ${id} no encontrado` 
      });
    }
    
    console.log('✅ Paciente encontrado:', rows[0].first_name);
    
    res.json({
      success: true,
      data: rows[0]
    });
    
  } catch (err) {
    if (conn) await conn.end();
    console.error('❌ Error en getPatientById:', err.message);
    
    res.status(500).json({ 
      success: false,
      error: 'Error obteniendo información del paciente',
      details: err.message
    });
  }
}

// [ETIQUETA] Actualizar paciente - MEJORADO
async function updatePatient(req, res) {
  let conn;
  try {
    const { id } = req.params;
    const { first_name, last_name, birth_date, gender, phone, email } = req.body;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de paciente no válido'
      });
    }

    console.log('✏️ Actualizando paciente ID:', id, 'Datos:', req.body);

    // [ETIQUETA] Validación de campos requeridos para actualización
    if (!first_name || !last_name || !phone || !email) {
      return res.status(400).json({
        success: false,
        error: 'Nombre, apellido, teléfono y email son requeridos'
      });
    }

    // [ETIQUETA] Validación de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'El formato del email no es válido'
      });
    }

    conn = await getConnection();
    
    // [ETIQUETA] Verificar que el paciente existe
    const [existingPatient] = await conn.execute('SELECT id FROM patients WHERE id = ?', [id]);
    
    if (existingPatient.length === 0) {
      await conn.end();
      return res.status(404).json({
        success: false,
        error: `Paciente con ID ${id} no encontrado`
      });
    }

    // [ETIQUETA] Verificar si el email ya está en uso por otro paciente
    const [emailCheck] = await conn.execute(
      'SELECT id FROM patients WHERE email = ? AND id != ?',
      [email, id]
    );
    
    if (emailCheck.length > 0) {
      await conn.end();
      return res.status(400).json({
        success: false,
        error: 'El email ya está en uso por otro paciente'
      });
    }

    // [ETIQUETA] Actualizar paciente
    await conn.execute(
      `UPDATE patients SET first_name=?, last_name=?, birth_date=?, gender=?, phone=?, email=? WHERE id=?`,
      [first_name.trim(), last_name.trim(), birth_date, gender, phone.trim(), email.trim(), id]
    );
    
    await conn.end();
    
    console.log('✅ Paciente actualizado exitosamente - ID:', id);
    
    res.json({ 
      success: true,
      message: 'Perfil actualizado exitosamente'
    });
    
  } catch (err) {
    if (conn) await conn.end();
    console.error('❌ Error en updatePatient:', err.message);
    
    let errorMessage = 'Error actualizando paciente';
    
    if (err.code === 'ER_DUP_ENTRY') {
      errorMessage = 'El email ya está en uso por otro paciente';
    } else if (err.code === 'ER_TRUNCATED_WRONG_VALUE') {
      errorMessage = 'Formato de fecha incorrecto';
    }
    
    res.status(500).json({ 
      success: false,
      error: errorMessage,
      details: err.message
    });
  }
}

// [ETIQUETA] Eliminar paciente - MEJORADO
async function deletePatient(req, res) {
  let conn;
  try {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'ID de paciente no válido'
      });
    }

    console.log('🗑️ Eliminando paciente ID:', id);
    
    conn = await getConnection();
    
    // [ETIQUETA] Verificar que el paciente existe
    const [existingPatient] = await conn.execute('SELECT first_name, last_name FROM patients WHERE id = ?', [id]);
    
    if (existingPatient.length === 0) {
      await conn.end();
      return res.status(404).json({
        success: false,
        error: `Paciente con ID ${id} no encontrado`
      });
    }

    const patientName = `${existingPatient[0].first_name} ${existingPatient[0].last_name}`;
    
    // [ETIQUETA] Eliminar paciente
    await conn.execute('DELETE FROM patients WHERE id=?', [id]);
    await conn.end();
    
    console.log('✅ Paciente eliminado:', patientName);
    
    res.json({ 
      success: true,
      message: `Paciente ${patientName} eliminado exitosamente`
    });
    
  } catch (err) {
    if (conn) await conn.end();
    console.error('❌ Error en deletePatient:', err.message);
    
    let errorMessage = 'Error eliminando paciente';
    
    if (err.code === 'ER_ROW_IS_REFERENCED') {
      errorMessage = 'No se puede eliminar el paciente porque tiene citas programadas';
    }
    
    res.status(500).json({ 
      success: false,
      error: errorMessage,
      details: err.message
    });
  }
}

// [ETIQUETA] Login de paciente - MEJORADO
async function loginPatient(req, res) {
  let conn;
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Intento de login para email:', email);

    // [ETIQUETA] Validación MEJORADA
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email y contraseña son requeridos' 
      });
    }

    // [ETIQUETA] Validación de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'El formato del email no es válido'
      });
    }

    conn = await getConnection();
    const [patients] = await conn.execute(
      'SELECT id, first_name, last_name, email, phone, gender FROM patients WHERE email = ? AND password = ?',
      [email.trim(), password]
    );
    
    await conn.end();

    if (patients.length === 0) {
      console.log('❌ Login fallido - Credenciales incorrectas');
      return res.status(401).json({ 
        success: false,
        error: 'Email o contraseña incorrectos' 
      });
    }

    const patient = patients[0];
    console.log('✅ Login exitoso - Paciente:', patient.first_name);
   res.json({
    success: true,
    message: `Bienvenido de nuevo, ${patient.first_name}`,
    patient: {  // ✅ Esto debe existir
        id: patient.id,
        first_name: patient.first_name,
        last_name: patient.last_name,
        email: patient.email,
        phone: patient.phone,
        gender: patient.gender
    }
});
    
  } catch (err) {
    if (conn) await conn.end();
    console.error('❌ Error en loginPatient:', err.message);
    
    res.status(500).json({ 
      success: false,
      error: 'Error en el proceso de login',
      details: err.message
    });
  }
}

// [ETIQUETA] Obtener citas del paciente - MEJORADO
async function getMyAppointments(req, res) {
  try {
    // Obtener patient_id desde query parameters
    const patientId = req.query.patient_id;
    
    console.log('📋 Solicitando citas para paciente ID:', patientId);
    
    if (!patientId) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere patient_id'
      });
    }

    const conn = await getConnection();
    const [rows] = await conn.execute(`
      SELECT a.*, d.name as doctor_name, d.specialty
      FROM appointments a 
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE a.patient_id = ?
      ORDER BY a.appointment_date DESC
    `, [patientId]);
    
    await conn.end();
    
    console.log(`✅ ${rows.length} citas encontradas para paciente ${patientId}`);
    
    res.json(rows);
    
  } catch (err) {
    console.error('❌ Error en getMyAppointments:', err.message);
    res.status(500).json({ 
      success: false,
      error: 'Error obteniendo citas' 
    });
  }
}

// [ETIQUETA] Exportar todas las funciones
module.exports = {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  loginPatient
  // NOTA: getMyAppointments está en otro archivo (appointmentsCtrl.js)
};