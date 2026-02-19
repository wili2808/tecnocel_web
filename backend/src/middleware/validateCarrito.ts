/**
 * @file Middleware de validación y seguridad para operaciones del carrito de compras
 *
 * Proporciona validación completa y middleware de seguridad para el sistema de carrito web:
 * - Validación de entradas con express-validator
 * - Verificación de límites de carrito (items, valor total)
 * - Validación de disponibilidad de stock
 * - Rate limiting específico para operaciones de carrito
 * - Logging detallado de operaciones
 *
 * Límites configurados:
 * - Máximo 50 unidades por producto
 * - Máximo 100 items totales en el carrito
 * - Valor máximo de carrito: 50,000 BOB
 * - Rate limit: 30 operaciones/minuto, 10 burst/10seg
 *
 * @module validateCarrito
 */

import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import logger from '../services/loggerService.js';
import CarritoWeb from '../models/CarritoWeb.js';
import CarritoWebItems from '../models/CarritoWebItems.js';
import Almacen from '../models/Almacen.js';

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
 * export const validateAgregarItem = [
 *   body('id_producto').isInt(),
 *   body('cantidad').isInt({ min: 1 }),
 *   handleValidationErrors  // <-- Maneja los errores
 * ];
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
 * Validaciones para agregar items al carrito
 *
 * Valida los datos de entrada al agregar un producto al carrito:
 * - id_producto: entero positivo requerido
 * - cantidad: entre 1 y 999 unidades
 * - detalles_personalizacion: objeto JSON opcional
 *
 * @constant
 * @type {ValidationChain[]}
 *
 * @example
 * router.post('/carrito/items',
 *   verificarTokenCliente,
 *   validateAgregarItem,
 *   agregarItemCarrito
 * );
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
 * Validaciones para actualizar cantidad de un item del carrito
 *
 * Valida parámetros al modificar la cantidad de un producto ya en el carrito:
 * - id_item (param): ID del item en el carrito
 * - cantidad (body): nueva cantidad entre 1 y 999
 *
 * @constant
 *
 * @example
 * router.put('/carrito/items/:id_item',
 *   verificarTokenCliente,
 *   validateActualizarCantidad,
 *   actualizarCantidadItem
 * );
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
 * Validaciones para eliminar un item del carrito
 *
 * Valida que el ID del item sea un entero positivo válido.
 *
 * @constant
 *
 * @example
 * router.delete('/carrito/items/:id_item',
 *   verificarTokenCliente,
 *   validateEliminarItem,
 *   eliminarItemCarrito
 * );
 */
export const validateEliminarItem = [
  param('id_item')
    .isInt({ min: 1 })
    .withMessage('El ID del item debe ser un número entero positivo'),
  
  handleValidationErrors
];

/**
 * Validaciones para confirmar/finalizar compra del carrito
 *
 * Valida datos opcionales al confirmar una compra:
 * - observaciones: texto hasta 500 caracteres
 * - moneda: BOB, USD o EUR
 * - metodo_pago: efectivo, tarjeta, transferencia o qr
 *
 * @constant
 *
 * @example
 * router.post('/carrito/confirmar',
 *   verificarTokenCliente,
 *   validateConfirmarCompra,
 *   confirmarCompra
 * );
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
    .isIn(['ARS', 'USD', 'EUR'])
    .withMessage('La moneda debe ser ARS, USD o EUR'),
  
  body('metodo_pago')
    .optional()
    .isIn(['efectivo', 'tarjeta', 'transferencia', 'qr'])
    .withMessage('Método de pago inválido'),
  
  handleValidationErrors
];

/**
 * Validaciones para obtener historial de carritos
 *
 * Valida query parameters para filtrar y paginar el historial:
 * - estado: activo, completado o abandonado
 * - limit: cantidad de resultados (1-100)
 * - offset: desplazamiento para paginación
 * - fecha_desde/fecha_hasta: filtros de fecha en formato ISO8601
 *
 * @constant
 *
 * @example
 * router.get('/carrito/historial',
 *   verificarTokenCliente,
 *   validateObtenerHistorial,
 *   obtenerHistorialCarritos
 * );
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
 * Middleware para verificar límites de carrito y prevenir abusos
 *
 * Verifica que las operaciones del carrito no excedan límites configurados:
 * - Máximo 50 unidades por producto individual
 * - Máximo 100 items totales en el carrito
 * - Valor total del carrito no mayor a 50,000 BOB
 *
 * Calcula el impacto de la operación actual sobre los límites existentes
 * y rechaza la operación si excede algún límite.
 *
 * @async
 * @param req - Express Request con body {id_producto, cantidad}
 * @param res - Express Response object
 * @param next - Express NextFunction
 * @returns 400 si se excede algún límite con detalles específicos
 * @returns 401 si el cliente no está autenticado
 * @returns 500 si ocurre error en el servidor
 *
 * @example
 * router.post('/carrito/items',
 *   verificarTokenCliente,
 *   validateAgregarItem,
 *   verificarLimitesCarrito,  // <-- Verifica límites antes de agregar
 *   agregarItemCarrito
 * );
 */
