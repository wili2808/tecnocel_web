import { Request, Response } from 'express';
import CarritoWeb from '../models/CarritoWeb.js';
import CarritoWebItems from '../models/CarritoWebItems.js';
import Almacen from '../models/Almacen.js';
import Cliente from '../models/Cliente.js';
import Venta from '../models/Venta.js';
import Oferta from '../models/Oferta.js';
import logger from '../services/loggerService.js';
import { Op } from 'sequelize';
import { getImageService } from '../services/imageService.js';
import ProductoImagen from '../models/ProductoImagen.js';

export default class CarritoController {

  /**
   * Método helper para obtener includes comunes del carrito
   */
  static getCarritoIncludes(): any[] {
    return [
      {
        model: CarritoWebItems,
        as: 'items',
        include: [
          {
            model: Almacen,
            as: 'producto',
            attributes: ['id_producto', 'nombre', 'descripcion', 'precio_venta', 'stock'],
            include: [
              {
                model: ProductoImagen,
                as: 'imagenes',
                attributes: ['url_imagen', 'alt_text', 'es_principal', 'orden']
              },
              {
                model: Oferta,
                as: 'ofertas',
                where: {
                  activo: true,
                  fecha_inicio: { [Op.lte]: new Date() },
                  fecha_fin: { [Op.gte]: new Date() }
                },
                required: false,
                through: {
                  attributes: ['precio_oferta']
                },
                attributes: ['id_oferta', 'nombre_oferta', 'tipo_descuento', 'valor_descuento']
              }
            ]
          }
        ]
      }
    ];
  }

  /**
   * Método helper para calcular precio con ofertas
   */
  static calcularPrecioConOferta(producto: any, ofertas: any[]): {
    precio_original: number;
    precio_oferta: number | null;
    descuento_porcentaje: number | null;
    en_oferta: boolean;
  } {
    const ofertaActiva = ofertas.length > 0 ? ofertas[0] : null;
    let precio_original = parseFloat(producto.precio_venta);
    let precio_oferta = null;
    let descuento_porcentaje = null;
    let en_oferta = false;
    
    if (ofertaActiva) {
      en_oferta = true;
      if (ofertaActiva.ProductoOferta?.precio_oferta) {
        precio_oferta = ofertaActiva.ProductoOferta.precio_oferta;
      } else if (ofertaActiva.tipo_descuento === 'porcentaje') {
        precio_oferta = precio_original * (1 - ofertaActiva.valor_descuento / 100);
        descuento_porcentaje = ofertaActiva.valor_descuento;
      } else if (ofertaActiva.tipo_descuento === 'monto_fijo') {
        precio_oferta = Math.max(0, precio_original - ofertaActiva.valor_descuento);
        descuento_porcentaje = ((ofertaActiva.valor_descuento / precio_original) * 100).toFixed(1);
      }
    }
    
    return { precio_original, precio_oferta, descuento_porcentaje, en_oferta };
  }

  /**
   * Método helper para transformar producto con imágenes y ofertas
   */
  static async transformarProductoConImagenes(producto: any, ofertas: any[]): Promise<any> {
          const { precio_original, precio_oferta, descuento_porcentaje, en_oferta } = 
        CarritoController.calcularPrecioConOferta(producto, ofertas);
    
    // Extraer solo los datos necesarios de las ofertas para evitar referencias circulares
    const ofertasSimplificadas = ofertas.map((oferta: any) => ({
      id_oferta: oferta.id_oferta,
      nombre_oferta: oferta.nombre_oferta,
      descripcion: oferta.descripcion,
      tipo_descuento: oferta.tipo_descuento,
      valor_descuento: oferta.valor_descuento,
      fecha_inicio: oferta.fecha_inicio,
      fecha_fin: oferta.fecha_fin,
      activo: oferta.activo
    }));

    // Transformar el producto con las URLs de imágenes
    let productoConImagenes = {
      id_producto: producto.id_producto,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio_venta: producto.precio_venta,
      stock: producto.stock,
      precio_original,
      precio_oferta,
      descuento_porcentaje,
      en_oferta,
      ofertas: ofertasSimplificadas
    };

    // Si el servicio de imágenes está disponible, transformar las imágenes
    const imageService = getImageService();
    if (imageService) {
      productoConImagenes = await imageService.transformProductWithImageUrls({
        ...productoConImagenes,
        imagenes: producto.imagenes
      });
    }
    
    return productoConImagenes;
  }

