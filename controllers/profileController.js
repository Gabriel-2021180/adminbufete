const Usuarios = require('../models/bufeteUser')
const { Storage } = require('@google-cloud/storage')
const storage = new Storage({ keyFilename: "googleimage.json" })
const moment = require('moment');
exports.getProfile = (req, res) => {
    if (req.isAuthenticated()) {
        const user = req.user
        const role = req.user.rol
        
        res.render('profileadmin', { user,role });
    } else {
        res.redirect('/login');
    }
};

exports.postEditProfile = async (req, res) => {
  try {
    const user = await Usuarios.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Actualiza los datos del usuario
    user.nombres = req.body.editnombres || user.nombres;
    user.apellidos = req.body.editapellidos || user.apellidos;
    user.username = req.body.editusername || user.username;
    user.ci = req.body.editci || user.ci;
    user.descripcion = req.body.editdescripcion || user.descripcion;
    user.direccion = req.body.editdireccion || user.direccion;
    user.fechanac = req.body.editfechanac || user.fechanac;
    user.phone = req.body.editphone || user.phone;

    // Si se subió una nueva imagen, actualiza la URL de la imagen
    if (req.file) {
      const imageUrl = await uploadFile(req.file);
      user.image = imageUrl;
    }

    await user.save();

    res.redirect('/profile');
  } catch (error) {
    console.error('Error al editar el perfil:', error);
    res.status(500).json({ error: 'Ocurrió un error al editar el perfil' });
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
