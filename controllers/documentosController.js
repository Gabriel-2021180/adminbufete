const Documento = require('../models/documentos');
const BufeteUser = require('../models/bufeteUser');
const User = require('../models/clientes');
const Caso = require('../models/casos');
const { Storage } = require('@google-cloud/storage');
const storage = new Storage({ keyFilename: 'googleimage.json' });
const bucketName = 'primerstorage';

// Subir un documento
exports.subirDocumento = async (req, res) => {
  const role=req.user.rol
  const { titulo, casoId } = req.body;

  try {
    
    const archivo = req.file;

    if (!archivo) {
      return res.status(400).json({ error: 'No se subió ningún archivo' });
    }

    const caso = await Caso.findById(casoId).populate('abogado cliente');

    if (!caso) {
      return res.status(404).json({ error: 'Caso no encontrado' });
    }

    const abogado = caso.abogado;
    const cliente = caso.cliente;

    if (!abogado || !cliente) {
      return res.status(404).json({ error: 'Abogado o cliente no encontrado' });
    }

    const correoAbogado = abogado.email;
    const correoCliente = cliente.email;

    const blob = storage.bucket(bucketName).file(archivo.originalname);
    const blobStream = blob.createWriteStream({
      metadata: {
        contentType: archivo.mimetype,
        metadata: {
          abogadoId: abogado._id,
          clienteId: cliente._id,
        },
      },
    });

    blobStream.on('error', (err) => {
      console.error('Error al subir el archivo:', err);
      res.status(500).json({ error: 'Ocurrió un error al subir el archivo' });
    });

    blobStream.on('finish', async () => {
      const documentoUrl = archivo.originalname;

      const documento = new Documento({
        titulo,
        documento: documentoUrl,
        abogadoId: abogado._id,
        clienteId: cliente._id,
        correoAbogado,
        correoCliente,
        caso: casoId,
      });

      documento.fechaupload = new Date();

      await documento.save();

      res.redirect(`/casos/${caso._id}`);
    });

    blobStream.end(archivo.buffer);

  } catch (error) {
    console.error('Error al subir el documento:', error);
    res.status(500).json({ error: 'Ocurrió un error al subir el documento' });
  }
};

// Obtener detalles de un documento
exports.getDocumento = async (req, res) => {
  const casoId = req.params.id;

  try {
    const role= req.user.rol;
    const documentos = await Documento.find({ caso: casoId, estado: true });

    if (!documentos) {
      return res.status(404).json({ error: 'No se encontraron documentos asociados al caso' });
    }

    res.render('caso', { documentos,rol });
  } catch (error) {
    console.error('Error al obtener los documentos del caso:', error);
    res.status(500).json({ error: 'Ocurrió un error al obtener los documentos del caso' });
  }
};


// Borrar un documento (borrado lógico)
exports.borrarDocumento = async (req, res) => {
  const documentoId = req.params.id;

  try {
    const documento = await Documento.findById(documentoId);

    if (!documento) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    documento.estado = false;
    await documento.save();

    res.status(200).json({ message: 'Documento borrado exitosamente' });
  } catch (error) {
    console.error('Error al borrar el documento:', error);
    res.status(500).json({ error: 'Ocurrió un error al borrar el documento' });
  }
};


// Obtener la URL de un documento
exports.getDocumentoUrl = async (req, res) => {
  const { documentoId } = req.params;
  const userId = req.user && req.user._id;

  if (!userId) {
    return res.status(401).json({ error: 'No se proporcionó el usuario autenticado' });
  }

  try {
    const documento = await Documento.findById(documentoId).populate({
      path: 'caso',
      populate: {
        path: 'abogado cliente',
        select: '_id',
      },
    });

    if (!documento) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    const caso = documento.caso;

    if (!caso) {
      return res.status(404).json({ error: 'Caso no encontrado' });
    }

    const abogadoId = caso.abogado._id.toString();
    const clienteId = caso.cliente._id.toString();
    
     
    if (abogadoId !== userId.toString()) {
      return res.status(403).json({ error: 'No tienes permiso para acceder a este documento' });
    }

    const documentoUrl = await storage
      .bucket(bucketName)
      .file(documento.documento)
      .getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000,
      });

    res.json({ url: documentoUrl[0] });
  } catch (error) {
    console.error('Error al obtener la URL del documento:', error);
    res.status(500).json({ error: 'Ocurrió un error al obtener la URL del documento' });
  }
};
