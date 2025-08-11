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

export class OfertaController {
  // Obtener ofertas activas
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

  // Obtener productos en oferta
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
              attributes: ['precio_oferta']
            }
          },
          {
            model: Categoria,
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

      // Calcular precios con descuento y transformar imágenes
      const productosConDescuento = await Promise.all(productosEnOferta.rows.map(async producto => {
        const productoJson = producto.toJSON() as any;
        
        // Agregar la información de ofertas primero
        if (productoJson.ofertas && productoJson.ofertas.length > 0) {
          const oferta = productoJson.ofertas[0];
          const precioOriginal = parseFloat(productoJson.precio_venta);
          let precioFinal = precioOriginal;
          
          if (oferta.ProductoOferta?.precio_oferta) {
            precioFinal = parseFloat(oferta.ProductoOferta.precio_oferta);
          } else {
            // Calcular descuento según tipo
            if (oferta.tipo_descuento === 'porcentaje') {
              precioFinal = precioOriginal * (1 - parseFloat(oferta.valor_descuento) / 100);
            } else {
              precioFinal = precioOriginal - parseFloat(oferta.valor_descuento);
            }
          }
          
          productoJson.precio_original = precioOriginal;
          productoJson.precio_oferta = Math.max(0, precioFinal);
          productoJson.descuento_porcentaje = ((precioOriginal - precioFinal) / precioOriginal * 100).toFixed(1);
          productoJson.en_oferta = true;
        }
        
        // Luego transformar las imágenes usando el imageService
        if (imageService) {
          const productoConImagenes = await imageService.transformProductWithImageUrls(productoJson);
          return productoConImagenes;
        }
        
        return productoJson;
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

  // Crear nueva oferta (admin)
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

  // Asignar productos a una oferta
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

        let precioFinalOferta = precio_oferta;
        
        // Si no se especifica precio_oferta, calcularlo
        if (!precio_oferta) {
          const precioOriginal = parseFloat(producto.precio_venta);
          if (oferta.tipo_descuento === 'porcentaje') {
            precioFinalOferta = precioOriginal * (1 - oferta.valor_descuento / 100);
          } else {
            precioFinalOferta = precioOriginal - oferta.valor_descuento;
          }
          precioFinalOferta = Math.max(0, precioFinalOferta);
        }

        try {
          const productoOferta = await ProductoOferta.create({
            id_producto,
            id_oferta: parseInt(id_oferta),
            precio_oferta: precioFinalOferta,
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

  // Actualizar oferta
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

  // Desactivar oferta
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