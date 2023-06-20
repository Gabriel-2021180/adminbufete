const mongoose = require('mongoose');
const { Schema } = mongoose;

const casoSchema = new Schema({
  nombrecaso:{type: String},
  tipo: { type: String, required: true },
  descripcion: { type: String, required: true },
  fase: { type: String, required: true },
  fechaini: { type: Date, required: true },
  fechafin: { type: Date },
  estado: { type: Boolean, default: true },
  abogado: { type: Schema.Types.ObjectId, ref: 'BufeteUser' },
  cliente: { type: Schema.Types.ObjectId, ref: 'User' },
  resultado: {
    type: String,
    enum: ['Ganado', 'Perdido', 'a medias',''], // Solo acepta estos tres valores
    default: null, // Por defecto, el resultado es null (no se ha definido aún)
  },
  observaciones: { type: [String] } 
});

module.exports = mongoose.model('Caso', casoSchema);
