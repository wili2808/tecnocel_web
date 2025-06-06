import { Router } from 'express';
import almacenController from '../controllers/AlmacenController.js';
import { verificarToken } from '../middleware/authMiddleware.js';

const router = Router();

// Rutas públicas (no requieren autenticación)
router.get('/productos', almacenController.getProducts);
router.get('/productos/:id', almacenController.getProductById);
router.get('/productos/buscar', almacenController.searchProducts);
router.get('/productos/categoria/:categoriaId', almacenController.getProductsByCategory);

// Rutas protegidas (requieren autenticación)
router.use(verificarToken);
router.post('/productos', almacenController.createProduct);
router.put('/productos/:id', almacenController.updateProduct);
router.delete('/productos/:id', almacenController.deleteProduct);
router.patch('/productos/:id/stock', almacenController.updateStock);

export default router; 