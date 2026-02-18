import { Router } from 'express';
import { CaracteristicaController } from '../controllers/CaracteristicaController.js';
import { verificarToken, verificarRol } from '../middleware/authMiddleware.js';

const router = Router();

// Rutas públicas
router.get('/tipos', CaracteristicaController.getTiposCaracteristicas);
router.get('/producto/:id_producto', CaracteristicaController.getCaracteristicasProducto);

// Rutas de administración (requieren autenticación)
router.get('/tipos/todas', verificarToken, CaracteristicaController.getAllTipos);
router.post('/tipos', verificarToken, verificarRol([1, 2]), CaracteristicaController.createTipoCaracteristica);
router.put('/tipos/:id_tipo', verificarToken, verificarRol([1, 2]), CaracteristicaController.updateTipoCaracteristica);
router.delete('/tipos/:id_tipo', verificarToken, verificarRol([1]), CaracteristicaController.deleteTipoCaracteristica);

router.post('/producto/:id_producto', verificarToken, verificarRol([1, 2]), CaracteristicaController.addCaracteristicaProducto);
router.put('/:id_caracteristica', verificarToken, verificarRol([1, 2]), CaracteristicaController.updateCaracteristicaProducto);
router.delete('/:id_caracteristica', verificarToken, verificarRol([1, 2]), CaracteristicaController.deleteCaracteristicaProducto);

export default router;
