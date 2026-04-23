import { Router } from 'express';
import EnvioController from '../controllers/EnvioController.js';
import { verificarToken, verificarPermiso } from '../middleware/authMiddleware.js';

const router = Router();

router.use(verificarToken);
router.use(verificarPermiso('ver_envios'));

// Rutas de solo lectura - requieren solo ver_envios
/**
 * @swagger
 * /envios/admin:
 *   get:
 *     summary: Listar envíos
 *     description: Obtiene la lista de envíos con paginación
 *     tags: [Envios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de envíos obtenida
 *       403:
 *         description: No tiene permisos
 *       500:
 *         description: Error interno del servidor
 */
router.get('/admin', EnvioController.listarEnvios.bind(EnvioController));
/**
 * @swagger
 * /envios/admin/{id_envio}:
 *   get:
 *     summary: Obtener detalle de envío
 *     description: Obtiene los detalles completos de un envío específico
 *     tags: [Envios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_envio
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalle del envío obtenido
 *       403:
 *         description: No tiene permisos
 *       404:
 *         description: Envío no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/admin/:id_envio', EnvioController.obtenerDetalle.bind(EnvioController));

// Rutas de gestión - requieren gestionar_envios
/**
 * @swagger
 * /envios/admin/{id_envio}/estado:
 *   patch:
 *     summary: Actualizar estado de envío
 *     description: Actualiza el estado de un envío
 *     tags: [Envios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_envio
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nuevoEstado
 *             properties:
 *               nuevoEstado:
 *                 type: string
 *               notas:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estado actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos
 *       404:
 *         description: Envío no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/admin/:id_envio/estado', verificarPermiso('gestionar_envios'), EnvioController.actualizarEstado.bind(EnvioController));

export default router;