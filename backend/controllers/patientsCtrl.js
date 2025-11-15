// patientsCtrl.js
// [ETIQUETA] Controlador con funciones CRUD para pacientes (usa MySQL)
// Comentarios: cada función hace conexión, ejecuta query parametrizada y guarda un log en Mongo.

const { getConnection } = require('../config/mysql');
// const Log = require('../models/logModel');  // COMENTADO TEMPORALMENTE

async function createPatient(req, res) {
  try {
    const { first_name, last_name, birth_date, gender, phone, email } = req.body;
    const conn = await getConnection();
    const [result] = await conn.execute(
      `INSERT INTO patients (first_name, last_name, birth_date, gender, phone, email)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, birth_date, gender, phone, email]
    );
    await conn.end();

    // [ETIQUETA LOG] Guardar actividad en Mongo - COMENTADO TEMPORALMENTE
    // await Log.create({ type: 'create_patient', details: { patient_id: result.insertId, user: 'admin' }});

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creando paciente' });
  }
}

async function getPatients(req, res) {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute('SELECT * FROM patients');
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error obteniendo pacientes' });
  }
}

async function updatePatient(req, res) {
  try {
    const { id } = req.params;
    const { first_name, last_name, birth_date, gender, phone, email } = req.body;
    const conn = await getConnection();
    await conn.execute(
      `UPDATE patients SET first_name=?, last_name=?, birth_date=?, gender=?, phone=?, email=? WHERE id=?`,
      [first_name, last_name, birth_date, gender, phone, email, id]
    );
    await conn.end();
    // await Log.create({ type: 'update_patient', details: { patient_id: id, user: 'admin' }});  // COMENTADO
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error actualizando paciente' });
  }
}

async function deletePatient(req, res) {
  try {
    const { id } = req.params;
    const conn = await getConnection();
    await conn.execute('DELETE FROM patients WHERE id=?', [id]);
    await conn.end();
    // await Log.create({ type: 'delete_patient', details: { patient_id: id, user: 'admin' }});  // COMENTADO
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error eliminando paciente' });
  }
}

module.exports = { createPatient, getPatients, updatePatient, deletePatient };