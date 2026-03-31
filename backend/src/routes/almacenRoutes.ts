import { Router } from 'express';
import almacenController from '../controllers/AlmacenController.js';
import { verificarToken, verificarPermiso } from '../middleware/authMiddleware.js';

const router = Router();

// Rutas públicas (no requieren autenticación)
router.get('/tipo-cambio', almacenController.getTipoCambio.bind(almacenController));
router.get('/diagnostico', almacenController.diagnosticProducts.bind(almacenController));
router.get('/productos', almacenController.getProducts.bind(almacenController));
router.get('/productos/destacados', almacenController.getFeaturedProducts.bind(almacenController));
router.get('/productos/buscar', almacenController.searchProducts.bind(almacenController));
router.get('/productos/categoria/:categoriaId', almacenController.getProductsByCategory.bind(almacenController));
router.get('/productos/:id', almacenController.getProductById.bind(almacenController));
router.get('/categorias', almacenController.getAllCategories.bind(almacenController));

// Rutas protegidas (requieren autenticación y permisos)
router.use(verificarToken);

// Categorías
router.post('/categorias', verificarPermiso('crear_categoria'), almacenController.createCategoria.bind(almacenController));
router.put('/categorias/:id', verificarPermiso('editar_categoria'), almacenController.updateCategoria.bind(almacenController));
router.delete('/categorias/:id', verificarPermiso('eliminar_categoria'), almacenController.deleteCategoria.bind(almacenController));

// Productos
router.post('/productos', verificarPermiso('crear_producto'), almacenController.createProduct.bind(almacenController));
router.put('/productos/:id', verificarPermiso('editar_producto'), almacenController.updateProduct.bind(almacenController));
router.delete('/productos/:id', verificarPermiso('eliminar_producto'), almacenController.deleteProduct.bind(almacenController));
router.patch('/productos/:id/stock', verificarPermiso('editar_producto'), almacenController.updateStock.bind(almacenController));

export default router;
