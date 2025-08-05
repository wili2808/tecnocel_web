import { Request, Response } from 'express';
import CarritoWeb from '../models/CarritoWeb.js';
import CarritoWebItems from '../models/CarritoWebItems.js';
import Almacen from '../models/Almacen.js';
import Cliente from '../models/Cliente.js';
import Venta from '../models/Venta.js';
import logger from '../utils/logger.js';
import { Op } from 'sequelize';

export default class CarritoController {

  /**
   * Obtener el carrito activo del cliente autenticado
   */
  static async obtenerCarrito(req: Request, res: Response) {
    try {
      const id_cliente = req.usuario?.id_cliente;

      if (!id_cliente) {
        return res.status(401).json({ mensaje: 'Cliente no autenticado' });
      }

      // Buscar carrito activo del cliente
      let carrito = await CarritoWeb.findOne({
        where: { 
          id_cliente, 
          estado: 'activo' 
        },
        include: [
          {
            model: CarritoWebItems,
            as: 'items',
            include: [
              {
                model: Almacen,
                as: 'producto',
                attributes: ['id_producto', 'nombre', 'descripcion', 'precio_venta', 'imagen', 'stock']
              }
            ]
          }
        ]
      });

      // Si no existe carrito activo, crear uno nuevo
      if (!carrito) {
        carrito = await CarritoWeb.create({
          id_cliente,
          estado: 'activo',
          total_carrito: 0.00,
          fyh_creacion: new Date(),
          fyh_actualizacion: new Date()
        });

        // Recargar con includes
        carrito = await CarritoWeb.findByPk(carrito.id_carrito, {
          include: [
            {
              model: CarritoWebItems,
              as: 'items',
              include: [
                {
                  model: Almacen,
                  as: 'producto',
                  attributes: ['id_producto', 'nombre', 'descripcion', 'precio_venta', 'imagen', 'stock']
                }
              ]
            }
          ]
        });
      }

      logger.info('Carrito obtenido exitosamente', {
        cliente_id: id_cliente,
        items_count: carrito!.items?.length || 0,
        total: carrito!.total_carrito
      });
      return res.json({
        carrito: {
          id_carrito: carrito!.id_carrito,
          estado: carrito!.estado,
          total_carrito: carrito!.total_carrito,
          items: carrito!.items || [],
          cantidad_items: carrito!.items?.length || 0
        }
      });

    } catch (error) {
      logger.error('Error al obtener carrito:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined,
        cliente_id: req.usuario?.id_cliente
      });
      return res.status(500).json({ mensaje: 'Error al obtener el carrito', error });
    }
  }

  /**
   * Agregar un producto al carrito
   */
  static async agregarItem(req: Request, res: Response) {
    try {
      const { id_producto, cantidad } = req.body;
      const id_cliente = req.usuario?.id_cliente;

      if (!id_cliente) {
        return res.status(401).json({ mensaje: 'Cliente no autenticado' });
      }

      // Validaciones
      if (!id_producto || !cantidad || cantidad < 1) {
        return res.status(400).json({ mensaje: 'Datos inválidos. Se requiere id_producto y cantidad mayor a 0' });
      }

      logger.debug(`Agregando item al carrito - Cliente: ${id_cliente}, Producto: ${id_producto}, Cantidad: ${cantidad}`);

      // Verificar que el producto existe y tiene stock
      const producto = await Almacen.findByPk(id_producto);
      if (!producto) {
        return res.status(404).json({ mensaje: 'Producto no encontrado' });
      }

      if (producto.stock < cantidad) {
        return res.status(400).json({ 
          mensaje: 'Stock insuficiente', 
          stock_disponible: producto.stock 
        });
      }

      // Obtener o crear carrito activo
      let carrito = await CarritoWeb.findOne({
        where: { id_cliente, estado: 'activo' }
      });

      if (!carrito) {
        carrito = await CarritoWeb.create({
          id_cliente,
          estado: 'activo',
          total_carrito: 0.00,
          fyh_creacion: new Date(),
          fyh_actualizacion: new Date()
        });
      }

      const precio_unitario = parseFloat(producto.precio_venta);
      const subtotal = precio_unitario * cantidad;

      // Verificar si el producto ya está en el carrito
      const itemExistente = await CarritoWebItems.findOne({
        where: { 
          id_carrito: carrito.id_carrito, 
          id_producto 
        }
      });

      let item;
      if (itemExistente) {
        // Actualizar cantidad y subtotal del item existente
        const nuevaCantidad = itemExistente.cantidad + cantidad;
        const nuevoSubtotal = precio_unitario * nuevaCantidad;

        // Verificar stock para la nueva cantidad
        if (producto.stock < nuevaCantidad) {
          return res.status(400).json({ 
            mensaje: 'Stock insuficiente para la cantidad total', 
            stock_disponible: producto.stock,
            cantidad_actual_en_carrito: itemExistente.cantidad
          });
        }

        item = await itemExistente.update({
          cantidad: nuevaCantidad,
          subtotal: nuevoSubtotal,
          fyh_actualizacion: new Date()
        });
      } else {
        // Crear nuevo item
        item = await CarritoWebItems.create({
          id_carrito: carrito.id_carrito,
          id_producto,
          cantidad,
          precio_unitario,
          subtotal,
          fyh_creacion: new Date(),
          fyh_actualizacion: new Date()
        });
      }

      // Recalcular total del carrito
      const nuevoTotal = await carrito.calcularTotal();
      await carrito.update({
        total_carrito: nuevoTotal,
        fyh_actualizacion: new Date()
      });

      // Recargar item con datos del producto
      const itemCompleto = await CarritoWebItems.findByPk(item.id_item, {
        include: [
          {
            model: Almacen,
            as: 'producto',
            attributes: ['id_producto', 'nombre', 'descripcion', 'precio_venta', 'imagen', 'stock']
          }
        ]
      });

      logger.info(`Item agregado exitosamente al carrito - Cliente: ${id_cliente}, Item ID: ${item.id_item}`);
      return res.json({
        mensaje: itemExistente ? 'Cantidad actualizada en el carrito' : 'Producto agregado al carrito',
        item: itemCompleto,
        total_carrito: nuevoTotal
      });

    } catch (error) {
      logger.error('Error al agregar item al carrito:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined,
        cliente_id: req.usuario?.id_cliente,
        body: req.body
      });
      return res.status(500).json({ mensaje: 'Error al agregar producto al carrito', error });
    }
  }

  /**
   * Actualizar la cantidad de un item en el carrito
   */
  static async actualizarCantidad(req: Request, res: Response) {
    try {
      const { id_item } = req.params;
      const { cantidad } = req.body;
      const id_cliente = req.usuario?.id_cliente;

      if (!id_cliente) {
        return res.status(401).json({ mensaje: 'Cliente no autenticado' });
      }

      if (!cantidad || cantidad < 1) {
        return res.status(400).json({ mensaje: 'La cantidad debe ser mayor a 0' });
      }

      logger.debug(`Actualizando cantidad - Cliente: ${id_cliente}, Item: ${id_item}, Nueva cantidad: ${cantidad}`);

      // Buscar el item y verificar que pertenece al cliente
      const item = await CarritoWebItems.findOne({
        where: { id_item },
        include: [
          {
            model: CarritoWeb,
            as: 'carrito',
            where: { id_cliente, estado: 'activo' }
          },
          {
            model: Almacen,
            as: 'producto'
          }
        ]
      });

      if (!item) {
        return res.status(404).json({ mensaje: 'Item no encontrado en el carrito' });
      }

      // Verificar stock disponible
      if (item.producto!.stock < cantidad) {
        return res.status(400).json({ 
          mensaje: 'Stock insuficiente', 
          stock_disponible: item.producto!.stock 
        });
      }

      // Actualizar cantidad y subtotal
      const nuevoSubtotal = item.precio_unitario * cantidad;
      await item.update({
        cantidad,
        subtotal: nuevoSubtotal,
        fyh_actualizacion: new Date()
      });

      // Recalcular total del carrito
      const carrito = item.carrito!;
      const nuevoTotal = await carrito.calcularTotal();
      await carrito.update({
        total_carrito: nuevoTotal,
        fyh_actualizacion: new Date()
      });

      logger.info(`Cantidad actualizada exitosamente - Item: ${id_item}, Nueva cantidad: ${cantidad}`);
      return res.json({
        mensaje: 'Cantidad actualizada exitosamente',
        item: {
          id_item: item.id_item,
          cantidad: item.cantidad,
          subtotal: item.subtotal
        },
        total_carrito: nuevoTotal
      });

    } catch (error) {
      logger.error('Error al actualizar cantidad:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined,
        cliente_id: req.usuario?.id_cliente,
        params: req.params,
        body: req.body
      });
      return res.status(500).json({ mensaje: 'Error al actualizar la cantidad', error });
    }
  }

  /**
   * Eliminar un item del carrito
   */
  static async eliminarItem(req: Request, res: Response) {
    try {
      const { id_item } = req.params;
      const id_cliente = req.usuario?.id_cliente;

      if (!id_cliente) {
        return res.status(401).json({ mensaje: 'Cliente no autenticado' });
      }

      logger.debug(`Eliminando item - Cliente: ${id_cliente}, Item: ${id_item}`);

      // Buscar el item y verificar que pertenece al cliente
      const item = await CarritoWebItems.findOne({
        where: { id_item },
        include: [
          {
            model: CarritoWeb,
            as: 'carrito',
            where: { id_cliente, estado: 'activo' }
          }
        ]
      });

      if (!item) {
        return res.status(404).json({ mensaje: 'Item no encontrado en el carrito' });
      }

      // Eliminar el item
      await item.destroy();

      // Recalcular total del carrito
      const carrito = item.carrito!;
      const nuevoTotal = await carrito.calcularTotal();
      await carrito.update({
        total_carrito: nuevoTotal,
        fyh_actualizacion: new Date()
      });

      logger.info(`Item eliminado exitosamente - Item: ${id_item}`);
      return res.json({
        mensaje: 'Producto eliminado del carrito',
        total_carrito: nuevoTotal
      });

    } catch (error) {
      logger.error('Error al eliminar item:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined,
        cliente_id: req.usuario?.id_cliente,
        params: req.params
      });
      return res.status(500).json({ mensaje: 'Error al eliminar producto del carrito', error });
    }
  }

  /**
   * Vaciar el carrito completo
   */
  static async vaciarCarrito(req: Request, res: Response) {
    try {
      const id_cliente = req.usuario?.id_cliente;

      if (!id_cliente) {
        return res.status(401).json({ mensaje: 'Cliente no autenticado' });
      }

      logger.debug(`Vaciando carrito - Cliente: ${id_cliente}`);

      // Buscar carrito activo
      const carrito = await CarritoWeb.findOne({
        where: { id_cliente, estado: 'activo' }
      });

      if (!carrito) {
        return res.status(404).json({ mensaje: 'No hay carrito activo' });
      }

      // Eliminar todos los items del carrito
      await CarritoWebItems.destroy({
        where: { id_carrito: carrito.id_carrito }
      });

      // Actualizar total del carrito
      await carrito.update({
        total_carrito: 0.00,
        fyh_actualizacion: new Date()
      });

      logger.info(`Carrito vaciado exitosamente - Cliente: ${id_cliente}`);
      return res.json({
        mensaje: 'Carrito vaciado exitosamente',
        total_carrito: 0.00
      });

    } catch (error) {
      logger.error('Error al vaciar carrito:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined,
        cliente_id: req.usuario?.id_cliente
      });
      return res.status(500).json({ mensaje: 'Error al vaciar el carrito', error });
    }
  }

  /**
   * Confirmar compra - Convertir carrito en venta
   */
  static async confirmarCompra(req: Request, res: Response) {
    try {
      const { observaciones, moneda = 'BOB' } = req.body;
      const id_cliente = req.usuario?.id_cliente;

      if (!id_cliente) {
        return res.status(401).json({ mensaje: 'Cliente no autenticado' });
      }

      logger.debug(`Confirmando compra - Cliente: ${id_cliente}`);

      // Buscar carrito activo con items
      const carrito = await CarritoWeb.findOne({
        where: { id_cliente, estado: 'activo' },
        include: [
          {
            model: CarritoWebItems,
            as: 'items',
            include: [
              {
                model: Almacen,
                as: 'producto'
              }
            ]
          }
        ]
      });

      if (!carrito || !carrito.items || carrito.items.length === 0) {
        return res.status(400).json({ mensaje: 'No hay productos en el carrito' });
      }

      // Verificar stock disponible para todos los productos
      for (const item of carrito.items) {
        if (item.producto!.stock < item.cantidad) {
          return res.status(400).json({
            mensaje: `Stock insuficiente para ${item.producto!.nombre}`,
            producto: item.producto!.nombre,
            stock_disponible: item.producto!.stock,
            cantidad_solicitada: item.cantidad
          });
        }
      }

      // Generar número de venta
      const ultimaVenta = await Venta.findOne({
        order: [['nro_venta', 'DESC']]
      });
      const nroVenta = ultimaVenta ? ultimaVenta.nro_venta + 1 : 1;

      // Crear la venta
      const venta = await Venta.create({
        nro_venta: nroVenta,
        id_cliente,
        id_carrito: carrito.id_carrito,
        total_pagado: parseFloat(carrito.total_carrito.toString()),
        observaciones,
        moneda,
        fyh_creacion: new Date(),
        fyh_actualizacion: new Date()
      });

      // Actualizar stock de productos
      for (const item of carrito.items) {
        await Almacen.update(
          { 
            stock: item.producto!.stock - item.cantidad,
            fyh_actualizacion: new Date()
          },
          { where: { id_producto: item.id_producto } }
        );
      }

      // Marcar carrito como completado
      await carrito.update({
        estado: 'completado',
        fyh_actualizacion: new Date()
      });

      logger.info(`Compra confirmada exitosamente - Cliente: ${id_cliente}, Venta: ${nroVenta}`);
      return res.json({
        mensaje: 'Compra realizada exitosamente',
        venta: {
          id_venta: venta.id_venta,
          nro_venta: venta.nro_venta,
          total_pagado: venta.total_pagado,
          fyh_creacion: venta.fyh_creacion
        },
        carrito_id: carrito.id_carrito
      });

    } catch (error) {
      logger.error('Error al confirmar compra:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined,
        cliente_id: req.usuario?.id_cliente,
        body: req.body
      });
      return res.status(500).json({ mensaje: 'Error al procesar la compra', error });
    }
  }

  /**
   * Obtener historial de carritos del cliente
   */
  static async obtenerHistorial(req: Request, res: Response) {
    try {
      const id_cliente = req.usuario?.id_cliente;
      const { estado, limit = 10, offset = 0 } = req.query;

      if (!id_cliente) {
        return res.status(401).json({ mensaje: 'Cliente no autenticado' });
      }

      const whereCondition: any = { id_cliente };
      if (estado) {
        whereCondition.estado = estado;
      }

      const carritos = await CarritoWeb.findAndCountAll({
        where: whereCondition,
        include: [
          {
            model: CarritoWebItems,
            as: 'items',
            include: [
              {
                model: Almacen,
                as: 'producto',
                attributes: ['id_producto', 'nombre', 'precio_venta']
              }
            ]
          },
          {
            model: Venta,
            as: 'venta',
            attributes: ['id_venta', 'nro_venta', 'fyh_creacion'],
            required: false
          }
        ],
        order: [['fyh_creacion', 'DESC']],
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

      logger.info(`Historial obtenido - Cliente: ${id_cliente}, Carritos: ${carritos.count}`);
      return res.json({
        carritos: carritos.rows,
        total: carritos.count,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      });

    } catch (error) {
      logger.error('Error al obtener historial:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined,
        cliente_id: req.usuario?.id_cliente
      });
      return res.status(500).json({ mensaje: 'Error al obtener el historial', error });
    }
  }
} 