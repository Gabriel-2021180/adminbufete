const User = require('../models/bufeteUser');
const { validationResult } = require('express-validator');
const passport = require('passport');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const { Storage } = require('@google-cloud/storage')
const storage = new Storage({ keyFilename: "googleimage.json" })
const { check } = require('express-validator');
const moment = require('moment');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const emailValidator = require('email-validator');
const schedule = require('node-schedule'); // Importa el módulo 'node-schedule'

const emailTransporter = require('../configs/emailConfig'); 
const BufeteUser = require('../models/bufeteUser'); // Importa el modelo 'bufeteUserSchema'
const { Console } = require('console');

exports.getSignup = (req, res) => {
  res.render('signup');
};

exports.postSignup = async (req, res) => {
  const { nombres, apellidos, username, ci, direccion, fechanac, phone, email, password } = req.body;
   
  // Realiza la validación manual de los campos
  // ...

  if (errors.length > 0) {
    req.flash('error_msg', 'Hay errores en la entrada.');
    return res.status(422).render('signup', { errors });

  }

  // Valida el correo electrónico
  if (!emailValidator.validate(email)) {
    errors.push({ msg: 'La dirección de correo electrónico no es válida.' });
    req.flash('error_msg', 'Hay errores en la entrada.');
    return res.status(422).render('RegistrarUsuario', { errors });
  }

  // Genera un token único
  const emailVerificationToken = crypto.randomBytes(32).toString('hex');
  
  // Configura el enlace de verificación y el contenido del correo electrónico
  const verificationLink = `${req.protocol}://${req.get('host')}/verify-email?token=${emailVerificationToken}`;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verificación de correo electrónico',
    html: `<p>Por favor, haz clic en el siguiente enlace para verificar tu correo electrónico: <a href="${verificationLink}">${verificationLink}</a></p>`,
  };

  // Envía el correo electrónico
  try {
    await emailTransporter.sendMail(mailOptions);
  } catch (error) {
    req.flash('error_msg', 'No se pudo enviar el correo electrónico de verificación. Por favor, inténtalo de nuevo.');
    
    return res.redirect('/signup');
  }

  const usuario = "Abogado";
  const url = "https://storage.googleapis.com/primerstorage/abogadodefault.png";


  const newUser = new BufeteUser({
    nombres,
    apellidos,
    username,
    ci,
    direccion,
    rol: usuario,
    fechanac,
    phone,
    email,
    password,
    image: url,
    emailVerificationToken,
    
    emailVerified: false, // Establece el campo emailVerified en falso al crear un nuevo usuario
  });

  try {
    await newUser.save();


  } catch (error) {
    if (error.code === 11000) {
      const duplicatedField = Object.keys(error.keyValue)[0];
      
      let errorMessage;
      switch (duplicatedField) {
        case 'username':
          errorMessage = 'El nombre de usuario ya está en uso.';
          break;
        case 'ci':
          errorMessage = 'La cédula de identidad ya está registrada.';
          break;
        case 'email':
          errorMessage = 'El correo electrónico ya está registrado.';
          break;
        case 'phone':
          errorMessage = 'El número de celular ya está registrado.';
          break;
        default:
          errorMessage = 'Ocurrió un error. Por favor, inténtalo de nuevo.';
      }

      req.flash('error_msg', errorMessage);
      res.render('RegistrarUsuario', {
        nombres: req.body.nombres,
        apellidos: req.body.apellidos,
        username: req.body.username,
        ci: req.body.ci,
        direccion: req.body.direccion,
        fechanac: req.body.fechanac,
        phone: req.body.phone,
        email: req.body.email,
      });
    } else {
      req.flash('error_msg', 'Ocurrió un error durante el registro. Por favor, inténtalo de nuevo.');
      res.render('RegistrarUsuario', {
        nombres: req.body.nombres,
        apellidos: req.body.apellidos,
        username: req.body.username,
        ci: req.body.ci,
        direccion: req.body.direccion,
        fechanac: req.body.fechanac,
        phone: req.body.phone,
        email: req.body.email,
      });
    }
  }
};

exports.eliminarUsuario = async (req, res) => {
  const usuarioId = req.params.id;

  try {
    const usuario = await Usuarios.findByIdAndUpdate(usuarioId, { estado: false });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar el usuario:', error);
    res.status(500).json({ message: 'Error al eliminar el usuario' });
  }
};



async function uploadFile(file) {
    const now = moment().format('YYYYMMDD_HHmmss');
    const bucket = storage.bucket('primerstorage');
    const fileName = `${now}_${file.originalname}`;
    const fileUpload = bucket.file(fileName);
    const stream = fileUpload.createWriteStream({
        resumable: false,
        public: true,
        metadata: {
            contentType: file.mimetype,
        },
    });

    return new Promise((resolve, reject) => {
        stream.on('error', reject);
        stream.on('finish', () => {
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileUpload.name}`;
            resolve(publicUrl);
        });
        stream.end(file.buffer);
    });
}
