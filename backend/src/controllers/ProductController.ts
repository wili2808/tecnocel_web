import { Request, Response } from 'express';
import Producto from '../models/Producto.js'; // Importar el modelo Producto

class ProductController {
  async getProducts(req: Request, res: Response) {
    try {
      const products = await Producto.findAll(); // Obtener productos de la base de datos
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Error fetching products' });
    }
  }
}

export default new ProductController();
