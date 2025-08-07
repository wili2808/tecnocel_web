import { Router } from 'express';
import { OfertaController } from '../controllers/OfertaController.js';

const router = Router();

// Rutas públicas
router.get('/activas', OfertaController.getOfertasActivas);
router.get('/productos', OfertaController.getProductosEnOferta);

// Rutas de administración (requieren autenticación de admin)
// TODO: Agregar middleware de autenticación de admin
router.post('/', OfertaController.createOferta);
router.put('/:id', OfertaController.updateOferta);
router.delete('/:id', OfertaController.deleteOferta);
router.post('/:id_oferta/productos', OfertaController.asignarProductosOferta);

export default router;