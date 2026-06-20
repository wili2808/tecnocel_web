import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import type { VentaItemResumen } from '../types/venta.types.js';
import Venta from '../models/Venta.js';
import VentaItem from '../models/VentaItem.js';
import Envio from '../models/Envio.js';
import Cancelacion from '../models/Cancelacion.js';
import Direccion from '../models/Direccion.js';
import Almacen from '../models/Almacen.js';
import Cliente from '../models/Cliente.js';
import ProductoImagen from '../models/ProductoImagen.js';
import logger from '../services/loggerService.js';
import { getImageService, ImageType } from '../services/imageService.js';

/**
 * Controlador para gestión de ventas (vista del cliente)
 *
 * Maneja todas las operaciones relacionadas con ventas confirmadas
 * desde la perspectiva del cliente autenticado:
 * - Obtener historial de ventas
 * - Obtener detalle de una venta específica
 *
 * Los items se leen directamente desde tb_venta_items (snapshot permanente),
 * sin depender del carrito original.
 *
 * Todos los endpoints requieren autenticación de cliente (verificarTokenCliente).
 *
 * @class VentaController
 */
class VentaController {

  /**
   * Obtiene el historial de ventas del cliente autenticado
   *
   * @param req - Express Request con query params y req.usuario.id_cliente
   * @param req.query.limit - Límite de resultados (default: 10, max: 50)
   * @param req.query.offset - Offset para paginación (default: 0)
   * @param res - Express Response object
   * @returns 200 con array de ventas transformadas
   */
  static async obtenerHistorialCliente(req: Request, res: Response) {
    try {
      const id_cliente = req.usuario?.id;

      if (!id_cliente) {
        return res.status(401).json({ mensaje: 'Cliente no autenticado' });
      }

      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
      const offset = parseInt(req.query.offset as string) || 0;

      logger.debug(`Obteniendo historial de ventas - Cliente: ${id_cliente}, Limit: ${limit}, Offset: ${offset}`);

      const ventas = await Venta.findAll({
        where: { id_cliente },
        include: [
          {
            model: VentaItem,
            as: 'items',
            include: [
              {
                model: Almacen,
                as: 'producto',
                attributes: ['id_producto', 'nombre', 'descripcion'],
                include: [{
                  model: ProductoImagen,
                  as: 'imagenes',
                  attributes: ['url_imagen', 'es_principal'],
                  required: false,
                  separate: false
                }]
              }
            ]
          },
          {
            model: Cancelacion,
            as: 'cancelacion',
            required: false,
            attributes: ['motivo', 'fyh_cancelacion']
          },
          {
            model: Envio,
            as: 'envio',
            required: false,
            include: [{
              model: Direccion,
              as: 'direccion_envio',
              required: false,
              attributes: ['calle', 'numero', 'piso', 'departamento', 'barrio', 'ciudad', 'provincia']
            }]
          }
        ],
        order: [['fyh_creacion', 'DESC']],
        limit,
        offset
      });

      const ventasTransformadas = ventas.map(venta => {
        /** Sequelize no tipifica asociaciones — cast necesario para acceder a relaciones incluidas */
        const ventaData = venta.toJSON() as Record<string, any>;
        const numeroVentaFormateado = `V-${ventaData.nro_venta.toString().padStart(5, '0')}`;

        const items = (ventaData.items || []).map((item: Record<string, any>) => {
          const imagenes = item.producto?.imagenes || [];
          const imgPrincipal = imagenes.find((i: any) => i.es_principal) || imagenes[0];
          const imageService = getImageService();
          const imagen_url = imgPrincipal?.url_imagen
            ? imageService
              ? imageService.generateImageUrl(imgPrincipal.url_imagen, ImageType.PRODUCT)
              : imgPrincipal.url_imagen
            : null;
          return {
            id_producto: item.producto?.id_producto || null,
            nombre_producto: item.producto?.nombre || 'Producto no disponible',
            imagen_url,
            cantidad: item.cantidad,
            precio_unitario: parseFloat(item.precio_unitario),
            subtotal: parseFloat(item.subtotal)
          };
        });

        return {
          id_venta: ventaData.id_venta,
          numero_venta: numeroVentaFormateado,
          fecha_venta: ventaData.fyh_creacion,
          total: parseFloat(ventaData.total_pagado),
          estado: ventaData.estado,
          metodo_pago: ventaData.metodo_pago || null,
          moneda: ventaData.moneda || 'ARS',
          valor_dolar: ventaData.valor_dolar ? parseFloat(ventaData.valor_dolar) : null,
          estado_reembolso: ventaData.estado_reembolso || null,
          envio: ventaData.envio ? {
            tipo_entrega:    ventaData.envio.tipo_entrega,
            estado_envio:    ventaData.envio.estado_envio,
            fecha_despacho:  ventaData.envio.fyh_despacho || null,
            direccion_envio: (ventaData.envio.envio_calle || ventaData.envio.direccion_envio) ? {
              nombre_direccion: ventaData.envio.envio_nombre_direccion || null,
              calle:        ventaData.envio.envio_calle || ventaData.envio.direccion_envio?.calle || null,
              numero:       ventaData.envio.envio_numero || ventaData.envio.direccion_envio?.numero || null,
              piso:         ventaData.envio.envio_piso || ventaData.envio.direccion_envio?.piso || null,
              departamento: ventaData.envio.envio_departamento || ventaData.envio.direccion_envio?.departamento || null,
              barrio:       ventaData.envio.envio_barrio || ventaData.envio.direccion_envio?.barrio || null,
              ciudad:       ventaData.envio.envio_ciudad || ventaData.envio.direccion_envio?.ciudad || null,
              provincia:    ventaData.envio.envio_provincia || ventaData.envio.direccion_envio?.provincia || null,
              codigo_postal: ventaData.envio.envio_codigo_postal || null,
              pais:         ventaData.envio.envio_pais || null,
              referencia:   ventaData.envio.envio_referencia || null,
              telefono_contacto: ventaData.envio.envio_telefono_contacto || null
            } : null
          } : null,
          cancelacion: ventaData.cancelacion ? {
            motivo:            ventaData.cancelacion.motivo || null,
            fecha_cancelacion: ventaData.cancelacion.fyh_cancelacion
          } : null,
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
        cliente_id: req.usuario?.id,
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
   * Solo permite acceso al cliente dueño de la venta.
   *
   * @param req - Express Request con params.id_venta y req.usuario.id_cliente
   * @param req.params.id_venta - ID de la venta a consultar
   * @param res - Express Response object
   * @returns 200 con datos completos de la venta
   */
  static async obtenerDetalle(req: Request, res: Response) {
    try {
      const id_cliente = req.usuario?.id;
      const { id_venta } = req.params;

      if (!id_cliente) {
        return res.status(401).json({ mensaje: 'Cliente no autenticado' });
      }

      logger.debug(`Obteniendo detalle de venta - Cliente: ${id_cliente}, Venta: ${id_venta}`);

      const venta = await Venta.findOne({
        where: { id_venta },
        include: [
          {
            model: Cliente,
            attributes: ['id_cliente', 'nombre_cliente', 'apellido_cliente', 'email_cliente']
          },
          {
            model: VentaItem,
            as: 'items',
            include: [
              {
                model: Almacen,
                as: 'producto',
                attributes: ['id_producto', 'nombre', 'descripcion', 'codigo']
              }
            ]
          },
          {
            model: Cancelacion,
            as: 'cancelacion',
            required: false,
            attributes: ['motivo', 'fyh_cancelacion']
          },
          {
            model: Envio,
            as: 'envio',
            required: false,
            include: [{
              model: Direccion,
              as: 'direccion_envio',
              required: false,
              attributes: ['calle', 'numero', 'piso', 'departamento', 'barrio', 'ciudad', 'provincia']
            }]
          }
        ]
      });

      if (!venta) {
        return res.status(404).json({ mensaje: 'Venta no encontrada' });
      }

      /** Sequelize no tipifica asociaciones — cast necesario para acceder a relaciones incluidas */
      const ventaData = venta.toJSON() as Record<string, any>;

      // Verificar que la venta pertenece al cliente autenticado
      if (ventaData.id_cliente !== id_cliente) {
        logger.warn('Intento de acceso a venta de otro cliente', {
          cliente_autenticado: id_cliente,
          cliente_venta: ventaData.id_cliente,
          id_venta
        });
        return res.status(403).json({ mensaje: 'No tiene permisos para acceder a esta venta' });
      }

      const numeroVentaFormateado = `V-${ventaData.nro_venta.toString().padStart(5, '0')}`;

      const items = (ventaData.items || []).map((item: any) => ({
        id_producto: item.producto?.id_producto,
        nombre_producto: item.producto?.nombre || 'Producto no disponible',
        descripcion: item.producto?.descripcion,
        codigo: item.producto?.codigo,
        cantidad: item.cantidad,
        precio_unitario: parseFloat(item.precio_unitario),
        subtotal: parseFloat(item.subtotal)
      }));

      const ventaDetallada = {
        id_venta: ventaData.id_venta,
        numero_venta: numeroVentaFormateado,
        fecha_venta: ventaData.fyh_creacion,
        total: parseFloat(ventaData.total_pagado),
        estado: ventaData.estado,
        metodo_pago: ventaData.metodo_pago || null,
        observaciones: ventaData.observaciones,
        moneda: ventaData.moneda || 'ARS',
        valor_dolar: ventaData.valor_dolar ? parseFloat(ventaData.valor_dolar) : null,
        estado_reembolso: ventaData.estado_reembolso || null,
        envio: ventaData.envio ? {
          tipo_entrega:    ventaData.envio.tipo_entrega,
          estado_envio:    ventaData.envio.estado_envio,
          fecha_despacho:  ventaData.envio.fecha_despacho || null,
          direccion_envio: (ventaData.envio.envio_calle || ventaData.envio.direccion_envio) ? {
              nombre_direccion: ventaData.envio.envio_nombre_direccion || null,
              calle:        ventaData.envio.envio_calle || ventaData.envio.direccion_envio?.calle || null,
              numero:       ventaData.envio.envio_numero || ventaData.envio.direccion_envio?.numero || null,
              piso:         ventaData.envio.envio_piso || ventaData.envio.direccion_envio?.piso || null,
              departamento: ventaData.envio.envio_departamento || ventaData.envio.direccion_envio?.departamento || null,
              barrio:       ventaData.envio.envio_barrio || ventaData.envio.direccion_envio?.barrio || null,
              ciudad:       ventaData.envio.envio_ciudad || ventaData.envio.direccion_envio?.ciudad || null,
              provincia:    ventaData.envio.envio_provincia || ventaData.envio.direccion_envio?.provincia || null,
              codigo_postal: ventaData.envio.envio_codigo_postal || null,
              pais:         ventaData.envio.envio_pais || null,
              referencia:   ventaData.envio.envio_referencia || null,
              telefono_contacto: ventaData.envio.envio_telefono_contacto || null
            } : null
        } : null,
        cancelacion: ventaData.cancelacion ? {
          motivo:            ventaData.cancelacion.motivo || null,
          fecha_cancelacion: ventaData.cancelacion.fyh_cancelacion
        } : null,
        cliente: {
          id_cliente: ventaData.Cliente?.id_cliente,
          nombre_cliente: ventaData.Cliente?.nombre_cliente,
          apellido_cliente: ventaData.Cliente?.apellido_cliente,
          correo: ventaData.Cliente?.email_cliente
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
        cliente_id: req.usuario?.id,
        params: req.params
      });
      return res.status(500).json({
        mensaje: 'Error al obtener el detalle de la venta',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}

export default VentaController;