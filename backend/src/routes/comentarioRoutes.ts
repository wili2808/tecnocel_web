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
router.get(
  '/producto/:id_producto',
  validateObtenerComentarios,
  (req: Request, res: Response) => comentarioController.obtenerComentariosProducto(req, res)
);

// Obtener estadísticas de comentarios de un producto
router.get(
  '/producto/:id_producto/estadisticas',
  validateProductIdParam,
  (req: Request, res: Response) => comentarioController.obtenerEstadisticasProducto(req, res)
);

// --- RUTAS PROTEGIDAS ---

// Crear nuevo comentario
router.post(
  '/',
  verificarTokenCliente,
  validateCrearComentario,
  (req: Request, res: Response) => comentarioController.crearComentario(req, res)
);

// Actualizar comentario
router.put(
  '/:id_comentario',
  verificarTokenCliente,
  validateActualizarComentario,
  (req: Request, res: Response) => comentarioController.actualizarComentario(req, res)
);

// Eliminar comentario (soft delete) - clientes
router.delete(
  '/:id_comentario',
  verificarTokenCliente,
  validateIdParam,
  (req: Request, res: Response) => comentarioController.eliminarComentario(req, res)
);

// Eliminar comentario propio - usuarios del sistema (sin permiso requerido)
router.delete(
  '/:id_comentario/propio',
  verificarToken,
  validateIdParam,
  (req: Request, res: Response) => comentarioController.eliminarComentarioPropio(req, res)
);

// Admin elimina cualquier comentario
router.delete(
  '/:id_comentario/admin',
  verificarToken,
  verificarPermiso('eliminar_comentarios'),
  validateIdParam,
  (req: Request, res: Response) => comentarioController.eliminarComentario(req, res)
);

// Eliminar imagen de comentario
router.delete(
  '/:id_comentario/imagenes/:id_imagen',
  verificarTokenCliente,
  validateEliminarImagenComentario,
  (req: Request, res: Response) => comentarioController.eliminarImagenComentario(req, res)
);

// RESPUESTAS A COMENTARIOS

// Cliente responde un comentario
router.post(
  '/:id_comentario/respuestas/cliente',
  verificarTokenCliente,
  validateCrearRespuesta,
  (req: Request, res: Response) => comentarioController.crearRespuestaCliente(req, res)
);

// Admin/empleado responde con respuesta oficial
router.post(
  '/:id_comentario/respuestas/admin',
  verificarToken,
  verificarPermiso('responder_comentarios'),
  validateCrearRespuesta,
  (req: Request, res: Response) => comentarioController.crearRespuestaAdmin(req, res)
);

// Eliminar propia respuesta (cliente)
router.delete(
  '/respuestas/:id_respuesta',
  verificarTokenCliente,
  validateRespuestaIdParam,
  (req: Request, res: Response) => comentarioController.eliminarRespuesta(req, res)
);

// System user elimina su propia respuesta (sin permiso requerido si es owner)
router.delete(
  '/respuestas/:id_respuesta/propia',
  verificarToken,
  validateRespuestaIdParam,
  (req: Request, res: Response) => comentarioController.eliminarRespuestaPropia(req, res)
);

// MODERACIÓN (solo admins/empleados del sistema - requieren permiso)

// Ocultar o restaurar un comentario
router.patch(
  '/:id_comentario/moderar',
  verificarToken,
  verificarPermiso('moderar_comentarios'),
  validateModerarComentario,
  (req: Request, res: Response) => comentarioController.moderarComentario(req, res)
);

// Moderar una respuesta
router.patch(
  '/respuestas/:id_respuesta/moderar',
  verificarToken,
  verificarPermiso('moderar_comentarios'),
  validateModerarRespuesta,
  (req: Request, res: Response) => comentarioController.moderarRespuesta(req, res)
);

// Admin elimina cualquier respuesta
router.delete(
  '/respuestas/:id_respuesta/admin',
  verificarToken,
  verificarPermiso('eliminar_comentarios'),
  validateRespuestaIdParam,
  (req: Request, _res: Response, next: NextFunction) => { req.body.estado = 'eliminado'; next(); },
  (req: Request, res: Response) => comentarioController.moderarRespuesta(req, res)
);

// Listar comentarios para administración
router.get(
  '/lista/admin',
  verificarToken,
  verificarPermiso('moderar_comentarios'),
  (req: Request, res: Response) => comentarioController.listarComentariosAdmin(req, res)
);

export default router;