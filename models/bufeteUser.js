const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const { Schema } = mongoose;

const bufeteUserSchema = new Schema({
    nombres: {type:String,required:true},
    apellidos: {type:String,required:true},
    username: {type:String,required:true,unique:true},
    ci: {type:String,required:true,unique:true},
    descripcion: {type:String},
    direccion: {type:String,required:true},
    rol: {type: String, required: true},
    fechanac: {type: Date, required: true},
    phone: {type:String,required:true,unique:true},
    email: {type:String,required:true,unique:true},
    password: {type: String, required: true},
    image: String,
    emailVerificationToken: String,
    estado: {type:Boolean, default:true},
    emailVerified: { type: Boolean, default: false },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
});


bufeteUserSchema.methods.encryptPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    return hash;
};

bufeteUserSchema.methods.comparePassword = async function(password) {
    const isMatch = await bcrypt.compare(password, this.password);
    return isMatch;
};

bufeteUserSchema.pre('save', async function(next) {
    if (this.isModified('password') || this.isNew) {
        try {
            // Comprueba si la contraseña ya está encriptada
            if (!this.password.startsWith('$2b$')) {
                this.password = await this.encryptPassword(this.password);
            }
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});


module.exports = mongoose.model('BufeteUser', bufeteUserSchema);
