import { Router } from 'express';
import ComentarioController from '../controllers/ComentarioController.js';
import { verificarTokenCliente, verificarToken, verificarPermiso } from '../middleware/authMiddleware.js';
import { Request, Response, NextFunction } from 'express';
import {
  validateCrearComentario,
  validateActualizarComentario,
  validateObtenerComentarios,
  validateIdParam,
  validateEliminarImagenComentario,
  validateProductIdParam,
  validateCrearRespuesta,
  validateRespuestaIdParam,
  validateModerarComentario,
  validateModerarRespuesta
} from '../middleware/validateComentario.js';

const router = Router();
const comentarioController = new ComentarioController();

// --- RUTAS PÚBLICAS ---

// Obtener comentarios de un producto
/**
 * @swagger
 * /comentarios/producto/{id_producto}:
 *   get:
 *     summary: Obtener comentarios de un producto
 *     description: Obtiene los comentarios de un producto con paginación y ordenamiento
 *     tags: [Comentarios]
 *     parameters:
 *       - in: path
 *         name: id_producto
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Comentarios obtenidos exitosamente
 *       400:
 *         description: ID de producto inválido
 *       500:
 *         description: Error interno del servidor
 */
router.get(
  '/producto/:id_producto',
  validateObtenerComentarios,
  (req: Request, res: Response) => comentarioController.obtenerComentariosProducto(req, res)
);

// Obtener estadísticas de comentarios de un producto
/**
 * @swagger
 * /comentarios/producto/{id_producto}/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de comentarios
 *     description: Obtiene las estadísticas de comentarios (promedio, distribución) de un producto
 *     tags: [Comentarios]
 *     parameters:
 *       - in: path
 *         name: id_producto
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *       400:
 *         description: ID de producto inválido
 *       500:
 *         description: Error interno del servidor
 */
router.get(
  '/producto/:id_producto/estadisticas',
  validateProductIdParam,
  (req: Request, res: Response) => comentarioController.obtenerEstadisticasProducto(req, res)
);

// --- RUTAS PROTEGIDAS ---

