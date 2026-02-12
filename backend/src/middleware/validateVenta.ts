/**
 * @file Middleware de validación para operaciones de ventas
 *
 * Proporciona validación de parámetros y middleware de seguridad para consultas de ventas:
 * - Validación de parámetros de paginación
 * - Validación de IDs de venta
 * - Logging de operaciones
 * - Rate limiting específico para ventas
 *
 * @module validateVenta
 */

import { Request, Response, NextFunction } from 'express';
import { param, query, validationResult } from 'express-validator';
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
    logger.warn('Errores de validación en ventas:', {
      errors: errors.array(),
      path: req.path,
      method: req.method,
      params: req.params,
      query: req.query,
      cliente_id: req.usuario?.id
    });

    return res.status(400).json({
      mensaje: 'Datos de entrada inválidos',
      errores: errors.array()
    });
  }
  next();
};

/**
 * Validaciones para obtener historial de ventas
 *
 * Valida los parámetros de consulta (query params) para paginación:
 * - limit: entre 1 y 50 (default: 10)
 * - offset: entero no negativo (default: 0)
 *
 * @constant
 * @type {ValidationChain[]}
 *
 * @example
 * router.get('/ventas/historial',
 *   verificarTokenCliente,
 *   validateObtenerHistorial,
 *   VentaController.obtenerHistorialCliente
 * );
 */
export const validateObtenerHistorial = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('El límite debe ser un número entre 1 y 50')
    .toInt(),

  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El offset debe ser un número entero no negativo')
    .toInt(),

  handleValidationErrors
];

/**
 * Validaciones para obtener detalle de una venta
 *
 * Valida que el parámetro id_venta sea un entero positivo válido.
 *
 * @constant
 * @type {ValidationChain[]}
 *
 * @example
 * router.get('/ventas/:id_venta',
 *   verificarTokenCliente,
 *   validateObtenerDetalle,
 *   VentaController.obtenerDetalle
 * );
 */
export const validateObtenerDetalle = [
  param('id_venta')
    .isInt({ min: 1 })
    .withMessage('El ID de venta debe ser un número entero positivo')
    .toInt(),

  handleValidationErrors
];

/**
 * Middleware de logging para operaciones de ventas
 *
 * Registra el inicio de operaciones de consulta de ventas con
 * información contextual del cliente y operación realizada.
 *
 * @param operacion - Nombre descriptivo de la operación (ej: 'obtener_historial', 'obtener_detalle')
 * @returns Middleware function que logea la operación
 *
 * @example
 * router.get('/ventas/historial',
 *   logVentaOperation('obtener_historial'),
 *   VentaController.obtenerHistorialCliente
 * );
 */
export const logVentaOperation = (operacion: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    logger.debug(`Iniciando operación de venta: ${operacion}`, {
      operacion,
      cliente_id: req.usuario?.id,
      path: req.path,
      method: req.method,
      params: req.params,
      query: req.query
    });
    next();
  };
};

/**
 * Store en memoria para rate limiting de consultas de ventas
 *
 * Estructura: Map<clienteKey, { requests: number, windowStart: number }>
 * - clienteKey: `${ip}-${id_cliente}`
 * - requests: número de requests en la ventana actual
 * - windowStart: timestamp del inicio de la ventana actual
 */
const rateLimitStore = new Map<string, { requests: number; windowStart: number }>();

/**
 * Rate limiter manual para consultas de ventas
 *
 * Limita la frecuencia de consultas al historial de ventas para prevenir
 * abuso y garantizar disponibilidad del servicio.
 *
 * Configuración:
 * - Ventana de tiempo: 1 minuto (60000ms)
 * - Máximo de requests: 20 por cliente
 * - Identificación por: IP + id_cliente
 *
 * Implementación manual sin dependencias externas, siguiendo
 * el patrón del proyecto en validateCarrito.ts
 *
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction
 * @returns 429 si se excede el límite
 *
 * @example
 * router.use(ventasRateLimit);
 */
export const ventasRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const WINDOW_MS = 60 * 1000; // 1 minuto
  const MAX_REQUESTS = 20;

  const clienteId = req.usuario?.id || 'anonymous';
  const clienteKey = `${req.ip}-${clienteId}`;
  const now = Date.now();

  // Obtener o crear entrada para el cliente
  const clienteData = rateLimitStore.get(clienteKey) || {
    requests: 0,
    windowStart: now
  };

  // Verificar si la ventana de tiempo ha expirado
  if (now - clienteData.windowStart > WINDOW_MS) {
    // Nueva ventana de tiempo
    clienteData.requests = 1;
    clienteData.windowStart = now;
  } else {
    // Dentro de la ventana actual
    clienteData.requests++;
  }

  // Actualizar store
  rateLimitStore.set(clienteKey, clienteData);

  // Verificar límite
  if (clienteData.requests > MAX_REQUESTS) {
    logger.warn('Rate limit excedido para consultas de ventas', {
      ip: req.ip,
      cliente_id: clienteId,
      path: req.path,
      requests: clienteData.requests,
      limit: MAX_REQUESTS
    });

    return res.status(429).json({
      mensaje: 'Demasiadas consultas de ventas. Por favor, intente nuevamente en un momento.',
      retry_after: 60 // segundos
    });
  }

  // Limpieza periódica del store (cada 1000 entradas)
  if (rateLimitStore.size > 1000) {
    const entries = Array.from(rateLimitStore.entries());
    entries.forEach(([key, data]) => {
      if (now - data.windowStart > WINDOW_MS * 2) {
        rateLimitStore.delete(key);
      }
    });
  }

  next();
};