export const verificarLimitesCarrito = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id_cliente = req.usuario?.id;
    
    if (!id_cliente) {
      return res.status(401).json({ mensaje: 'Cliente no autenticado' });
    }

    const MAX_ITEMS_POR_CARRITO = 50;
    const MAX_ITEMS_TOTALES = 100;
    const MAX_VALOR_CARRITO = 50000; // En la moneda base (ARS)
    
    const { cantidad, id_producto } = req.body;

    // Verificar límite por producto individual
    if (cantidad && cantidad > MAX_ITEMS_POR_CARRITO) {
      logger.warn('Límite de items por producto excedido', {
        cliente_id: id_cliente,
        cantidad_solicitada: cantidad,
        limite_maximo: MAX_ITEMS_POR_CARRITO,
        producto_id: id_producto
      });
      
      return res.status(400).json({
        mensaje: `No se pueden agregar más de ${MAX_ITEMS_POR_CARRITO} unidades por producto`,
        limite_maximo: MAX_ITEMS_POR_CARRITO,
        cantidad_solicitada: cantidad
      });
    }

    // Verificar límite total de items en el carrito
    const carrito = await CarritoWeb.findOne({
      where: { id_cliente, estado: 'activo' },
      include: [{ model: CarritoWebItems, as: 'items' }]
    });

    if (carrito) {
      // Calcular total de items actual
      const totalItemsActual = (carrito.items || []).reduce((sum: number, item: CarritoWebItems) => sum + item.cantidad, 0);
      const nuevoTotal = totalItemsActual + (cantidad || 0);

      if (nuevoTotal > MAX_ITEMS_TOTALES) {
        logger.warn('Límite total de items en carrito excedido', {
          cliente_id: id_cliente,
          items_actuales: totalItemsActual,
          items_solicitados: cantidad,
          limite_maximo: MAX_ITEMS_TOTALES
        });
        
        return res.status(400).json({
          mensaje: `El carrito no puede exceder ${MAX_ITEMS_TOTALES} items en total`,
          items_actuales: totalItemsActual,
          limite_maximo: MAX_ITEMS_TOTALES,
          items_disponibles: MAX_ITEMS_TOTALES - totalItemsActual
        });
      }

      // Verificar valor total del carrito
      const nuevoProducto = await Almacen.findByPk(id_producto);
      if (nuevoProducto) {
        const valorActual = parseFloat(carrito.total_carrito.toString());
        const valorAdicional = parseFloat(nuevoProducto.precio_venta.toString()) * cantidad;
        const nuevoValorTotal = valorActual + valorAdicional;

        if (nuevoValorTotal > MAX_VALOR_CARRITO) {
          logger.warn('Límite de valor del carrito excedido', {
            cliente_id: id_cliente,
            valor_actual: valorActual,
            valor_adicional: valorAdicional,
            limite_maximo: MAX_VALOR_CARRITO
          });
          
          return res.status(400).json({
            mensaje: `El valor total del carrito no puede exceder ${MAX_VALOR_CARRITO} ARS`,
            valor_actual: valorActual,
            limite_maximo: MAX_VALOR_CARRITO
          });
        }
      }
    }

    next();
  } catch (error) {
    logger.error('Error al verificar límites del carrito:', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      cliente_id: req.usuario?.id,
      body: req.body
    });
    return res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};



/**
 * Factory de middleware para logging detallado de operaciones del carrito
 *
 * Crea un middleware que intercepta respuestas y registra información detallada
 * de operaciones del carrito (agregar, obtener, actualizar, eliminar).
 *
 * Características:
 * - Calcula duración de la operación
 * - Registra metadata relevante (cliente, status, datos)
 * - Previene logs duplicados con otros middleware
 * - Diferentes niveles de log según éxito/fallo
 *
 * @param operacion - Nombre descriptivo de la operación (ej: "agregar_item", "obtener_carrito")
 * @returns Middleware function que intercepta y loguea la operación
 *
 * @example
 * router.post('/carrito/items',
 *   logCarritoOperation('agregar_item'),
 *   verificarTokenCliente,
 *   agregarItemCarrito
 * );
 */
