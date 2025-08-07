import { Request, Response } from 'express';
import Favorito from '../models/Favorito.js';
import Almacen from '../models/Almacen.js';
import Cliente from '../models/Cliente.js';
import Marca from '../models/Marca.js';
import Categoria from '../models/Categoria.js';
import logger from '../utils/logger.js';
import ProductoImagen from '../models/ProductoImagen.js';
import { getImageService } from '../services/imageService.js';

export class FavoritoController {
  // Obtener favoritos de un cliente
  static async getFavoritosCliente(req: Request, res: Response) {
    try {
      const { id_cliente } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      // Verificar que el cliente existe
      const cliente = await Cliente.findByPk(id_cliente);
      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      const favoritos = await Favorito.findAndCountAll({
        where: { id_cliente },
        include: [
          {
            model: Almacen,
            as: 'producto',
            include: [
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
                attributes: ['id_imagen', 'url_imagen', 'alt_text', 'es_principal', 'orden'],
                order: [['orden', 'ASC']]
              }
            ]
          }
        ],
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        order: [['fyh_creacion', 'DESC']]
      });

      // Obtener el servicio de imágenes
      const imageService = getImageService();
      
      // Debug: Verificar estado del servicio de imágenes
      logger.debug('Estado del servicio de imágenes en FavoritoController:', {
        imageServiceAvailable: !!imageService,
        imageServiceType: typeof imageService
      });

      // Transformar la respuesta para mapear url_imagen a url y generar imagen_url
      const favoritosTransformados = await Promise.all(favoritos.rows.map(async (favorito) => {
        const producto = favorito.get({ plain: true }).producto;
        
        if (producto && producto.imagenes) {
          // Transformar imágenes con estructura consistente
          producto.imagenes = producto.imagenes.map((imagen: any) => ({
            ...imagen,
            url: imagen.url_imagen // Mapear url_imagen a url para el frontend
          }));
          
          // Encontrar la imagen principal o usar la primera disponible
          const imagenPrincipal = producto.imagenes.find((img: any) => img.es_principal);
          const imagenDefault = imagenPrincipal || producto.imagenes[0];
          
          // Debug: Log de imagen encontrada
          logger.debug(`Procesando imagen para producto ${producto.id_producto}:`, {
            imagenDefault: imagenDefault?.url_imagen,
            esPrincipal: imagenDefault?.es_principal
          });
          
          // ✅ Generar imagen_url directamente sin depender del servicio
          if (imagenDefault && imagenDefault.url_imagen) {
            producto.imagen_url = `http://localhost:3000/api/images/${imagenDefault.url_imagen}`;
            logger.debug(`imagen_url generada: ${producto.imagen_url}`);
          } else {
            producto.imagen_url = null;
            logger.debug(`No se pudo generar imagen_url para producto ${producto.id_producto}`);
          }
          
          // Debug: Log de imágenes transformadas
          logger.debug(`Imágenes transformadas para producto ${producto.id_producto}:`, {
            total_imagenes: producto.imagenes.length,
            imagen_url: producto.imagen_url,
            imagenes: producto.imagenes.map((img: any) => ({
              url: img.url,
              es_principal: img.es_principal,
              orden: img.orden
            }))
          });
        } else {
          // Si no hay imágenes, establecer imagen_url como null
          producto.imagen_url = null;
          producto.imagenes = [];
          logger.debug(`Producto ${producto.id_producto} sin imágenes`);
        }
        
        return {
          ...favorito.get({ plain: true }),
          producto
        };
      }));

      res.json({
        success: true,
        data: favoritosTransformados,
        pagination: {
          total: favoritos.count,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          pages: Math.ceil(favoritos.count / parseInt(limit as string))
        }
      });
    } catch (error) {
      logger.error('Error obteniendo favoritos del cliente:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Verificar si un producto es favorito
  static async verificarFavorito(req: Request, res: Response) {
    try {
      const { id_cliente, id_producto } = req.params;

      const favorito = await Favorito.findOne({
        where: { id_cliente, id_producto }
      });

      res.json({
        success: true,
        esFavorito: !!favorito,
        data: favorito
      });
    } catch (error) {
      logger.error('Error verificando favorito:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Agregar producto a favoritos
  static async addFavorito(req: Request, res: Response) {
    try {
      const { id_cliente } = req.params;
      const { id_producto } = req.body;

      if (!id_producto) {
        return res.status(400).json({
          success: false,
          message: 'ID del producto es requerido'
        });
      }

      // Verificar que el cliente existe
      const cliente = await Cliente.findByPk(id_cliente);
      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: 'Cliente no encontrado'
        });
      }

      // Verificar que el producto existe
      const producto = await Almacen.findByPk(id_producto);
      if (!producto) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      // Verificar si ya es favorito
      const favoritoExistente = await Favorito.findOne({
        where: { id_cliente, id_producto }
      });

      if (favoritoExistente) {
        return res.status(409).json({
          success: false,
          message: 'El producto ya está en favoritos'
        });
      }

      const nuevoFavorito = await Favorito.create({
        id_cliente: parseInt(id_cliente),
        id_producto: parseInt(id_producto),
        fyh_creacion: new Date()
      });

      // Obtener el favorito completo con datos del producto
      const favoritoCompleto = await Favorito.findByPk(nuevoFavorito.id_favorito, {
        include: [
          {
            model: Almacen,
            as: 'producto',
            include: [
              {
                model: Categoria,
                attributes: ['nombre_categoria']
              },
              {
                model: Marca,
                as: 'marca',
                attributes: ['nombre_marca']
              }
            ]
          }
        ]
      });

      logger.info(`Producto agregado a favoritos - Cliente: ${id_cliente}, Producto: ${id_producto}`);

      res.status(201).json({
        success: true,
        message: 'Producto agregado a favoritos',
        data: favoritoCompleto
      });
    } catch (error) {
      logger.error('Error agregando favorito:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Eliminar producto de favoritos
  static async removeFavorito(req: Request, res: Response) {
    try {
      const { id_cliente, id_producto } = req.params;

      const favorito = await Favorito.findOne({
        where: { id_cliente, id_producto }
      });

      if (!favorito) {
        return res.status(404).json({
          success: false,
          message: 'El producto no está en favoritos'
        });
      }

      await favorito.destroy();

      logger.info(`Producto removido de favoritos - Cliente: ${id_cliente}, Producto: ${id_producto}`);

      res.json({
        success: true,
        message: 'Producto removido de favoritos'
      });
    } catch (error) {
      logger.error('Error removiendo favorito:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Alternar favorito (agregar/quitar)
  static async toggleFavorito(req: Request, res: Response) {
    try {
      const { id_cliente, id_producto } = req.params;

      const favoritoExistente = await Favorito.findOne({
        where: { id_cliente, id_producto }
      });

      if (favoritoExistente) {
        // Remover de favoritos
        await favoritoExistente.destroy();
        
        logger.info(`Producto removido de favoritos - Cliente: ${id_cliente}, Producto: ${id_producto}`);
        
        return res.json({
          success: true,
          message: 'Producto removido de favoritos',
          action: 'removed',
          esFavorito: false
        });
      } else {
        // Verificar que cliente y producto existen
        const cliente = await Cliente.findByPk(id_cliente);
        const producto = await Almacen.findByPk(id_producto);

        if (!cliente) {
          return res.status(404).json({
            success: false,
            message: 'Cliente no encontrado'
          });
        }

        if (!producto) {
          return res.status(404).json({
            success: false,
            message: 'Producto no encontrado'
          });
        }

        // Agregar a favoritos
        const nuevoFavorito = await Favorito.create({
          id_cliente: parseInt(id_cliente),
          id_producto: parseInt(id_producto),
          fyh_creacion: new Date()
        });

        logger.info(`Producto agregado a favoritos - Cliente: ${id_cliente}, Producto: ${id_producto}`);

        return res.status(201).json({
          success: true,
          message: 'Producto agregado a favoritos',
          action: 'added',
          esFavorito: true,
          data: nuevoFavorito
        });
      }
    } catch (error) {
      logger.error('Error alternando favorito:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }

  // Obtener estadísticas de favoritos
  static async getEstadisticasFavoritos(req: Request, res: Response) {
    try {
      const { id_cliente } = req.params;

      const totalFavoritos = await Favorito.count({
        where: { id_cliente }
      });

      // Favoritos por categoría
      const favoritosPorCategoria = await Favorito.findAll({
        where: { id_cliente },
        include: [
          {
            model: Almacen,
            as: 'producto',
            include: [
              {
                model: Categoria,
                attributes: ['id_categoria', 'nombre_categoria']
              }
            ]
          }
        ],
        raw: false
      });

      const categorias: { [key: string]: number } = {};
      favoritosPorCategoria.forEach((fav: any) => {
        const categoria = fav.producto?.Categoria?.nombre_categoria || 'Sin categoría';
        categorias[categoria] = (categorias[categoria] || 0) + 1;
      });

      res.json({
        success: true,
        data: {
          total: totalFavoritos,
          porCategoria: categorias
        }
      });
    } catch (error) {
      logger.error('Error obteniendo estadísticas de favoritos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}