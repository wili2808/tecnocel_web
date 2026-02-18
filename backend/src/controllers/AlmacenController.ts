import { Request, Response } from 'express';
import { Op } from 'sequelize';
// Modelos
import Almacen from '../models/Almacen.js';
import Categoria from '../models/Categoria.js';
import Usuario from '../models/Usuario.js';
import Marca from '../models/Marca.js';
import TipoCaracteristica from '../models/TipoCaracteristica.js';
import ProductoCaracteristica from '../models/ProductoCaracteristica.js';
import Oferta from '../models/Oferta.js';
import ProductoImagen from '../models/ProductoImagen.js';
// Servicios
import logger from '../services/loggerService.js';
import { getImageService } from '../services/imageService.js';
import { enriquecerProductoConOferta } from '../services/ofertaService.js';

/**
 * Controlador para gestión del catálogo de productos del almacén
 *
 * Maneja todas las operaciones CRUD de productos, búsqueda, filtrado,
 * y transformación de URLs de imágenes mediante el servicio de imágenes.
 *
 * @class AlmacenController
 */
class AlmacenController {

  /**
   * Transforma una lista de productos agregando URLs completas de imágenes
   *
   * Método helper privado que procesa un array de productos y enriquece cada uno
   * con URLs de imágenes completas usando el servicio de imágenes. Maneja
   * gracefully la ausencia del servicio de imágenes retornando productos sin
   * transformar en caso de error.
   *
   * @private
   * @param productos - Array de productos Sequelize a transformar
   * @returns Promise que resuelve con array de productos transformados con URLs de imágenes
   *
   * @example
   * const productos = await Almacen.findAll();
   * const conImagenes = await this.transformProductsWithImages(productos);
   * // conImagenes[0].imagen_url = "http://localhost:3000/api/uploads/productos/imagen.jpg"
   */
  private async transformProductsWithImages(productos: any[]): Promise<any[]> {
    try {
      if (!productos || productos.length === 0) {
        return [];
      }

      const imageService = getImageService();
      if (!imageService) {
        logger.warn('Servicio de imágenes no disponible, devolviendo productos sin URLs de imagen');
        return productos.map(p => p.toJSON ? p.toJSON() : p);
      }
      
      return await imageService.transformProductsWithImageUrls(productos);
    } catch (error) {
      logger.error('Error al transformar productos con imágenes:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        productCount: productos ? productos.length : 0,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      return productos ? productos.map(p => p.toJSON ? p.toJSON() : p) : [];
    }
  }

  /**
   * Transforma un producto individual agregando URLs completas de imágenes
   *
   * Similar a transformProductsWithImages pero para un solo producto.
   * Agrega URLs completas de imágenes usando el servicio de imágenes.
   * Si el servicio no está disponible, retorna el producto sin transformar.
   *
   * @private
   * @param producto - Producto Sequelize individual a transformar
   * @returns Promise que resuelve con el producto transformado con URLs de imágenes
   *
   * @example
   * const producto = await Almacen.findByPk(1);
   * const conImagen = await this.transformProductWithImage(producto);
   * // conImagen.imagen_url = "http://localhost:3000/api/uploads/productos/imagen.jpg"
   */
  private async transformProductWithImage(producto: any): Promise<any> {
    try {
      const imageService = getImageService();
      if (!imageService) {
        logger.warn('Servicio de imágenes no disponible, devolviendo producto sin URL de imagen');
        return producto.toJSON ? producto.toJSON() : producto;
      }
      
      return await imageService.transformProductWithImageUrls(producto);
    } catch (error) {
      logger.error('Error al transformar producto individual con imagen:', {
        productId: producto.id_producto || 'unknown',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      
      return producto.toJSON ? producto.toJSON() : producto;
    }
  }

  /**
   * Obtiene todos los productos del almacén con información relacionada
   *
   * Endpoint público que retorna el catálogo completo de productos incluyendo:
   * - Información de categoría
   * - Usuario creador
   * - Marca con logo
   * - Características del producto
   * - Ofertas activas vigentes
   * - Imágenes del producto
   *
   * Las URLs de imágenes son transformadas a URLs completas mediante imageService.
   * Las ofertas son filtradas por fecha actual y estado activo.
   *
   * @param req - Express Request object
   * @param res - Express Response object
   * @returns 200 con array de productos transformados
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * GET /api/almacen/productos
   * Response: [{ id_producto: 1, nombre: "iPhone 13", imagen_url: "...", ofertas: [...] }]
   */
  async getProducts(req: Request, res: Response) {
    try {
      logger.debug('Obteniendo lista de productos del almacén');
      const now = new Date();
      
      const productos = await Almacen.findAll({
        include: [
          { 
            model: Categoria,
            as: 'Categoria',
            attributes: ['nombre_categoria']
          },
          { 
            model: Usuario, 
            attributes: ['nombres'] 
          },
          {
            model: Marca,
            as: 'marca',
            attributes: ['nombre_marca', 'logo_marca']
          },
          {
            model: TipoCaracteristica,
            as: 'caracteristicas',
            through: {
              attributes: ['valor']
            },
            attributes: ['nombre_tipo', 'tipo_dato', 'unidad_medida']
          },
          {
            model: Oferta,
            as: 'ofertas',
            where: {
              activo: true,
              fecha_inicio: { [Op.lte]: now },
              fecha_fin: { [Op.gte]: now }
            },
            required: false,
            through: {
              attributes: ['precio_oferta', 'es_precio_personalizado']
            },
            attributes: ['nombre_oferta', 'tipo_descuento', 'valor_descuento']
          },
          {
            model: ProductoImagen,
            as: 'imagenes',
            attributes: ['url_imagen', 'alt_text', 'es_principal', 'orden']
          }
        ]
      });
      
      const productosConImagenes = await this.transformProductsWithImages(productos);
      
      res.locals.skipHttpLog = true;
      
      logger.info('Productos obtenidos exitosamente', {
        operacion: 'obtener_productos',
        cantidad: productos.length,
        conImagenes: productosConImagenes.filter(p => p.imagen_disponible).length,
        success: true
      });
      
      res.json(productosConImagenes);
    } catch (error) {
      logger.error('Error al obtener productos del almacén:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({ message: 'Error al obtener los productos del almacén' });
    }
  }

  /**
   * Obtiene un producto específico por su ID con todos los detalles
   *
   * Endpoint público que retorna información detallada de un producto incluyendo:
   * - Categoría completa
   * - Usuario creador
   * - Marca con logo y descripción
   * - Características detalladas con tipos y opciones
   * - Ofertas activas vigentes con precios especiales
   * - Todas las imágenes del producto con metadatos
   *
   * @param req - Express Request con params.id (ID del producto)
   * @param res - Express Response object
   * @returns 200 con objeto del producto transformado
   * @returns 404 si el producto no existe
   * @returns 500 si ocurre error en el servidor
   *
   * @example
   * GET /api/almacen/productos/123
   * Response: { id_producto: 123, nombre: "iPhone 13", marca: {...}, ofertas: [...] }
   */
  async getProductById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const now = new Date();
      
      const producto = await Almacen.findByPk(id, {
        include: [
          { 
            model: Categoria,
            as: 'Categoria',
            attributes: ['nombre_categoria']
          },
          { 
            model: Usuario, 
            attributes: ['nombres'] 
          },
          {
            model: Marca,
            as: 'marca',
            attributes: ['nombre_marca', 'logo_marca', 'descripcion_marca']
          },
          {
            model: ProductoCaracteristica,
            as: 'productosCaracteristicas',
            include: [
              {
                model: TipoCaracteristica,
                as: 'tipo',
                attributes: ['nombre_tipo', 'tipo_dato', 'unidad_medida', 'descripcion', 'opciones_seleccion']
              }
            ],
            attributes: ['id_caracteristica', 'valor']
          },
          {
            model: Oferta,
            as: 'ofertas',
            where: {
              activo: true,
              fecha_inicio: { [Op.lte]: now },
              fecha_fin: { [Op.gte]: now }
            },
            required: false,
            through: {
              attributes: ['precio_oferta', 'es_precio_personalizado']
            },
            attributes: ['nombre_oferta', 'tipo_descuento', 'valor_descuento', 'descripcion']
          },
          {
            model: ProductoImagen,
            as: 'imagenes',
            attributes: ['url_imagen', 'alt_text', 'es_principal', 'orden']
          }
        ]
      });

      if (!producto) {
        logger.warn(`Producto no encontrado en almacén con ID: ${id}`);
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      const productoConImagen = await this.transformProductWithImage(producto);

      res.locals.skipHttpLog = true;
      
      logger.info('Producto obtenido exitosamente', {
        operacion: 'obtener_producto',
        producto_id: id,
        nombre: producto.getDataValue('nombre'),
        categoria: (producto as any).Categoria?.nombre_categoria,
        success: true
      });
      
      res.json(productoConImagen);
    } catch (error) {
      logger.error('Error al obtener producto del almacén por ID:', {
        id: req.params.id,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      res.status(500).json({ message: 'Error al obtener el producto del almacén' });
    }
  }

  /**
   * Crea un nuevo producto en el almacén
   *
   * Endpoint protegido que crea un producto con toda su información y opcionalmente
   * sus imágenes. Después de crear el producto, automáticamente crea registros de
   * ProductoImagen si se proporcionan URLs de imágenes en el body.
   *
   * Tras la creación exitosa, reutiliza getProductById para retornar el producto
   * completo con todas sus relaciones cargadas.
   *
   * @param req - Express Request con body conteniendo datos del producto e imagenes[]
   * @param req.body.imagenes - Array opcional de {url_imagen, alt_text} para el producto
   * @param res - Express Response object
   * @returns 200 con el producto creado completo (via getProductById)
   * @returns 500 si ocurre error en la creación
   *
   * @example
   * POST /api/almacen/productos
   * Body: {
   *   nombre: "iPhone 13",
   *   precio_venta: 999,
   *   stock: 10,
   *   imagenes: [
   *     { url_imagen: "iphone13.jpg", alt_text: "iPhone 13 frontal" }
   *   ]
   * }
   */
  async createProduct(req: Request, res: Response) {
    try {
      const { imagenes, caracteristicas, ...productoData } = req.body;

      // Tomar id_usuario del token autenticado (req.usuario)
      // Esto previene que se falsifique el campo id_usuario en el body
      const producto = await Almacen.create({
        ...productoData,
        id_usuario: req.usuario?.id, // Siempre usar el usuario autenticado
        fyh_creacion: new Date(),
        fyh_actualizacion: new Date()
      });

      // Crear imágenes si se proporcionaron
      if (Array.isArray(imagenes) && imagenes.length > 0) {
        const imagenesData = imagenes.map((img: any, index: number) => ({
          id_producto: producto.id_producto,
          url_imagen: img.url_imagen,
          alt_text: img.alt_text || `Imagen ${index + 1} de ${producto.nombre}`,
          es_principal: index === 0,
          orden: index,
          fyh_creacion: new Date()
        }));

        await ProductoImagen.bulkCreate(imagenesData);
      }

      // Crear características si se proporcionaron
      if (Array.isArray(caracteristicas) && caracteristicas.length > 0) {
        const caracData = caracteristicas.map((c: { id_tipo: number; valor: string }) => ({
          id_producto: producto.id_producto,
          id_tipo: c.id_tipo,
          valor: c.valor,
          fyh_creacion: new Date(),
          fyh_actualizacion: new Date()
        }));
        await ProductoCaracteristica.bulkCreate(caracData);
      }

      // Guardar el ID original de req.params (si existe)
      const originalId = req.params.id;
      
      // Asignar el ID del producto recién creado para reutilizar getProductById
      req.params.id = producto.id_producto.toString();
      
      // Reutilizar getProductById para obtener el producto completo
      // Este método maneja la respuesta HTTP internamente
      await this.getProductById(req, res);
      
      // Log de creación exitosa después de la respuesta (para evitar duplicación)
      logger.info('Producto creado exitosamente', {
        operacion: 'crear_producto',
        producto_id: producto.getDataValue('id_producto'),
        nombre: producto.getDataValue('nombre'),
        codigo: producto.getDataValue('codigo'),
        imagenes: imagenes?.length || 0,
        success: true
      });
      
      // Restaurar el ID original (opcional, para mantener consistencia)
      if (originalId !== undefined) {
        req.params.id = originalId;
      }
    } catch (error) {
      logger.error('Error al crear producto en almacén:', {
        data: req.body,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      res.status(500).json({ message: 'Error al crear el producto en almacén' });
    }
  }

  /**
   * Actualiza un producto existente en el almacén
   *
   * Endpoint protegido que actualiza los datos de un producto y opcionalmente
   * reemplaza todas sus imágenes. Si se proporciona un array de imagenes,
   * primero elimina todas las imágenes existentes y luego crea las nuevas.
   *
   * La primera imagen del array siempre se marca como principal (es_principal=true).
   *
   * @param req - Express Request con params.id y body con datos a actualizar
   * @param req.body.imagenes - Array opcional de {url_imagen, alt_text} para reemplazar imágenes
   * @param res - Express Response object
   * @returns 200 con mensaje de confirmación si la actualización es exitosa
   * @returns 404 si el producto no existe
   * @returns 500 si ocurre error en la actualización
   *
   * @example
   * PUT /api/almacen/productos/123
   * Body: {
   *   nombre: "iPhone 13 Pro",
   *   precio_venta: 1099,
   *   imagenes: [{ url_imagen: "nueva.jpg" }]
   * }
   */
  async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { imagenes, caracteristicas, ...productoData } = req.body;

      const [updated] = await Almacen.update({
        ...productoData,
        fyh_actualizacion: new Date()
      }, {
        where: { id_producto: id }
      });

      if (!updated) {
        logger.warn(`Intento de actualizar producto inexistente en almacén ID: ${id}`);
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      // Actualizar imágenes si se proporcionaron
      if (Array.isArray(imagenes)) {
        await ProductoImagen.destroy({
          where: { id_producto: id }
        });

        if (imagenes.length > 0) {
          const imagenesData = imagenes.map((img: any, index: number) => ({
            id_producto: id,
            url_imagen: img.url_imagen,
            alt_text: img.alt_text || `Imagen ${index + 1} de ${productoData.nombre}`,
            es_principal: index === 0,
            orden: index,
            fyh_creacion: new Date()
          }));

          await ProductoImagen.bulkCreate(imagenesData);
        }
      }

      // Actualizar características si se proporcionaron
      if (Array.isArray(caracteristicas)) {
        await ProductoCaracteristica.destroy({ where: { id_producto: id } });
        if (caracteristicas.length > 0) {
          const caracData = caracteristicas.map((c: { id_tipo: number; valor: string }) => ({
            id_producto: id,
            id_tipo: c.id_tipo,
            valor: c.valor,
            fyh_creacion: new Date(),
            fyh_actualizacion: new Date()
          }));
          await ProductoCaracteristica.bulkCreate(caracData);
        }
      }

      res.locals.skipHttpLog = true;

      logger.info('Producto actualizado exitosamente', {
        operacion: 'actualizar_producto',
        producto_id: id,
        imagenes_actualizadas: imagenes?.length,
        caracteristicas_actualizadas: caracteristicas?.length,
        success: true
      });
      
      res.json({ message: 'Producto actualizado correctamente' });
    } catch (error) {
      logger.error('Error al actualizar producto en almacén:', {
        id: req.params.id,
        data: req.body,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      res.status(500).json({ message: 'Error al actualizar el producto en almacén' });
    }
  }

  /**
   * Elimina un producto del almacén
   *
   * Endpoint protegido que elimina permanentemente un producto y todas sus
   * imágenes asociadas de la base de datos. Esta operación es irreversible.
   *
   * NOTA: No elimina archivos físicos de imágenes del servidor, solo los
   * registros de la base de datos.
   *
   * @param req - Express Request con params.id (ID del producto a eliminar)
   * @param res - Express Response object
   * @returns 200 con mensaje de confirmación si la eliminación es exitosa
   * @returns 404 si el producto no existe
   * @returns 500 si ocurre error en la eliminación
   *
   * @example
   * DELETE /api/almacen/productos/123
   * Response: { message: "Producto eliminado correctamente" }
   */
  async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      logger.debug(`Eliminando producto del almacén ID: ${id}`);
      
      // Eliminar imágenes asociadas
      await ProductoImagen.destroy({
        where: { id_producto: id }
      });

      const deleted = await Almacen.destroy({
        where: { id_producto: id }
      });

      if (!deleted) {
        logger.warn(`Intento de eliminar producto inexistente del almacén ID: ${id}`);
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      res.locals.skipHttpLog = true;
      
      logger.info('Producto eliminado exitosamente', {
        operacion: 'eliminar_producto',
        producto_id: id,
        success: true
      });
      
      res.json({ message: 'Producto eliminado correctamente' });
    } catch (error) {
      logger.error('Error al eliminar producto del almacén:', {
        id: req.params.id,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      res.status(500).json({ message: 'Error al eliminar el producto del almacén' });
    }
  }

  /**
   * Busca productos por término de búsqueda
   *
   * Endpoint público que busca productos cuyo nombre o código coincidan
   * parcialmente con el término proporcionado (búsqueda LIKE %término%).
   *
   * Incluye información de categoría, usuario creador e imágenes en los resultados.
   *
   * @param req - Express Request con query.termino (término de búsqueda)
   * @param res - Express Response object
   * @returns 200 con array de productos que coinciden con la búsqueda
   * @returns 400 si no se proporciona término de búsqueda
   * @returns 500 si ocurre error en la búsqueda
   *
   * @example
   * GET /api/almacen/productos/buscar?termino=iphone
   * Response: [{ id_producto: 1, nombre: "iPhone 13", ... }]
   */
  async searchProducts(req: Request, res: Response) {
    try {
      const { termino } = req.query;
      logger.debug(`Buscando productos en almacén con término: ${termino}`);

      if (!termino) {
        logger.warn('Búsqueda de productos sin término especificado');
        return res.status(400).json({ message: 'Término de búsqueda requerido' });
      }

      const productos = await Almacen.findAll({
        where: {
          [Op.or]: [
            { nombre: { [Op.like]: `%${termino}%` } },
            { codigo: { [Op.like]: `%${termino}%` } }
          ]
        },
        include: [
          { model: Categoria, as: 'Categoria', attributes: ['nombre_categoria'] },
          { model: Usuario, attributes: ['nombres'] },
          {
            model: Marca,
            as: 'marca',
            attributes: ['nombre_marca', 'logo_marca']
          },
          {
            model: ProductoImagen,
            as: 'imagenes',
            attributes: ['url_imagen', 'alt_text', 'es_principal', 'orden']
          }
        ]
      });

      const productosConImagenes = await this.transformProductsWithImages(productos);

      logger.info(`Se encontraron ${productos.length} productos con el término: ${termino}`);
      res.json(productosConImagenes);
    } catch (error) {
      logger.error('Error al buscar productos en almacén:', {
        termino: req.query.termino,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      res.status(500).json({ message: 'Error al buscar productos en almacén' });
    }
  }

  /**
   * Obtiene todos los productos de una categoría específica
   *
   * Endpoint público que filtra productos por ID de categoría.
   * Incluye información de categoría, usuario creador e imágenes.
   *
   * @param req - Express Request con params.categoriaId (ID de la categoría)
   * @param res - Express Response object
   * @returns 200 con array de productos de la categoría especificada
   * @returns 500 si ocurre error en la consulta
   *
   * @example
   * GET /api/almacen/productos/categoria/5
   * Response: [{ id_producto: 1, nombre: "iPhone 13", Categoria: { nombre_categoria: "Smartphones" } }]
   */
  async getProductsByCategory(req: Request, res: Response) {
    try {
      const { categoriaId } = req.params;
      logger.debug(`Obteniendo productos por categoría ID: ${categoriaId}`);

      const productos = await Almacen.findAll({
        where: { id_categoria: categoriaId },
        include: [
          { model: Categoria, as: 'Categoria', attributes: ['nombre_categoria'] },
          { model: Usuario, attributes: ['nombres'] },
          {
            model: Marca,
            as: 'marca',
            attributes: ['nombre_marca', 'logo_marca']
          },
          {
            model: ProductoImagen,
            as: 'imagenes',
            attributes: ['url_imagen', 'alt_text', 'es_principal', 'orden']
          }
        ]
      });

      const productosConImagenes = await this.transformProductsWithImages(productos);

      logger.info(`Se encontraron ${productos.length} productos para la categoría ID: ${categoriaId}`);
      res.json(productosConImagenes);
    } catch (error) {
      logger.error('Error al obtener productos por categoría:', {
        categoriaId: req.params.categoriaId,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      res.status(500).json({ message: 'Error al obtener productos por categoría' });
    }
  }

  /**
   * Actualiza el stock de un producto
   *
   * Endpoint protegido que actualiza únicamente la cantidad de stock disponible
   * de un producto específico. Útil para actualizaciones rápidas de inventario
   * sin necesidad de enviar todos los datos del producto.
   *
   * @param req - Express Request con params.id y body.stock (nuevo stock)
   * @param res - Express Response object
   * @returns 200 con mensaje de confirmación si la actualización es exitosa
   * @returns 404 si el producto no existe
   * @returns 500 si ocurre error en la actualización
   *
   * @example
   * PATCH /api/almacen/productos/123/stock
   * Body: { stock: 50 }
   * Response: { message: "Stock actualizado correctamente" }
   */
  async updateStock(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { stock } = req.body;
      logger.debug(`Actualizando stock del producto ID: ${id}`, { stock });
      
      const [updated] = await Almacen.update({
        stock,
        fyh_actualizacion: new Date()
      }, {
        where: { id_producto: id }
      });

      if (!updated) {
        logger.warn(`Intento de actualizar stock de producto inexistente ID: ${id}`);
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      res.locals.skipHttpLog = true;
      
      logger.info('Stock actualizado exitosamente', {
        operacion: 'actualizar_stock',
        producto_id: id,
        nuevo_stock: stock,
        success: true
      });
      
      res.json({ message: 'Stock actualizado correctamente' });
    } catch (error) {
      logger.error('Error al actualizar stock:', {
        id: req.params.id,
        stock: req.body.stock,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      res.status(500).json({ message: 'Error al actualizar el stock' });
    }
  }

  /**
   * Obtiene los productos destacados del catálogo
   *
   * Endpoint público que retorna productos marcados como destacados (es_destacado=true)
   * que tengan stock disponible. Los resultados son ordenados por orden_destacado
   * (ascendente) y fecha de actualización (descendente).
   *
   * Por defecto retorna 6 productos, pero se puede especificar un límite diferente
   * mediante query parameter.
   *
   * @param req - Express Request con query.limit opcional (default: 6)
   * @param res - Express Response object
   * @returns 200 con array de productos destacados con imágenes transformadas
   * @returns 500 si ocurre error en la consulta
   *
   * @example
   * GET /api/almacen/productos/destacados?limit=10
   * Response: [{ id_producto: 1, nombre: "iPhone 13", es_destacado: true, ... }]
   */
  async getFeaturedProducts(req: Request, res: Response) {
    try {
      logger.debug('Obteniendo productos destacados');
      const limit = parseInt(req.query.limit as string) || 6;

      const productos = await Almacen.findAll({
        where: {
          stock: { [Op.gt]: 0 },
          es_destacado: true
        },
        include: [
          { model: Categoria, as: 'Categoria', attributes: ['nombre_categoria'] },
          { model: Usuario, attributes: ['nombres'] },
          {
            model: Marca,
            as: 'marca',
            attributes: ['nombre_marca', 'logo_marca']
          },
          {
            model: ProductoImagen,
            as: 'imagenes',
            attributes: ['url_imagen', 'alt_text', 'es_principal', 'orden']
          }
        ],
        order: [
          ['orden_destacado', 'ASC'],
          ['fyh_actualizacion', 'DESC']
        ],
        limit
      });

      const productosConImagenes = await this.transformProductsWithImages(productos);
      logger.debug('Transformación de imágenes destacados completada');

      // Marcar para evitar log HTTP duplicado
      res.locals.skipHttpLog = true;
      
      logger.info('Productos destacados obtenidos exitosamente', {
        operacion: 'obtener_destacados',
        cantidad: productos.length,
        limit: limit,
        success: true
      });
      
      res.json(productosConImagenes);
    } catch (error) {
      logger.error('Error al obtener productos destacados:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({ message: 'Error al obtener los productos destacados' });
    }
  }

  /**
   * Obtiene todas las categorías disponibles
   *
   * Endpoint público que retorna la lista completa de categorías de productos
   * registradas en el sistema. Solo retorna ID y nombre de cada categoría.
   *
   * Útil para poblar filtros y selectores de categoría en el frontend.
   *
   * @param req - Express Request object
   * @param res - Express Response object
   * @returns 200 con array de categorías {id_categoria, nombre_categoria}
   * @returns 500 si ocurre error en la consulta
   *
   * @example
   * GET /api/almacen/categorias
   * Response: [
   *   { id_categoria: 1, nombre_categoria: "Smartphones" },
   *   { id_categoria: 2, nombre_categoria: "Laptops" }
   * ]
   */
  async getAllCategories(req: Request, res: Response) {
    try {
      logger.debug('Obteniendo todas las categorías');
      const categorias = await Categoria.findAll({
        attributes: ['id_categoria', 'nombre_categoria']
      });
      res.locals.skipHttpLog = true;
      
      logger.info('Categorías obtenidas exitosamente', {
        operacion: 'obtener_categorias',
        cantidad: categorias.length,
        success: true
      });
      
      res.json(categorias);
    } catch (error) {
      logger.error('Error al obtener categorías:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({ message: 'Error al obtener las categorías' });
    }
  }

  /**
   * Ejecuta diagnóstico completo del sistema de productos
   *
   * Endpoint de debugging que ejecuta una serie de pruebas paso a paso para
   * diagnosticar problemas en el sistema de productos. Prueba:
   * - Consultas básicas sin includes
   * - Includes de Categoria
   * - Includes de Usuario
   * - Ambos includes combinados
   * - Transformación de imágenes
   * - Carga de imágenes desde ProductoImagen
   *
   * Cada paso es ejecutado independientemente y los errores son capturados
   * individualmente para identificar exactamente dónde falla el sistema.
   *
   * IMPORTANTE: Este endpoint es solo para desarrollo/debugging.
   * Debe estar deshabilitado o protegido en producción.
   *
   * @param req - Express Request object
   * @param res - Express Response object
   * @returns 200 con objeto de diagnóstico detallado con resultados de cada paso
   * @returns 500 si ocurre error general en el diagnóstico
   *
   * @example
   * GET /api/almacen/diagnostico
   * Response: {
   *   success: true,
   *   message: "Todos los pasos exitosos",
   *   diagnostics: {
   *     step1_basic_query: { success: true, count: 5 },
   *     step2_categoria_include: { success: true, count: 5 },
   *     ...
   *   }
   * }
   */
  async diagnosticProducts(req: Request, res: Response) {
    const diagnostics: any = {
      step1_basic_query: null,
      step2_categoria_include: null,
      step3_usuario_include: null,
      step4_both_includes: null,
      step5_transform_test: null,
      step6_images_test: null,
      errors: [] as string[]
    };

    try {
      // Paso 1: Consulta básica
      logger.debug('DIAGNÓSTICO Paso 1: Consulta básica sin includes');
      try {
        const productosBasicos = await Almacen.findAll({ limit: 5 });
        diagnostics.step1_basic_query = {
          success: true,
          count: productosBasicos.length,
          sample: productosBasicos.length > 0 ? {
            id: productosBasicos[0].getDataValue('id_producto'),
            nombre: productosBasicos[0].getDataValue('nombre')
          } : null
        };
        logger.info(`✅ Paso 1 exitoso: ${productosBasicos.length} productos`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        diagnostics.step1_basic_query = { success: false, error: errorMsg };
        diagnostics.errors.push(`Paso 1: ${errorMsg}`);
        logger.error(`❌ Paso 1 falló: ${errorMsg}`);
      }

      // Paso 2: Include Categoria
      logger.debug('DIAGNÓSTICO Paso 2: Include Categoria');
      try {
        const productosConCategoria = await Almacen.findAll({
          include: [{ model: Categoria, as: 'Categoria', attributes: ['nombre_categoria'] }],
          limit: 5
        });
        diagnostics.step2_categoria_include = {
          success: true,
          count: productosConCategoria.length
        };
        logger.info(`✅ Paso 2 exitoso: ${productosConCategoria.length} productos con categoría`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        diagnostics.step2_categoria_include = { success: false, error: errorMsg };
        diagnostics.errors.push(`Paso 2: ${errorMsg}`);
        logger.error(`❌ Paso 2 falló: ${errorMsg}`);
      }

      // Paso 3: Include Usuario
      logger.debug('DIAGNÓSTICO Paso 3: Include Usuario');
      try {
        const productosConUsuario = await Almacen.findAll({
          include: [{ model: Usuario, attributes: ['nombres'] }],
          limit: 5
        });
        diagnostics.step3_usuario_include = {
          success: true,
          count: productosConUsuario.length
        };
        logger.info(`✅ Paso 3 exitoso: ${productosConUsuario.length} productos con usuario`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        diagnostics.step3_usuario_include = { success: false, error: errorMsg };
        diagnostics.errors.push(`Paso 3: ${errorMsg}`);
        logger.error(`❌ Paso 3 falló: ${errorMsg}`);
      }

      // Paso 4: Ambos includes
      logger.debug('DIAGNÓSTICO Paso 4: Ambos includes');
      try {
        const productos = await Almacen.findAll({
          include: [
            { model: Categoria, as: 'Categoria', attributes: ['nombre_categoria'] },
            { model: Usuario, attributes: ['nombres'] }
          ],
          limit: 5
        });
        diagnostics.step4_both_includes = {
          success: true,
          count: productos.length
        };
        logger.info(`✅ Paso 4 exitoso: ${productos.length} productos con ambos includes`);

        // Paso 5: Probar transformación
        logger.debug('DIAGNÓSTICO Paso 5: Transformación de imágenes');
        try {
          const productosConImagenes = await this.transformProductsWithImages(productos);
          diagnostics.step5_transform_test = {
            success: true,
            count: productosConImagenes.length,
            first_transformed: productosConImagenes.length > 0 ? {
              has_imagen_url: 'imagen_url' in productosConImagenes[0],
              imagen_url: productosConImagenes[0].imagen_url || null
            } : null
          };
          logger.info(`✅ Paso 5 exitoso: ${productosConImagenes.length} productos transformados`);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
          diagnostics.step5_transform_test = { success: false, error: errorMsg };
          diagnostics.errors.push(`Paso 5: ${errorMsg}`);
          logger.error(`❌ Paso 5 falló: ${errorMsg}`);
        }

        // Paso 6: Probar imágenes
        logger.debug('DIAGNÓSTICO Paso 6: Prueba de imágenes');
        try {
          const productosConImagenesCompleto = await Almacen.findAll({
            include: [
              {
                model: ProductoImagen,
                as: 'imagenes',
                attributes: ['url_imagen', 'alt_text', 'es_principal', 'orden']
              }
            ],
            limit: 5
          });

          diagnostics.step6_images_test = {
            success: true,
            count: productosConImagenesCompleto.length,
            images_count: productosConImagenesCompleto.reduce((acc, prod) => acc + ((prod as any).imagenes?.length || 0), 0),
            sample: productosConImagenesCompleto.length > 0 ? {
              product_id: productosConImagenesCompleto[0].id_producto,
              images: (productosConImagenesCompleto[0] as any).imagenes || []
            } : null
          };
          logger.info(`✅ Paso 6 exitoso: Prueba de imágenes completada`);
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
          diagnostics.step6_images_test = { success: false, error: errorMsg };
          diagnostics.errors.push(`Paso 6: ${errorMsg}`);
          logger.error(`❌ Paso 6 falló: ${errorMsg}`);
        }

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        diagnostics.step4_both_includes = { success: false, error: errorMsg };
        diagnostics.errors.push(`Paso 4: ${errorMsg}`);
        logger.error(`❌ Paso 4 falló: ${errorMsg}`);
      }

      logger.info('🔍 Diagnóstico completo:', diagnostics);
      res.json({
        success: diagnostics.errors.length === 0,
        message: diagnostics.errors.length === 0 ? 'Todos los pasos exitosos' : 'Se encontraron errores',
        diagnostics: diagnostics
      });

    } catch (error) {
      logger.error('Error general en diagnóstico:', error);
      res.status(500).json({
        success: false,
        message: 'Error general en diagnóstico',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}

export default new AlmacenController();