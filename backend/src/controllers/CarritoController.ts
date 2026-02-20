import { Request, Response } from 'express';
import CarritoWeb from '../models/CarritoWeb.js';
import CarritoWebItems from '../models/CarritoWebItems.js';
import Almacen from '../models/Almacen.js';
import Cliente from '../models/Cliente.js';
import Venta from '../models/Venta.js';
import VentaItem from '../models/VentaItem.js';
import Envio from '../models/Envio.js';
import Oferta from '../models/Oferta.js';
import logger from '../services/loggerService.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import Configuracion from '../models/Configuracion.js';
import { getImageService } from '../services/imageService.js';
import ProductoImagen from '../models/ProductoImagen.js';
import { calcularPrecioOferta, calcularPorcentajeDescuento } from '../services/ofertaService.js';
import { sendOrderConfirmationEmail } from '../services/emailService.js';

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
                  attributes: ['precio_oferta', 'es_precio_personalizado']
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
   * Determina el precio a pagar considerando ofertas vigentes usando lógica híbrida.
   * Soporta dos modos:
   * - Precio personalizado (si es_precio_personalizado = true)
   * - Cálculo dinámico con descuento porcentual o monto fijo
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
    descuento_porcentaje: string | null;
    en_oferta: boolean;
  } {
    const ofertaActiva = ofertas.length > 0 ? ofertas[0] : null;
    const precio_original = parseFloat(producto.precio_venta);

    if (!ofertaActiva) {
      return {
        precio_original,
        precio_oferta: null,
        descuento_porcentaje: null,
        en_oferta: false
      };
    }

    // Usar servicio de ofertas para calcular precio con lógica híbrida
    const productoOferta = ofertaActiva.ProductoOferta || null;
    const precio_final = calcularPrecioOferta(
      precio_original,
      {
        tipo_descuento: ofertaActiva.tipo_descuento,
        valor_descuento: parseFloat(ofertaActiva.valor_descuento)
      },
      productoOferta
    );

    const descuento_porcentaje = calcularPorcentajeDescuento(precio_original, precio_final);

    return {
      precio_original,
      precio_oferta: precio_final,
      descuento_porcentaje,
      en_oferta: true
    };
  }

  /**
   * Calcula el precio actual completo de un producto con ofertas vigentes
   * Retorna información completa para auditoría de precios (Fase 2)
   *
   * Esta función extiende calcularPrecioConOferta para incluir:
   * - ID de la oferta aplicada
   * - Nombre de la oferta
   * - Precio final numérico (no string)
   * - Descuento numérico (no string)
   *
   * @static
   * @param producto - Producto de Almacen con ofertas incluidas
   * @returns Objeto con información completa de precios para auditoría
   *
   * @example
   * const preciosActuales = await CarritoController.calcularPrecioActualCompleto(producto);
   * // {
   * //   precio_original: 999.99,
   * //   precio_oferta: 799.99,
   * //   precio_final: 799.99,
   * //   descuento_porcentaje: 20.00,
   * //   en_oferta: true,
   * //   id_oferta_aplicada: 5,
   * //   nombre_oferta: "Black Friday 20%"
   * // }
   */
  static calcularPrecioActualCompleto(producto: any): {
    precio_original: number;
    precio_oferta: number | null;
    precio_final: number;
    descuento_porcentaje: number;
    en_oferta: boolean;
    id_oferta_aplicada: number | null;
    nombre_oferta: string | null;
  } {
    const precio_original = parseFloat(producto.precio_venta);
    const ofertas = producto.ofertas || [];

    if (ofertas.length === 0) {
      return {
        precio_original,
        precio_oferta: null,
        precio_final: precio_original,
        descuento_porcentaje: 0,
        en_oferta: false,
        id_oferta_aplicada: null,
        nombre_oferta: null
      };
    }

    // Buscar la mejor oferta (mayor descuento)
    let mejorOferta = null;
    let mejorPrecioFinal = precio_original;

    for (const oferta of ofertas) {
      const { precio_oferta } = CarritoController.calcularPrecioConOferta(producto, [oferta]);

      if (precio_oferta && precio_oferta < mejorPrecioFinal) {
        mejorPrecioFinal = precio_oferta;
        mejorOferta = oferta;
      }
    }

    if (!mejorOferta) {
      return {
        precio_original,
        precio_oferta: null,
        precio_final: precio_original,
        descuento_porcentaje: 0,
        en_oferta: false,
        id_oferta_aplicada: null,
        nombre_oferta: null
      };
    }

    const descuento_porcentaje = parseFloat(
      calcularPorcentajeDescuento(precio_original, mejorPrecioFinal)
    );

    return {
      precio_original,
      precio_oferta: mejorPrecioFinal,
      precio_final: mejorPrecioFinal,
      descuento_porcentaje,
      en_oferta: true,
      id_oferta_aplicada: mejorOferta.id_oferta,
      nombre_oferta: mejorOferta.nombre_oferta
    };
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
   * ACTUALIZACIÓN: Ahora valida stock disponible y agrega información de disponibilidad
   * FASE 2: Revalida precios y detecta cambios desde que se agregaron al carrito
   *
   * @static
   * @param items - Array de items del carrito (CarritoWebItems) o undefined
   * @returns Promise con array de items transformados con productos enriquecidos y validación de stock y precios
   *
   * @example
   * const itemsTransformados = await CarritoController.transformarItemsCarrito(carrito.items);
   * // Cada item tendrá: imagen_url, precio_oferta, stock_disponible, tiene_stock, precio_actual, precio_cambio, etc.
   */
  static async transformarItemsCarrito(items: any[] | undefined): Promise<any[]> {
    if (!items || items.length === 0) {
      return [];
    }

    return await Promise.all(items.map(async item => {
      const producto = item.producto as any;
      const ofertas = producto?.ofertas || [];

      const productoTransformado = await CarritoController.transformarProductoConImagenes(producto, ofertas);

      // ✅ VALIDACIÓN DE STOCK (Fase 1)
      const stock_disponible = producto?.stock || 0;
      const cantidad_solicitada = item.cantidad;
      const tiene_stock = stock_disponible >= cantidad_solicitada;

      // Calcular sugerencia de cantidad si no hay stock suficiente
      const sugerencia_cantidad = tiene_stock ? null : (stock_disponible > 0 ? stock_disponible : null);

      // ✅ REVALIDACIÓN DE PRECIOS (Fase 2)
      const preciosActuales = CarritoController.calcularPrecioActualCompleto(producto);

      // Comparar precio guardado vs precio actual
      const precio_guardado = parseFloat(item.precio_unitario.toString());
      const precio_actual = preciosActuales.precio_final;
      const diferencia_precio = precio_actual - precio_guardado;
      const porcentaje_cambio = precio_guardado > 0 ? (diferencia_precio / precio_guardado) * 100 : 0;

      // Flag de cambio significativo (> 1%)
      const precio_cambio_significativo = Math.abs(porcentaje_cambio) > 1;

      // Calcular subtotales
      const subtotal_guardado = parseFloat(item.subtotal.toString());
      const subtotal_actual = precio_actual * cantidad_solicitada;

      // ✅ ACTUALIZAR PRECIOS EN BD SI HAY CAMBIO SIGNIFICATIVO (Fase 2)
      // La actualización ocurre automáticamente al detectar el cambio
      // Esto mantiene la BD sincronizada sin requerir acción del usuario
      if (precio_cambio_significativo) {
        try {
          await item.update({
            precio_unitario: precio_actual,
            subtotal: subtotal_actual,
            precio_base_original: preciosActuales.precio_original,
            precio_con_oferta_original: preciosActuales.precio_oferta,
            descuento_porcentaje_original: preciosActuales.descuento_porcentaje,
            id_oferta_aplicada: preciosActuales.id_oferta_aplicada,
            fyh_precio_validado: new Date(),
            precio_ha_cambiado: false  // Resetear flag porque ya se actualizó
          });

          logger.info(`Precio actualizado automáticamente para item ${item.id_item}: ${precio_guardado} → ${precio_actual}`);

          // NOTA: NO modificamos las variables precio_guardado/subtotal_guardado
          // para que el frontend RECIBA la información del cambio en esta carga
          // En la próxima carga del carrito, ya no habrá diferencia porque la BD está actualizada
        } catch (error) {
          logger.error('Error al actualizar precio en BD:', error);
          // Continuar aunque falle la actualización
        }
      }

      return {
        ...item.toJSON(),
        producto: productoTransformado,
        // Información de stock (Fase 1)
        stock_disponible,
        tiene_stock,
        sugerencia_cantidad,
        cantidad_faltante: tiene_stock ? 0 : (cantidad_solicitada - stock_disponible),
        // ✅ INFORMACIÓN DE PRECIOS (Fase 2)
        precio_guardado,
        precio_actual,
        diferencia_precio,
        porcentaje_cambio,
        precio_cambio: precio_cambio_significativo,
        subtotal_guardado,
        subtotal_actual,
        // Información de oferta guardada
        oferta_guardada: {
          id_oferta: item.id_oferta_aplicada,
          descuento_porcentaje: item.descuento_porcentaje_original,
          precio_oferta: item.precio_con_oferta_original
        },
        // Información de oferta actual
        oferta_actual: {
          id_oferta: preciosActuales.id_oferta_aplicada,
          nombre_oferta: preciosActuales.nombre_oferta,
          descuento_porcentaje: preciosActuales.descuento_porcentaje,
          precio_oferta: preciosActuales.precio_oferta
        }
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
      const id_cliente = req.usuario?.id;

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

      // Transformar items del carrito con ofertas, imágenes y validación de stock y precios
      const itemsTransformados = await CarritoController.transformarItemsCarrito(carrito.items);

      // ✅ VERIFICAR si hay items sin stock suficiente (Fase 1)
      const itemsSinStock = itemsTransformados.filter(item => !item.tiene_stock);
      const tiene_items_sin_stock = itemsSinStock.length > 0;

      // ✅ VERIFICAR si hay items con precio cambiado (Fase 2)
      const itemsConPrecioCambiado = itemsTransformados.filter(item => item.precio_cambio);
      const tiene_cambios_precio = itemsConPrecioCambiado.length > 0;

      // Calcular totales
      const totalConPreciosGuardados = itemsTransformados.reduce(
        (sum, item) => sum + item.subtotal_guardado,
        0
      );

      const totalConPreciosActuales = itemsTransformados.reduce(
        (sum, item) => sum + item.subtotal_actual,
        0
      );

      const diferencia_total = totalConPreciosActuales - totalConPreciosGuardados;

      // ✅ ACTUALIZAR TOTAL DEL CARRITO CON PRECIOS ACTUALES (Fase 2)
      // Si hubo cambios de precio, los items ya se actualizaron en transformarItemsCarrito
      // Por lo tanto, debemos usar el total con precios ACTUALES
      const totalParaActualizar = tiene_cambios_precio ? totalConPreciosActuales : totalConPreciosGuardados;

      if (Math.abs(totalParaActualizar - parseFloat(carrito.total_carrito.toString())) > 0.01) {
        await carrito.update({
          total_carrito: totalParaActualizar,
          fyh_actualizacion: new Date()
        });
      }

      // Construir respuesta del carrito
      const carritoResponse = {
        id_carrito: carrito.id_carrito,
        id_cliente: carrito.id_cliente,
        estado: carrito.estado,
        items: itemsTransformados,
        total_carrito: totalConPreciosGuardados,  // Total guardado (por compatibilidad)
        total_actual: totalConPreciosActuales,     // ✅ Total actualizado
        diferencia_total,                          // ✅ Diferencia en totales
        cantidad_items: itemsTransformados.length,
        cargando: false,
        error: null,
        // Información de stock (Fase 1)
        tiene_items_sin_stock,
        items_sin_stock: itemsSinStock.map(item => ({
          id_item: item.id_item,
          id_producto: item.id_producto,
          nombre_producto: item.producto?.nombre,
          cantidad_solicitada: item.cantidad,
          stock_disponible: item.stock_disponible,
          sugerencia_cantidad: item.sugerencia_cantidad
        })),
        // ✅ INFORMACIÓN DE PRECIOS (Fase 2)
        tiene_cambios_precio,
        items_con_cambio_precio: itemsConPrecioCambiado.map(item => ({
          id_item: item.id_item,
          id_producto: item.id_producto,
          nombre_producto: item.producto?.nombre,
          precio_guardado: item.precio_guardado,
          precio_actual: item.precio_actual,
          diferencia_precio: item.diferencia_precio,
          porcentaje_cambio: item.porcentaje_cambio,
          subtotal_guardado: item.subtotal_guardado,
          subtotal_actual: item.subtotal_actual
        }))
      };

      return res.json({ carrito: carritoResponse });

    } catch (error) {
      logger.error('Error al obtener carrito:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined,
        cliente_id: req.usuario?.id
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
      const id_cliente = req.usuario?.id;

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

      // ✅ CALCULAR PRECIOS COMPLETOS (Fase 2 - Revalidación de Precios)
      const preciosActuales = CarritoController.calcularPrecioActualCompleto(producto);

      // Usar precio final calculado
      const precio_unitario = preciosActuales.precio_final;
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
          // ✅ ACTUALIZAR CAMPOS DE AUDITORÍA (Fase 2)
          precio_base_original: preciosActuales.precio_original,
          precio_con_oferta_original: preciosActuales.precio_oferta,
          descuento_porcentaje_original: preciosActuales.descuento_porcentaje,
          id_oferta_aplicada: preciosActuales.id_oferta_aplicada,
          precio_es_manual: false,
          fyh_precio_validado: new Date(),
          precio_ha_cambiado: false,  // Resetear flag al actualizar
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
          // ✅ GUARDAR CAMPOS DE AUDITORÍA (Fase 2 - Revalidación de Precios)
          precio_base_original: preciosActuales.precio_original,
          precio_con_oferta_original: preciosActuales.precio_oferta,
          descuento_porcentaje_original: preciosActuales.descuento_porcentaje,
          id_oferta_aplicada: preciosActuales.id_oferta_aplicada,
          precio_es_manual: false,
          fyh_precio_validado: new Date(),
          precio_ha_cambiado: false,
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
                  attributes: ['precio_oferta', 'es_precio_personalizado']
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
        cliente_id: req.usuario?.id,
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
      const id_cliente = req.usuario?.id;

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
                  attributes: ['precio_oferta', 'es_precio_personalizado']
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

      // ✅ CALCULAR PRECIOS ACTUALES (Fase 2 - Revalidación de Precios)
      const preciosActuales = CarritoController.calcularPrecioActualCompleto(item.producto!);

      // Usar precio final calculado
      const precio_unitario = preciosActuales.precio_final;

      // Actualizar cantidad y subtotal con el precio correcto
      const nuevoSubtotal = precio_unitario * cantidad;
      await item.update({
        cantidad,
        subtotal: nuevoSubtotal,
        precio_unitario, // Actualizar también el precio unitario por si cambió la oferta
        // ✅ ACTUALIZAR CAMPOS DE AUDITORÍA (Fase 2)
        precio_base_original: preciosActuales.precio_original,
        precio_con_oferta_original: preciosActuales.precio_oferta,
        descuento_porcentaje_original: preciosActuales.descuento_porcentaje,
        id_oferta_aplicada: preciosActuales.id_oferta_aplicada,
        precio_es_manual: false,
        fyh_precio_validado: new Date(),
        precio_ha_cambiado: false,  // Resetear flag al actualizar
        fyh_actualizacion: new Date()
      });

      // Recalcular total del carrito
      const carrito = item.carrito!;
      const nuevoTotal = await carrito.calcularTotal();
      await carrito.update({
        total_carrito: nuevoTotal,
        fyh_actualizacion: new Date()
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
        cliente_id: req.usuario?.id,
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
      const id_cliente = req.usuario?.id;

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

      return res.json({
        mensaje: 'Producto eliminado del carrito',
        total_carrito: nuevoTotal
      });

    } catch (error) {
      logger.error('Error al eliminar item:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined,
        cliente_id: req.usuario?.id,
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
      const id_cliente = req.usuario?.id;

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

      return res.json({
        mensaje: 'Carrito vaciado exitosamente',
        total_carrito: 0.00
      });

    } catch (error) {
      logger.error('Error al vaciar carrito:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined,
        cliente_id: req.usuario?.id
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
    // Crear transacción para garantizar atomicidad de la operación
    const transaction = await sequelize.transaction();

    try {
      const { observaciones, moneda = 'ARS', metodo_pago, aceptar_cambio_precio = false,
              tipo_entrega = 'retiro_en_tienda', id_direccion = null } = req.body;
      const id_cliente = req.usuario?.id;

      if (!id_cliente) {
        return res.status(401).json({ mensaje: 'Cliente no autenticado' });
      }

      logger.debug(`Confirmando compra - Cliente: ${id_cliente}, Acepta cambios: ${aceptar_cambio_precio}`);

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

      // ✅ REVALIDAR PRECIOS ANTES DE CONFIRMAR (Fase 2)
      const itemsConPreciosActuales = await Promise.all(
        carrito.items.map(async (item) => {
          const productoActual = await Almacen.findByPk(item.id_producto, {
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
                  attributes: ['precio_oferta', 'es_precio_personalizado']
                },
                attributes: ['id_oferta', 'nombre_oferta', 'tipo_descuento', 'valor_descuento']
              }
            ]
          });

          const preciosActuales = CarritoController.calcularPrecioActualCompleto(productoActual!);

          return {
            item,
            precio_guardado: parseFloat(item.precio_unitario.toString()),
            precio_actual: preciosActuales.precio_final,
            diferencia: preciosActuales.precio_final - parseFloat(item.precio_unitario.toString()),
            cambio_significativo: Math.abs(
              ((preciosActuales.precio_final - parseFloat(item.precio_unitario.toString())) / parseFloat(item.precio_unitario.toString())) * 100
            ) > 1  // Cambio > 1%
          };
        })
      );

      // Detectar items con cambios de precio significativos
      const itemsConCambio = itemsConPreciosActuales.filter(i => i.cambio_significativo);

      if (itemsConCambio.length > 0 && !aceptar_cambio_precio) {
        // ✅ RECHAZAR COMPRA SI HAY CAMBIOS Y NO SE ACEPTARON
        const detallesCambios = itemsConCambio.map(i => ({
          id_item: i.item.id_item,
          nombre_producto: i.item.producto?.nombre,
          precio_anterior: i.precio_guardado,
          precio_nuevo: i.precio_actual,
          diferencia: i.diferencia,
          porcentaje_cambio: ((i.diferencia / i.precio_guardado) * 100).toFixed(2)
        }));

        logger.warn('Compra rechazada por cambio de precios', {
          cliente_id: id_cliente,
          items_con_cambio: detallesCambios
        });

        return res.status(400).json({
          codigo: 'PRECIOS_CAMBIARON',
          mensaje: 'Los precios de algunos productos han cambiado. Por favor, revisa tu carrito y confirma nuevamente.',
          items_con_cambio: detallesCambios,
          requiere_confirmacion: true
        });
      }

      // ✅ ACTUALIZAR ITEMS CON PRECIOS ACTUALES
      for (const itemConPrecio of itemsConPreciosActuales) {
        if (itemConPrecio.cambio_significativo) {
          await CarritoWebItems.update({
            precio_unitario: itemConPrecio.precio_actual,
            subtotal: itemConPrecio.precio_actual * itemConPrecio.item.cantidad,
            precio_ha_cambiado: true,
            fyh_actualizacion: new Date()
          }, {
            where: { id_item: itemConPrecio.item.id_item },
            transaction
          });
        }
      }

      // Recalcular total con precios actuales
      const totalActualizado = itemsConPreciosActuales.reduce(
        (sum, i) => sum + (i.precio_actual * i.item.cantidad),
        0
      );

      // Generar número de venta
      const ultimaVenta = await Venta.findOne({
        order: [['nro_venta', 'DESC']],
        transaction
      });
      const nroVenta = ultimaVenta ? ultimaVenta.nro_venta + 1 : 1;

      // Obtener tipo de cambio vigente (siempre, para snapshot de auditoría y conversión ARS)
      const tcConfig = await Configuracion.findByPk('tipo_cambio_usd', { transaction });
      const tipoCambio = tcConfig ? parseFloat(tcConfig.valor) : 1200.00;
      const valor_dolar = tipoCambio;

      // Calcular total en la moneda de pago (ARS requiere conversión desde USD)
      const totalPagadoFinal = moneda === 'ARS'
        ? Math.round(totalActualizado * tipoCambio)
        : totalActualizado;

      // ✅ CREAR VENTA CON TOTAL ACTUALIZADO (Fase 2)
      const venta = await Venta.create({
        nro_venta: nroVenta,
        id_cliente,
        id_carrito_web: carrito.id_carrito,
        tipo_venta: 'web',
        estado: 'completada',
        total_pagado: totalPagadoFinal,
        observaciones,
        moneda,
        metodo_pago: metodo_pago || null,
        valor_dolar,
        fyh_creacion: new Date(),
        fyh_actualizacion: new Date()
      }, { transaction });

      // Crear registro logístico en tb_envios
      await Envio.create({
        id_venta:          venta.id_venta,
        tipo_entrega,
        id_direccion:      tipo_entrega === 'envio' ? (id_direccion || null) : null,
        estado_envio:      tipo_entrega === 'envio' ? 'pendiente' : 'no_aplica',
        fyh_creacion:      new Date(),
        fyh_actualizacion: new Date()
      }, { transaction });

      // ✅ CREAR SNAPSHOT PERMANENTE EN tb_venta_items
      // Registro histórico de los productos vendidos con precio fijo al momento de la compra
      // Los precios se almacenan en la moneda de pago (ARS = USD × tipoCambio)
      for (const itemConPrecio of itemsConPreciosActuales) {
        const { item } = itemConPrecio;
        const precioUnitarioUSD = itemConPrecio.precio_actual;
        const precioUnitarioFinal = moneda === 'ARS'
          ? Math.round(precioUnitarioUSD * tipoCambio)
          : precioUnitarioUSD;
        const subtotalFinal = moneda === 'ARS'
          ? Math.round(precioUnitarioUSD * item.cantidad * tipoCambio)
          : precioUnitarioUSD * item.cantidad;

        await VentaItem.create({
          id_venta: venta.id_venta,
          id_producto: item.id_producto,
          cantidad: item.cantidad,
          precio_unitario: precioUnitarioFinal,
          subtotal: subtotalFinal,
          fyh_creacion: new Date()
        }, { transaction });
      }

      // Actualizar stock de productos
      for (const item of carrito.items) {
        await Almacen.update(
          {
            stock: item.producto!.stock - item.cantidad,
            fyh_actualizacion: new Date()
          },
          {
            where: { id_producto: item.id_producto },
            transaction
          }
        );
      }

      // Marcar carrito como completado
      await carrito.update({
        estado: 'completado',
        fyh_actualizacion: new Date()
      }, { transaction });

      // Confirmar transacción - todas las operaciones fueron exitosas
      await transaction.commit();

      // Email de confirmación de compra al cliente (no bloqueante)
      Cliente.findByPk(id_cliente, {
        attributes: ['email_cliente', 'nombre_cliente']
      }).then(cliente => {
        if (cliente?.email_cliente) {
          sendOrderConfirmationEmail(cliente.email_cliente, {
            nro_venta:      `V-${nroVenta.toString().padStart(5, '0')}`,
            nombre_cliente: cliente.nombre_cliente,
            total_pagado:   totalActualizado,
            items: (carrito.items || []).map(item => ({
              nombre_producto: item.producto?.nombre || 'Producto',
              cantidad:        item.cantidad,
              precio_unitario: item.precio_unitario,
              subtotal:        item.subtotal
            }))
          }).catch(err => logger.error('Error enviando email de confirmación de compra:', { error: err.message }));
        }
      }).catch(err => logger.error('Error buscando cliente para email confirmación:', { error: err.message }));

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
      // Revertir transacción en caso de error
      await transaction.rollback();

      logger.error('Error al confirmar compra (ROLLBACK ejecutado):', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined,
        cliente_id: req.usuario?.id,
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
      const id_cliente = req.usuario?.id;
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
        cliente_id: req.usuario?.id
      });
      return res.status(500).json({ mensaje: 'Error al obtener el historial', error });
    }
  }
} 