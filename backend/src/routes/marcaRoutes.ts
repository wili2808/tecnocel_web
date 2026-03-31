import { Router } from 'express';
import { MarcaController } from '../controllers/MarcaController.js';
import { verificarToken, verificarPermiso } from '../middleware/authMiddleware.js';
import {
  validateCreateMarca,
  validateUpdateMarca,
  validateDeleteMarca,
  validateGetMarcaById
} from '../middleware/validateMarca.js';

const router = Router();

// ============================================================================
// RUTAS PÚBLICAS - No requieren autenticación
// ============================================================================

/**
 * GET /marcas
 * Obtiene todas las marcas activas del sistema
 * Acceso: Público
 */
router.get('/', MarcaController.getAllMarcas);

/**
 * GET /marcas/:id
 * Obtiene una marca específica por su ID
 * Acceso: Público
 * Validación: ID debe ser número entero positivo
 */
router.get('/:id', validateGetMarcaById, MarcaController.getMarcaById);

// ============================================================================
// RUTAS DE ADMINISTRACIÓN - Requieren permisos específicos
// ============================================================================

/**
 * POST /marcas
 * Crea una nueva marca en el sistema
 * Acceso: Permiso crear_marca
 */
router.post(
  '/',
  verificarToken,
  verificarPermiso('crear_marca'),
  validateCreateMarca,
  MarcaController.createMarca
);

/**
 * PUT /marcas/:id
 * Actualiza una marca existente
 * Acceso: Permiso editar_marca
 */
router.put(
  '/:id',
  verificarToken,
  verificarPermiso('editar_marca'),
  validateUpdateMarca,
  MarcaController.updateMarca
);

/**
 * DELETE /marcas/:id
 * Elimina (soft delete) una marca del sistema
 * Acceso: Permiso eliminar_marca
 */
router.delete(
  '/:id',
  verificarToken,
  verificarPermiso('eliminar_marca'),
  validateDeleteMarca,
  MarcaController.deleteMarca
);

export default router;
