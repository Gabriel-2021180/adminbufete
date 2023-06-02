const InvitationCode = require('../models/invitacion');
const BufeteUser = require('../models/bufeteUser')
const { Storage } = require('@google-cloud/storage')
const emailTransporter = require('../configs/emailConfig'); 
const storage = new Storage({ keyFilename: "googleimage.json" })
const moment = require('moment');
const crypto = require('crypto');
exports.saveCode = async (req, res) => {
    try {
        const { code } = req.body;

        
        const now = new Date();

        
        const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

        
        const count = await InvitationCode.countDocuments({
            created_by: req.user._id, // Asegúrate de que 'req.user._id' contiene el ID del usuario actual
            created_at: { $gte: oneDayAgo }
        });

        // Si el usuario ya ha creado 3 códigos de invitación en el último día, no permitas que cree más
        if (count >= 10) {
            return res.status(400).json({ message: 'Has alcanzado el límite de 3 códigos de invitación por día' });
        }

        // Si el usuario no ha alcanzado el límite, crea el nuevo código de invitación
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
// Usar un código de invitación existente
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
        invitationCode.used_by = req.user._id; // Asegúrate de que 'req.user._id' contiene el ID del usuario actual
        invitationCode.used = true; // Marca el código como utilizado
        await invitationCode.save();

        res.json({ message: 'Código de invitación utilizado con éxito' });
    } catch (error) {
        res.status(500).json({ message: 'Error al usar el código de invitación', error });
    }
};

// Verificar el código de invitación
exports.getcreateuserwithinvitation = (req, res) => {
    // Comprueba si el código de invitación ha sido verificado
    if (!req.session.codeVerified) {
        // Si no, redirige al usuario a la página para ingresar el código de invitación
        return res.redirect('/enter-invitation-code');
    }

    // Si el código de invitación ha sido verificado, renderiza la página de registro
    res.render('crearusuarioinvitacion');
};


// Verificar el código de invitación
exports.postEnterInvitationCode = async (req, res) => {
    const { invitationCode } = req.body;

    // Comprueba si el código de invitación es válido
    const code = await InvitationCode.findOne({ code: invitationCode });
    
    if (!code || code.used) {
        req.flash('error_msg', 'El código de invitación no es válido o ya ha sido utilizado.');
        return res.redirect('/enter-invitation-code');
    }

    // Si el código es válido, redirige al formulario de registro
    req.session.invitationCode = invitationCode;
    req.session.codeVerified = true;
    res.redirect('/signup-with-invitation');
};



// Registrar un nuevo usuario con un código de invitación
exports.postSignupWithInvitation = async (req, res) => {
    const { nombres, apellidos, username, ci, direccion, fechanac, phone, email, password } = req.body;
    const invitationCode = req.session.invitationCode;

    // Comprueba si el código de invitación es válido
    const code = await InvitationCode.findOne({ code: invitationCode });
    if (!code || code.used) {
        req.flash('error_msg', 'El código de invitación no es válido o ya ha sido utilizado.');
        return res.redirect('/enter-invitation-code');
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
      console.log(error);
      return res.redirect('/signup-with-invitation');
    }
    
    const url = await uploadFile(req.file);
    // Continúa con el registro del usuario como lo haces normalmente
    const newUser = new BufeteUser({
        nombres,
        apellidos,
        username,
        ci,
        direccion,
        rol: 'Abogado',
        fechanac,
        phone,
        email,
        password,
        image: url,
        emailVerificationToken,
        emailVerified: false,
    });

    newUser.password = await newUser.encryptPassword(newUser.password);

    await newUser.save();

    // Marca el código de invitación como utilizado
    code.used_at = Date.now();
    code.used_by = newUser._id;
    await code.save();

    req.flash('success_msg', 'Te has registrado con éxito. Ahora puedes iniciar sesión.');
    res.redirect('/login');
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
