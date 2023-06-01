const mongoose = require('mongoose');

const { Schema } = mongoose;

const solicitudAbogadoSchema = new Schema({
  abogado: { type: Schema.Types.ObjectId, ref: 'BufeteUser' },
  cliente: { type: Schema.Types.ObjectId, ref: 'User' },
  mensaje: { type: String, required: true },
  tipo: { type: String, required: true }, // Campo para el tipo de caso
  tipoSolicitud: { type: String, required: true }, // Nuevo campo para el tipo de solicitud
  fecha: { type: Date, default: Date.now },
  estado: { type: String, required: true},
});


module.exports = mongoose.model('SolicitudAbogado', solicitudAbogadoSchema);
