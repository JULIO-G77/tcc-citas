// mysql.js
// [ETIQUETA] Conexión a MySQL. Reemplaza usuario/password por tus credenciales.
const mysql = require('mysql2/promise');

async function getConnection() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Julio123',
    database: 'clinicdb',
    // AGREGAR ESTAS OPCIONES:
    decimalNumbers: true,
    supportBigNumbers: true,
    bigNumberStrings: false,
    // Esta opción es crucial para LIMIT/OFFSET:
    typeCast: function (field, next) {
      if (field.type === 'TINY' && field.length === 1) {
        return field.string() === '1';
      }
      return next();
    }
  });
  return connection;
}
// AGREGAR estas funciones NUEVAS:

// REGISTRO DE PACIENTE
async function registerPatient(req, res) {
  try {
    const { first_name, last_name, birth_date, gender, phone, email, password } = req.body;
    
    // Validaciones
    if (!first_name || !last_name || !phone || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    
    const conn = await getConnection();
    
    // Verificar si el email ya existe
    const [existing] = await conn.execute(
      'SELECT id FROM patients WHERE email = ?',
      [email]
    );
    
    if (existing.length > 0) {
      await conn.end();
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    
    // Crear paciente (en producción, hashear la contraseña)
    const [result] = await conn.execute(
      `INSERT INTO patients (first_name, last_name, birth_date, gender, phone, email, password)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, birth_date, gender, phone, email, password]
    );
    
    await conn.end();
    
    res.json({ 
      success: true, 
      id: result.insertId,
      message: 'Paciente registrado exitosamente'
    });
    
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'El paciente ya existe' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error registrando paciente' });
  }
}

// LOGIN DE PACIENTE
async function loginPatient(req, res) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }
    
    const conn = await getConnection();
    const [patients] = await conn.execute(
      'SELECT id, first_name, last_name, email, phone, birth_date, gender FROM patients WHERE email = ? AND password = ? AND status = "active"',
      [email, password]
    );
    
    await conn.end();
    
    if (patients.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
    
    // En producción, usar JWT tokens
    const patient = patients[0];
    const token = 'patient-' + patient.id; // Token simple para demo
    
    res.json({
      success: true,
      token: token,
      patient: patient
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en el login' });
  }
}
module.exports = { getConnection };
