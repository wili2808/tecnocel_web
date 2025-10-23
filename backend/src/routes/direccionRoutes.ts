import { Router } from 'express';
import { DireccionController } from '../controllers/DireccionController.js';
import { verificarTokenCliente } from '../middleware/authMiddleware.js';

const router = Router();

// ============================================================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN DE CLIENTE
// ============================================================================
router.use(verificarTokenCliente);

// ============================================================================
// RUTAS DE DIRECCIONES
// ============================================================================

// Obtener todas las direcciones de un cliente
router.get('/cliente/:id_cliente', DireccionController.getDireccionesCliente);

// Obtener dirección predeterminada de un cliente
router.get('/cliente/:id_cliente/predeterminada', DireccionController.getDireccionPredeterminada);

// Obtener una dirección específica por ID
router.get('/:id', DireccionController.getDireccionById);

// Crear nueva dirección para un cliente
router.post('/cliente/:id_cliente', DireccionController.createDireccion);

// Actualizar una dirección existente
router.put('/:id', DireccionController.updateDireccion);

// Establecer una dirección como predeterminada
router.put('/:id/predeterminada', DireccionController.setPredeterminada);

// Eliminar una dirección
router.delete('/:id', DireccionController.deleteDireccion);

export default router;