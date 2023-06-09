const SolicitudAbogado = require('../models/SolicitudAbogado');
const Caso = require('../models/casos');
exports.getSolicitudes = async (req, res) => {
  try {
    const role= req.user.rol
    const user = req.user
    const abogadoId = req.user._id; 
    const solicitudes = await SolicitudAbogado.find({ abogado: abogadoId }).populate('cliente');

    res.render('solicitudes', { solicitudes, abogadoId,role,user }); 
  } catch (error) {
    console.error('Error al obtener las solicitudes:', error);
    res.status(500).json({ error: 'Ocurrió un error al obtener las solicitudes' });
  }
};


exports.postAceptarSolicitud = async (req, res) => {
  
  try {
    const solicitudId = req.params.solicitudId;
    const abogadoId = req.user._id;

    const solicitud = await SolicitudAbogado.findById(solicitudId);

    if (!solicitud || solicitud.estado !== 'pendiente') {
      req.flash('error_msg', 'La solicitud no existe o ya fue aceptada.');
      return res.redirect('/solicitudes');
    }

    if (solicitud.abogado.toString() !== abogadoId.toString()) {
      req.flash('error_msg', 'No puedes aceptar una solicitud que no te fue enviada.');
      return res.redirect('/solicitudes');
    }

    const caso = await Caso.findOne({ cliente: solicitud.cliente });

    if (caso) {
      caso.abogado = abogadoId;
      await caso.save();
      solicitud.casoCreado = true;
    }

   

    solicitud.estado = 'aceptada';
    await solicitud.save();

    req.flash('success_msg', 'Has aceptado la solicitud exitosamente.');
    res.redirect('/solicitudes');
  } catch (error) {
    console.error('Error al aceptar la solicitud:', error);
    req.flash('error_msg', 'Ocurrió un error al aceptar la solicitud. Por favor, inténtalo de nuevo.');
    res.redirect('/solicitudes');
  }
};


