const express = require('express');
const passport = require('passport');
const router = express.Router();
const LoginController = require('../controllers/logincontroller');
const SignupController = require('../controllers/SignupController');
const ProfileController = require('../controllers/profileController');
const InvitationCodeController = require('../controllers/invitationCodeController');
const firstcontroller = require('../controllers/firstController');
const solicitudAbogadoController = require('../controllers/solicitudController');
const CitasController = require('../controllers/CitasController');
const casoController = require('../controllers/casoscontroller');
const { body } = require('express-validator');
const DocumentoController = require('../controllers/documentosController');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const multer = require('multer');
const BufeteUser = require('../models/bufeteUser');
const User = require('../models/bufeteUser');
const storage = multer.memoryStorage();
const upload = multer({ storage }).single('documento');
const uploadProfileImg = multer({ storage }).single('profileimg');
const uploadeditprofileimage = multer({ storage }).single('editimage')
const rateLimiter = new RateLimiterMemory({
  points: 4,
  duration: 60 * 5,
});

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};

router.get('/', LoginController.getLogin);
router.get('/signup', SignupController.getSignup);
router.get('/verify-email', async (req, res) => {
  const token = req.query.token;

  try {
    const user = await BufeteUser.findOne({ emailVerificationToken: token });

    if (!user) {
      req.flash('error_msg', 'El enlace de verificación no es válido o ha expirado.');
      return res.redirect('/login');
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();
    req.flash('success_msg', 'Correo electrónico verificado exitosamente. Ahora puedes iniciar sesión.');
    res.redirect('/');
  } catch (error) {
    console.error('Error al verificar el correo electrónico:', error);
    req.flash('error_msg', 'Ocurrió un error al verificar tu correo electrónico. Por favor, inténtalo de nuevo.');
    res.redirect('/signup');
  }
});

router.post(
  '/signup',
  [
    body('nombres').notEmpty().withMessage('El campo nombres no puede estar vacío.'),
    body('apellidos').notEmpty().withMessage('El campo apellidos no puede estar vacío.'),
    body('username').notEmpty().withMessage('El campo nombre de usuario no puede estar vacío.'),
    body('ci').notEmpty().withMessage('El campo cédula de identidad no puede estar vacío.'),
    body('direccion').notEmpty().withMessage('El campo dirección no puede estar vacío.'),
    body('fechanac').notEmpty().withMessage('El campo fecha de nacimiento no puede estar vacío.'),
    body('phone').notEmpty().withMessage('El campo teléfono no puede estar vacío.'),
    body('email').notEmpty().withMessage('El campo email no puede estar vacío.'),
    body('password').notEmpty().withMessage('El campo contraseña no puede estar vacío.'),
  ],
  upload,
  SignupController.postSignup
);

router.post(
  '/login',
  async (req, res, next) => {
    try {
      const rateLimiterRes = await rateLimiter.consume(req.ip);
      req.rateLimiterRes = rateLimiterRes;
      next();
    } catch (err) {
      console.log('Demasiadas solicitudes');
      req.rateLimiterRes = err;
      const remainingTime = Math.ceil(err.msBeforeNext / 1000);
      req.flash('error', `Demasiadas solicitudes, por favor espera ${remainingTime} segundos antes de intentar de nuevo.`);

      return res.render('login', { error: req.flash('error'), disableInputs: true });
    }
  },
  passport.authenticate('local', {
    successRedirect: '/index',
    failureRedirect: '/',
    failureFlash: true,
  })
);

router.get('/index', ensureAuthenticated, (req, res) => {
  const role= req.user.rol
  const user=req.user
  res.render('indexAdmin', { user: req.user,role,user});
});

router.get('/logout', LoginController.getLogout);

router.get('/profile', LoginController.isAuthenticated, ProfileController.getProfile);

router.get('/chat', LoginController.isAuthenticated, (req, res) => {
  res.render('chat', { user: req.user });
});

router.get('/solicitudes', ensureAuthenticated, solicitudAbogadoController.getSolicitudes);
router.get('/get-documento-url/:documentoId', ensureAuthenticated, DocumentoController.getDocumentoUrl);

router.get('/registro', ensureAuthenticated,firstcontroller.getRegister);
router.post(
  '/registro',
  [
    body('nombres').notEmpty().withMessage('El campo nombres no puede estar vacío.'),
    body('apellidos').notEmpty().withMessage('El campo apellidos no puede estar vacío.'),
    body('username').notEmpty().withMessage('El campo nombre de usuario no puede estar vacío.'),
    body('ci').notEmpty().withMessage('El campo cédula de identidad no puede estar vacío.'),
    body('direccion').notEmpty().withMessage('El campo dirección no puede estar vacío.'),
    body('fechanac').notEmpty().withMessage('El campo fecha de nacimiento no puede estar vacío.'),
    body('phone').notEmpty().withMessage('El campo teléfono no puede estar vacío.'),
    body('email').notEmpty().withMessage('El campo email no puede estar vacío.'),
    body('password').notEmpty().withMessage('El campo contraseña no puede estar vacío.'),
  ],
  upload,
  SignupController.postSignup
);


//casos
router.get('/casos', ensureAuthenticated, casoController.getCasosAbogado);
router.get('/casos/:id', ensureAuthenticated, casoController.getCaso);
router.post('/casos', ensureAuthenticated, casoController.postCrearCaso);
router.post('/subir-documento', ensureAuthenticated, upload, DocumentoController.subirDocumento);
router.post('/casos/:id/editar', casoController.postEditarCaso);
router.post('/casos/:id/archivar', casoController.postArchivarCaso);



router.get('/clientesDelAbogado', ensureAuthenticated, CitasController.getClientesDelAbogado);
router.get('/clientes',ensureAuthenticated,firstcontroller.getclientes)
router.get('/clientes/buscar',ensureAuthenticated,firstcontroller.getAllclientes)
router.get('/usuarios/buscar',ensureAuthenticated,firstcontroller.getAllUsers)
//citas
router.post('/citas',ensureAuthenticated,CitasController.postCita)
router.get('/citasJSON',ensureAuthenticated,CitasController.getCitasJSON)
router.get('/reunionesJSON',ensureAuthenticated,CitasController.getReunionesJSON)
// ruta.js
router.post('/citas/:id/eliminar', CitasController.postEliminarCita);

router.post('/reuniones/:id/eliminar', CitasController.postEliminarReunion);
// ver usuarios
router.get('/usuarios', ensureAuthenticated,firstcontroller.getusers);
router.put('/editusuarios/:id', ensureAuthenticated,firstcontroller.CargarUsuario);
router.put('/editclientes/:id', ensureAuthenticated,firstcontroller.CargarCliente);
router.post('/editusuarios/:id', ensureAuthenticated,firstcontroller.updateUser);
//parte de la invitacion
router.post('/invitationCodes', ensureAuthenticated, InvitationCodeController.saveCode);
router.get('/enter-invitation-code', InvitationCodeController.getEnterInvitationCode);
router.post('/enter-invitation-code', InvitationCodeController.postEnterInvitationCode);
router.get('/signup-with-invitation', InvitationCodeController.getcreateuserwithinvitation);
router.post(
  '/signup-with-invitation',
  uploadProfileImg,
  [
    body('nombres').trim().notEmpty().withMessage('El campo nombres no puede estar vacío.').escape(),
    body('apellidos').trim().notEmpty().withMessage('El campo apellidos no puede estar vacío.').escape(),
    body('username').trim().notEmpty().withMessage('El campo nombre de usuario no puede estar vacío.').escape(),
    body('ci').trim().notEmpty().withMessage('El campo cédula de identidad no puede estar vacío.').escape(),
    body('direccion').trim().notEmpty().withMessage('El campo dirección no puede estar vacío.').escape(),
    body('fechanac').notEmpty().withMessage('El campo fecha de nacimiento no puede estar vacío.'),
    body('phone').trim().notEmpty().withMessage('El campo teléfono no puede estar vacío.').escape(),
    body('email').trim().notEmpty().withMessage('El campo email no puede estar vacío.').isEmail().withMessage('El email ingresado no es válido.').escape(),
    body('password').notEmpty().withMessage('El campo contraseña no puede estar vacío.'),
  ],
  InvitationCodeController.postSignupWithInvitation
);
//validacion en tiempo real de datos
router.get('/check-unique', InvitationCodeController.checkUniqueFields);
router.post('/casos/:id/observaciones', ensureAuthenticated, casoController.postAgregarObservacion);
//borrar documento
router.put('/documentos/:id', DocumentoController.borrarDocumento);
//pagos
router.post('/casos/:id/pagos', ensureAuthenticated, casoController.postCrearPago);
router.get('/casos/:id/pagos', ensureAuthenticated, casoController.getPagosCaso);
//facturas
router.get('/factura-pago/:id', ensureAuthenticated, casoController.getFacturaPago);
router.get('/factura-casos/:id', ensureAuthenticated, casoController.getFacturaCasos);
//"dar de baja a un usuario"
router.put('/borrar/:id',ensureAuthenticated,firstcontroller.deleteUser)
//'dar de baja a un cliente'
router.put('/borrarcliente/:id',ensureAuthenticated,firstcontroller.deleteCliente) 
//aceptar un caso avanzdo
router.post('/aceptar-solicitud/:solicitudId',ensureAuthenticated,solicitudAbogadoController.postAceptarSolicitud);


//parte para las reuniones:
// Ruta para obtener los usuarios
router.get('/api/usuarios', ensureAuthenticated, async (req, res) => {
  try {
    const searchTerm = req.query.nombre;
    const usuarioActual = req.user._id; // Asume que el ID del usuario actual está en req.user._id

    const usuarios = await User.find({
      _id: { $ne: usuarioActual }, // Excluir al usuario actual
      nombres: new RegExp(searchTerm, 'i') // Búsqueda insensible a mayúsculas y minúsculas
    });

    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    res.status(500).json({ message: 'Error al obtener los usuarios' });
  }
});


// Ruta para agregar un usuario a la reunión
router.post('/api/reuniones/:reunionId/agregarUsuario', ensureAuthenticated, async (req, res) => {
  try {
    const usuarioId = req.body.usuarioId;
    const reunionId = req.params.reunionId;
    const reunion = await Reunion.findById(reunionId);
    if (!reunion.usuarios.includes(usuarioId)) {
      reunion.usuarios.push(usuarioId);
      await reunion.save();
      res.json({ message: 'Usuario agregado exitosamente' });
    } else {
      res.status(400).json({ message: 'El usuario ya está en la reunión' });
    }
  } catch (error) {
    console.error('Error al agregar el usuario a la reunión:', error);
    res.status(500).json({ message: 'Error al agregar el usuario a la reunión' });
  }
});

// Ruta para obtener las reuniones de un usuario
router.get('/api/reuniones', ensureAuthenticated, async (req, res) => {
  try {
    const usuarioId = req.user._id; // Asume que el ID del usuario está en req.user._id
    const reuniones = await Reunion.find({ usuarios: usuarioId });
    res.json(reuniones);
  } catch (error) {
    console.error('Error al obtener las reuniones:', error);
    res.status(500).json({ message: 'Error al obtener las reuniones' });
  }
});

// Ruta para crear una nueva reunión
router.post('/api/reuniones', ensureAuthenticated, );
router.post('/reuniones',ensureAuthenticated, CitasController.postReunion)
router.post('/profile/edit',ensureAuthenticated,uploadeditprofileimage,ProfileController.postEditProfile)
//ruta para jalar los datos del usuario para el campo edit
router.get('/usuarios/:id', firstcontroller.editarUsuario);
router.get('/clientes/:id', firstcontroller.editarCliente);
//olvide mi contraseña
const forgotPasswordController = require('../controllers/forgotPasswordController');
router.get('/forgot-password', forgotPasswordController.getForgotPassword);
router.post('/forgot-password', forgotPasswordController.postForgotPassword);
router.get('/reset-password', forgotPasswordController.getResetPassword);
router.post('/reset-password', forgotPasswordController.postResetPassword);

module.exports = router;

