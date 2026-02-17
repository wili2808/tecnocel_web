import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Oferta from '../models/Oferta.js';
import ProductoOferta from '../models/ProductoOferta.js';
import Almacen from '../models/Almacen.js';
import Marca from '../models/Marca.js';
import Categoria from '../models/Categoria.js';
import ProductoImagen from '../models/ProductoImagen.js';
import { getImageService } from '../services/imageService.js';
import logger from '../services/loggerService.js';
import { enriquecerProductoConOferta, prepararDatosProductoOferta } from '../services/ofertaService.js';

/**
 * Controlador para gestión de ofertas y descuentos de productos
 *
 * Maneja el sistema completo de ofertas y promociones:
 * - CRUD de ofertas con validación de fechas
 * - Asignación de productos a ofertas (relación muchos a muchos)
 * - Cálculo de precios con descuento (porcentaje o monto fijo)
 * - Filtrado de ofertas activas por fechas
 * - Listado de productos en oferta con precios calculados
 *
 * Las ofertas pueden tener descuento por porcentaje o monto fijo,
 * y se pueden asignar múltiples productos con precios de oferta específicos.
 *
 * @class OfertaController
 */
export class OfertaController {
  /**
   * Obtiene todas las ofertas activas vigentes
   *
   * Endpoint público que retorna ofertas activas cuya fecha actual esté entre
   * fecha_inicio y fecha_fin. Las ofertas se ordenan por fecha de creación descendente.
   *
   * @param req - Express Request object
   * @param res - Express Response object
   * @returns 200 con { success, data, count } array de ofertas activas
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * GET /api/ofertas/activas
   * Response: {
   *   success: true,
   *   data: [
   *     {
   *       id_oferta: 1,
   *       nombre_oferta: "Black Friday 2024",
   *       tipo_descuento: "porcentaje",
   *       valor_descuento: 20,
   *       fecha_inicio: "2024-11-25",
   *       fecha_fin: "2024-11-30"
   *     }
   *   ],
   *   count: 1
   * }
   */
  static async getOfertasActivas(req: Request, res: Response) {
    try {
      const now = new Date();
      
      const ofertas = await Oferta.findAll({
        where: {
          activo: true,
          fecha_inicio: { [Op.lte]: now },
          fecha_fin: { [Op.gte]: now }
        },
        order: [['fyh_creacion', 'DESC']]
      });

      res.locals.skipHttpLog = true;
      
      logger.info('Ofertas activas obtenidas exitosamente', {
        operacion: 'obtener_ofertas_activas',
        cantidad: ofertas.length,
        success: true
      });

      res.json({
        success: true,
        data: ofertas,
        count: ofertas.length
      });
    } catch (error) {
      logger.error('Error obteniendo ofertas activas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Obtiene productos que están en oferta activa con precios calculados
   *
   * Endpoint público que retorna productos asociados a ofertas vigentes con:
   * - Información completa del producto (categoría, marca, imágenes)
   * - Precio original y precio de oferta calculado
   * - Porcentaje de descuento
   * - Paginación (limit y offset)
   * - URLs de imágenes transformadas
   *
   * El precio de oferta se calcula automáticamente según el tipo de descuento
   * (porcentaje o monto fijo), o se usa el precio específico si está definido
   * en ProductoOferta.
   *
   * @param req - Express Request con query {limit?, offset?}
   * @param res - Express Response object
   * @returns 200 con { success, data, pagination } productos en oferta con precios calculados
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * GET /api/ofertas/productos?limit=20&offset=0
   * Response: {
   *   success: true,
   *   data: [
   *     {
   *       id_producto: 123,
   *       nombre: "iPhone 13",
   *       precio_original: 999,
   *       precio_oferta: 799.2,
   *       descuento_porcentaje: "20.0",
   *       en_oferta: true,
   *       ofertas: [...]
   *     }
   *   ],
   *   pagination: { total: 45, limit: 20, offset: 0, pages: 3 }
   * }
   */
  static async getProductosEnOferta(req: Request, res: Response) {
    try {
      const { limit = 20, offset = 0 } = req.query;
      const now = new Date();

      const productosEnOferta = await Almacen.findAndCountAll({
        include: [
          {
            model: Oferta,
            as: 'ofertas',
            where: {
              activo: true,
              fecha_inicio: { [Op.lte]: now },
              fecha_fin: { [Op.gte]: now }
            },
            through: {
              attributes: ['precio_oferta', 'es_precio_personalizado']
            }
          },
          {
            model: Categoria,
            as: 'Categoria',
            attributes: ['nombre_categoria']
          },
          {
            model: Marca,
            as: 'marca',
            attributes: ['nombre_marca']
          },
          {
            model: ProductoImagen,
            as: 'imagenes',
            attributes: ['url_imagen', 'alt_text', 'es_principal', 'orden']
          }
        ],
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        order: [['fyh_actualizacion', 'DESC']]
      });

      // Obtener servicio de imágenes (sin logging innecesario)
      const imageService = getImageService();
      if (!imageService) {
        logger.warn('Servicio de imágenes no disponible para productos en oferta');
      }

      // Calcular precios con descuento y transformar imágenes usando servicio de ofertas
      const productosConDescuento = await Promise.all(productosEnOferta.rows.map(async producto => {
        const productoJson = producto.toJSON() as any;

        // Enriquecer producto con información de oferta usando lógica híbrida
        const productoConOferta = enriquecerProductoConOferta(productoJson);

        // Transformar las imágenes usando el imageService
        if (imageService) {
          const productoConImagenes = await imageService.transformProductWithImageUrls(productoConOferta);
          return productoConImagenes;
        }

        return productoConOferta;
      }));

      res.locals.skipHttpLog = true;
      
      logger.info('Productos en oferta obtenidos exitosamente', {
        operacion: 'obtener_productos_oferta',
        cantidad: productosConDescuento.length,
        total: productosEnOferta.count,
        limit: parseInt(limit as string),
        success: true
      });

      res.json({
        success: true,
        data: productosConDescuento,
        pagination: {
          total: productosEnOferta.count,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          pages: Math.ceil(productosEnOferta.count / parseInt(limit as string))
        }
      });
    } catch (error) {
      logger.error('Error obteniendo productos en oferta:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Crea una nueva oferta (requiere admin)
   *
   * Endpoint protegido que crea una nueva oferta/promoción. Valida campos requeridos
   * y permite configurar:
   * - Tipo de descuento (porcentaje o monto fijo)
   * - Valor del descuento
   * - Fechas de vigencia (inicio y fin)
   * - Precios mínimo/máximo aplicables (opcional)
   * - Límite de uso (opcional)
   *
   * La oferta se crea con estado activo=true y uso_actual=0.
   *
   * @param req - Express Request con body {nombre_oferta, descripcion?, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin, precio_minimo?, precio_maximo?, limite_uso?}
   * @param res - Express Response object
   * @returns 201 con { success, message, data } oferta creada
   * @returns 400 si faltan campos requeridos
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * POST /api/ofertas
   * Body: {
   *   nombre_oferta: "Cyber Monday 2024",
   *   descripcion: "Descuentos increíbles en toda la tienda",
   *   tipo_descuento: "porcentaje",
   *   valor_descuento: 25,
   *   fecha_inicio: "2024-12-01T00:00:00Z",
   *   fecha_fin: "2024-12-02T23:59:59Z",
   *   precio_minimo: 100
   * }
   */
  static async createOferta(req: Request, res: Response) {
    try {
      const {
        nombre_oferta,
        descripcion,
        tipo_descuento,
        valor_descuento,
        fecha_inicio,
        fecha_fin,
        precio_minimo,
        precio_maximo,
        limite_uso
      } = req.body;

      if (!nombre_oferta || !tipo_descuento || !valor_descuento || !fecha_inicio || !fecha_fin) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos requeridos: nombre_oferta, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin'
        });
      }

      const now = new Date();

      const nuevaOferta = await Oferta.create({
        nombre_oferta,
        descripcion: descripcion || null,
        tipo_descuento,
        valor_descuento: parseFloat(valor_descuento),
        fecha_inicio: new Date(fecha_inicio),
        fecha_fin: new Date(fecha_fin),
        precio_minimo: precio_minimo ? parseFloat(precio_minimo) : null,
        precio_maximo: precio_maximo ? parseFloat(precio_maximo) : null,
        limite_uso: limite_uso ? parseInt(limite_uso) : null,
        activo: true,
        uso_actual: 0,
        fyh_creacion: now,
        fyh_actualizacion: now
      });

      logger.info(`Nueva oferta creada: ${nombre_oferta} (ID: ${nuevaOferta.id_oferta})`);

      res.status(201).json({
        success: true,
        message: 'Oferta creada exitosamente',
        data: nuevaOferta
      });
    } catch (error) {
      logger.error('Error creando oferta:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Asigna productos a una oferta existente (requiere admin)
   *
   * Endpoint protegido que asocia múltiples productos a una oferta mediante
   * la tabla intermedia ProductoOferta. Para cada producto:
   * - Verifica que el producto existe
   * - Calcula el precio de oferta si no se especifica
   * - Crea la asociación en ProductoOferta
   * - Maneja duplicados gracefully (ignora y continúa)
   *
   * El precio de oferta se calcula automáticamente según el tipo de descuento
   * de la oferta, o se puede especificar un precio_oferta personalizado.
   *
   * @param req - Express Request con params.id_oferta y body {productos: Array<{id_producto, precio_oferta?}>}
   * @param res - Express Response object
   * @returns 200 con { success, message, data } productos asignados exitosamente
   * @returns 400 si no se proporciona array de productos válido
   * @returns 404 si la oferta no existe
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * POST /api/ofertas/5/productos
   * Body: {
   *   productos: [
   *     { id_producto: 123, precio_oferta: 799 },
   *     { id_producto: 124 }  // Se calcula automáticamente
   *   ]
   * }
   * Response: {
   *   success: true,
   *   message: "2 productos asignados a la oferta",
   *   data: [...]
   * }
   */
  static async asignarProductosOferta(req: Request, res: Response) {
    try {
      const { id_oferta } = req.params;
      const { productos } = req.body; // Array de { id_producto, precio_oferta? }

      if (!productos || !Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un array de productos'
        });
      }

      const oferta = await Oferta.findByPk(id_oferta);
      if (!oferta) {
        return res.status(404).json({
          success: false,
          message: 'Oferta no encontrada'
        });
      }

      const now = new Date();
      const productosAsignados = [];

      for (const prod of productos) {
        const { id_producto, precio_oferta } = prod;

        // Verificar que el producto existe
        const producto = await Almacen.findByPk(id_producto);
        if (!producto) {
          logger.warn(`Producto no encontrado: ${id_producto}`);
          continue;
        }

        // Preparar datos usando lógica híbrida del servicio
        const datosProductoOferta = prepararDatosProductoOferta(
          parseFloat(producto.precio_venta),
          oferta,
          precio_oferta
        );

        try {
          const productoOferta = await ProductoOferta.create({
            id_producto,
            id_oferta: parseInt(id_oferta),
            precio_oferta: datosProductoOferta.precio_oferta,
            es_precio_personalizado: datosProductoOferta.es_precio_personalizado,
            fyh_creacion: now
          });

          productosAsignados.push(productoOferta);
        } catch (error: any) {
          if (error.message?.includes('Duplicate entry')) {
            logger.warn(`Producto ${id_producto} ya está en la oferta ${id_oferta}`);
          } else {
            logger.error(`Error asignando producto ${id_producto}:`, error);
          }
        }
      }

      logger.info(`${productosAsignados.length} productos asignados a oferta ${id_oferta}`);

      res.json({
        success: true,
        message: `${productosAsignados.length} productos asignados a la oferta`,
        data: productosAsignados
      });
    } catch (error) {
      logger.error('Error asignando productos a oferta:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Actualiza una oferta existente (requiere admin)
   *
   * Endpoint protegido que permite modificar cualquier campo de una oferta.
   * Actualiza automáticamente la fecha de actualización (fyh_actualizacion).
   *
   * @param req - Express Request con params.id y body con campos a actualizar
   * @param res - Express Response object
   * @returns 200 con { success, message, data } oferta actualizada
   * @returns 404 si la oferta no existe
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * PUT /api/ofertas/5
   * Body: {
   *   nombre_oferta: "Black Friday Extended",
   *   fecha_fin: "2024-12-05T23:59:59Z",
   *   valor_descuento: 30
   * }
   */
  static async updateOferta(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const datosActualizacion = req.body;

      const oferta = await Oferta.findByPk(id);
      if (!oferta) {
        return res.status(404).json({
          success: false,
          message: 'Oferta no encontrada'
        });
      }

      // Agregar fecha de actualización
      datosActualizacion.fyh_actualizacion = new Date();

      await oferta.update(datosActualizacion);

      logger.info(`Oferta actualizada: ${oferta.nombre_oferta} (ID: ${id})`);

      res.json({
        success: true,
        message: 'Oferta actualizada exitosamente',
        data: oferta
      });
    } catch (error) {
      logger.error('Error actualizando oferta:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  /**
   * Desactiva una oferta (soft delete) (requiere admin)
   *
   * Endpoint protegido que marca una oferta como inactiva (activo=false)
   * sin eliminarla permanentemente de la BD. Los productos asociados
   * a la oferta no se eliminan, solo la oferta deja de estar vigente.
   *
   * @param req - Express Request con params.id
   * @param res - Express Response object
   * @returns 200 con { success, message }
   * @returns 404 si la oferta no existe
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * DELETE /api/ofertas/5
   * Response: {
   *   success: true,
   *   message: "Oferta eliminada exitosamente"
   * }
   */
  static async deleteOferta(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const oferta = await Oferta.findByPk(id);
      if (!oferta) {
        return res.status(404).json({
          success: false,
          message: 'Oferta no encontrada'
        });
      }

      await oferta.update({
        activo: false,
        fyh_actualizacion: new Date()
      });

      logger.info(`Oferta desactivada: ${oferta.nombre_oferta} (ID: ${id})`);

      res.json({
        success: true,
        message: 'Oferta eliminada exitosamente'
      });
    } catch (error) {
      logger.error('Error eliminando oferta:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}