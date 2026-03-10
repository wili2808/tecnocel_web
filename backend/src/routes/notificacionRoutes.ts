import { Router } from 'express';
import { NotificacionController } from '../controllers/NotificacionController.js';
import { verificarTokenCliente } from '../middleware/authMiddleware.js';

const router = Router();

// Todas las rutas requieren autenticación del cliente
router.use(verificarTokenCliente);

router.get('/', NotificacionController.getNotificaciones);
router.get('/no-leidas', NotificacionController.getNoLeidas);
router.put('/leer-todas', NotificacionController.marcarTodasLeidas);
router.put('/:id/leer', NotificacionController.marcarLeida);
router.delete('/:id', NotificacionController.eliminarNotificacion);

export default router;
