import { Request, Response } from 'express';
import Producto from '../models/Producto.js'; // Importar el modelo Producto
import logger from '../utils/logger.js';

class ProductController {
  async getProducts(req: Request, res: Response) {
    try {
      logger.debug('Obteniendo lista de productos');
      const products = await Producto.findAll(); // Obtener productos de la base de datos
      logger.info(`Se obtuvieron ${products.length} productos exitosamente`);
      res.json(products);
    } catch (error) {
      logger.error('Error al obtener productos:', {
        error: error instanceof Error ? error.message : 'Error desconocido',
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({ message: 'Error al obtener los productos' });
    }
  }

  async getProductById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      logger.debug(`Buscando producto con ID: ${id}`);
      
      const product = await Producto.findByPk(id);
      if (!product) {
        logger.warn(`Producto no encontrado con ID: ${id}`);
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      logger.info(`Producto encontrado: ${product.getDataValue('nombre')} (ID: ${id})`);
      res.json(product);
    } catch (error) {
      logger.error('Error al obtener producto por ID:', {
        id: req.params.id,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      res.status(500).json({ message: 'Error al obtener el producto' });
    }
  }

  async createProduct(req: Request, res: Response) {
    try {
      logger.debug('Creando nuevo producto:', req.body);
      const product = await Producto.create(req.body);
      logger.info(`Producto creado exitosamente: ${product.getDataValue('nombre')} (ID: ${product.getDataValue('id')})`);
      res.status(201).json(product);
    } catch (error) {
      logger.error('Error al crear producto:', {
        data: req.body,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      res.status(500).json({ message: 'Error al crear el producto' });
    }
  }

  async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      logger.debug(`Actualizando producto ID: ${id}`, req.body);
      
      const [updated] = await Producto.update(req.body, {
        where: { id }
      });

      if (!updated) {
        logger.warn(`Intento de actualizar producto inexistente ID: ${id}`);
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      logger.info(`Producto actualizado exitosamente ID: ${id}`);
      res.json({ message: 'Producto actualizado correctamente' });
    } catch (error) {
      logger.error('Error al actualizar producto:', {
        id: req.params.id,
        data: req.body,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      res.status(500).json({ message: 'Error al actualizar el producto' });
    }
  }

  async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      logger.debug(`Eliminando producto ID: ${id}`);
      
      const deleted = await Producto.destroy({
        where: { id }
      });

      if (!deleted) {
        logger.warn(`Intento de eliminar producto inexistente ID: ${id}`);
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      logger.info(`Producto eliminado exitosamente ID: ${id}`);
      res.json({ message: 'Producto eliminado correctamente' });
    } catch (error) {
      logger.error('Error al eliminar producto:', {
        id: req.params.id,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
      res.status(500).json({ message: 'Error al eliminar el producto' });
    }
  }
}

export default new ProductController();
