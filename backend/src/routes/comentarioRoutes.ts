import { Router } from 'express';
import ComentarioController from '../controllers/ComentarioController.js';
import { verificarTokenCliente } from '../middleware/authMiddleware.js';
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
  handleValidationErrors
];

// Validaciones para parámetros de ID
const validateIdParam = [
  param('id_comentario')
    .isInt({ min: 1 })
    .withMessage('El ID del comentario debe ser un número entero positivo'),
  handleValidationErrors
];

const validateProductIdParam = [
  param('id_producto')
    .isInt({ min: 1 })
    .withMessage('El ID del producto debe ser un número entero positivo'),
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

// RUTAS ADICIONALES PARA FUTURAS IMPLEMENTACIONES

// Responder a un comentario (solo admin)
// router.post('/:id_comentario/respuesta', verificarTokenAdmin, responderComentario);

// Marcar comentario como verificado (solo admin)
// router.patch('/:id_comentario/verificar', verificarTokenAdmin, verificarComentario);

// Moderar comentario (solo admin)
// router.patch('/:id_comentario/moderar', verificarTokenAdmin, moderarComentario);

export default router;