export const logCarritoOperation = (operacion: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id_cliente = req.usuario?.id;
    const startTime = Date.now();
    
    // Interceptar la respuesta para loggear el resultado
    const originalSend = res.json;
    res.json = function(data: any) {
      const duration = Date.now() - startTime;
      const success = res.statusCode < 400;
      
      // Un solo log con toda la información relevante
      const logLevel = success ? 'info' : 'warn';
      const logData = {
        operacion,
        cliente_id: id_cliente,
        status_code: res.statusCode,
        success,
        duration: `${duration}ms`,
        body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined,
        response_data: success ? undefined : data, // Solo loggear datos de respuesta en caso de error
        user_agent: req.get('User-Agent')
      };

      // Evitar log duplicado si ya se registró un warn para este error
      if (!success && res.locals.errorLogged) {
        return originalSend.call(this, data);
      }

      // Construir un mensaje más descriptivo para operaciones exitosas
      let mensaje = `${req.method} ${req.path} | Operación: ${operacion}`;
      
      if (success) {
        switch (operacion) {
          case 'agregar_item':
            mensaje = `Producto agregado exitosamente al carrito | Cliente: ${id_cliente}`;
            break;
          case 'obtener_carrito':
            const responseData = data?.carrito;
            mensaje = `Carrito obtenido exitosamente | Cliente: ${id_cliente} | Items: ${responseData?.cantidad_items || 0} | Total: ${responseData?.total_carrito || '0.00'}`;
            break;
        }
      }
      
      // Marcar para evitar log HTTP duplicado
      res.locals.skipHttpLog = true;
      
      logger[logLevel](mensaje, logData);
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * Middleware para verificar disponibilidad de stock de productos
 *
 * Verifica que el producto exista y tenga stock suficiente antes de agregarlo
 * al carrito. Considera la cantidad ya existente en el carrito del cliente.
 *
 * Validaciones:
 * - Producto existe en la base de datos
 * - Producto tiene stock disponible (stock > 0)
 * - Cantidad total (carrito + nueva) no excede stock disponible
 *
 * Adjunta el producto a req.producto para uso posterior en controladores.
 *
 * @async
 * @param req - Express Request con body {id_producto, cantidad}
 * @param res - Express Response object
 * @param next - Express NextFunction
 * @returns 404 si el producto no existe
 * @returns 400 si no hay stock o la cantidad excede disponibilidad
 * @returns 500 si ocurre error en el servidor
 *
 * @example
 * router.post('/carrito/items',
 *   verificarTokenCliente,
 *   validateAgregarItem,
 *   verificarDisponibilidadProducto,  // <-- Verifica stock
 *   agregarItemCarrito
 * );
 */
export const verificarDisponibilidadProducto = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id_producto, cantidad } = req.body;
    const id_cliente = req.usuario?.id;
    
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

    // Verificar cantidad total considerando lo que ya está en el carrito
    const carrito = await CarritoWeb.findOne({
      where: { id_cliente, estado: 'activo' },
      include: [{
        model: CarritoWebItems,
        as: 'items',
        where: { id_producto },
        required: false
      }]
    });

    const cantidadEnCarrito = carrito?.items?.[0]?.cantidad || 0;
    const cantidadTotal = cantidadEnCarrito + (cantidad || 1);

    if (cantidadTotal > producto.stock) {
      logger.warn('Intento de agregar más items que el stock disponible', {
        cliente_id: id_cliente,
        producto_id: id_producto,
        stock_disponible: producto.stock,
        cantidad_en_carrito: cantidadEnCarrito,
        cantidad_solicitada: cantidad,
        cantidad_total: cantidadTotal
      });
      
      // Marcar que ya se registró el error
      res.locals.errorLogged = true;

      return res.status(400).json({
        mensaje: `No es posible agregar ${cantidad || 1} unidad(es) más. Ya tienes ${cantidadEnCarrito} en el carrito y solo hay ${producto.stock} unidades disponibles.`,
        stock_disponible: producto.stock,
        cantidad_actual_en_carrito: cantidadEnCarrito,
        cantidad_solicitada: cantidad || 1,
        producto: {
          id: producto.id_producto,
          nombre: producto.nombre,
          precio: producto.precio_venta
        }
      });
    }

    // Agregar datos del producto al request para uso posterior
    req.producto = producto;
    next();
    
  } catch (error) {
    logger.error('Error al verificar disponibilidad del producto:', {
      error: error instanceof Error ? error.message : 'Error desconocido',
      id_producto: req.body.id_producto,
      cliente_id: req.usuario?.id
    });
    return res.status(500).json({ mensaje: 'Error al verificar disponibilidad del producto' });
  }
};

