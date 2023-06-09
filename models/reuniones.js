const mongoose = require('mongoose');
const { Schema } = mongoose;

const reunionSchema = new Schema({
        asunto: { type: String, required: true },
        estado: { type: String, required: true },
        fecha: { type: Date, required: true },
        lugar: { type: String, required: true },
        hora: { type: String, required: true },
        horaFin: { type: String, required: true },
        usuarios: [{ type: Schema.Types.ObjectId, ref: 'BufeteUser' }],
        activo: { type: Boolean, default: true } // Nuevo campo
});
      
module.exports = mongoose.model('Reuniones', reunionSchema);
