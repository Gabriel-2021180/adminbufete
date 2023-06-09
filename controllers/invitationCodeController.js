const InvitationCode = require('../models/invitacion');
const BufeteUser = require('../models/bufeteUser');
const { Storage } = require('@google-cloud/storage');
const emailTransporter = require('../configs/emailConfig');
const storage = new Storage({ keyFilename: "googleimage.json" });
const moment = require('moment');
const crypto = require('crypto');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const DOMPurify = createDOMPurify(new JSDOM('').window);

exports.saveCode = async (req, res) => {
  try {
    const { code } = req.body;

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

    const count = await InvitationCode.countDocuments({
      created_by: req.user._id,
      created_at: { $gte: oneDayAgo }
    });

    if (count >= 10) {
      return res.status(400).json({ message: 'Has alcanzado el límite de 3 códigos de invitación por día' });
    }

    const newCode = new InvitationCode({ code, created_by: req.user._id, created_at: now });
    await newCode.save();

    res.json({ message: 'Código de invitación guardado', code: newCode.code });
  } catch (error) {
    res.status(500).json({ message: 'Error al guardar el código de invitación', error });
  }
};

exports.getEnterInvitationCode = (req, res) => {
  res.render('validarinvitacion');
};

exports.useCode = async (req, res) => {
  try {
    const { code } = req.body;
    const invitationCode = await InvitationCode.findOne({ code });

    if (!invitationCode) {
      return res.status(404).json({ message: 'Código de invitación no encontrado' });
    }

    if (invitationCode.used) {
      return res.status(400).json({ message: 'Este código de invitación ya ha sido utilizado' });
    }

    invitationCode.used_at = Date.now();
    invitationCode.used_by = req.user._id;
    invitationCode.used = true;
    await invitationCode.save();

    res.json({ message: 'Código de invitación utilizado con éxito' });
  } catch (error) {
    res.status(500).json({ message: 'Error al usar el código de invitación', error });
  }
};

exports.getcreateuserwithinvitation = (req, res) => {
  if (!req.session.codeVerified) {
    return res.redirect('/enter-invitation-code');
  }

  res.render('crearusuarioinvitacion');
};

exports.postEnterInvitationCode = async (req, res) => {
    const { invitationCode } = req.body;
  
    const code = await InvitationCode.findOne({ code: invitationCode });
  
    if (!code || code.used) {
      req.flash('error_msg', 'El código de invitación no es válido o ya ha sido utilizado.');
      return res.redirect('/enter-invitation-code');
    }
  
    req.session.invitationCode = invitationCode;
    req.session.codeVerified = true;
    res.redirect('/signup-with-invitation');
  };

  exports.postSignupWithInvitation = async (req, res) => {
    try {
      const { nombres, apellidos, username, ci, direccion, fechanac, phone, email, password } = req.body;
      const invitationCode = req.session.invitationCode;
      console.log('esta es la contraseña que el usuario esta poniendo:  ' + password);
  
      const code = await InvitationCode.findOne({ code: invitationCode });
      if (!code || code.used) {
        req.flash('error_msg', 'El código de invitación no es válido o ya ha sido utilizado.');
        return res.redirect('/enter-invitation-code');
      }
  
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      const verificationLink = `${req.protocol}://${req.get('host')}/verify-email?token=${emailVerificationToken}`;
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verificación de correo electrónico',
        html: `<p>Por favor, haz clic en el siguiente enlace para verificar tu correo electrónico: <a href="${verificationLink}">${verificationLink}</a></p>`,
      };
  
      try {
        await emailTransporter.sendMail(mailOptions);
      } catch (error) {
        req.flash('error_msg', 'No se pudo enviar el correo electrónico de verificación. Por favor, inténtalo de nuevo.');
        console.log(error);
        return res.redirect('/signup-with-invitation');
      }
  
      const url = await uploadFile(req.file);
  
      const newUser = new BufeteUser({
        nombres: DOMPurify.sanitize(nombres),
        apellidos: DOMPurify.sanitize(apellidos),
        username: DOMPurify.sanitize(username),
        ci: DOMPurify.sanitize(ci),
        direccion: DOMPurify.sanitize(direccion),
        rol: 'Abogado',
        fechanac: DOMPurify.sanitize(fechanac),
        phone: DOMPurify.sanitize(phone),
        email: DOMPurify.sanitize(email),
        password: DOMPurify.sanitize(password),
        image: url,
        emailVerificationToken,
        emailVerified: false,
      });
  
      await newUser.save();
  
      code.used_at = Date.now();
      code.used_by = newUser._id;
      code.used = true; // Agregamos esta línea para actualizar el estado a true
      await code.save();
  
      req.flash('success_msg', 'Te has registrado con éxito. Ahora puedes iniciar sesión.');
      res.redirect('https://mail.google.com');
    } catch (error) {
      res.status(500).json({ message: 'Error al registrar el usuario con el código de invitación', error });
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
exports.checkUniqueFields = async (req, res) => {
    const { field, value } = req.query;
  
    try {
      const existingUser = await BufeteUser.findOne({ [field]: value });
  
      if (existingUser) {
        return res.json({ unique: false });
      }
  
      res.json({ unique: true });
    } catch (error) {
      res.status(500).json({ message: 'Error al verificar la unicidad del campo', error });
    }
  };
  
