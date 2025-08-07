import { Router } from 'express';
import { MarcaController } from '../controllers/MarcaController.js';

const router = Router();

// Rutas públicas
router.get('/', MarcaController.getAllMarcas);
router.get('/:id', MarcaController.getMarcaById);

// Rutas de administración (requieren autenticación de admin)
// TODO: Agregar middleware de autenticación de admin
router.post('/', MarcaController.createMarca);
router.put('/:id', MarcaController.updateMarca);
router.delete('/:id', MarcaController.deleteMarca);

export default router;