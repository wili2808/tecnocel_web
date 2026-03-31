import { Router } from 'express';
import { OfertaController } from '../controllers/OfertaController.js';
import { verificarToken, verificarPermiso } from '../middleware/authMiddleware.js';

const router = Router();

// Rutas públicas
router.get('/activas', OfertaController.getOfertasActivas);
router.get('/productos', OfertaController.getProductosEnOferta);

// Rutas de administración (requieren permisos específicos)
router.get('/todas', verificarToken, verificarPermiso('ver_ofertas'), OfertaController.getAllOfertas);
router.get('/producto/:id_producto', verificarToken, verificarPermiso('ver_ofertas'), OfertaController.getOfertasByProducto);
router.get('/:id', verificarToken, verificarPermiso('ver_ofertas'), OfertaController.getOfertaById);
router.post('/', verificarToken, verificarPermiso('crear_oferta'), OfertaController.createOferta);
router.put('/:id', verificarToken, verificarPermiso('editar_oferta'), OfertaController.updateOferta);
router.delete('/:id', verificarToken, verificarPermiso('eliminar_oferta'), OfertaController.deleteOferta);
router.post('/:id_oferta/productos', verificarToken, verificarPermiso('editar_oferta'), OfertaController.asignarProductosOferta);
router.delete('/:id_oferta/productos/:id_producto', verificarToken, verificarPermiso('editar_oferta'), OfertaController.removeProductoOferta);

export default router;
