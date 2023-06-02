const Cita = require('../models/citas');
const Reunion = require('../models/reuniones');
const Caso = require('../models/casos');
const User = require('../models/clientes');
const mongoose = require('mongoose');
exports.postCita = async (req, res) => {
  try {
    const { motivo, estado, fecha, hora, horaFin, cliente } = req.body;
    const abogadoId = req.user._id; // Asume que el ID del abogado está en req.user._id
    const cita = new Cita({ motivo, estado, fecha, hora, horaFin, abogado: abogadoId,cliente });

    console.log('Recibida solicitud para guardar cita:', cita);
    await cita.save();
    res.redirect('/'); // Redirige a la página principal después de guardar la cita
  } catch (error) {
    console.error('Error al crear la cita:', error);
    res.status(500).json({ message: 'Error al crear la cita' });
  }
};


exports.getCitasJSON = async (req, res) => {
  try {
    const User=req.user._id;
    const citas = await Cita.find({abogado:User});
    // Convertir las fechas a una cadena sin convertir la zona horaria
    const citasConFechasUTC = citas.map((cita) => {
      const fechaUTC = cita.fecha.toISOString().split('T')[0];
      return { ...cita.toObject(), fecha: fechaUTC, horaFin: cita.horaFin };
    });
    
    res.json(citasConFechasUTC);
  } catch (error) {
    console.error('Error al obtener las citas:', error);
    res.status(500).json({ message: 'Error al obtener las citas' });
  }
};



exports.postReunion = async (req, res) => {
  try {
    const { asunto, estado, fecha, lugar, hora, horaFin, usuarios } = req.body;
    console.log('Recibida solicitud para guardar reunion:', req.body);

    const reunion = new Reunion({ asunto, estado, fecha, lugar, hora, horaFin, usuarios });
    console.log('Datos de la reunion a guardar:', reunion);
    await reunion.save();
    res.redirect('/gu'); // Redirige a la página principal después de guardar la reunion
  } catch (error) {
    console.error('Error al crear la reunion:', error);
    res.status(500).json({ message: 'Error al crear la reunion' });
  }
};



exports.getReunionesJSON = async (req, res) => {
  try {
    const reuniones = await Reunion.find();
    // Convertir las fechas a una cadena sin convertir la zona horaria
    const reunionesConFechasUTC = reuniones.map((reunion) => {
      const fechaUTC = reunion.fecha.toISOString().split('T')[0];
      return { ...reunion.toObject(), fecha: fechaUTC, horaFin: reunion.horaFin };
    });

    res.json(reunionesConFechasUTC);
  } catch (error) {
    console.error('Error al obtener las reuniones:', error);
    res.status(500).json({ message: 'Error al obtener las reuniones' });
  }
};
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
    cita.estado = false; // Cambia el estado a false
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
    reunion.estado = false; // Cambia el estado a false
    await reunion.save();
    res.json({ message: 'Reunión eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar la reunión:', error);
    res.status(500).json({ message: 'Error al eliminar la reunión' });
  }
};