/**
 * Almacén en memoria para rate limiting del carrito
 *
 * IMPORTANTE: En producción usar Redis para compartir estado entre instancias
 * del servidor y evitar memory leaks en aplicaciones de alta escala.
 *
 * @private
 */
const rateLimitStore = new Map<string, {
  count: number;
  window: number;
  burstCount: number;
  burstWindow: number;
}>();

/**
 * Middleware de rate limiting específico para operaciones de carrito
 *
 * Protege contra abuso implementando límites de tasa con dos niveles:
 * - Límite principal: 30 operaciones por minuto
 * - Límite burst: 10 operaciones en 10 segundos (picos cortos)
 *
 * Previene:
 * - Ataques de denegación de servicio (DoS)
 * - Scripts automatizados de scraping
 * - Uso excesivo accidental del cliente
 *
 * Auto-limpia entradas antiguas para prevenir memory leaks.
 *
 * @param req - Express Request con req.usuario.id_cliente
 * @param res - Express Response object
 * @param next - Express NextFunction
 * @returns 429 si se exceden los límites con tiempo de espera
 *
 * @example
 * router.post('/carrito/items',
 *   verificarTokenCliente,
 *   carritoRateLimit,  // <-- Protege contra abuso
 *   agregarItemCarrito
 * );
 */
export const carritoRateLimit = (req: Request, res: Response, next: NextFunction) => {
  const id_cliente = req.usuario?.id;
  const now = Date.now();
  
  // Configuración más flexible del rate limiting
  const LIMITE_POR_MINUTO = 30; // Aumentado de 10 a 30
  const LIMITE_BURST = 10; // Permite hasta 10 operaciones en 10 segundos
  const VENTANA_TIEMPO = 60 * 1000; // 1 minuto
  const VENTANA_BURST = 10 * 1000; // 10 segundos para burst
  
  // Diferentes límites según el tipo de operación
  const operacion = req.path.includes('/items') ? 'modificacion' : 'consulta';
  const limiteOperacion = operacion === 'modificacion' ? LIMITE_POR_MINUTO : LIMITE_POR_MINUTO * 2;
  
  const clienteKey = `carrito_${id_cliente}`;
  const clienteData = rateLimitStore.get(clienteKey) || { 
    count: 0, 
    window: now, 
    burstCount: 0,
    burstWindow: now
  };
  
  // Resetear ventana principal si ha pasado el tiempo
  if (now - clienteData.window > VENTANA_TIEMPO) {
    clienteData.count = 0;
    clienteData.window = now;
  }
  
  // Resetear ventana de burst si ha pasado el tiempo
  if (now - clienteData.burstWindow > VENTANA_BURST) {
    clienteData.burstCount = 0;
    clienteData.burstWindow = now;
  }
  
  // Incrementar contadores
  clienteData.count++;
  clienteData.burstCount++;
  rateLimitStore.set(clienteKey, clienteData);
  
  // Verificar límite de burst (más restrictivo para picos cortos)
  if (clienteData.burstCount > LIMITE_BURST) {
    logger.warn('Rate limit de burst excedido para operaciones de carrito', {
      cliente_id: id_cliente,
      operaciones_burst: clienteData.burstCount,
      limite_burst: LIMITE_BURST,
      operacion: operacion
    });
    
    return res.status(429).json({
      mensaje: 'Demasiadas operaciones rápidas. Espera unos segundos antes de continuar.',
      limite_burst: LIMITE_BURST,
      reintentar_en: Math.ceil((VENTANA_BURST - (now - clienteData.burstWindow)) / 1000),
      tipo_operacion: operacion
    });
  }
  
  // Verificar límite principal (más permisivo)
  if (clienteData.count > limiteOperacion) {
    logger.warn('Rate limit principal excedido para operaciones de carrito', {
      cliente_id: id_cliente,
      operaciones_realizadas: clienteData.count,
      limite: limiteOperacion,
      operacion: operacion
    });
    
    return res.status(429).json({
      mensaje: 'Demasiadas operaciones en el carrito. Intenta nuevamente en un momento.',
      limite_por_minuto: limiteOperacion,
      reintentar_en: Math.ceil((VENTANA_TIEMPO - (now - clienteData.window)) / 1000),
      tipo_operacion: operacion
    });
  }
  
  // Limpiar datos antiguos del store para evitar memory leaks
  if (rateLimitStore.size > 1000) {
    const entries = Array.from(rateLimitStore.entries());
    const cutoff = now - (VENTANA_TIEMPO * 2); // Mantener solo datos de las últimas 2 ventanas
    
    for (const [key, data] of entries) {
      if (data.window < cutoff) {
        rateLimitStore.delete(key);
      }
    }
  }
  
  next();
};

