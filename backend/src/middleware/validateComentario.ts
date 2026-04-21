import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';

// Middleware para manejar errores de validación
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
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
export const validateCrearComentario = [
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
export const validateActualizarComentario = [
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
export const validateObtenerComentarios = [
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
export const validateIdParam = [
  param('id_comentario')
    .isInt({ min: 1 })
    .withMessage('El ID del comentario debe ser un número entero positivo'),
  handleValidationErrors
];

// Validaciones para eliminar imagen de comentario
export const validateEliminarImagenComentario = [
  param('id_comentario')
    .isInt({ min: 1 })
    .withMessage('El ID del comentario debe ser un número entero positivo'),
  param('id_imagen')
    .isInt({ min: 1 })
    .withMessage('El ID de la imagen debe ser un número entero positivo'),
  handleValidationErrors
];

export const validateProductIdParam = [
  param('id_producto')
    .isInt({ min: 1 })
    .withMessage('El ID del producto debe ser un número entero positivo'),
  handleValidationErrors
];

export const validateCrearRespuesta = [
  param('id_comentario')
    .isInt({ min: 1 })
    .withMessage('ID de comentario inválido'),
  body('contenido')
    .isLength({ min: 1, max: 1000 })
    .withMessage('El contenido debe tener entre 1 y 1000 caracteres')
    .trim(),
  handleValidationErrors
];

export const validateRespuestaIdParam = [
  param('id_respuesta')
    .isInt({ min: 1 })
    .withMessage('ID de respuesta inválido'),
  handleValidationErrors
];

export const validateModerarComentario = [
  param('id_comentario')
    .isInt({ min: 1 })
    .withMessage('ID de comentario inválido'),
  body('estado')
    .isIn(['activo', 'oculto', 'eliminado'])
    .withMessage('Estado inválido. Valores permitidos: activo, oculto, eliminado'),
  handleValidationErrors
];

export const validateModerarRespuesta = [
  param('id_respuesta')
    .isInt({ min: 1 })
    .withMessage('ID de respuesta inválido'),
  body('estado')
    .isIn(['activo', 'oculto', 'eliminado'])
    .withMessage('Estado inválido. Valores permitidos: activo, oculto, eliminado'),
  handleValidationErrors
];
