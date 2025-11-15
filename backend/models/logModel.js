// logModel.js
// [ETIQUETA] Modelo Mongoose para almacenar logs y notas flexibles (NoSQL)
const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  type: { type: String, required: true },          // ej: create_patient
  timestamp: { type: Date, default: Date.now },
  details: { type: mongoose.Schema.Types.Mixed }   // objetos con datos flexibles
});

module.exports = mongoose.model('Log', LogSchema);