/**
 * Middleware de rate limiting diferenciado por tipo de operación
 *
 * Versión avanzada de rate limiting que aplica límites diferentes según
 * el tipo de operación HTTP:
 * - GET (consultas): 60 operaciones/minuto - Más permisivo
 * - POST/PUT/DELETE (modificaciones): 30 operaciones/minuto - Más restrictivo
 *
 * Útil cuando se quiere permitir más consultas frecuentes del estado del carrito
 * pero limitar operaciones que modifican datos.
 *
 * @param req - Express Request con método HTTP y req.usuario.id_cliente
 * @param res - Express Response object
 * @param next - Express NextFunction
 * @returns 429 si se exceden los límites específicos de la operación
 *
 * @example
 * // Aplicar a todas las rutas del carrito
 * router.use('/carrito', carritoRateLimitDiferenciado);
 */
export const carritoRateLimitDiferenciado = (req: Request, res: Response, next: NextFunction) => {
  const id_cliente = req.usuario?.id;
  const now = Date.now();
  
  // Determinar el tipo de operación
  const esConsulta = req.method === 'GET';
  const esModificacion = req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE';
  
  // Límites más permisivos para consultas
  const LIMITE_CONSULTAS_POR_MINUTO = 60; // 60 consultas por minuto
  const LIMITE_MODIFICACIONES_POR_MINUTO = 30; // 30 modificaciones por minuto
  const LIMITE_BURST = 15; // 15 operaciones en 10 segundos
  const VENTANA_TIEMPO = 60 * 1000; // 1 minuto
  const VENTANA_BURST = 10 * 1000; // 10 segundos
  
  const limiteOperacion = esConsulta ? LIMITE_CONSULTAS_POR_MINUTO : LIMITE_MODIFICACIONES_POR_MINUTO;
  const tipoOperacion = esConsulta ? 'consulta' : 'modificacion';
  
  const clienteKey = `carrito_${tipoOperacion}_${id_cliente}`;
  const clienteData = rateLimitStore.get(clienteKey) || { 
    count: 0, 
    window: now, 
    burstCount: 0,
    burstWindow: now
  };
  
  // Resetear ventanas si han pasado
  if (now - clienteData.window > VENTANA_TIEMPO) {
    clienteData.count = 0;
    clienteData.window = now;
  }
  
  if (now - clienteData.burstWindow > VENTANA_BURST) {
    clienteData.burstCount = 0;
    clienteData.burstWindow = now;
  }
  
  // Incrementar contadores
  clienteData.count++;
  clienteData.burstCount++;
  rateLimitStore.set(clienteKey, clienteData);
  
  // Verificar límite de burst
  if (clienteData.burstCount > LIMITE_BURST) {
    logger.warn('Rate limit de burst excedido para operaciones de carrito', {
      cliente_id: id_cliente,
      operaciones_burst: clienteData.burstCount,
      limite_burst: LIMITE_BURST,
      tipo_operacion: tipoOperacion,
      metodo: req.method,
      path: req.path
    });
    
    return res.status(429).json({
      mensaje: 'Demasiadas operaciones rápidas. Espera unos segundos antes de continuar.',
      limite_burst: LIMITE_BURST,
      reintentar_en: Math.ceil((VENTANA_BURST - (now - clienteData.burstWindow)) / 1000),
      tipo_operacion: tipoOperacion
    });
  }
  
  // Verificar límite principal
  if (clienteData.count > limiteOperacion) {
    logger.warn('Rate limit principal excedido para operaciones de carrito', {
      cliente_id: id_cliente,
      operaciones_realizadas: clienteData.count,
      limite: limiteOperacion,
      tipo_operacion: tipoOperacion,
      metodo: req.method,
      path: req.path
    });
    
    return res.status(429).json({
      mensaje: `Demasiadas ${tipoOperacion === 'consulta' ? 'consultas' : 'modificaciones'} en el carrito. Intenta nuevamente en un momento.`,
      limite_por_minuto: limiteOperacion,
      reintentar_en: Math.ceil((VENTANA_TIEMPO - (now - clienteData.window)) / 1000),
      tipo_operacion: tipoOperacion
    });
  }
  
  next();
};

/**
 * Extensión de la interfaz Request de Express para incluir datos del producto
 *
 * Permite que verificarDisponibilidadProducto adjunte información del producto
 * a la request para uso en controladores posteriores, evitando consultas duplicadas.
 */
declare global {
  namespace Express {
    interface Request {
      producto?: any;
    }
  }
} 