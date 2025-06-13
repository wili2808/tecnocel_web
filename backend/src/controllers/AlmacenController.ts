import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Almacen from '../models/Almacen.js';
import Categoria from '../models/Categoria.js';
import Usuario from '../models/Usuario.js';
import logger from '../utils/logger.js';

// Controlador para gestionar las operaciones del almacén
class AlmacenController {
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
      logger.info(`Se obtuvieron ${productos.length} productos del almacén exitosamente`);
      res.json(productos);
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

      logger.info(`Producto encontrado en almacén: ${producto.getDataValue('nombre')} (ID: ${id})`);
      res.json(producto);
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

      logger.info(`Se encontraron ${productos.length} productos con el término: ${termino}`);
      res.json(productos);
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

      logger.info(`Se encontraron ${productos.length} productos para la categoría ID: ${categoriaId}`);
      res.json(productos);
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

      logger.info(`Se obtuvieron ${productos.length} productos destacados exitosamente`);
      res.json(productos);
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
}

export default new AlmacenController(); 