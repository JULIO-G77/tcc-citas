// mongo.js
// [ETIQUETA] Conexión a MongoDB (local). Si usas Atlas, coloca la URI.
const mongoose = require('mongoose');

async function connectMongo() {
  const uri = 'mongodb://localhost:27017/cliniclogs'; // <-- Cambiar si usas Atlas
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  console.log('MongoDB conectado');
}

module.exports = { connectMongo };
