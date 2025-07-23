import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import logger from '../utils/logger.js';

/**
 * Middleware para manejar errores de validación
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Errores de validación en carrito:', {
      errors: errors.array(),
      path: req.path,
      method: req.method,
      body: req.body,
      params: req.params,
      cliente_id: req.usuario?.id_cliente
    });
    
    return res.status(400).json({
      mensaje: 'Datos de entrada inválidos',
      errores: errors.array()
    });
  }
  next();
};

/**
 * Validaciones para agregar items al carrito
 */
export const validateAgregarItem = [
  body('id_producto')
    .isInt({ min: 1 })
    .withMessage('El ID del producto debe ser un número entero positivo'),
  
  body('cantidad')
    .isInt({ min: 1, max: 999 })
    .withMessage('La cantidad debe ser un número entre 1 y 999'),
  
  body('detalles_personalizacion')
    .optional()
    .isObject()
    .withMessage('Los detalles de personalización deben ser un objeto válido'),
  
  handleValidationErrors
];

/**
 * Validaciones para actualizar cantidad de item
 */
export const validateActualizarCantidad = [
  param('id_item')
    .isInt({ min: 1 })
    .withMessage('El ID del item debe ser un número entero positivo'),
  
  body('cantidad')
    .isInt({ min: 1, max: 999 })
    .withMessage('La cantidad debe ser un número entre 1 y 999'),
  
  handleValidationErrors
];

/**
 * Validaciones para eliminar item del carrito
 */
export const validateEliminarItem = [
  param('id_item')
    .isInt({ min: 1 })
    .withMessage('El ID del item debe ser un número entero positivo'),
  
  handleValidationErrors
];

/**
 * Validaciones para confirmar compra
 */
export const validateConfirmarCompra = [
  body('observaciones')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Las observaciones deben ser texto con máximo 500 caracteres'),
  
  body('moneda')
    .optional()
    .isIn(['BOB', 'USD', 'EUR'])
    .withMessage('La moneda debe ser BOB, USD o EUR'),
  
  body('metodo_pago')
    .optional()
    .isIn(['efectivo', 'tarjeta', 'transferencia', 'qr'])
    .withMessage('Método de pago inválido'),
  
  handleValidationErrors
];

/**
 * Validaciones para obtener historial de carritos
 */
export const validateObtenerHistorial = [
  query('estado')
    .optional()
    .isIn(['activo', 'completado', 'abandonado'])
    .withMessage('Estado inválido. Debe ser: activo, completado o abandonado'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un número entre 1 y 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El offset debe ser un número mayor o igual a 0'),
  
  query('fecha_desde')
    .optional()
    .isISO8601()
    .withMessage('Fecha desde debe tener formato ISO8601'),
  
  query('fecha_hasta')
    .optional()
    .isISO8601()
    .withMessage('Fecha hasta debe tener formato ISO8601'),
  
  handleValidationErrors
];

/**
 * Middleware para verificar límites de carrito
 */
export const verificarLimitesCarrito = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id_cliente = req.usuario?.id_cliente;
    
    if (!id_cliente) {
      return res.status(401).json({ mensaje: 'Cliente no autenticado' });
    }

    // Aquí puedes agregar lógicas como:
    // - Límite máximo de items por carrito (ej: 50 items)
    // - Límite máximo de valor del carrito
    // - Verificar si el cliente tiene carritos abandonados excesivos
    
    const MAX_ITEMS_POR_CARRITO = 50;
    const { cantidad } = req.body;
    
    if (cantidad && cantidad > MAX_ITEMS_POR_CARRITO) {
      return res.status(400).json({
        mensaje: `No se pueden agregar más de ${MAX_ITEMS_POR_CARRITO} unidades por producto`,
        limite_maximo: MAX_ITEMS_POR_CARRITO
      });
    }

    next();
  } catch (error) {
    logger.error('Error al verificar límites del carrito:', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      cliente_id: req.usuario?.id_cliente
    });
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

/**
 * Middleware para logging de operaciones del carrito
 */
export const logCarritoOperation = (operacion: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id_cliente = req.usuario?.id_cliente;
    
    logger.info(`Operación de carrito iniciada: ${operacion}`, {
      operacion,
      cliente_id: id_cliente,
      path: req.path,
      method: req.method,
      body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined,
      params: req.params,
      query: req.query,
      user_agent: req.get('User-Agent'),
      ip: req.ip
    });
    
    // Interceptar la respuesta para loggear el resultado
    const originalSend = res.json;
    res.json = function(data: any) {
      logger.info(`Operación de carrito completada: ${operacion}`, {
        operacion,
        cliente_id: id_cliente,
        status_code: res.statusCode,
        success: res.statusCode < 400
      });
      return originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * Middleware para verificar disponibilidad de productos
 */
export const verificarDisponibilidadProducto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id_producto } = req.body;
    
    if (!id_producto) {
      return next(); // Si no hay id_producto, dejar que otras validaciones lo manejen
    }

    // Importación dinámica para evitar dependencias circulares
    const Almacen = (await import('../models/Almacen.js')).default;
    
    const producto = await Almacen.findByPk(id_producto);
    
    if (!producto) {
      return res.status(404).json({
        mensaje: 'Producto no encontrado',
        id_producto
      });
    }

    if (producto.stock === 0) {
      return res.status(400).json({
        mensaje: 'Producto sin stock disponible',
        producto: producto.nombre,
        stock_actual: producto.stock
      });
    }

    // Agregar datos del producto al request para uso posterior
    req.producto = producto;
    next();
    
  } catch (error) {
    logger.error('Error al verificar disponibilidad del producto:', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      id_producto: req.body.id_producto,
      cliente_id: req.usuario?.id_cliente
    });
    return res.status(500).json({ mensaje: 'Error al verificar disponibilidad del producto' });
  }
};

// Almacén temporal para rate limiting (en producción usar Redis)
const rateLimitStore = new Map<string, { count: number; window: number }>();

/**
 * Middleware para rate limiting específico del carrito
 */
export const carritoRateLimit = (req: Request, res: Response, next: NextFunction) => {
  // Implementar rate limiting básico por cliente
  // En producción, usar librerías como express-rate-limit con Redis
  
  const id_cliente = req.usuario?.id_cliente;
  const now = Date.now();
  
  // Ejemplo simple: máximo 10 operaciones por minuto por cliente
  const LIMITE_POR_MINUTO = 10;
  const VENTANA_TIEMPO = 60 * 1000; // 1 minuto
  
  const clienteKey = `carrito_${id_cliente}`;
  const clienteData = rateLimitStore.get(clienteKey) || { count: 0, window: now };
  
  // Resetear ventana si ha pasado el tiempo
  if (now - clienteData.window > VENTANA_TIEMPO) {
    clienteData.count = 0;
    clienteData.window = now;
  }
  
  clienteData.count++;
  rateLimitStore.set(clienteKey, clienteData);
  
  if (clienteData.count > LIMITE_POR_MINUTO) {
    logger.warn('Rate limit excedido para operaciones de carrito', {
      cliente_id: id_cliente,
      operaciones_realizadas: clienteData.count,
      limite: LIMITE_POR_MINUTO
    });
    
    return res.status(429).json({
      mensaje: 'Demasiadas operaciones en el carrito. Intenta nuevamente en un momento.',
      limite_por_minuto: LIMITE_POR_MINUTO,
      reintentar_en: Math.ceil((VENTANA_TIEMPO - (now - clienteData.window)) / 1000)
    });
  }
  
  next();
};

// Extender la interfaz Request para incluir el producto
declare global {
  namespace Express {
    interface Request {
      producto?: any;
    }
  }
} 