const fetch = require('node-fetch');
const BufeteUser = require('../models/bufeteUser');

exports.enviarDatosBufeteUser = async (req, res) => {
    try {
      // Obtener todos los miembros del bufete desde la base de datos
      const bufeteUsers = await BufeteUser.find({rol:"Abogado"});
  
      if (!bufeteUsers) {
        return res.status(404).json({ error: 'No se encontraron miembros del bufete' });
      }
  
      // Preparar los datos a enviar al sistema de administración
      const datosBufeteUsers = bufeteUsers.map((bufeteUser) => ({
        nombres: bufeteUser.nombres,
        apellidos: bufeteUser.apellidos,
        // Agrega los demás campos que deseas enviar al sistema de administración
      }));
  
      // Realizar el envío de los datos al sistema de administración
      // Puedes implementar la lógica específica para enviar los datos al sistema de administración aquí
  
      // Ejemplo de respuesta exitosa
      res.status(200).json({ message: 'Datos de los miembros del bufete enviados al sistema de administración correctamente' });
    } catch (error) {
      console.error('Error al enviar los datos de los miembros del bufete al sistema de administración:', error);
      res.status(500).json({ error: 'Ocurrió un error al enviar los datos al sistema de administración' });
    }
  };
  
