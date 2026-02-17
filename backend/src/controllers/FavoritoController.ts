import { Request, Response } from 'express';
import Favorito from '../models/Favorito.js';
import Almacen from '../models/Almacen.js';
import Cliente from '../models/Cliente.js';
import Marca from '../models/Marca.js';
import Categoria from '../models/Categoria.js';
import logger from '../services/loggerService.js';
import ProductoImagen from '../models/ProductoImagen.js';
import { getImageService } from '../services/imageService.js';

/**
 * Controlador para gestión de productos favoritos
 *
 * Maneja la lista de deseos (wishlist) de los clientes permitiendo:
 * - Obtener favoritos con paginación
 * - Agregar/remover productos de favoritos
 * - Alternar estado de favorito (toggle)
 * - Verificar si un producto es favorito
 * - Obtener estadísticas de favoritos
 *
 * Todos los endpoints requieren autenticación de cliente.
 *
 * @class FavoritoController
 */
export class FavoritoController {
  /**
   * Obtiene la lista de productos favoritos de un cliente
   *
   * Endpoint protegido que retorna los favoritos del cliente con información
   * completa de productos, incluyendo imágenes transformadas, categoría y marca.
   * Soporta paginación para listas grandes.
   *
   * @param req - Express Request con params.id_cliente y query params
   * @param req.params.id_cliente - ID del cliente (requerido)
   * @param req.query.limit - Límite de resultados por página (default: 20)
   * @param req.query.offset - Offset para paginación (default: 0)
   * @param res - Express Response object
   * @returns 200 con { success, data, pagination }
   * @returns 404 si el cliente no existe
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * GET /api/favoritos/cliente/5?limit=10&offset=0
   *
   * Response 200: {
   *   "success": true,
   *   "data": [
   *     {
   *       "id_favorito": 1,
   *       "id_cliente": 5,
   *       "id_producto": 10,
   *       "fyh_creacion": "2025-10-14T...",
   *       "producto": {
   *         "id_producto": 10,
   *         "nombre": "iPhone 13",
   *         "precio_venta": 999.99,
   *         "imagen_url": "http://localhost:3000/api/images/iphone13.jpg",
   *         "Categoria": { "nombre_categoria": "Smartphones" },
   *         "marca": { "nombre_marca": "Apple" }
   *       }
   *     }
   *   ],
   *   "pagination": {
   *     "total": 25,
   *     "limit": 10,
   *     "offset": 0,
   *     "pages": 3
   *   }
   * }
   */
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

  /**
   * Verifica si un producto específico es favorito de un cliente
   *
   * Endpoint útil para el frontend para mostrar el estado correcto
   * del botón/ícono de favorito en la UI.
   *
   * @param req - Express Request con params
   * @param req.params.id_cliente - ID del cliente
   * @param req.params.id_producto - ID del producto a verificar
   * @param res - Express Response object
   * @returns 200 con { success, esFavorito, data }
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * GET /api/favoritos/cliente/5/producto/10
   *
   * Response 200: {
   *   "success": true,
   *   "esFavorito": true,
   *   "data": { "id_favorito": 1, ... }
   * }
   */
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

  /**
   * Agrega un producto a la lista de favoritos del cliente
   *
   * Endpoint protegido que añade un producto a favoritos con validaciones:
   * - Cliente debe existir
   * - Producto debe existir
   * - No permite duplicados (409 si ya es favorito)
   *
   * @param req - Express Request con params y body
   * @param req.params.id_cliente - ID del cliente
   * @param req.body.id_producto - ID del producto a agregar (requerido)
   * @param res - Express Response object
   * @returns 201 con { success, message, data } si se agrega exitosamente
   * @returns 400 si falta id_producto
   * @returns 404 si cliente o producto no existen
   * @returns 409 si el producto ya está en favoritos
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * POST /api/favoritos/cliente/5
   * Body: { "id_producto": 10 }
   *
   * Response 201: {
   *   "success": true,
   *   "message": "Producto agregado a favoritos",
   *   "data": { ... }
   * }
   */
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
                as: 'Categoria',
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

  /**
   * Elimina un producto de la lista de favoritos del cliente
   *
   * Endpoint protegido que remueve un producto específico de favoritos.
   *
   * @param req - Express Request con params
   * @param req.params.id_cliente - ID del cliente
   * @param req.params.id_producto - ID del producto a remover
   * @param res - Express Response object
   * @returns 200 con { success, message } si se elimina exitosamente
   * @returns 404 si el producto no está en favoritos
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * DELETE /api/favoritos/cliente/5/producto/10
   *
   * Response 200: {
   *   "success": true,
   *   "message": "Producto removido de favoritos"
   * }
   */
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

      // Marcar para evitar log HTTP duplicado
      res.locals.skipHttpLog = true;
      
      logger.info('Producto removido de favoritos', {
        operacion: 'remover_favorito',
        cliente_id: id_cliente,
        producto_id: id_producto,
        success: true
      });

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

  /**
   * Alterna el estado de favorito de un producto (toggle)
   *
   * Endpoint de conveniencia que agrega o remueve un producto de favoritos
   * en una sola operación. Si está en favoritos lo remueve, si no lo agrega.
   *
   * Útil para implementar botones de favorito con un solo clic.
   *
   * @param req - Express Request con params
   * @param req.params.id_cliente - ID del cliente
   * @param req.params.id_producto - ID del producto a alternar
   * @param res - Express Response object
   * @returns 200 con { success, message, action: 'removed', esFavorito: false } si remueve
   * @returns 201 con { success, message, action: 'added', esFavorito: true } si agrega
   * @returns 404 si cliente o producto no existen (al agregar)
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * POST /api/favoritos/cliente/5/producto/10/toggle
   *
   * Response 200 (removido): {
   *   "success": true,
   *   "message": "Producto removido de favoritos",
   *   "action": "removed",
   *   "esFavorito": false
   * }
   *
   * Response 201 (agregado): {
   *   "success": true,
   *   "message": "Producto agregado a favoritos",
   *   "action": "added",
   *   "esFavorito": true
   * }
   */
  static async toggleFavorito(req: Request, res: Response) {
    try {
      const { id_cliente, id_producto } = req.params;

      const favoritoExistente = await Favorito.findOne({
        where: { id_cliente, id_producto }
      });

      if (favoritoExistente) {
        // Remover de favoritos
        await favoritoExistente.destroy();
        
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

  /**
   * Obtiene estadísticas de los favoritos de un cliente
   *
   * Endpoint que retorna métricas útiles sobre los favoritos:
   * - Total de productos en favoritos
   * - Distribución por categorías
   *
   * Útil para dashboards o analíticas del cliente.
   *
   * @param req - Express Request con params.id_cliente
   * @param res - Express Response object
   * @returns 200 con { success, data: { total, porCategoria } }
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * GET /api/favoritos/cliente/5/estadisticas
   *
   * Response 200: {
   *   "success": true,
   *   "data": {
   *     "total": 25,
   *     "porCategoria": {
   *       "Smartphones": 10,
   *       "Laptops": 8,
   *       "Accesorios": 7
   *     }
   *   }
   * }
   */
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
                as: 'Categoria',
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