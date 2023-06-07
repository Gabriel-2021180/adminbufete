const crypto = require('crypto');
const BufeteUser = require('../models/bufeteUser');
const emailTransporter = require('../configs/emailConfig');
const bcrypt = require('bcrypt');
exports.getForgotPassword = (req, res) => {
    res.render('forgot-password');
};

exports.postForgotPassword = async (req, res) => {
    const { email } = req.body;
    const user = await BufeteUser.findOne({ email });

    if (!user) {
        req.flash('error_msg', 'No se encontró ninguna cuenta con ese correo electrónico.');
        return res.redirect('/forgot-password');
    }

    const resetPasswordToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const resetLink = `${req.protocol}://${req.get('host')}/reset-password?token=${resetPasswordToken}`;
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Restablecimiento de contraseña',
        html: `<p>Por favor, haz clic en el siguiente enlace para restablecer tu contraseña: <a href="${resetLink}">${resetLink}</a></p>`,
    };

    try {
        await emailTransporter.sendMail(mailOptions);
        req.flash('success_msg', 'Se ha enviado un correo electrónico con instrucciones para restablecer tu contraseña.');
        res.redirect('https://mail.google.com/');
    } catch (error) {
        req.flash('error_msg', 'Ocurrió un error al enviar el correo electrónico de restablecimiento de contraseña. Por favor, inténtalo de nuevo.');
        res.redirect('/forgot-password');
    }
};

exports.getResetPassword = (req, res) => {
    const { token } = req.query;
    res.render('reset-password', { token });
};

exports.postResetPassword = async (req, res) => {
    const { token } = req.query;
    const { password } = req.body;

    const user = await BufeteUser.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });

    if (!user) {
        req.flash('error_msg', 'El token de restablecimiento de contraseña no es válido o ha expirado.');
        return res.redirect('/forgot-password');
    }

    // Borramos el token y la fecha de caducidad inmediatamente después de encontrar al usuario
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    // Encriptamos la nueva contraseña manualmente y la asignamos al usuario
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    user.password = hash;

    // Guardamos el usuario, pero desactivamos los middlewares para evitar que la contraseña se encripte nuevamente
    await user.save({ validateBeforeSave: false });

    req.flash('success_msg', 'Tu contraseña ha sido restablecida con éxito. Ahora puedes iniciar sesión.');
    res.redirect('/');
};






