// mysql.js
// [ETIQUETA] Conexión a MySQL. Reemplaza usuario/password por tus credenciales.
const mysql = require('mysql2/promise');

async function getConnection() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',            // <-- CAMBIAR SI TU USUARIO ES OTRO
    password: 'Julio123',         // <-- mi contra
    database: 'clinicdb'
  });
  return connection;
}

module.exports = { getConnection };
