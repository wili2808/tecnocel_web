import { Router } from 'express';
import ComentarioController from '../controllers/ComentarioController.js';
import { verificarTokenCliente, verificarToken } from '../middleware/authMiddleware.js';
import { body, param, query } from 'express-validator';
import { validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

const router = Router();
const comentarioController = new ComentarioController();

// Middleware para manejar errores de validación
const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      mensaje: 'Errores de validación',
      errores: errors.array()
    });
  }
  next();
};

// Validaciones para crear comentario
const validateCrearComentario = [
  body('id_producto')
    .isInt({ min: 1 })
    .withMessage('El ID del producto debe ser un número entero positivo'),
  body('id_cliente')
    .isInt({ min: 1 })
    .withMessage('El ID del cliente debe ser un número entero positivo'),
  body('comentario')
    .isLength({ min: 10, max: 2000 })
    .withMessage('El comentario debe tener entre 10 y 2000 caracteres')
    .trim(),
  body('calificacion')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('La calificación debe ser un número entre 1 y 5'),
  body('imagenes')
    .optional()
    .isArray({ max: 5 })
    .withMessage('Máximo 5 imágenes por comentario'),
  body('imagenes.*.nombre_archivo')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('El nombre del archivo debe tener entre 1 y 255 caracteres'),
  body('imagenes.*.ruta_imagen')
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage('La ruta de la imagen debe tener entre 1 y 500 caracteres'),
  body('imagenes.*.tipo_archivo')
    .optional()
    .isIn(['jpg', 'jpeg', 'png', 'webp', 'gif'])
    .withMessage('Tipo de archivo no válido. Debe ser: jpg, jpeg, png, webp o gif'),
  body('imagenes.*.orden')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('El orden debe ser un número entre 1 y 5'),
  handleValidationErrors
];

// Validaciones para actualizar comentario
const validateActualizarComentario = [
  param('id_comentario')
    .isInt({ min: 1 })
    .withMessage('El ID del comentario debe ser un número entero positivo'),
  body('comentario')
    .optional()
    .isLength({ min: 10, max: 2000 })
    .withMessage('El comentario debe tener entre 10 y 2000 caracteres')
    .trim(),
  body('calificacion')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('La calificación debe ser un número entre 1 y 5'),
  handleValidationErrors
];

// Validaciones para obtener comentarios
const validateObtenerComentarios = [
  param('id_producto')
    .isInt({ min: 1 })
    .withMessage('El ID del producto debe ser un número entero positivo'),
  query('limite')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('El límite debe ser un número entre 1 y 50'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El offset debe ser un número mayor o igual a 0'),
  query('orden')
    .optional()
    .isIn(['recientes', 'antiguos', 'mejor_calificacion', 'peor_calificacion'])
    .withMessage('Orden no válido. Debe ser: recientes, antiguos, mejor_calificacion o peor_calificacion'),
  query('incluir_ocultos')
    .optional()
    .isIn(['true', 'false', '1', '0'])
    .withMessage('incluir_ocultos debe ser true o false'),
  handleValidationErrors
];

// Validaciones para parámetros de ID
const validateIdParam = [
  param('id_comentario')
    .isInt({ min: 1 })
    .withMessage('El ID del comentario debe ser un número entero positivo'),
  handleValidationErrors
];

// Validaciones para eliminar imagen de comentario
const validateEliminarImagenComentario = [
  param('id_comentario')
    .isInt({ min: 1 })
    .withMessage('El ID del comentario debe ser un número entero positivo'),
  param('id_imagen')
    .isInt({ min: 1 })
    .withMessage('El ID de la imagen debe ser un número entero positivo'),
  handleValidationErrors
];

const validateProductIdParam = [
  param('id_producto')
    .isInt({ min: 1 })
    .withMessage('El ID del producto debe ser un número entero positivo'),
  handleValidationErrors
];

const validateCrearRespuesta = [
  param('id_comentario')
    .isInt({ min: 1 })
    .withMessage('ID de comentario inválido'),
  body('contenido')
    .isLength({ min: 1, max: 1000 })
    .withMessage('El contenido debe tener entre 1 y 1000 caracteres')
    .trim(),
  handleValidationErrors
];

const validateRespuestaIdParam = [
  param('id_respuesta')
    .isInt({ min: 1 })
    .withMessage('ID de respuesta inválido'),
  handleValidationErrors
];

const validateModerarComentario = [
  param('id_comentario')
    .isInt({ min: 1 })
    .withMessage('ID de comentario inválido'),
  body('estado')
    .isIn(['activo', 'oculto', 'eliminado'])
    .withMessage('Estado inválido. Valores permitidos: activo, oculto, eliminado'),
  handleValidationErrors
];

const validateModerarRespuesta = [
  param('id_respuesta')
    .isInt({ min: 1 })
    .withMessage('ID de respuesta inválido'),
  body('estado')
    .isIn(['activo', 'oculto', 'eliminado'])
    .withMessage('Estado inválido. Valores permitidos: activo, oculto, eliminado'),
  handleValidationErrors
];

// RUTAS PÚBLICAS (sin autenticación)

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

// RUTAS PROTEGIDAS (requieren autenticación)

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

// Eliminar comentario (soft delete)
router.delete(
  '/:id_comentario',
  verificarTokenCliente,
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

// MODERACIÓN (solo admins/empleados del sistema)

// Ocultar o restaurar un comentario
router.patch(
  '/:id_comentario/moderar',
  verificarToken,
  validateModerarComentario,
  (req: Request, res: Response) => comentarioController.moderarComentario(req, res)
);

// Moderar una respuesta
router.patch(
  '/respuestas/:id_respuesta/moderar',
  verificarToken,
  validateModerarRespuesta,
  (req: Request, res: Response) => comentarioController.moderarRespuesta(req, res)
);

// Admin elimina cualquier respuesta
router.delete(
  '/respuestas/:id_respuesta/admin',
  verificarToken,
  validateRespuestaIdParam,
  (req: Request, _res: Response, next: NextFunction) => { req.body.estado = 'eliminado'; next(); },
  (req: Request, res: Response) => comentarioController.moderarRespuesta(req, res)
);

export default router;