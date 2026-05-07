import { Router } from 'express';
import MensajeController from '../controllers/MensajeController.js';
import { verificarToken, verificarPermiso } from '../middleware/authMiddleware.js';
import { validateCreateMensaje, validateUpdateMensajeStatus } from '../middleware/validateMensaje.js';

const router = Router();

/**
 * @swagger
 * /mensajes:
 *   post:
 *     summary: Enviar un mensaje de contacto
 *     tags: [Mensajes]
 */
router.post('/', validateCreateMensaje, MensajeController.createMensaje);

// --- Rutas protegidas ---

router.use(verificarToken);

/**
 * @swagger
 * /mensajes:
 *   get:
 *     summary: Listar mensajes de contacto
 *     tags: [Mensajes]
 */
router.get('/', verificarPermiso('ver_mensajes'), MensajeController.getMensajes);

/**
 * @swagger
 * /mensajes/{id}:
 *   get:
 *     summary: Obtener detalle de un mensaje
 *     tags: [Mensajes]
 */
router.get('/:id', verificarPermiso('ver_mensajes'), MensajeController.getMensajeById);

/**
 * @swagger
 * /mensajes/{id}/status:
 *   patch:
 *     summary: Marcar mensaje como leído/no leído
 *     tags: [Mensajes]
 */
router.patch('/:id/status', verificarPermiso('gestionar_mensajes'), validateUpdateMensajeStatus, MensajeController.updateStatus);

/**
 * @swagger
 * /mensajes/{id}:
 *   delete:
 *     summary: Eliminar un mensaje
 *     tags: [Mensajes]
 */
router.delete('/:id', verificarPermiso('gestionar_mensajes'), MensajeController.deleteMensaje);

export default router;
