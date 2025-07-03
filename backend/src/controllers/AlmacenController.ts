import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Almacen from '../models/Almacen.js';
import Categoria from '../models/Categoria.js';
import Usuario from '../models/Usuario.js';
import logger from '../utils/logger.js';
import { getImageService } from '../services/imageService.js';

// Controlador para gestionar las operaciones del almacén
class AlmacenController {
  
  // Método helper para transformar productos con URLs de imágenes
  private transformProductsWithImages(productos: any[]): any[] {
    try {
      if (!productos || productos.length === 0) {
        return [];
      }

      const imageService = getImageService();
      if (!imageService) {
        logger.warn('Servicio de imágenes no disponible, devolviendo productos sin URLs de imagen');
        return productos.map(p => p.toJSON ? p.toJSON() : p);
      }
      
      return imageService.transformProductsWithImageUrls(productos);
    } catch (error) {
      logger.error('Error al transformar productos con imágenes:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        productCount: productos ? productos.length : 0,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Fallback: devolver productos sin transformar
      return productos ? productos.map(p => p.toJSON ? p.toJSON() : p) : [];
    }
  }

  // Método alternativo de transformación más simple
  private transformProductsWithImagesSafe(productos: any[]): any[] {
    if (!productos || productos.length === 0) {
      return [];
    }

    try {
      const imageService = getImageService();
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
      
      return productos.map(producto => {
        const productData = producto.toJSON ? producto.toJSON() : producto;
        
        if (imageService && productData.imagen) {
          // Generar URL de imagen usando el servicio
          productData.imagen_url = imageService.generateImageUrl(productData.imagen);
          productData.imagen_disponible = !!productData.imagen;
        } else if (productData.imagen) {
          // Fallback: generar URL manualmente
          productData.imagen_url = `${baseUrl}/api/images/${productData.imagen}`;
          productData.imagen_disponible = !!productData.imagen;
        } else {
          // Sin imagen
          productData.imagen_url = `${baseUrl}/api/images/default-product.png`;
          productData.imagen_disponible = false;
        }
        
        return productData;
      });
    } catch (error) {
      logger.error('Error en transformación segura:', error);
      // Último fallback: devolver datos básicos
      return productos.map(p => p.toJSON ? p.toJSON() : p);
    }
  }

  // Método helper para transformar un producto individual con URL de imagen
  private transformProductWithImage(producto: any): any {
    try {
      const imageService = getImageService();
      if (!imageService) {
        logger.warn('Servicio de imágenes no disponible, devolviendo producto sin URL de imagen');
        return producto.toJSON ? producto.toJSON() : producto;
      }
      
      return imageService.transformProductWithImageUrl(producto);
    } catch (error) {
      logger.error('Error al transformar producto individual con imagen:', {
        productId: producto.id_producto || 'unknown',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      
      // Fallback: devolver producto sin transformar
      return producto.toJSON ? producto.toJSON() : producto;
    }
  }

  // Obtener todos los productos del almacén con sus categorías y usuarios asociados
  async getProducts(req: Request, res: Response) {
    try {
      logger.debug('Obteniendo lista de productos del almacén');
      const productos = await Almacen.findAll({
        include: [
          { model: Categoria, attributes: ['nombre_categoria'] },
          { model: Usuario, attributes: ['nombres'] }
        ]
      });
      
      // Transformar productos con URLs de imágenes (método seguro)
      const productosConImagenes = this.transformProductsWithImagesSafe(productos);
      logger.debug('Transformación de imágenes completada');
      
      logger.info(`Se obtuvieron ${productos.length} productos del almacén exitosamente`);
      res.json(productosConImagenes);
    } catch (error) {
      logger.error('Error al obtener productos del almacén:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({ message: 'Error al obtener los productos del almacén' });
    }
  }

  // Obtener un producto específico del almacén por su ID
  async getProductById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      logger.debug(`Buscando producto en almacén con ID: ${id}`);
      
      const producto = await Almacen.findByPk(id, {
        include: [
          { model: Categoria, attributes: ['nombre_categoria'] },
          { model: Usuario, attributes: ['nombres'] }
        ]
      });

      if (!producto) {
        logger.warn(`Producto no encontrado en almacén con ID: ${id}`);
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      // Transformar producto con URL de imagen
      const productoConImagen = this.transformProductWithImage(producto);

      logger.info(`Producto encontrado en almacén: ${producto.getDataValue('nombre')} (ID: ${id})`);
      res.json(productoConImagen);
    } catch (error) {
      logger.error('Error al obtener producto del almacén por ID:', {
        id: req.params.id,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      res.status(500).json({ message: 'Error al obtener el producto del almacén' });
    }
  }

  // Crear un nuevo producto en el almacén
  async createProduct(req: Request, res: Response) {
    try {
      logger.debug('Creando nuevo producto en almacén:', req.body);
      const producto = await Almacen.create({
        ...req.body,
        fyh_creacion: new Date(),
        fyh_actualizacion: new Date()
      });
      logger.info(`Producto creado exitosamente en almacén: ${producto.getDataValue('nombre')} (ID: ${producto.getDataValue('id_producto')})`);
      res.status(201).json(producto);
    } catch (error) {
      logger.error('Error al crear producto en almacén:', {
        data: req.body,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      res.status(500).json({ message: 'Error al crear el producto en almacén' });
    }
  }

  // Actualizar un producto existente en el almacén por su ID
  async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      logger.debug(`Actualizando producto en almacén ID: ${id}`, req.body);
      
      const [updated] = await Almacen.update({
        ...req.body,
        fyh_actualizacion: new Date()
      }, {
        where: { id_producto: id }
      });

      if (!updated) {
        logger.warn(`Intento de actualizar producto inexistente en almacén ID: ${id}`);
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      logger.info(`Producto actualizado exitosamente en almacén ID: ${id}`);
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

  // Eliminar un producto del almacén por su ID
  async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      logger.debug(`Eliminando producto del almacén ID: ${id}`);
      
      const deleted = await Almacen.destroy({
        where: { id_producto: id }
      });

      if (!deleted) {
        logger.warn(`Intento de eliminar producto inexistente del almacén ID: ${id}`);
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      logger.info(`Producto eliminado exitosamente del almacén ID: ${id}`);
      res.json({ message: 'Producto eliminado correctamente' });
    } catch (error) {
      logger.error('Error al eliminar producto del almacén:', {
        id: req.params.id,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      res.status(500).json({ message: 'Error al eliminar el producto del almacén' });
    }
  }

  // Buscar productos en el almacén por término (nombre o código)
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
          { model: Categoria, attributes: ['nombre_categoria'] },
          { model: Usuario, attributes: ['nombres'] }
        ]
      });

      // Transformar productos con URLs de imágenes (método seguro)
      const productosConImagenes = this.transformProductsWithImagesSafe(productos);

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

  // Obtener productos del almacén filtrados por categoría
  async getProductsByCategory(req: Request, res: Response) {
    try {
      const { categoriaId } = req.params;
      logger.debug(`Obteniendo productos por categoría ID: ${categoriaId}`);
      
      const productos = await Almacen.findAll({
        where: { id_categoria: categoriaId },
        include: [
          { model: Categoria, attributes: ['nombre_categoria'] },
          { model: Usuario, attributes: ['nombres'] }
        ]
      });

      // Transformar productos con URLs de imágenes (método seguro)
      const productosConImagenes = this.transformProductsWithImagesSafe(productos);

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

  // Actualizar solo el stock de un producto del almacén
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

      logger.info(`Stock actualizado exitosamente para el producto ID: ${id}`);
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

  // Obtener productos destacados (los más recientes con stock disponible)
  async getFeaturedProducts(req: Request, res: Response) {
    try {
      logger.debug('Obteniendo productos destacados');
      const productos = await Almacen.findAll({
        where: {
          stock: { [Op.gt]: 0 } // Solo productos con stock disponible
        },
        include: [
          { model: Categoria, attributes: ['nombre_categoria'] },
          { model: Usuario, attributes: ['nombres'] }
        ],
        order: [['fyh_actualizacion', 'DESC']], // Ordenar por más recientes
        limit: 6 // Limitar a 6 productos destacados
      });

      // Transformar productos destacados con URLs de imágenes (método seguro)
      const productosConImagenes = this.transformProductsWithImagesSafe(productos);
      logger.debug('Transformación de imágenes destacados completada');

      logger.info(`Se obtuvieron ${productos.length} productos destacados exitosamente`);
      res.json(productosConImagenes);
    } catch (error) {
      logger.error('Error al obtener productos destacados:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({ message: 'Error al obtener los productos destacados' });
    }
  }

  // Obtener todas las categorías disponibles
  async getAllCategories(req: Request, res: Response) {
    try {
      logger.debug('Obteniendo todas las categorías');
      const categorias = await Categoria.findAll({
        attributes: ['id_categoria', 'nombre_categoria']
      });
      logger.info(`Se obtuvieron ${categorias.length} categorías exitosamente`);
      res.json(categorias);
    } catch (error) {
      logger.error('Error al obtener categorías:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({ message: 'Error al obtener las categorías' });
    }
  }

  // Método de diagnóstico para debuggear problemas
  async diagnosticProducts(req: Request, res: Response) {
    const diagnostics: any = {
      step1_basic_query: null,
      step2_categoria_include: null,
      step3_usuario_include: null,
      step4_both_includes: null,
      step5_transform_test: null,
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
            nombre: productosBasicos[0].getDataValue('nombre'),
            imagen: productosBasicos[0].getDataValue('imagen')
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
          include: [{ model: Categoria, attributes: ['nombre_categoria'] }],
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
            { model: Categoria, attributes: ['nombre_categoria'] },
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
           // Usar método seguro para transformación
           const productosConImagenes = this.transformProductsWithImagesSafe(productos);
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