// appointmentsCtrl.js
// [ETIQUETA] Controlador para gestionar citas
const { getConnection } = require('../config/mysql');

exports.createAppointment = async (req, res) => {
  try {
    const { patient_id, doctor_id, appointment_date, reason } = req.body;
    const conn = await getConnection();
    const [result] = await conn.execute(
      'INSERT INTO appointments (patient_id, doctor_id, appointment_date, reason) VALUES (?, ?, ?, ?)',
      [patient_id, doctor_id, appointment_date, reason]
    );
    await conn.end();
    res.json({ id: result.insertId, message: 'Cita creada' });
  } catch (err) {
    console.error('Error creando cita', err);
    res.status(500).json({ error: 'Error creando cita' });
  }
};

exports.getAppointments = async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute(`
      SELECT a.*, p.first_name, p.last_name, d.name as doctor_name 
      FROM appointments a 
      LEFT JOIN patients p ON a.patient_id = p.id 
      LEFT JOIN doctors d ON a.doctor_id = d.id
      ORDER BY a.appointment_date DESC
    `);
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Error cargando citas', err);
    res.status(500).json({ error: 'Error obteniendo citas' });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_id, doctor_id, appointment_date, reason, status } = req.body;
    const conn = await getConnection();
    await conn.execute(
      'UPDATE appointments SET patient_id=?, doctor_id=?, appointment_date=?, reason=?, status=? WHERE id=?',
      [patient_id, doctor_id, appointment_date, reason, status, id]
    );
    await conn.end();
    res.json({ message: 'Cita actualizada' });
  } catch (err) {
    console.error('Error actualizando cita', err);
    res.status(500).json({ error: 'Error actualizando cita' });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await getConnection();
    await conn.execute('DELETE FROM appointments WHERE id=?', [id]);
    await conn.end();
    res.json({ message: 'Cita eliminada' });
  } catch (err) {
    console.error('Error eliminando cita', err);
    res.status(500).json({ error: 'Error eliminando cita' });
  }
};