/**
 * @file Middleware de validación para operaciones de usuarios y clientes del sistema
 *
 * Proporciona validación completa de datos para operaciones administrativas:
 * - Validación de creación de usuarios del sistema (admin/empleado)
 * - Validación de actualización de usuarios del sistema
 * - Validación de actualización de clientes web
 * - Manejo centralizado de errores de validación
 *
 * Todos los middleware usan express-validator para validación robusta y
 * logging estructurado con Winston para auditoría de operaciones.
 *
 * @module validateUsuario
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
 *
 * @example
 * // Usar al final de arrays de validación
 * export const validateCrearUsuario = [
 *   body('nombres').notEmpty(),
 *   body('email').isEmail(),
 *   handleValidationErrors  // <-- Maneja los errores
 * ];
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Errores de validación en operación de usuario/cliente:', {
      errors: errors.array(),
      path: req.path,
      method: req.method,
      body: req.body,
      params: req.params,
      usuario_id: (req as any).usuario?.id_usuario
    });

    return res.status(400).json({
      mensaje: 'Datos de entrada inválidos',
      errores: errors.array()
    });
  }
  next();
};

/**
 * Validaciones para crear un nuevo usuario del sistema
 *
 * Valida los datos de entrada al crear un usuario (admin o empleado):
 * - nombres: requerido, no vacío
 * - email: requerido, formato de email válido
 * - password: requerido, mínimo 6 caracteres
 * - id_rol: requerido, debe ser un número entero (1=admin, 2=empleado)
 *
 * @constant
 *
 * @example
 * router.post('/admin/usuarios',
 *   verificarToken,
 *   verificarRol([1]),
 *   validateCrearUsuario,
 *   UsuarioAdminController.crearUsuario
 * );
 */
export const validateCrearUsuario = [
  body('nombres')
    .notEmpty()
    .withMessage('El nombre es requerido')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),

  body('email')
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail()
    .trim(),

  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .isLength({ max: 100 })
    .withMessage('La contraseña no puede exceder 100 caracteres'),

  body('id_rol')
    .isInt({ min: 1 })
    .withMessage('El rol es requerido y debe ser un número válido'),

  handleValidationErrors
];

/**
 * Validaciones para actualizar un usuario del sistema existente
 *
 * Valida los datos de entrada al actualizar un usuario (admin o empleado).
 * Todos los campos son opcionales, pero si se proporcionan deben ser válidos:
 * - nombres: opcional, si se proporciona no puede estar vacío
 * - email: opcional, si se proporciona debe ser formato válido
 * - password: opcional, si se proporciona mínimo 6 caracteres
 * - id_rol: opcional, si se proporciona debe ser entero válido
 * - id (param): requerido en la URL, debe ser entero positivo
 *
 * @constant
 *
 * @example
 * router.put('/admin/usuarios/:id',
 *   verificarToken,
 *   verificarRol([1, 2]),
 *   validateActualizarUsuario,
 *   UsuarioAdminController.actualizarUsuario
 * );
 */
export const validateActualizarUsuario = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID del usuario debe ser un número entero positivo'),

  body('nombres')
    .optional()
    .notEmpty()
    .withMessage('El nombre no puede estar vacío')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),

  body('email')
    .optional()
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail()
    .trim(),

  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .isLength({ max: 100 })
    .withMessage('La contraseña no puede exceder 100 caracteres'),

  body('id_rol')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El rol debe ser un número válido'),

  handleValidationErrors
];

/**
 * Validaciones para actualizar un cliente web desde el panel administrativo
 *
 * Valida los datos de entrada al actualizar información de un cliente.
 * Todos los campos son opcionales, pero si se proporcionan deben ser válidos:
 * - nombre_cliente: opcional, no vacío si se proporciona
 * - apellido_cliente: opcional, no vacío si se proporciona
 * - celular_cliente: opcional, no vacío si se proporciona
 * - nit_ci_cliente: opcional, no vacío si se proporciona
 * - is_web_enabled: opcional, debe ser booleano (habilitar/deshabilitar acceso web)
 * - email_verified: opcional, debe ser booleano (marcar email como verificado)
 * - id (param): requerido en la URL, debe ser entero positivo
 *
 * @constant
 *
 * @example
 * router.put('/admin/clientes/:id',
 *   verificarToken,
 *   verificarRol([1, 2]),
 *   validateActualizarCliente,
 *   UsuarioAdminController.actualizarCliente
 * );
 */
export const validateActualizarCliente = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID del cliente debe ser un número entero positivo'),

  body('nombre_cliente')
    .optional()
    .notEmpty()
    .withMessage('El nombre del cliente no puede estar vacío')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),

  body('apellido_cliente')
    .optional()
    .notEmpty()
    .withMessage('El apellido del cliente no puede estar vacío')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El apellido debe tener entre 2 y 100 caracteres'),

  body('celular_cliente')
    .optional()
    .notEmpty()
    .withMessage('El celular del cliente no puede estar vacío')
    .trim()
    .isLength({ min: 8, max: 15 })
    .withMessage('El celular debe tener entre 8 y 15 caracteres'),

  body('nit_ci_cliente')
    .optional()
    .notEmpty()
    .withMessage('El NIT/CI del cliente no puede estar vacío')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('El NIT/CI debe tener entre 1 y 50 caracteres'),

  body('is_web_enabled')
    .optional()
    .isBoolean()
    .withMessage('is_web_enabled debe ser un valor booleano (true/false)'),

  body('email_verified')
    .optional()
    .isBoolean()
    .withMessage('email_verified debe ser un valor booleano (true/false)'),

  handleValidationErrors
];
