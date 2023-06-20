const Usuarios = require('../models/bufeteUser')
const Clientes = require('../models/clientes')
const Caso = require('../models/casos');
const Notification = require('../models/notificaciones');
exports.getAllUsers = async (req, res) => {
  try {
      // Obtiene el término de búsqueda de los parámetros de consulta
      const searchTerm = req.query.searchTerm;
      let usuarios;

      // Si el término de búsqueda no está vacío, realiza una búsqueda
      if (searchTerm) {
          usuarios = await Usuarios.find({
              estado: true,
              _id: { $ne: req.user._id }, // Excluye al usuario actual
              $or: [
                  { username: new RegExp(searchTerm, 'i') },
                  { nombres: new RegExp(searchTerm, 'i') },
                  { apellidos: new RegExp(searchTerm, 'i') }
              ]
          });
      } else {
          // Si no hay término de búsqueda, muestra todos los usuarios excepto el actual
          usuarios = await Usuarios.find({ _id: { $ne: req.user._id } }); // Excluye al usuario actual
      }

      // Comprueba si la búsqueda devolvió algún resultado
      if (usuarios.length > 0) {
          // Devuelve solo el HTML para la tabla de usuarios
          return res.render('usuarios-tabla', { usuarios: usuarios });
      } else {
          // Si no hay usuarios, renderiza la tabla con un mensaje de no hay usuarios
          return res.render('usuarios-tabla', { usuarios: null });    
      }
  } catch (error) {
      return res.status(500).json({
          message: '$err',
      });
  }
};
//parte para los usuarios inactivos
exports.getAllInactiveUsers = async (req, res) => {
  try {
      // Obtiene el término de búsqueda de los parámetros de consulta
      const searchTerm = req.query.searchTerm;
      let usuarios;

      // Si el término de búsqueda no está vacío, realiza una búsqueda
      if (searchTerm) {
          usuarios = await Usuarios.find({
              estado: false, // Cambia a false para obtener usuarios inactivos
              _id: { $ne: req.user._id }, // Excluye al usuario actual
              $or: [
                  { username: new RegExp(searchTerm, 'i') },
                  { nombres: new RegExp(searchTerm, 'i') },
                  { apellidos: new RegExp(searchTerm, 'i') }
              ]
          });
      } else {
          // Si no hay término de búsqueda, muestra todos los usuarios inactivos excepto el actual
          usuarios = await Usuarios.find({ estado: false, _id: { $ne: req.user._id } }); // Excluye al usuario actual
      }

      // Comprueba si la búsqueda devolvió algún resultado
      if (usuarios.length > 0) {
          // Devuelve solo el HTML para la tabla de usuarios
          return res.render('usuarios-inactivos-tabla', { usuarios: usuarios });
      } else {
          // Si no hay usuarios, renderiza la tabla con un mensaje de no hay usuarios
          return res.render('usuarios-inactivos-tabla', { usuarios: null });    
      }
  } catch (error) {
      return res.status(500).json({
          message: '$err',
      });
  }
};
exports.getAllInactiveClients = async (req, res) => {
  try {
      // Obtiene el término de búsqueda de los parámetros de consulta
      const searchTerm = req.query.searchTerm;
      let usuarios;

      // Si el término de búsqueda no está vacío, realiza una búsqueda
      if (searchTerm) {
          usuarios = await Clientes.find({
              estado: false, // Cambia a false para obtener usuarios inactivos
              _id: { $ne: req.user._id }, // Excluye al usuario actual
              $or: [
                  { username: new RegExp(searchTerm, 'i') },
                  { nombres: new RegExp(searchTerm, 'i') },
                  { apellidos: new RegExp(searchTerm, 'i') }
              ]
          });
          
      } else {
          // Si no hay término de búsqueda, muestra todos los usuarios inactivos excepto el actual
          usuarios = await Clientes.find({ estado: false }); // Excluye al usuario actual
          
      }

      // Comprueba si la búsqueda devolvió algún resultado
      if (usuarios.length > 0) {
          // Devuelve solo el HTML para la tabla de usuarios
          return res.render('clientes-inactivos-tabla', { usuarios: usuarios });
      } else {
          // Si no hay usuarios, renderiza la tabla con un mensaje de no hay usuarios
          return res.render('clientes-inactivos-tabla', { usuarios: null });    
      }
  } catch (error) {
      return res.status(500).json({
          message: '$err',
      });
  }
};
exports.getAllInactiveclients = async (req, res) => {
  try {
      // Obtiene el término de búsqueda de los parámetros de consulta
      const searchTerm = req.query.searchTerm;
      let usuarios;

      // Si el término de búsqueda no está vacío, realiza una búsqueda
      if (searchTerm) {
          usuarios = await Clientes.find({
              estado: false, // Cambia a false para obtener usuarios inactivos
              _id: { $ne: req.user._id }, // Excluye al usuario actual
              $or: [
                  { username: new RegExp(searchTerm, 'i') },
                  { nombres: new RegExp(searchTerm, 'i') },
                  { apellidos: new RegExp(searchTerm, 'i') }
              ]
          });
      } else {
          // Si no hay término de búsqueda, muestra todos los usuarios inactivos excepto el actual
          usuarios = await Usuarios.find({ estado: false, _id: { $ne: req.user._id } }); // Excluye al usuario actual
      }

      // Comprueba si la búsqueda devolvió algún resultado
      if (usuarios.length > 0) {
          // Devuelve solo el HTML para la tabla de usuarios
          return res.render('clietes-inactivos-tabla', { usuarios: usuarios });
      } else {
          // Si no hay usuarios, renderiza la tabla con un mensaje de no hay usuarios
          return res.render('clientes-inactivos-tabla', { usuarios: null });    
      }
  } catch (error) {
      return res.status(500).json({
          message: '$err',
      });
  }
};

