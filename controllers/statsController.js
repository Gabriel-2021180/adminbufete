const BufeteUser = require('../models/bufeteUser');
const Caso = require('../models/casos');
const SolicitudAbogado = require('../models/SolicitudAbogado');
const Cita= require('../models/citas');
const Documento= require('../models/documentos');
const Pago = require('../models/Pagos');
const Reunion = require('../models/reuniones');
exports.getUserStats = async (req, res) => {
    try {
        const role=req.user.rol
        const user=req.user
        const userB = await BufeteUser.findById(req.user._id);
        if (!userB) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const casosGanados = await Caso.countDocuments({ abogado: req.user._id, resultado: 'Ganado' });
        const casosPerdidos = await Caso.countDocuments({ abogado: req.user._id, resultado: 'Perdido' });
        const casosMedias = await Caso.countDocuments({ abogado: req.user._id, resultado: 'a medias' });
        const solicitudesRecibidas = await SolicitudAbogado.countDocuments({ abogado: req.user._id });
        const citas = await Cita.countDocuments({ abogado: req.user._id });
        const documentos = await Documento.countDocuments({ estado: true });
        const pagosRecibidos = await Pago.countDocuments({ abogado: req.user._id });
        const reuniones = await Reunion.countDocuments({ usuarios: req.user._id });

        const stats = {
            casosGanados,
            casosPerdidos,
            casosMedias,
            solicitudesRecibidas,
            citas,
            documentos,
            pagosRecibidos,
            reuniones,
        };

        res.render('userStats', { stats,user,role }); // Renderizamos la vista 'userStats' y pasamos las estadísticas
    } catch (error) {
        
        res.status(500).json({ message: 'Error al obtener las estadísticas del usuario', error });
    }
};
exports.getAdminUserStats = async (req, res) => {
    try {
        const role=req.user.rol
        const user=req.user
        const userB = await BufeteUser.findById(req.params.id);
        if (!userB) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const casosGanados = await Caso.countDocuments({ abogado: userB._id, resultado: 'Ganado' });
        const casosPerdidos = await Caso.countDocuments({ abogado: userB._id, resultado: 'Perdido' });
        const casosMedias = await Caso.countDocuments({ abogado: userB._id, resultado: 'a medias' });
        const solicitudesRecibidas = await SolicitudAbogado.countDocuments({ abogado: userB._id });
        const citas = await Cita.countDocuments({ abogado: userB._id });
        const documentos = await Documento.countDocuments({ abogado: userB._id });
        const pagosRecibidos = await Pago.countDocuments({ abogado: userB._id });
        const reuniones = await Reunion.countDocuments({ usuarios: userB._id });

        const stats = {
            casosGanados,
            casosPerdidos,
            casosMedias,
            solicitudesRecibidas,
            citas,
            documentos,
            pagosRecibidos,
            reuniones,
        };

        res.render('useradminStats', { stats, user, role }); 
    } catch (error) {
        
        res.status(500).json({ message: 'Error al obtener las estadísticas del usuario', error });
    }
};

