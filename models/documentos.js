const mongoose = require('mongoose');
const { Schema } = mongoose;

const documentoSchema = new Schema({
  titulo: { type: String, required: true },
  documento: { type: String, required: true },
  estado: { type: Boolean, default: true },
  fechaupload:{type:Date},
  caso: { type: Schema.Types.ObjectId, ref: 'Caso' }
});

module.exports = mongoose.model('Documento', documentoSchema);
