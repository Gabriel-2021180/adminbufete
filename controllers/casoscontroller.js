const Caso = require('../models/casos')
const SolicitudAbogado=require('../models/SolicitudAbogado')
const Documento = require('../models/documentos')
const Pago = require('../models/Pagos')
exports.postCrearCaso = async (req, res) => {
    try {
      const solicitudId = req.body.solicitudId; // Obtén el ID de la solicitud del formulario
  
      // Obtén la solicitud de la base de datos
      const solicitud = await SolicitudAbogado.findById(solicitudId).populate('cliente');
  
      // Verifica si la solicitud existe
      if (!solicitud) {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }
  
      // Obtén los datos del formulario
      const { nombreCaso, descripcionCaso,tipo } = req.body;
  
      // Crea el caso en la base de datos
      const caso = new Caso({
        nombrecaso: nombreCaso,
        tipo: tipo,
        descripcion: descripcionCaso,
        fase: 'En proceso',
        fechaini: Date.now(),
        estado: true,
        
        abogado: req.user._id,
        cliente: solicitud.cliente._id,
      });
      await caso.save();
  
      // Redirige al abogado a la vista del caso específico
      res.redirect(`/casos/${caso._id}`);
    } catch (error) {
      console.error('Error al crear el caso:', error);
      res.status(500).json({ error: 'Ocurrió un error al crear el caso' });
    }
  };
  
  // casoController.js
  exports.getCaso = async (req, res) => {
    try {
      const role=req.user.rol
      const casoId = req.params.id;
      const user=req.user
      const caso = await Caso.findById(casoId).populate('abogado cliente');
  
      // Verifica si el usuario autenticado es el mismo que el usuario asociado con el caso
      if (req.user._id.toString() !== caso.abogado._id.toString()) {
        return res.status(403).send('ey!!!!!!! lo que estas haciendo esta mal violas la confidencialidad y no puedes entrar aqui asi que porfa retirate :)');
      }
  
      const documentos = await Documento.find({ caso: casoId,estado:true });
      res.render('caso', { caso, documentos,role,user });
    } catch (error) {
      console.error('Error al obtener el caso:', error);
      res.status(500).json({ error: 'Ocurrió un error al obtener el caso' });
    }
  };
  
  
  exports.getCasosAbogado = async (req, res) => {
    try {
      const user=req.user
      const role=req.user.rol
      const abogadoId = req.user._id; // Obtén el ID del abogado autenticado
  
      // Obtén los casos del abogado desde la base de datos
      const casos = await Caso.find({ abogado: abogadoId,estado:true }).populate('abogado cliente');
  
      // Renderiza la vista de casos del abogado
      res.render('casos', { casos,role,user });
    } catch (error) {
      console.error('Error al obtener los casos del abogado:', error);
      res.status(500).json({ error: 'Ocurrió un error al obtener los casos del abogado' });
    }
  };
  
  exports.postAgregarObservacion = async (req, res) => {
    try {
      const casoId = req.params.id;
      const observacion = req.body.observacion;
  
      const caso = await Caso.findById(casoId);
  
      // Verifica si el usuario autenticado es el mismo que el usuario asociado con el caso
      if (req.user._id.toString() !== caso.abogado._id.toString()) {
        return res.status(403).send('No tienes permiso para agregar una observación a este caso');
      }
  
      caso.observaciones.push(observacion);
      await caso.save();
  
      res.redirect(`/casos/${caso._id}`);
    } catch (error) {
      console.error('Error al agregar la observación:', error);
      res.status(500).json({ error: 'Ocurrió un error al agregar la observación' });
    }
};
//pagos
exports.postCrearPago = async (req, res) => {
  try {
    const { monto,detalle } = req.body;
    const casoId = req.params.id;

    const caso = await Caso.findById(casoId).populate('abogado cliente');

    // Verifica si el usuario autenticado es el mismo que el usuario asociado con el caso
    if (req.user._id.toString() !== caso.abogado._id.toString()) {
      return res.status(403).send('No tienes permiso para crear un pago para este caso');
    }

    const pago = new Pago({
      cliente: caso.cliente._id,
      abogado: caso.abogado._id,
      caso: caso._id,
      monto: monto,
      detalle:detalle
    });
    await pago.save();

    res.redirect(`/casos/${caso._id}`);
  } catch (error) {
    console.error('Error al crear el pago:', error);
    res.status(500).json({ error: 'Ocurrió un error al crear el pago' });
  }
};

