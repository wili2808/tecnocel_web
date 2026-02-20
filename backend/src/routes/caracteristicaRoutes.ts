import { Router } from 'express';
import { CaracteristicaController } from '../controllers/CaracteristicaController.js';
import { verificarToken, verificarRol } from '../middleware/authMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Rutas públicas
router.get('/tipos', CaracteristicaController.getTiposCaracteristicas);
router.get('/producto/:id_producto', CaracteristicaController.getCaracteristicasProducto);

// Rutas de administración (requieren autenticación)
router.get('/tipos/todas', verificarToken, CaracteristicaController.getAllTipos);
router.post('/tipos', verificarToken, verificarRol([ROLES.ADMIN, ROLES.GERENTE]), CaracteristicaController.createTipoCaracteristica);
router.put('/tipos/:id_tipo', verificarToken, verificarRol([ROLES.ADMIN, ROLES.GERENTE]), CaracteristicaController.updateTipoCaracteristica);
router.delete('/tipos/:id_tipo', verificarToken, verificarRol([ROLES.ADMIN]), CaracteristicaController.deleteTipoCaracteristica);

router.post('/producto/:id_producto', verificarToken, verificarRol([ROLES.ADMIN, ROLES.GERENTE]), CaracteristicaController.addCaracteristicaProducto);
router.put('/:id_caracteristica', verificarToken, verificarRol([ROLES.ADMIN, ROLES.GERENTE]), CaracteristicaController.updateCaracteristicaProducto);
router.delete('/:id_caracteristica', verificarToken, verificarRol([ROLES.ADMIN, ROLES.GERENTE]), CaracteristicaController.deleteCaracteristicaProducto);

export default router;
