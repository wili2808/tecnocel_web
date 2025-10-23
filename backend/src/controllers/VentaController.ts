import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Venta from '../models/Venta.js';
import CarritoWeb from '../models/CarritoWeb.js';
import CarritoWebItems from '../models/CarritoWebItems.js';
import Almacen from '../models/Almacen.js';
import Cliente from '../models/Cliente.js';
import logger from '../services/loggerService.js';

/**
 * Controlador para gestión de ventas
 *
 * Maneja todas las operaciones relacionadas con ventas confirmadas:
 * - Obtener historial de ventas del cliente
 * - Obtener detalle de una venta específica
 * - Consulta de ventas con sus items
 *
 * Todos los endpoints requieren autenticación de cliente (verificarTokenCliente).
 *
 * @class VentaController
 */
export default class VentaController {

  /**
   * Obtiene el historial de ventas del cliente autenticado
   *
   * Endpoint protegido que retorna todas las ventas confirmadas del cliente
   * con su información completa incluyendo items comprados.
   *
   * Funcionalidades:
   * - Consulta ventas por id_cliente
   * - Include de CarritoWeb → CarritoWebItems → Almacen (producto)
   * - Transforma datos al formato esperado por el frontend
   * - Paginación opcional con limit y offset
   * - Ordenamiento por fecha descendente (más recientes primero)
   *
   * @param req - Express Request con query params y req.usuario.id_cliente
   * @param req.query.limit - Límite de resultados (default: 10, max: 50)
   * @param req.query.offset - Offset para paginación (default: 0)
   * @param res - Express Response object
   * @returns 200 con array de ventas transformadas
   * @returns 401 si el cliente no está autenticado
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * GET /api/ventas/historial?limit=10&offset=0
   * Headers: { "Authorization": "Bearer TOKEN" }
   *
   * Response 200: [
   *   {
   *     id_venta: 1,
   *     numero_venta: "V-00001",
   *     fecha_venta: "2025-10-22T10:30:00.000Z",
   *     total: 1500.00,
   *     estado: "completada",
   *     items: [
   *       {
   *         nombre_producto: "iPhone 13",
   *         cantidad: 2,
   *         precio_unitario: 750.00,
   *         subtotal: 1500.00
   *       }
   *     ]
   *   }
   * ]
   */
  static async obtenerHistorialCliente(req: Request, res: Response) {
    try {
      const id_cliente = req.usuario?.id_cliente;

      if (!id_cliente) {
        return res.status(401).json({ mensaje: 'Cliente no autenticado' });
      }

      // Validar y parsear parámetros de paginación
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
      const offset = parseInt(req.query.offset as string) || 0;

      logger.debug(`Obteniendo historial de ventas - Cliente: ${id_cliente}, Limit: ${limit}, Offset: ${offset}`);

      // Consultar ventas del cliente con sus carritos e items
      const ventas = await Venta.findAll({
        where: { id_cliente },
        include: [
          {
            model: CarritoWeb,
            as: 'carrito',
            include: [
              {
                model: CarritoWebItems,
                as: 'items',
                include: [
                  {
                    model: Almacen,
                    as: 'producto',
                    attributes: ['id_producto', 'nombre', 'descripcion']
                  }
                ]
              }
            ]
          }
        ],
        order: [['fyh_creacion', 'DESC']], // Más recientes primero
        limit,
        offset
      });

      // Transformar datos al formato esperado por el frontend
      const ventasTransformadas = ventas.map(venta => {
        const ventaData = venta.toJSON() as any;

        // Formatear número de venta con padding
        const numeroVentaFormateado = `V-${ventaData.nro_venta.toString().padStart(5, '0')}`;

        // Extraer items del carrito asociado
        const items = ventaData.carrito?.items?.map((item: any) => ({
          nombre_producto: item.producto?.nombre || 'Producto no disponible',
          cantidad: item.cantidad,
          precio_unitario: parseFloat(item.precio_unitario),
          subtotal: parseFloat(item.subtotal)
        })) || [];

        return {
          id_venta: ventaData.id_venta,
          numero_venta: numeroVentaFormateado,
          fecha_venta: ventaData.fyh_creacion,
          total: parseFloat(ventaData.total_pagado),
          estado: 'completada', // Todas las ventas en la BD están completadas
          items
        };
      });

      logger.info('Historial de ventas obtenido exitosamente', {
        operacion: 'obtener_historial_ventas',
        cliente_id: id_cliente,
        cantidad_ventas: ventasTransformadas.length,
        limit,
        offset,
        success: true
      });

      return res.json(ventasTransformadas);

    } catch (error) {
      logger.error('Error al obtener historial de ventas:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined,
        cliente_id: req.usuario?.id_cliente,
        query: req.query
      });
      return res.status(500).json({
        mensaje: 'Error al obtener el historial de ventas',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Obtiene el detalle completo de una venta específica
   *
   * Endpoint protegido que retorna información detallada de una venta.
   * Solo permite acceso al cliente dueño de la venta.
   *
   * @param req - Express Request con params.id_venta y req.usuario.id_cliente
   * @param req.params.id_venta - ID de la venta a consultar
   * @param res - Express Response object
   * @returns 200 con datos completos de la venta
   * @returns 401 si el cliente no está autenticado
   * @returns 403 si la venta no pertenece al cliente
   * @returns 404 si la venta no existe
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * GET /api/ventas/5
   * Headers: { "Authorization": "Bearer TOKEN" }
   *
   * Response 200: {
   *   id_venta: 5,
   *   numero_venta: "V-00005",
   *   fecha_venta: "2025-10-22T10:30:00.000Z",
   *   total: 1500.00,
   *   estado: "completada",
   *   observaciones: "Entrega a domicilio",
   *   moneda: "BOB",
   *   cliente: {
   *     id_cliente: 3,
   *     nombre_cliente: "Juan",
   *     apellido_cliente: "Pérez"
   *   },
   *   items: [...]
   * }
   */
  static async obtenerDetalle(req: Request, res: Response) {
    try {
      const id_cliente = req.usuario?.id_cliente;
      const { id_venta } = req.params;

      if (!id_cliente) {
        return res.status(401).json({ mensaje: 'Cliente no autenticado' });
      }

      logger.debug(`Obteniendo detalle de venta - Cliente: ${id_cliente}, Venta: ${id_venta}`);

      // Buscar la venta con todos sus detalles
      const venta = await Venta.findOne({
        where: { id_venta },
        include: [
          {
            model: Cliente,
            as: 'cliente',
            attributes: ['id_cliente', 'nombre_cliente', 'apellido_cliente', 'correo']
          },
          {
            model: CarritoWeb,
            as: 'carrito',
            include: [
              {
                model: CarritoWebItems,
                as: 'items',
                include: [
                  {
                    model: Almacen,
                    as: 'producto',
                    attributes: ['id_producto', 'nombre', 'descripcion', 'codigo']
                  }
                ]
              }
            ]
          }
        ]
      });

      if (!venta) {
        return res.status(404).json({ mensaje: 'Venta no encontrada' });
      }

      // Verificar que la venta pertenece al cliente autenticado
      const ventaData = venta.toJSON() as any;
      if (ventaData.id_cliente !== id_cliente) {
        logger.warn('Intento de acceso a venta de otro cliente', {
          cliente_autenticado: id_cliente,
          cliente_venta: ventaData.id_cliente,
          id_venta
        });
        return res.status(403).json({ mensaje: 'No tiene permisos para acceder a esta venta' });
      }

      // Formatear número de venta
      const numeroVentaFormateado = `V-${ventaData.nro_venta.toString().padStart(5, '0')}`;

      // Transformar items
      const items = ventaData.carrito?.items?.map((item: any) => ({
        id_producto: item.producto?.id_producto,
        nombre_producto: item.producto?.nombre || 'Producto no disponible',
        descripcion: item.producto?.descripcion,
        codigo: item.producto?.codigo,
        cantidad: item.cantidad,
        precio_unitario: parseFloat(item.precio_unitario),
        subtotal: parseFloat(item.subtotal)
      })) || [];

      // Construir respuesta completa
      const ventaDetallada = {
        id_venta: ventaData.id_venta,
        numero_venta: numeroVentaFormateado,
        fecha_venta: ventaData.fyh_creacion,
        total: parseFloat(ventaData.total_pagado),
        estado: 'completada',
        observaciones: ventaData.observaciones,
        moneda: ventaData.moneda || 'BOB',
        valor_dolar: ventaData.valor_dolar ? parseFloat(ventaData.valor_dolar) : null,
        cliente: {
          id_cliente: ventaData.cliente?.id_cliente,
          nombre_cliente: ventaData.cliente?.nombre_cliente,
          apellido_cliente: ventaData.cliente?.apellido_cliente,
          correo: ventaData.cliente?.correo
        },
        items
      };

      logger.info('Detalle de venta obtenido exitosamente', {
        operacion: 'obtener_detalle_venta',
        cliente_id: id_cliente,
        id_venta,
        cantidad_items: items.length,
        success: true
      });

      return res.json(ventaDetallada);

    } catch (error) {
      logger.error('Error al obtener detalle de venta:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined,
        cliente_id: req.usuario?.id_cliente,
        params: req.params
      });
      return res.status(500).json({
        mensaje: 'Error al obtener el detalle de la venta',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}
