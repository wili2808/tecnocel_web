/**
 * @file Middleware de validación para operaciones de marcas
 *
 * Proporciona validación completa para el sistema de marcas:
 * - Validación de entradas con express-validator
 * - Verificación de formato de campos
 * - Validación de longitudes y tipos de datos
 * - Logging detallado de errores de validación
 *
 * @module validateMarca
 */

import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import logger from '../services/loggerService.js';

/**
 * Middleware para manejar errores de validación de express-validator
 *
 * Intercepta y formatea errores de validación generados por las reglas
 * de express-validator. Si hay errores, retorna 400 con detalles.
 *
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction
 * @returns 400 con array de errores de validación si hay errores
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Errores de validación en marcas:', {
      errors: errors.array(),
      path: req.path,
      method: req.method,
      body: req.body,
      params: req.params,
      usuario_id: req.usuario?.id_usuario
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
 * Validaciones para crear una nueva marca
 *
 * Valida:
 * - nombre_marca: Requerido, string, 2-100 caracteres
 * - logo_marca: Opcional, string, máximo 500 caracteres
 * - descripcion_marca: Opcional, string, máximo 1000 caracteres
 */
export const validateCreateMarca = [
  body('nombre_marca')
    .notEmpty()
    .withMessage('El nombre de la marca es requerido')
    .isString()
    .withMessage('El nombre debe ser un texto')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-Z0-9\s\-áéíóúÁÉÍÓÚñÑ]+$/)
    .withMessage('El nombre solo puede contener letras, números, espacios y guiones'),

  body('logo_marca')
    .optional()
    .isString()
    .withMessage('El logo debe ser un texto')
    .trim()
    .isLength({ max: 500 })
    .withMessage('El logo no puede exceder 500 caracteres'),

  body('descripcion_marca')
    .optional()
    .isString()
    .withMessage('La descripción debe ser un texto')
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder 1000 caracteres'),

  handleValidationErrors
];

/**
 * Validaciones para actualizar una marca existente
 *
 * Valida:
 * - id: Requerido en params, debe ser número entero positivo
 * - nombre_marca: Opcional, string, 2-100 caracteres si se proporciona
 * - logo_marca: Opcional, string, máximo 500 caracteres
 * - descripcion_marca: Opcional, string, máximo 1000 caracteres
 * - activo: Opcional, boolean
 */
export const validateUpdateMarca = [
  param('id')
    .notEmpty()
    .withMessage('El ID de la marca es requerido')
    .isInt({ min: 1 })
    .withMessage('El ID debe ser un número entero positivo'),

  body('nombre_marca')
    .optional()
    .isString()
    .withMessage('El nombre debe ser un texto')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-Z0-9\s\-áéíóúÁÉÍÓÚñÑ]+$/)
    .withMessage('El nombre solo puede contener letras, números, espacios y guiones'),

  body('logo_marca')
    .optional()
    .isString()
    .withMessage('El logo debe ser un texto')
    .trim()
    .isLength({ max: 500 })
    .withMessage('El logo no puede exceder 500 caracteres'),

  body('descripcion_marca')
    .optional()
    .isString()
    .withMessage('La descripción debe ser un texto')
    .trim()
    .isLength({ max: 1000 })
    .withMessage('La descripción no puede exceder 1000 caracteres'),

  body('activo')
    .optional()
    .isBoolean()
    .withMessage('El campo activo debe ser un valor booleano'),

  handleValidationErrors
];

/**
 * Validaciones para eliminar/desactivar una marca
 *
 * Valida:
 * - id: Requerido en params, debe ser número entero positivo
 */
export const validateDeleteMarca = [
  param('id')
    .notEmpty()
    .withMessage('El ID de la marca es requerido')
    .isInt({ min: 1 })
    .withMessage('El ID debe ser un número entero positivo'),

  handleValidationErrors
];

/**
 * Validaciones para obtener una marca por ID
 *
 * Valida:
 * - id: Requerido en params, debe ser número entero positivo
 */
export const validateGetMarcaById = [
  param('id')
    .notEmpty()
    .withMessage('El ID de la marca es requerido')
    .isInt({ min: 1 })
    .withMessage('El ID debe ser un número entero positivo'),

  handleValidationErrors
];