exports.CargarUsuario = async (req, res) => {
  try {
    const usuarioId = req.params.id; // Obtiene el ID del usuario a editar
    const {
      nombres,
      apellidos,
      fechanac,
      username,
      phone,
      direccion,
      ci,
      rol
    } = req.body; // Obtiene los datos actualizados del usuario

    const usuario = await Usuarios.findByIdAndUpdate(
      usuarioId,
      {
        nombres,
        apellidos,
        fechanac,
        username,
        phone,
        direccion,
        ci,
        rol
      },
      { new: true }
    );

    if (!usuario) {
      return res.status(404).json({ message: 'El usuario no fue encontrado' });
    }

    return res.status(200).json({ message: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    return res.status(500).json({ message: 'Error al actualizar el usuario' });
  }
};
exports.getusers = async (req, res) => {
const role = req.user.rol
const user = req.user
if (role !=="Abogado Jefe") {
  return res.status(403).send('ey!!!!!!! lo que estas haciendo esta mal sera mejor que te retires estimad@');
}
  try {
      const usuarios = await Usuarios.find({ estado: true, _id: { $ne: req.user._id } }); // Excluye al usuario actual
      return res.render('usuarios', { usuarios: usuarios, role, estado: true,user });
  } catch (error) {
      return res.status(500).json({
          message: 'ERROR AL OBTENER LOS USUARIOS',
      });
  }
};
//usuarios inactivos
exports.getinactiveusers = async (req, res) => {
  const role = req.user.rol
  const user = req.user
  if (role !=="Abogado Jefe") {
    return res.status(403).send('ey!!!!!!! lo que estas haciendo esta mal sera mejor que te retires estimad@');
  }
    try {
        const usuarios = await Usuarios.find({ estado: false, _id: { $ne: req.user._id } }); // Excluye al usuario actual
        return res.render('usuariosinactivos', { usuarios: usuarios, role, estado: true,user });
    } catch (error) {
        return res.status(500).json({
            message: 'ERROR AL OBTENER LOS USUARIOS',
        });
    }
};

exports.getinactiveClients = async (req, res) => {
  const role = req.user.rol
  const user = req.user
  if (role !=="Abogado Jefe") {
    return res.status(403).send('ey!!!!!!! lo que estas haciendo esta mal sera mejor que te retires estimad@');
  }
    try {
        const usuarios = await Clientes.find({ estado: false}); // Excluye al usuario actual
        return res.render('clientesinactivos', { usuarios: usuarios, role, estado: true,user });
    } catch (error) {
        return res.status(500).json({
            message: 'ERROR AL OBTENER LOS USUARIOS',
        });
    }
};
  
//inicio de clientes
exports.CargarCliente = async (req, res) => {
  try {
    const clienteId = req.params.id; // Obtiene el ID del cliente a editar
    const {
      nombres,
      apellidos,
      fechanac,
      username,
      phone,
      direccion,
      ci,
      rol
    } = req.body; // Obtiene los datos actualizados del cliente

    const cliente = await Clientes.findByIdAndUpdate(
      clienteId,
      {
        nombres,
        apellidos,
        fechanac,
        username,
        phone,
        direccion,
        ci,
        rol
      },
      { new: true }
    );

    if (!cliente) {
      return res.status(404).json({ message: 'El cliente no fue encontrado' });
    }

    return res.status(200).json({ message: 'Cliente actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar el cliente:', error);
    return res.status(500).json({ message: 'Error al actualizar el cliente' });
  }
};
exports.editarCliente = async (req, res) => {
  const clienteId = req.params.id;

  try {
    const cliente = await Clientes.findById(clienteId).select('-_id -image');

    if (!cliente) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    // Preparar los datos del cliente para enviar al cliente
    const datosCliente = {
      nombres: cliente.nombres,
      apellidos: cliente.apellidos,
      username: cliente.username,
      ci: cliente.ci,
      direccion: cliente.direccion,
      
      fechanac: cliente.fechanac.toISOString().split('T')[0],
      phone: cliente.phone,
      email: cliente.email,
    };

    res.json(datosCliente);
  } catch (error) {
    console.error('Error al obtener el cliente:', error);
    res.status(500).json({ message: 'Error al obtener el cliente' });
  }
};

exports.getClientes = async (req, res) => {
  const role = req.user.rol;
  const user = req.user;
  if (role !== "Abogado Jefe") {
    return res.status(403).send('¡Ey! ¡Lo que estás haciendo está mal! Será mejor que te retires, estimad@');
  }
  try {
    const clientes = await Clientes.find({ estado: true, _id: { $ne: req.user._id } }); // Excluye al cliente actual
    return res.render('clientes', { clientes, role, estado: true, user });
  } catch (error) {
    return res.status(500).json({
      message: 'ERROR AL OBTENER LOS CLIENTES',
    });
  }
};

exports.getAllclientes = async (req, res) => {
    try {
        // Obtiene el término de búsqueda de los parámetros de consulta
        const searchTermc = req.query.searchTermc;
        let clientes;

        // Si el término de búsqueda no está vacío, realiza una búsqueda
        if (searchTermc) {
            clientes = await Clientes.find({estado:true,
                $or: [
                    { username: new RegExp(searchTermc, 'i') },
                    { nombres: new RegExp(searchTermc, 'i') },
                    { apellidos: new RegExp(searchTermc, 'i') }
                ]
            });
            
        } else {
            // Si no hay término de búsqueda, muestra todos los usuarios
            clientes = await Clientes.find({});
        }

        // Comprueba si la búsqueda devolvió algún resultado
        if (clientes.length > 0) {
            // Devuelve solo el HTML para la tabla de usuarios
            return res.render('clientes-tabla', { clientes: clientes });
            
        } else {
            // Si no hay usuarios, renderiza la tabla con un mensaje de no hay usuarios
            return res.render('clientes-tabla', { clientes: null });    
            
        }
        
    } catch (error) {
        return res.status(500).json({
            message: 'ERROR EN LA BÚSQUEDA DE USUARIOS $error',
        });
    }
};
//obtener datos del usuario para editar:
// En tu controlador
exports.getdatoseditarUsuario = async (req, res) => {
  const usuarioId = req.params.id;

  try {
    const usuario = await Usuarios.findById(usuarioId).select('-_id -image');

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Preparar los datos del usuario para enviar al cliente
    const datosUsuario = {
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      username: usuario.username,
      ci: usuario.ci,
      direccion: usuario.direccion,
      rol: usuario.rol,
      fechanac: usuario.fechanac.toISOString().split('T')[0],
      phone: usuario.phone,
      email: usuario.email,
      password: '', // No enviar la contraseña al cliente
    };

    res.json(datosUsuario);
  } catch (error) {
    console.error('Error al obtener el usuario:', error);
    res.status(500).json({ message: 'Error al obtener el usuario' });
  }
};


exports.getclientes = async (req, res) => {
  const user = req.user
    try {
      const role=req.user.rol;
      if (role !=="Abogado Jefe") {
        return res.status(403).send('ey!!!!!!! lo que estas haciendo esta mal sera mejor que te retires estimad@');
      }
      const clientes = await Clientes.find({ estado: true });
        return res.render('clientes', { clientes: clientes,role,estado: true,user });
    } catch (error) {
        return res.status(500).json({
            message: 'ERROR AL OBTENER LOS clientes $error',
        });
    }
};
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { rol } = req.body;

    // Encuentra el usuario por su ID
    const usuario = await Usuarios.findById(userId);

    if (!usuario) {
      return res.status(404).json({
        message: 'El usuario no fue encontrado',
      });
    }

    // Actualiza el campo 'rol' del usuario
    usuario.rol = rol;

    // Guarda los cambios en la base de datos
    await usuario.save();

    return res.status(200).json({
      message: 'Usuario actualizado exitosamente',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error al actualizar el usuario',
      error: error.message,
    });
  }
};


//fin de clientes
exports.getIndex = (req, res) => {
    res.render('indexAdmin');
};

exports.getLogin = (req, res) => {
    res.render('login')
}
exports.getRegister = (req, res) => {
  const role=req.user.rol;
  const user=req.user;
    res.render('RegistrarUsuario',{role,user})
}
// En tu controlador
exports.editarUsuario = async (req, res) => {
    const usuarioId = req.params.id;
  
    try {
      const usuario = await Usuarios.findById(usuarioId).select('-_id -image');
  
      if (!usuario) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
  
      // Preparar los datos del usuario para enviar al cliente
      const datosUsuario = {
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        username: usuario.username,
        ci: usuario.ci,
        direccion: usuario.direccion,
        rol: usuario.rol,
        fechanac: usuario.fechanac.toISOString().split('T')[0],
        phone: usuario.phone,
        email: usuario.email,
        password: '', // No enviar la contraseña al cliente
      };
  
      res.json(datosUsuario);
    } catch (error) {
      console.error('Error al obtener el usuario:', error);
      res.status(500).json({ message: 'Error al obtener el usuario' });
    }
};

exports.updateBufeteUser = async (req, res) => {
 
    try {
      const { userId, nombres, apellidos, username, ci, direccion, rol, fechanac, phone, email, password, image } = req.body;
  
      // Encuentra el usuario por su ID
      const usuario = await Usuarios.findById(userId);
  
      if (!usuario) {
        return res.status(404).json({
          message: 'El usuario no fue encontrado',
        });
      }
  
      // Actualiza los campos del usuario
      usuario.nombres = nombres;
      usuario.apellidos = apellidos;
      usuario.username = username;
      usuario.ci = ci;
      usuario.direccion = direccion;
      usuario.rol = rol;
      usuario.fechanac = fechanac;
      usuario.phone = phone;
      usuario.email = email;
      usuario.password = password;
      usuario.image = image;
  
      // Guarda los cambios en la base de datos
      await usuario.save();
  
      return res.status(200).json({
        message: 'Usuario actualizado exitosamente',
      });
    } catch (error) {
      return res.status(500).json({
        message: 'Error al actualizar el usuario',
        error: error.message,
      });
    }
  };

  exports.deleteUser = async (req, res) => {
    try {
      const userId = req.params.id;
  
      // Encuentra el usuario por su ID
      const usuario = await Usuarios.findById(userId);
  
      if (!usuario) {
        return res.status(404).json({
          message: 'El usuario no fue encontrado',
        });
      }
  
      // Comprueba si el usuario es un abogado y si tiene casos asociados
      if (usuario.rol === 'Abogado') {
        const casos = await Caso.find({ abogado: userId });
        
        if (casos.length > 0) {
          // Si el abogado tiene casos asociados, crea notificaciones para sus clientes
          for (const caso of casos) {
            const notification = new Notification({
              user: caso.cliente,
              message: 'Tu abogado ha sido eliminado. Por favor, selecciona un nuevo abogado.',
            });
            await notification.save();
  
            // Desasocia el abogado del caso
            caso.abogado = null;
            await caso.save();

            // Encuentra al cliente asociado al caso y establece su campo seekingReplacementLawyer en true
            const cliente = await Clientes.findById(caso.cliente);

            cliente.seekingReplacementLawyer = true;
            
            await cliente.save();
          }
        }
      }
  
      // Cambia el estado del usuario a inactivo
      usuario.estado = false;
      await usuario.save();
  
      return res.status(200).json({
        message: 'Usuario eliminado exitosamente',
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: 'Error al eliminar el usuario',
        error: error.message,
      });
    }
};

//reactivar usuarios 
exports.reactivateUser = async (req, res) => {
  try {
    // Obtiene el id del usuario desde los parámetros de la ruta
    const userId = req.params.id;

    // Busca el usuario en la base de datos y actualiza su estado a true
    const user = await Usuarios.findByIdAndUpdate(userId, { estado: true });

    // Si el usuario no se encuentra, envía un error
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Si todo sale bien, envía una respuesta exitosa
    res.status(200).json({ message: 'Usuario reactivado exitosamente', user });
  } catch (error) {
    // Si algo sale mal, envía un error
    res.status(500).json({ message: 'Hubo un error al reactivar el usuario', error });
  }
};
exports.reactivateClient = async (req, res) => {
  try {
    // Obtiene el id del cliente desde los parámetros de la ruta
    const userId = req.params.id;
     
    // Busca el cliente en la base de datos y actualiza su estado a true
    const user = await Clientes.findByIdAndUpdate(userId, { estado: true });
    
    // Si el cliente no se encuentra, envía un error
    if (!user) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    // Si todo sale bien, envía una respuesta exitosa
    res.status(200).json({ message: 'Cliente reactivado exitosamente', user });
  } catch (error) {
    // Si algo sale mal, envía un error
    res.status(500).json({ message: 'Hubo un error al reactivar el cliente', error });
  }
};

exports.deleteCliente = async (req, res) => {
  try {
    const userId = req.params.id;

    // Encuentra el usuario por su ID
    const usuario = await Clientes.findById(userId);

    if (!usuario) {
      return res.status(404).json({
        message: 'El cliente no fue encontrado',
      });
    }

    usuario.estado = false;
    await usuario.save();

    return res.status(200).json({
      message: 'Cliente eliminado exitosamente',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Error al eliminar el cliente',
      error: error.message,
    });
  }
};