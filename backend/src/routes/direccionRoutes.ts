import { Router } from 'express';
import { DireccionController } from '../controllers/DireccionController.js';

const router = Router();

// Todas las rutas requieren autenticación del cliente
// TODO: Agregar middleware de autenticación de cliente

// Rutas de direcciones
router.get('/cliente/:id_cliente', DireccionController.getDireccionesCliente);
router.get('/cliente/:id_cliente/predeterminada', DireccionController.getDireccionPredeterminada);
router.get('/:id', DireccionController.getDireccionById);

router.post('/cliente/:id_cliente', DireccionController.createDireccion);
router.put('/:id', DireccionController.updateDireccion);
router.put('/:id/predeterminada', DireccionController.setPredeterminada);
router.delete('/:id', DireccionController.deleteDireccion);

export default router;