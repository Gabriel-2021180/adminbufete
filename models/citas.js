const mongoose = require('mongoose');
const { Schema } = mongoose;

const citaSchema = new Schema({
    motivo: {type:String,required:true},
    estado: {type:String,required:true},
    fecha: {type:Date,required:true},
    hora: {type:String,required:true},
    horaFin: {type:String,required:true},
    activo: { type: Boolean, default: true },
    abogado: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BufeteUser',
      required: true,
    },
    cliente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
});

module.exports = mongoose.model('Cita', citaSchema);