exports.getPagosCaso = async (req, res) => {
  try {
    const user = req.user
    const casoId = req.params.id;

    const caso = await Caso.findById(casoId);

    // Verifica si el usuario autenticado es el mismo que el usuario asociado con el caso
    if (req.user._id.toString()!== caso.abogado._id.toString()) {
      return res.status(403).send('No tienes permiso para ver los pagos de este caso');
    }

    const pagos = await Pago.find({ caso: casoId }).populate('cliente abogado');

    res.render('pagos', { pagos,user });
  } catch (error) {
    console.error('Error al obtener los pagos:', error);
    res.status(500).json({ error: 'Ocurrió un error al obtener los pagos' });
  }
};

//parte de la facturacion
exports.getFacturaPago = async (req, res) => {
  try {
    const pagoId = req.params.id;

    const pago = await Pago.findById(pagoId).populate('cliente abogado caso');

    if (!pago) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    // Verifica si el usuario autenticado es el mismo que el usuario asociado con el caso
    if (req.user._id.toString() !== pago.abogado._id.toString()) {
      return res.status(403).send('No tienes permiso para ver la factura de este pago');
    }

    res.render('factura', { pago });
  } catch (error) {
    console.error('Error al obtener la factura del pago:', error);
    res.status(500).json({ error: 'Ocurrió un error al obtener la factura del pago' });
  }
};

exports.getFacturaCasos = async (req, res) => {
  try {
    const casoId = req.params.id;

    const caso = await Caso.findById(casoId);

    
    if (req.user._id.toString() !== caso.abogado._id.toString()) {
      return res.status(403).send('No tienes permiso para ver la factura de este caso');
    }

    const pagos = await Pago.find({ caso: casoId }).populate('cliente abogado');

    res.render('facturaCasos', { pagos });
  } catch (error) {
    console.error('Error al obtener la factura de los casos:', error);
    res.status(500).json({ error: 'Ocurrió un error al obtener la factura de los casos' });
  }
};
// En tu controlador
exports.postEditarCaso = async (req, res) => {
  try {
    const casoId = req.params.id; // Obtén el ID del caso del formulario
    const { editnombreCaso, editdescripcion, edittipo } = req.body; // Obtén los datos del formulario

    // Encuentra el caso en la base de datos
    const caso = await Caso.findById(casoId);

    // Verifica si el caso existe
    if (!caso) {
      return res.status(404).json({ message: 'Caso no encontrado' });
    }

    // Actualiza los datos del caso
    caso.nombrecaso = editnombreCaso;
    caso.descripcion = editdescripcion;
    caso.tipo = edittipo;

    // Guarda los cambios en la base de datos
    await caso.save();

    // Redirige al usuario a la vista del caso
    res.redirect(`/casos/${casoId}`);
  } catch (error) {
    console.error('Error al editar el caso:', error);
    res.status(500).json({ message: 'Error al editar el caso' });
  }
};

// En tu controlador
exports.postArchivarCaso = async (req, res) => {
  try {
    const casoId = req.params.id; // Obtén el ID del caso del formulario

    // Encuentra el caso en la base de datos
    const caso = await Caso.findById(casoId);

    // Verifica si el caso existe
    if (!caso) {
      return res.status(404).json({ message: 'Caso no encontrado' });
    }

    // Verifica si el usuario autenticado es el mismo que el usuario asociado con el caso
    if (req.user._id.toString() !== caso.abogado._id.toString()) {
      return res.status(403).send('No tienes permiso para archivar este caso');
    }

    // Cambia el estado del caso a false
    caso.estado = false;

    // Guarda los cambios en la base de datos
    await caso.save();

    // Redirige al usuario a la vista de sus casos
    res.redirect('/casos');
  } catch (error) {
    console.error('Error al archivar el caso:', error);
    res.status(500).json({ message: 'Error al archivar el caso' });
  }
};


