const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/mysql');

router.get('/', async (req, res) => {
  try {
    const conn = await getConnection();
    const [rows] = await conn.execute('SELECT * FROM doctors');
    await conn.end();
    res.json(rows);
  } catch (err) {
    console.error('Error cargando doctores', err);
    res.status(500).json({ error: 'Error obteniendo doctores' });
  }
});

module.exports = router;
