import { Router } from 'express';
import { OfertaController } from '../controllers/OfertaController.js';
import { verificarToken, verificarRol } from '../middleware/authMiddleware.js';

const router = Router();

// Rutas públicas
router.get('/activas', OfertaController.getOfertasActivas);
router.get('/productos', OfertaController.getProductosEnOferta);

// Rutas de administración (requieren autenticación de admin)
router.get('/todas', verificarToken, OfertaController.getAllOfertas);
router.get('/producto/:id_producto', verificarToken, OfertaController.getOfertasByProducto);
router.get('/:id', verificarToken, OfertaController.getOfertaById);
router.post('/', verificarToken, verificarRol([1, 2]), OfertaController.createOferta);
router.put('/:id', verificarToken, verificarRol([1, 2]), OfertaController.updateOferta);
router.delete('/:id', verificarToken, verificarRol([1]), OfertaController.deleteOferta);
router.post('/:id_oferta/productos', verificarToken, verificarRol([1, 2]), OfertaController.asignarProductosOferta);
router.delete('/:id_oferta/productos/:id_producto', verificarToken, verificarRol([1, 2]), OfertaController.removeProductoOferta);

export default router;
