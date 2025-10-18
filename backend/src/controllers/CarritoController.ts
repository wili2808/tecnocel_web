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

/**
 * Controlador para gestión del carrito de compras
 *
 * Maneja todas las operaciones del carrito incluyendo:
 * - Obtener carrito activo del cliente
 * - Agregar/actualizar/eliminar items
 * - Cálculo de precios con ofertas
 * - Transformación de URLs de imágenes
 * - Confirmar compra (conversión a venta)
 * - Historial de carritos
 *
 * Todos los endpoints requieren autenticación de cliente (verificarTokenCliente).
 *
 * @class CarritoController
 */
export default class CarritoController {

  /**
   * Retorna configuración de includes de Sequelize para carrito completo
   *
   * Helper method que define qué relaciones cargar al consultar un carrito:
   * - Items del carrito con sus productos
   * - Imágenes de cada producto
   * - Ofertas activas vigentes de cada producto
   *
   * @static
   * @returns Array de configuración de includes para Sequelize
   *
   * @example
   * const carrito = await CarritoWeb.findOne({
   *   where: { id_cliente: 5 },
   *   include: CarritoController.getCarritoIncludes()
   * });
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
   * Calcula el precio final de un producto aplicando ofertas activas
   *
   * Determina el precio a pagar considerando ofertas vigentes. Soporta
   * tres tipos de descuento:
   * - Precio fijo en oferta (precio_oferta en ProductoOferta)
   * - Descuento porcentual (ej: 15% descuento)
   * - Descuento monto fijo (ej: Bs. 50 de descuento)
   *
   * @static
   * @param producto - Producto con precio_venta
   * @param ofertas - Array de ofertas activas del producto
   * @returns Objeto con precio_original, precio_oferta, descuento_porcentaje, en_oferta
   *
   * @example
   * const resultado = CarritoController.calcularPrecioConOferta(
   *   { precio_venta: 100 },
   *   [{ tipo_descuento: 'porcentaje', valor_descuento: 20 }]
   * );
   * // resultado: { precio_original: 100, precio_oferta: 80, descuento_porcentaje: 20, en_oferta: true }
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
   * Transforma un producto agregando URLs completas de imágenes y datos de ofertas
   *
   * Enriquece un producto con:
   * - URLs completas de imágenes vía imageService
   * - Precios calculados con ofertas aplicadas
   * - Información de descuentos
   * - Datos simplificados de ofertas (sin referencias circulares)
   *
   * @static
   * @param producto - Producto Sequelize con imagenes
   * @param ofertas - Array de ofertas activas del producto
   * @returns Promise con producto transformado incluyendo imagen_url y precios con oferta
   *
   * @example
   * const productoTransformado = await CarritoController.transformarProductoConImagenes(
   *   producto,
   *   ofertas
   * );
   * // productoTransformado incluye: imagen_url, precio_oferta, descuento_porcentaje, etc.
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
   * Transforma un array de items del carrito con productos completos
   *
   * Procesa cada item del carrito aplicando transformación de imágenes y ofertas
   * a sus productos asociados. Maneja arrays vacíos o undefined gracefully.
   *
   * @static
   * @param items - Array de items del carrito (CarritoWebItems) o undefined
   * @returns Promise con array de items transformados con productos enriquecidos
   *
   * @example
   * const itemsTransformados = await CarritoController.transformarItemsCarrito(carrito.items);
   * // Cada item tendrá su producto con imagen_url, precio_oferta, etc.
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
   * Obtiene el carrito activo del cliente autenticado
   *
   * Endpoint protegido que retorna el carrito activo del cliente con todos sus items,
   * productos, imágenes y ofertas aplicadas. Si no existe carrito activo, crea uno nuevo.
   *
   * Funcionalidades:
   * - Crea carrito automáticamente si no existe
   * - Transforma URLs de imágenes de productos
   * - Calcula precios con ofertas aplicadas
   * - Recalcula y sincroniza totales
   *
   * @param req - Express Request con req.usuario.id_cliente del middleware
   * @param res - Express Response object
   * @returns 200 con { carrito: {...} } incluyendo items transformados
   * @returns 401 si el cliente no está autenticado
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * GET /api/carrito
   * Headers: { "Authorization": "Bearer TOKEN" }
   *
   * Response 200: {
   *   "carrito": {
   *     "id_carrito": 5,
   *     "id_cliente": 3,
   *     "estado": "activo",
   *     "items": [
   *       {
   *         "id_item": 1,
   *         "cantidad": 2,
   *         "precio_unitario": 999.99,
   *         "subtotal": 1999.98,
   *         "producto": {
   *           "id_producto": 10,
   *           "nombre": "iPhone 13",
   *           "imagen_url": "http://...",
   *           "precio_oferta": 899.99,
   *           "en_oferta": true
   *         }
   *       }
   *     ],
   *     "total_carrito": 1999.98,
   *     "cantidad_items": 1
   *   }
   * }
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
   * Agrega un producto al carrito del cliente autenticado
   *
   * Endpoint protegido que agrega un producto al carrito activo o actualiza
   * la cantidad si el producto ya existe en el carrito.
   *
   * Funcionalidades:
   * - Verifica stock disponible antes de agregar
   * - Aplica precios con ofertas si están disponibles
   * - Crea carrito automáticamente si no existe
   * - Actualiza cantidad si el producto ya está en el carrito
   * - Recalcula totales automáticamente
   *
   * @param req - Express Request con body y req.usuario.id_cliente
   * @param req.body.id_producto - ID del producto a agregar (requerido)
   * @param req.body.cantidad - Cantidad a agregar (requerido, min: 1)
   * @param res - Express Response object
   * @returns 200 con { mensaje, item, total_carrito } si se agrega exitosamente
   * @returns 400 si datos inválidos o stock insuficiente
   * @returns 401 si el cliente no está autenticado
   * @returns 404 si el producto no existe
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * POST /api/carrito/items
   * Headers: { "Authorization": "Bearer TOKEN" }
   * Body: {
   *   "id_producto": 10,
   *   "cantidad": 2
   * }
   *
   * Response 200: {
   *   "mensaje": "Producto agregado al carrito",
   *   "item": { ... },
   *   "total_carrito": 1999.98
   * }
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
   * Actualiza la cantidad de un item específico en el carrito
   *
   * Endpoint protegido que modifica la cantidad de un producto ya existente
   * en el carrito. Verifica stock disponible y recalcula precios con ofertas.
   *
   * @param req - Express Request con params.id_item, body.cantidad y req.usuario
   * @param req.params.id_item - ID del item del carrito a actualizar
   * @param req.body.cantidad - Nueva cantidad (requerido, min: 1)
   * @param res - Express Response object
   * @returns 200 con { mensaje, item, total_carrito } si la actualización es exitosa
   * @returns 400 si la cantidad es inválida o hay stock insuficiente
   * @returns 401 si el cliente no está autenticado
   * @returns 404 si el item no existe en el carrito del cliente
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * PUT /api/carrito/items/5
   * Headers: { "Authorization": "Bearer TOKEN" }
   * Body: { "cantidad": 3 }
   *
   * Response 200: {
   *   "mensaje": "Cantidad actualizada exitosamente",
   *   "item": { ... },
   *   "total_carrito": 2999.97
   * }
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
   * Elimina un item específico del carrito
   *
   * Endpoint protegido que remueve completamente un producto del carrito activo
   * y recalcula el total. El item solo puede ser eliminado por su dueño.
   *
   * @param req - Express Request con params.id_item y req.usuario.id_cliente
   * @param req.params.id_item - ID del item del carrito a eliminar
   * @param res - Express Response object
   * @returns 200 con { mensaje, total_carrito } si la eliminación es exitosa
   * @returns 401 si el cliente no está autenticado
   * @returns 404 si el item no existe en el carrito del cliente
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * DELETE /api/carrito/items/5
   * Headers: { "Authorization": "Bearer TOKEN" }
   *
   * Response 200: {
   *   "mensaje": "Producto eliminado del carrito",
   *   "total_carrito": 999.99
   * }
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
   * Vacía el carrito eliminando todos sus items
   *
   * Endpoint protegido que elimina todos los items del carrito activo del cliente
   * y establece el total en 0. El carrito permanece en estado "activo".
   *
   * @param req - Express Request con req.usuario.id_cliente
   * @param res - Express Response object
   * @returns 200 con { mensaje, total_carrito: 0 } si se vacía exitosamente
   * @returns 401 si el cliente no está autenticado
   * @returns 404 si no hay carrito activo
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * DELETE /api/carrito
   * Headers: { "Authorization": "Bearer TOKEN" }
   *
   * Response 200: {
   *   "mensaje": "Carrito vaciado exitosamente",
   *   "total_carrito": 0.00
   * }
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
   * Confirma la compra convirtiendo el carrito en una venta
   *
   * Endpoint protegido que procesa la compra final:
   * - Verifica stock disponible de todos los productos
   * - Crea un registro de venta (Venta)
   * - Actualiza el stock de productos
   * - Marca el carrito como "completado"
   * - Genera número de venta consecutivo
   *
   * IMPORTANTE: Esta operación es irreversible y afecta el inventario.
   *
   * @param req - Express Request con body y req.usuario.id_cliente
   * @param req.body.observaciones - Notas opcionales sobre la compra
   * @param req.body.moneda - Moneda de la transacción (default: "BOB")
   * @param res - Express Response object
   * @returns 200 con { mensaje, venta, carrito_id } si la compra es exitosa
   * @returns 400 si el carrito está vacío o hay stock insuficiente
   * @returns 401 si el cliente no está autenticado
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * POST /api/carrito/confirmar-compra
   * Headers: { "Authorization": "Bearer TOKEN" }
   * Body: {
   *   "observaciones": "Entrega a domicilio",
   *   "moneda": "BOB"
   * }
   *
   * Response 200: {
   *   "mensaje": "Compra realizada exitosamente",
   *   "venta": {
   *     "id_venta": 45,
   *     "nro_venta": 1001,
   *     "total_pagado": 1999.98,
   *     "fyh_creacion": "2025-10-14T..."
   *   },
   *   "carrito_id": 10
   * }
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
   * Obtiene el historial de carritos del cliente autenticado
   *
   * Endpoint protegido que retorna los carritos previos del cliente con paginación.
   * Incluye carritos en todos los estados (activo, completado, abandonado).
   *
   * @param req - Express Request con query params y req.usuario.id_cliente
   * @param req.query.estado - Filtrar por estado opcional ("activo", "completado")
   * @param req.query.limit - Límite de resultados (default: 10)
   * @param req.query.offset - Offset para paginación (default: 0)
   * @param res - Express Response object
   * @returns 200 con { carritos, total, limit, offset }
   * @returns 401 si el cliente no está autenticado
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * GET /api/carrito/historial?estado=completado&limit=5&offset=0
   * Headers: { "Authorization": "Bearer TOKEN" }
   *
   * Response 200: {
   *   "carritos": [
   *     {
   *       "id_carrito": 8,
   *       "estado": "completado",
   *       "total_carrito": 1999.98,
   *       "items": [...],
   *       "venta": {
   *         "nro_venta": 1001,
   *         "fyh_creacion": "2025-10-14T..."
   *       }
   *     }
   *   ],
   *   "total": 15,
   *   "limit": 5,
   *   "offset": 0
   * }
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