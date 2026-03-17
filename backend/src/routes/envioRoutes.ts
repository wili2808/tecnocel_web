import { Router } from 'express';
import { EnvioController } from '../controllers/EnvioController.js';
import { verificarToken, verificarRol } from '../middleware/authMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(verificarToken);
router.use(verificarRol([ROLES.ADMIN, ROLES.GERENTE, ROLES.VENDEDOR]));

router.get('/admin', EnvioController.listarEnvios.bind(EnvioController));
router.get('/admin/:id_envio', EnvioController.obtenerDetalle.bind(EnvioController));
router.patch('/admin/:id_envio/estado', EnvioController.actualizarEstado.bind(EnvioController));

export default router;
