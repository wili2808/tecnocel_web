import { Router } from 'express';
import almacenController from '../controllers/AlmacenController.js';
import { verificarToken } from '../middleware/authMiddleware.js';

const router = Router();

// Rutas públicas (no requieren autenticación)
router.get('/diagnostico', almacenController.diagnosticProducts.bind(almacenController));
router.get('/productos', almacenController.getProducts.bind(almacenController));
router.get('/productos/destacados', almacenController.getFeaturedProducts.bind(almacenController));
router.get('/productos/:id', almacenController.getProductById.bind(almacenController));
router.get('/productos/buscar', almacenController.searchProducts.bind(almacenController));
router.get('/productos/categoria/:categoriaId', almacenController.getProductsByCategory.bind(almacenController));
router.get('/categorias', almacenController.getAllCategories.bind(almacenController));

// Rutas protegidas (requieren autenticación)
router.use(verificarToken);
router.post('/productos', almacenController.createProduct.bind(almacenController));
router.put('/productos/:id', almacenController.updateProduct.bind(almacenController));
router.delete('/productos/:id', almacenController.deleteProduct.bind(almacenController));
router.patch('/productos/:id/stock', almacenController.updateStock.bind(almacenController));

export default router; 