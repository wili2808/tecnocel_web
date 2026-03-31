import { Router } from 'express';
import { EnvioController } from '../controllers/EnvioController.js';
import { verificarToken, verificarPermiso } from '../middleware/authMiddleware.js';

const router = Router();

router.use(verificarToken);
router.use(verificarPermiso('ver_envios'));

// Rutas de solo lectura - requieren solo ver_envios
router.get('/admin', EnvioController.listarEnvios.bind(EnvioController));
router.get('/admin/:id_envio', EnvioController.obtenerDetalle.bind(EnvioController));

// Rutas de gestión - requieren gestionar_envios
router.patch('/admin/:id_envio/estado', verificarPermiso('gestionar_envios'), EnvioController.actualizarEstado.bind(EnvioController));

export default router;
