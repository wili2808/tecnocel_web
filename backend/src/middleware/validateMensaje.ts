import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import logger from '../services/loggerService.js';

/**
 * Middleware para manejar errores de validación
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Errores de validación en mensajes:', {
      errors: errors.array(),
      path: req.path
    });

    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors: errors.array()
    });
  }
  next();
};

/**
 * Validaciones para crear un mensaje de contacto
 */
export const validateCreateMensaje = [
  body('nombre')
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 3, max: 100 }).withMessage('El nombre debe tener entre 3 y 100 caracteres'),
  
  body('email')
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('El formato de email no es válido'),
  
  body('telefono')
    .optional()
    .isLength({ max: 20 }).withMessage('El teléfono no puede exceder 20 caracteres'),
  
  body('asunto')
    .notEmpty().withMessage('El asunto es requerido')
    .isLength({ min: 3, max: 100 }).withMessage('El asunto debe tener entre 3 y 100 caracteres'),
  
  body('mensaje')
    .notEmpty().withMessage('El mensaje es requerido')
    .isLength({ min: 10 }).withMessage('El mensaje debe tener al menos 10 caracteres'),
  
  handleValidationErrors
];

/**
 * Validaciones para actualizar estado de mensaje
 */
export const validateUpdateMensajeStatus = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID inválido'),
  
  body('leido')
    .isBoolean().withMessage('El campo leido debe ser booleano'),
  
  handleValidationErrors
];
