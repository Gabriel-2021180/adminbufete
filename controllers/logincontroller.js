const BufeteUser = require('../models/bufeteUser'); // Asegúrate de que la ruta sea correcta

exports.getLogin = (req, res) => {
    
    const disableInputs = req.rateLimiterRes ? true : false;
    const remainingTime = req.rateLimiterRes && Math.ceil(req.rateLimiterRes.msBeforeNext / 1000);
    res.render('login', { error: req.flash('error'), disableInputs, remainingTime });
};

exports.postLogin = async (req, res, next) => {
    const { username } = req.body;

    try {
        const user = await BufeteUser.findOne({ username });

        if (!user) {
            req.flash('error_msg', 'Ocurrió un error al iniciar sesión. Por favor, inténtalo de nuevo.');
            return res.redirect('/');
        }

        // Autenticar al usuario
        req.login(user, function (err) {
            if (err) {
                
                console.error('Error al iniciar sesión:', err);
                req.flash('error_msg', 'Ocurrió un error al iniciar sesión. Por favor, inténtalo de nuevo.');
                return res.redirect('/');
            }
            return res.redirect('/index');
        });
    } catch (err) {
        console.error('Error al verificar el usuario:', err);
        req.flash('error_msg', 'Ocurrió un error al iniciar sesión. Por favor, inténtalo de nuevo.');
        res.redirect('/');
    }
};


exports.getIndex = (req, res) => {
    res.render('indexAdmin');
};

exports.getLogout = (req, res) => {
    
    req.session.destroy(); // Destruye la sesión del usuario
    res.redirect('/');
  };

exports.isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
};