// Crear nuevo comentario
/**
 * @swagger
 * /comentarios:
 *   post:
 *     summary: Crear nuevo comentario
 *     description: Crea un comentario para un producto con calificación e imágenes opcionales
 *     tags: [Comentarios]
 *     security:
 *       - bearerAuthCliente: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_producto
 *               - id_cliente
 *               - comentario
 *             properties:
 *               id_producto:
 *                 type: integer
 *               id_cliente:
 *                 type: integer
 *               comentario:
 *                 type: string
 *               calificacion:
 *                 type: integer
 *               imagenes:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Comentario creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Producto o cliente no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post(
  '/',
  verificarTokenCliente,
  validateCrearComentario,
  (req: Request, res: Response) => comentarioController.crearComentario(req, res)
);

// Actualizar comentario
/**
 * @swagger
 * /comentarios/{id_comentario}:
 *   put:
 *     summary: Actualizar comentario
 *     description: Actualiza un comentario existente
 *     tags: [Comentarios]
 *     security:
 *       - bearerAuthCliente: []
 *     parameters:
 *       - in: path
 *         name: id_comentario
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               comentario:
 *                 type: string
 *               calificacion:
 *                 type: integer
 *               imagenes_a_eliminar:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Comentario actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Comentario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put(
  '/:id_comentario',
  verificarTokenCliente,
  validateActualizarComentario,
  (req: Request, res: Response) => comentarioController.actualizarComentario(req, res)
);

// Eliminar comentario (soft delete) - clientes
/**
 * @swagger
 * /comentarios/{id_comentario}:
 *   delete:
 *     summary: Eliminar comentario (cliente)
 *     description: Elimina un comentario (soft delete) creado por el cliente
 *     tags: [Comentarios]
 *     security:
 *       - bearerAuthCliente: []
 *     parameters:
 *       - in: path
 *         name: id_comentario
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Comentario eliminado exitosamente
 *       404:
 *         description: Comentario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete(
  '/:id_comentario',
  verificarTokenCliente,
  validateIdParam,
  (req: Request, res: Response) => comentarioController.eliminarComentario(req, res)
);

// Eliminar comentario propio - usuarios del sistema (sin permiso requerido)
/**
 * @swagger
 * /comentarios/{id_comentario}/propio:
 *   delete:
 *     summary: Eliminar comentario propio (admin/empleado)
 *     description: Permite a usuarios del sistema eliminar sus propios comentarios
 *     tags: [Comentarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_comentario
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Comentario eliminado exitosamente
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: Comentario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete(
  '/:id_comentario/propio',
  verificarToken,
  validateIdParam,
  (req: Request, res: Response) => comentarioController.eliminarComentarioPropio(req, res)
);

// Admin elimina cualquier comentario
/**
 * @swagger
 * /comentarios/{id_comentario}/admin:
 *   delete:
 *     summary: Eliminar cualquier comentario (admin)
 *     description: Permite a un administrador eliminar cualquier comentario
 *     tags: [Comentarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_comentario
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Comentario eliminado exitosamente
 *       404:
 *         description: Comentario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete(
  '/:id_comentario/admin',
  verificarToken,
  verificarPermiso('eliminar_comentarios'),
  validateIdParam,
  (req: Request, res: Response) => comentarioController.eliminarComentario(req, res)
);

// Eliminar imagen de comentario
/**
 * @swagger
 * /comentarios/{id_comentario}/imagenes/{id_imagen}:
 *   delete:
 *     summary: Eliminar imagen de comentario
 *     description: Elimina una imagen específica de un comentario
 *     tags: [Comentarios]
 *     security:
 *       - bearerAuthCliente: []
 *     parameters:
 *       - in: path
 *         name: id_comentario
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: id_imagen
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Imagen eliminada exitosamente
 *       404:
 *         description: Comentario o imagen no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete(
  '/:id_comentario/imagenes/:id_imagen',
  verificarTokenCliente,
  validateEliminarImagenComentario,
  (req: Request, res: Response) => comentarioController.eliminarImagenComentario(req, res)
);

// RESPUESTAS A COMENTARIOS

// Cliente responde un comentario
/**
 * @swagger
 * /comentarios/{id_comentario}/respuestas/cliente:
 *   post:
 *     summary: Cliente responde comentario
 *     description: Permite a un cliente responder a un comentario
 *     tags: [Comentarios]
 *     security:
 *       - bearerAuthCliente: []
 *     parameters:
 *       - in: path
 *         name: id_comentario
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
 *               - contenido
 *             properties:
 *               contenido:
 *                 type: string
 *     responses:
 *       201:
 *         description: Respuesta creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Comentario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post(
  '/:id_comentario/respuestas/cliente',
  verificarTokenCliente,
  validateCrearRespuesta,
  (req: Request, res: Response) => comentarioController.crearRespuestaCliente(req, res)
);

// Admin/empleado responde con respuesta oficial
/**
 * @swagger
 * /comentarios/{id_comentario}/respuestas/admin:
 *   post:
 *     summary: Admin responde comentario
 *     description: Permite a un administrador o empleado responder a un comentario oficialmente
 *     tags: [Comentarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_comentario
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
 *               - contenido
 *             properties:
 *               contenido:
 *                 type: string
 *     responses:
 *       201:
 *         description: Respuesta oficial creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Comentario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post(
  '/:id_comentario/respuestas/admin',
  verificarToken,
  verificarPermiso('responder_comentarios'),
  validateCrearRespuesta,
  (req: Request, res: Response) => comentarioController.crearRespuestaAdmin(req, res)
);

// Eliminar propia respuesta (cliente)
/**
 * @swagger
 * /comentarios/respuestas/{id_respuesta}:
 *   delete:
 *     summary: Eliminar respuesta de cliente
 *     description: Permite a un cliente eliminar su propia respuesta
 *     tags: [Comentarios]
 *     security:
 *       - bearerAuthCliente: []
 *     parameters:
 *       - in: path
 *         name: id_respuesta
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Respuesta eliminada exitosamente
 *       404:
 *         description: Respuesta no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete(
  '/respuestas/:id_respuesta',
  verificarTokenCliente,
  validateRespuestaIdParam,
  (req: Request, res: Response) => comentarioController.eliminarRespuesta(req, res)
);

// System user elimina su propia respuesta (sin permiso requerido si es owner)
/**
 * @swagger
 * /comentarios/respuestas/{id_respuesta}/propia:
 *   delete:
 *     summary: Eliminar respuesta propia (admin/empleado)
 *     description: Permite a un administrador o empleado eliminar su propia respuesta
 *     tags: [Comentarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_respuesta
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Respuesta eliminada exitosamente
 *       404:
 *         description: Respuesta no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete(
  '/respuestas/:id_respuesta/propia',
  verificarToken,
  validateRespuestaIdParam,
  (req: Request, res: Response) => comentarioController.eliminarRespuestaPropia(req, res)
);

// MODERACIÓN (solo admins/empleados del sistema - requieren permiso)

// Ocultar o restaurar un comentario
/**
 * @swagger
 * /comentarios/{id_comentario}/moderar:
 *   patch:
 *     summary: Moderar comentario
 *     description: Permite a un administrador ocultar o restaurar un comentario
 *     tags: [Comentarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_comentario
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
 *               - estado
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [activo, oculto, eliminado]
 *     responses:
 *       200:
 *         description: Comentario moderado exitosamente
 *       404:
 *         description: Comentario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.patch(
  '/:id_comentario/moderar',
  verificarToken,
  verificarPermiso('moderar_comentarios'),
  validateModerarComentario,
  (req: Request, res: Response) => comentarioController.moderarComentario(req, res)
);

// Moderar una respuesta
/**
 * @swagger
 * /comentarios/respuestas/{id_respuesta}/moderar:
 *   patch:
 *     summary: Moderar respuesta
 *     description: Permite a un administrador ocultar o restaurar una respuesta
 *     tags: [Comentarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_respuesta
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
 *               - estado
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [activo, oculto, eliminado]
 *     responses:
 *       200:
 *         description: Respuesta moderada exitosamente
 *       404:
 *         description: Respuesta no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.patch(
  '/respuestas/:id_respuesta/moderar',
  verificarToken,
  verificarPermiso('moderar_comentarios'),
  validateModerarRespuesta,
  (req: Request, res: Response) => comentarioController.moderarRespuesta(req, res)
);

// Admin elimina cualquier respuesta
/**
 * @swagger
 * /comentarios/respuestas/{id_respuesta}/admin:
 *   delete:
 *     summary: Eliminar respuesta (admin)
 *     description: Permite a un administrador eliminar cualquier respuesta
 *     tags: [Comentarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_respuesta
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Respuesta eliminada exitosamente
 *       404:
 *         description: Respuesta no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete(
  '/respuestas/:id_respuesta/admin',
  verificarToken,
  verificarPermiso('eliminar_comentarios'),
  validateRespuestaIdParam,
  (req: Request, _res: Response, next: NextFunction) => { req.body.estado = 'eliminado'; next(); },
  (req: Request, res: Response) => comentarioController.moderarRespuesta(req, res)
);

export default router;