import { Router } from 'express';
import { CaracteristicaController } from '../controllers/CaracteristicaController.js';

const router = Router();

// Rutas para tipos de características
router.get('/tipos', CaracteristicaController.getTiposCaracteristicas);
router.post('/tipos', CaracteristicaController.createTipoCaracteristica);

// Rutas para características de productos
router.get('/producto/:id_producto', CaracteristicaController.getCaracteristicasProducto);
router.post('/producto/:id_producto', CaracteristicaController.addCaracteristicaProducto);
router.put('/:id_caracteristica', CaracteristicaController.updateCaracteristicaProducto);
router.delete('/:id_caracteristica', CaracteristicaController.deleteCaracteristicaProducto);

export default router;