const Cita = require('../models/citas');
const Reunion = require('../models/reuniones');
const Caso = require('../models/casos');
const User = require('../models/clientes');
const BufeteUser=require('../models/bufeteUser')
const mongoose = require('mongoose');
exports.postCita = async (req, res) => {
  try {
    const { motivo, estado, fecha, hora, horaFin, cliente } = req.body;
    const abogadoId = req.user._id; // Asume que el ID del abogado está en req.user._id
    const cita = new Cita({ motivo, estado, fecha, hora, horaFin, abogado: abogadoId,cliente });

    await cita.save();
    res.redirect('/'); // Redirige a la página principal después de guardar la cita
  } catch (error) {
    console.error('Error al crear la cita:', error);
    res.status(500).json({ message: 'Error al crear la cita' });
  }
};


exports.getCitasJSON = async (req, res) => {
  try {
    const usuarioActual = req.user._id; // Asume que el ID del usuario actual está en req.user._id
    const fechaActual = new Date(); // Fecha y hora actual

    // Buscar las citas donde el usuario actual es el cliente y la fecha de la cita es posterior a la fecha actual
    const citas = await Cita.find({
      cliente: usuarioActual,
      fecha: { $gte: fechaActual } // Filtrar solo las citas futuras
    }).populate('abogado', 'nombres');

    // Convertir las fechas a una cadena sin convertir la zona horaria
    const citasConFechasUTC = citas.map((cita) => {
      const fechaUTC = cita.fecha.toISOString().split('T')[0];
      const estado = getEstadoCita(cita); // Obtener el estado de la cita
      return { ...cita.toObject(), fecha: fechaUTC, horaFin: cita.horaFin, estado };
    });

    res.json(citasConFechasUTC);
  } catch (error) {
    console.error('Error al obtener las citas:', error);
    res.status(500).json({ message: 'Error al obtener las citas' });
  }
};
function getEstadoCita(cita) {
  const fechaActual = new Date(); // Fecha y hora actual
  const fechaCita = cita.fecha;
  const horaInicio = new Date(fechaCita.getFullYear(), fechaCita.getMonth(), fechaCita.getDate(), cita.hora.split(':')[0], cita.hora.split(':')[1]);
  const horaFin = new Date(fechaCita.getFullYear(), fechaCita.getMonth(), fechaCita.getDate(), cita.horaFin.split(':')[0], cita.horaFin.split(':')[1]);

  if (fechaActual < horaInicio) {
    return 'Pendiente';
  } else if (fechaActual >= horaInicio && fechaActual <= horaFin) {
    return 'En curso';
  } else {
    return 'Terminada';
  }
}


exports.postReunion = async (req, res) => {
  try {
    const { asunto, estado, fecha, lugar, hora, horaFin, usuarios } = req.body;
    const usuarioActual = req.user._id; // Asume que el ID del usuario actual está en req.user._id

    // Verificar si el usuario actual no está incluido en la lista de usuarios invitados
    if (!usuarios.includes(usuarioActual)) {
      usuarios.push(usuarioActual); // Agregar al usuario actual a la lista
    }

    

    const reunion = new Reunion({ asunto, estado, fecha, lugar, hora, horaFin, usuarios });
   
    await reunion.save();

    // Rellenar los datos de los usuarios invitados
    const reunionPopulada = await Reunion.findById(reunion._id).populate('usuarios', 'nombres');
    
    res.json(reunionPopulada);
  } catch (error) {
    console.error('Error al crear la reunion:', error);
    res.status(500).json({ message: 'Error al crear la reunion' });
  }
};





exports.getReunionesJSON = async (req, res) => {
  try {
    const bufeteUserId = req.user._id;
    const fechaActual = new Date();

    const reuniones = await Reunion.find({
      usuarios: bufeteUserId,
      fecha: { $gte: fechaActual },
      activo: true // Filtrar solo las reuniones activas
    }).populate('usuarios', 'nombres');

    const reunionesConFechasUTC = reuniones.map((reunion) => {
      const fechaUTC = reunion.fecha.toISOString().split('T')[0];
      const estado = getEstadoReunion(reunion);
      return { ...reunion.toObject(), fecha: fechaUTC, horaFin: reunion.horaFin, estado };
    });

    res.json(reunionesConFechasUTC);
  } catch (error) {
    console.error('Error al obtener las reuniones:', error);
    res.status(500).json({ message: 'Error al obtener las reuniones' });
  }
};

function getEstadoReunion(reunion) {
  const fechaActual = new Date(); // Fecha y hora actual
  const fechaReunion = reunion.fecha;
  const horaInicio = new Date(fechaReunion.getFullYear(), fechaReunion.getMonth(), fechaReunion.getDate(), reunion.hora.split(':')[0], reunion.hora.split(':')[1]);
  const horaFin = new Date(fechaReunion.getFullYear(), fechaReunion.getMonth(), fechaReunion.getDate(), reunion.horaFin.split(':')[0], reunion.horaFin.split(':')[1]);

  if (fechaActual < horaInicio) {
    return 'Pendiente';
  } else if (fechaActual >= horaInicio && fechaActual <= horaFin) {
    return 'En curso';
  } else {
    return 'Terminada';
  }
}
exports.getClientesDelAbogado = async (req, res) => {
  try {
    const abogadoId = req.user._id; // Asume que el ID del abogado está en req.user._id

    // Buscar los casos que están asociados con el abogado
    const casos = await Caso.find({ abogado: abogadoId });

    // Extraer los IDs de los clientes de los casos
    const clienteIds = casos.map(caso => caso.cliente);

    // Buscar los clientes por sus IDs
    const clientes = await User.find({ _id: { $in: clienteIds } });
    
    res.json(clientes);
  } catch (error) {
    console.error('Error al obtener los clientes del abogado:', error);
    res.status(500).json({ message: 'Error al obtener los clientes del abogado' });
  }
};
//"eliminar las citas y reuniones"
// Controlador de citas
exports.postEliminarCita = async (req, res) => {
  try {
    const citaId = req.params.id;
    const cita = await Cita.findById(citaId);
    if (!cita) {
      throw new Error('Cita no encontrada');
    }
    cita.activo = false; // Cambia el campo 'activo' a false
    await cita.save();
    res.json({ message: 'Cita eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar la cita:', error);
    res.status(500).json({ message: 'Error al eliminar la cita' });
  }
};


exports.postEliminarReunion = async (req, res) => {
  try {
    const reunionId = req.params.id;
    const reunion = await Reunion.findById(reunionId);
    if (!reunion) {
      throw new Error('Reunión no encontrada');
    }
    reunion.activo = false; // Cambia el campo 'activo' a false
    await reunion.save();
    res.json({ message: 'Reunión eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar la reunión:', error);
    res.status(500).json({ message: 'Error al eliminar la reunión' });
  }
};

