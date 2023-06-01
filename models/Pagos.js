const mongoose = require('mongoose');
const { Schema } = mongoose;

const pagoSchema = new Schema({
  cliente: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  abogado: { type: Schema.Types.ObjectId, ref: 'BufeteUser', required: true },
  caso: { type: Schema.Types.ObjectId, ref: 'Caso', required: true },
  monto:{type:Number,required: true},
  detalle:{type:String,required: true},
  fechaHora: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Pago', pagoSchema);
