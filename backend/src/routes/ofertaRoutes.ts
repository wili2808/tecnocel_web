import { Router } from 'express';
import { OfertaController } from '../controllers/OfertaController.js';
import { verificarToken, verificarRol } from '../middleware/authMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Rutas públicas
router.get('/activas', OfertaController.getOfertasActivas);
router.get('/productos', OfertaController.getProductosEnOferta);

// Rutas de administración (requieren autenticación de admin)
router.get('/todas', verificarToken, OfertaController.getAllOfertas);
router.get('/producto/:id_producto', verificarToken, OfertaController.getOfertasByProducto);
router.get('/:id', verificarToken, OfertaController.getOfertaById);
router.post('/', verificarToken, verificarRol([ROLES.ADMIN, ROLES.GERENTE]), OfertaController.createOferta);
router.put('/:id', verificarToken, verificarRol([ROLES.ADMIN, ROLES.GERENTE]), OfertaController.updateOferta);
router.delete('/:id', verificarToken, verificarRol([ROLES.ADMIN]), OfertaController.deleteOferta);
router.post('/:id_oferta/productos', verificarToken, verificarRol([ROLES.ADMIN, ROLES.GERENTE]), OfertaController.asignarProductosOferta);
router.delete('/:id_oferta/productos/:id_producto', verificarToken, verificarRol([ROLES.ADMIN, ROLES.GERENTE]), OfertaController.removeProductoOferta);

export default router;
