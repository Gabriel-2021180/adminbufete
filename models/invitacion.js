const mongoose = require('mongoose');
const { Schema } = mongoose;

const invitationCodeSchema = new Schema({
    code: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'BufeteUser' }, // Nuevo campo
    used:{type:Boolean,default: false},
    used_at: { type: Date },
    used_by: { type: mongoose.Schema.Types.ObjectId, ref: 'BufeteUser' }
});

module.exports = mongoose.model('InvitationCode', invitationCodeSchema);
