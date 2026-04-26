import { Router } from 'express';
import NotificacionController from '../controllers/NotificacionController.js';
import { verificarTokenCliente } from '../middleware/authMiddleware.js';

const router = Router();

// Todas las rutas requieren autenticación del cliente
router.use(verificarTokenCliente);

/**
 * @swagger
 * /notificaciones:
 *   get:
 *     summary: Obtener notificaciones
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuthCliente: []
 *     responses:
 *       200:
 *         description: Lista de notificaciones
 */
router.get('/', NotificacionController.getNotificaciones);
/**
 * @swagger
 * /notificaciones/no-leidas:
 *   get:
 *     summary: Obtener notificaciones no leídas
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuthCliente: []
 *     responses:
 *       200:
 *         description: Lista de notificaciones no leídas
 */
router.get('/no-leidas', NotificacionController.getNoLeidas);
/**
 * @swagger
 * /notificaciones/leer-todas:
 *   put:
 *     summary: Marcar todas como leídas
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuthCliente: []
 *     responses:
 *       200:
 *         description: Notificaciones marcadas como leídas
 */
router.put('/leer-todas', NotificacionController.marcarTodasLeidas);
/**
 * @swagger
 * /notificaciones/eliminar-todas:
 *   delete:
 *     summary: Eliminar todas las notificaciones
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuthCliente: []
 *     responses:
 *       200:
 *         description: Notificaciones eliminadas
 */
router.delete('/eliminar-todas', NotificacionController.eliminarTodas);
/**
 * @swagger
 * /notificaciones/{id}/leer:
 *   put:
 *     summary: Marcar notificación como leída
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuthCliente: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notificación marcada como leída
 */
router.put('/:id/leer', NotificacionController.marcarLeida);
/**
 * @swagger
 * /notificaciones/{id}:
 *   delete:
 *     summary: Eliminar notificación
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuthCliente: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Notificación eliminada
 */
router.delete('/:id', NotificacionController.eliminarNotificacion);

export default router;
