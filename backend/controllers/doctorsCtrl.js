// doctorsCtrl.js - VERSIÓN CORREGIDA
// [ETIQUETA] Controlador para gestionar doctores
const { getConnection } = require('../config/mysql');

// ✅ OBTENER TODOS LOS DOCTORES
exports.getDoctors = async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute('SELECT * FROM doctors ORDER BY name');
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Error obteniendo doctores', err);
    res.status(500).json({ error: 'Error obteniendo doctores' });
  }
};

// doctorsCtrl.js - FUNCIÓN CORREGIDA (asegúrate de tener esta)
exports.getAvailableDoctors = async (req, res) => {
  try {
    const { specialty } = req.query;
    
    console.log('🔍 Buscando doctores para especialidad:', specialty);
    
    if (!specialty) {
      return res.status(400).json({ error: 'Especialidad requerida' });
    }

    const conn = await getConnection();
    
    // ✅ CONSULTA CORREGIDA: Filtrar SOLO por especialidad
    const query = `
      SELECT id, name, specialty, email
      FROM doctors 
      WHERE specialty = ?
      ORDER BY name
    `;
    
    const [rows] = await conn.execute(query, [specialty]);
    await conn.end();
    
    console.log(`✅ ${rows.length} doctores encontrados para ${specialty}`);
    res.json(rows);
    
  } catch (err) {
    console.error('❌ Error obteniendo doctores:', err);
    res.status(500).json({ error: 'Error obteniendo doctores' });
  }
};

// ✅ FUNCIÓN ALTERNATIVA: DOCTORES POR ESPECIALIDAD (para compatibilidad)
exports.getDoctorsBySpecialty = async (req, res) => {
  try {
    const { specialty } = req.query;
    console.log('🔍 Buscando doctores por especialidad:', specialty);
    
    if (!specialty) {
      return res.status(400).json({ error: 'Especialidad requerida' });
    }

    const conn = await getConnection();
    
    const query = `
      SELECT id, name, specialty, email
      FROM doctors 
      WHERE specialty = ?
      ORDER BY name
    `;
    
    const [rows] = await conn.execute(query, [specialty]);
    await conn.end();
    
    console.log(`✅ ${rows.length} doctores encontrados para ${specialty}`);
    res.json(rows);
    
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: 'Error obteniendo doctores' });
  }
};