  /**
   * Método helper para transformar items del carrito
   */
  static async transformarItemsCarrito(items: any[] | undefined): Promise<any[]> {
    if (!items || items.length === 0) {
      return [];
    }
    
    return await Promise.all(items.map(async item => {
      const producto = item.producto as any;
      const ofertas = producto?.ofertas || [];
      
      const productoTransformado = await CarritoController.transformarProductoConImagenes(producto, ofertas);
      
      return {
        ...item.toJSON(),
        producto: productoTransformado
      };
    }));
  }

  /**
   * Método helper para incluir solo datos básicos del producto
   */
  static getProductoBasicoIncludes(): any[] {
    return [
      {
        model: Almacen,
        as: 'producto',
        attributes: ['id_producto', 'nombre', 'descripcion', 'precio_venta', 'stock'],
        include: [
          {
            model: ProductoImagen,
            as: 'imagenes',
            attributes: ['url_imagen', 'alt_text', 'es_principal', 'orden']
          }
        ]
      }
    ];
  }

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
        include: CarritoController.getCarritoIncludes()
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
      }

      // Si el carrito existe pero no tiene items, retornar carrito vacío
      if (!carrito.items || carrito.items.length === 0) {
        return res.json({
          carrito: {
            id_carrito: carrito.id_carrito,
            id_cliente: carrito.id_cliente,
            estado: carrito.estado,
            items: [],
            total_carrito: 0.00,
            cantidad_items: 0,
            cargando: false,
            error: null
          }
        });
      }

      // Transformar items del carrito con ofertas e imágenes
      const itemsTransformados = await CarritoController.transformarItemsCarrito(carrito.items);

      // Recalcular total del carrito para asegurar consistencia
      const totalRecalculado = itemsTransformados.reduce((sum, item) => sum + parseFloat(item.subtotal.toString()), 0);

      // Actualizar el total en la base de datos si es diferente
      if (Math.abs(totalRecalculado - parseFloat(carrito.total_carrito.toString())) > 0.01) {
        await carrito.update({
          total_carrito: totalRecalculado,
          fyh_actualizacion: new Date()
        });
      }

      // Construir respuesta del carrito
      const carritoResponse = {
        id_carrito: carrito.id_carrito,
        id_cliente: carrito.id_cliente,
        estado: carrito.estado,
        items: itemsTransformados,
        total_carrito: totalRecalculado,
        cantidad_items: itemsTransformados.length,
        cargando: false,
        error: null
      };

      res.locals.skipHttpLog = true;
      
      logger.info('Carrito obtenido exitosamente', {
        operacion: 'obtener_carrito',
        cliente_id: id_cliente,
        cantidad_items: itemsTransformados.length,
        total_carrito: totalRecalculado,
        success: true
      });

      return res.json({ carrito: carritoResponse });

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

      if (!id_producto || !cantidad || cantidad < 1) {
        return res.status(400).json({ mensaje: 'Datos inválidos' });
      }

      logger.debug(`Agregando item al carrito - Cliente: ${id_cliente}, Producto: ${id_producto}, Cantidad: ${cantidad}`);

      // Verificar que el producto existe y tiene stock
      const producto = await Almacen.findByPk(id_producto, {
        include: [
          {
            model: Oferta,
            as: 'ofertas',
            where: {
              activo: true,
              fecha_inicio: { [Op.lte]: new Date() },
              fecha_fin: { [Op.gte]: new Date() }
            },
            required: false,
            through: {
              attributes: ['precio_oferta']
            },
            attributes: ['id_oferta', 'nombre_oferta', 'tipo_descuento', 'valor_descuento']
          }
        ]
      });

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

      // Calcular precio con oferta aplicada
      const ofertas = (producto as any).ofertas || [];
      const { precio_original, precio_oferta, en_oferta } = 
        CarritoController.calcularPrecioConOferta(producto, ofertas);
      
      // Usar precio con oferta si está disponible, sino precio original
      const precio_unitario = precio_oferta || precio_original;
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
          precio_unitario, // Actualizar también el precio unitario por si cambió la oferta
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

      // Recargar item con datos del producto y ofertas
      const itemCompleto = await CarritoWebItems.findByPk(item.id_item, {
        include: [
          {
            model: Almacen,
            as: 'producto',
            attributes: ['id_producto', 'nombre', 'descripcion', 'precio_venta', 'stock'],
            include: [
              {
                model: ProductoImagen,
                as: 'imagenes',
                attributes: ['url_imagen', 'alt_text', 'es_principal', 'orden']
              },
              {
                model: Oferta,
                as: 'ofertas',
                where: {
                  activo: true,
                  fecha_inicio: { [Op.lte]: new Date() },
                  fecha_fin: { [Op.gte]: new Date() }
                },
                required: false,
                through: {
                  attributes: ['precio_oferta']
                },
                attributes: ['id_oferta', 'nombre_oferta', 'tipo_descuento', 'valor_descuento']
              }
            ]
          }
        ]
      });

      // Transformar el producto con ofertas e imágenes
      if (itemCompleto?.producto) {
        const ofertasProducto = (itemCompleto.producto as any).ofertas || [];
        const productoTransformado = await CarritoController.transformarProductoConImagenes(
          itemCompleto.producto, 
          ofertasProducto
        );
        (itemCompleto as any).producto = productoTransformado;
      }

      // El log de éxito se maneja en el middleware de logging
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
      return res.status(500).json({ mensaje: 'Error al agregar item al carrito', error });
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
        return res.status(400).json({ mensaje: 'Cantidad debe ser mayor a 0' });
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
            as: 'producto',
            include: [
              {
                model: ProductoImagen,
                as: 'imagenes',
                attributes: ['url_imagen', 'alt_text', 'es_principal', 'orden']
              },
              {
                model: Oferta,
                as: 'ofertas',
                where: {
                  activo: true,
                  fecha_inicio: { [Op.lte]: new Date() },
                  fecha_fin: { [Op.gte]: new Date() }
                },
                required: false,
                through: {
                  attributes: ['precio_oferta']
                },
                attributes: ['id_oferta', 'nombre_oferta', 'tipo_descuento', 'valor_descuento']
              }
            ]
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

      // Calcular precio con oferta aplicada para recalcular el subtotal
      const ofertas = (item.producto as any).ofertas || [];
      const { precio_original, precio_oferta, descuento_porcentaje, en_oferta } = 
        CarritoController.calcularPrecioConOferta(item.producto!, ofertas);
      
      // Usar precio con oferta si está disponible, sino precio original
      const precio_unitario = precio_oferta || precio_original;
      
      // Actualizar cantidad y subtotal con el precio correcto
      const nuevoSubtotal = precio_unitario * cantidad;
      await item.update({
        cantidad,
        subtotal: nuevoSubtotal,
        precio_unitario, // Actualizar también el precio unitario por si cambió la oferta
        fyh_actualizacion: new Date()
      });

      // Recalcular total del carrito
      const carrito = item.carrito!;
      const nuevoTotal = await carrito.calcularTotal();
      await carrito.update({
        total_carrito: nuevoTotal,
        fyh_actualizacion: new Date()
      });

      res.locals.skipHttpLog = true;
      
      logger.info('Cantidad de item actualizada exitosamente', {
        operacion: 'actualizar_cantidad',
        cliente_id: id_cliente,
        item_id: id_item,
        nueva_cantidad: cantidad,
        success: true
      });
      
      // Transformar el producto con ofertas e imágenes usando el método helper
      const ofertasProducto = (item.producto as any).ofertas || [];
      const productoTransformado = await CarritoController.transformarProductoConImagenes(
        item.producto!, 
        ofertasProducto
      );

      return res.json({
        mensaje: 'Cantidad actualizada exitosamente',
        item: {
          id_item: item.id_item,
          id_carrito: item.id_carrito,
          id_producto: item.id_producto,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: item.subtotal,
          fyh_creacion: item.fyh_creacion.toISOString(),
          fyh_actualizacion: item.fyh_actualizacion.toISOString(),
          producto: productoTransformado
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

      res.locals.skipHttpLog = true;
      
      logger.info('Item eliminado del carrito exitosamente', {
        operacion: 'eliminar_item',
        cliente_id: id_cliente,
        item_id: id_item,
        success: true
      });
      
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
      const itemsEliminados = await CarritoWebItems.destroy({
        where: { id_carrito: carrito.id_carrito }
      });

      // Actualizar total del carrito
      await carrito.update({
        total_carrito: 0.00,
        fyh_actualizacion: new Date()
      });

      res.locals.skipHttpLog = true;
      
      logger.info('Carrito vaciado exitosamente', {
        operacion: 'vaciar_carrito',
        cliente_id: id_cliente,
        items_eliminados: itemsEliminados,
        success: true
      });
      
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

      res.locals.skipHttpLog = true;
      
      logger.info('Compra confirmada exitosamente', {
        operacion: 'confirmar_compra',
        cliente_id: id_cliente,
        nro_venta: nroVenta,
        items_comprados: carrito.items.length,
        total: carrito.total_carrito,
        success: true
      });
      
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