import { Router } from 'express';
import { MarcaController } from '../controllers/MarcaController.js';
import { verificarToken, verificarRol } from '../middleware/authMiddleware.js';
import { ROLES } from '../constants/roles.js';
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
// RUTAS DE ADMINISTRACIÓN - Requieren autenticación de admin (rol 1)
// ============================================================================

/**
 * POST /marcas
 * Crea una nueva marca en el sistema
 * Acceso: Solo administradores
 * Validación: nombre_marca requerido (2-100 chars), logo y descripción opcionales
 */
router.post(
  '/',
  verificarToken,
  verificarRol([ROLES.ADMIN]),
  validateCreateMarca,
  MarcaController.createMarca
);

/**
 * PUT /marcas/:id
 * Actualiza una marca existente
 * Acceso: Solo administradores
 * Validación: ID requerido, campos opcionales
 */
router.put(
  '/:id',
  verificarToken,
  verificarRol([ROLES.ADMIN]),
  validateUpdateMarca,
  MarcaController.updateMarca
);

/**
 * DELETE /marcas/:id
 * Elimina (soft delete) una marca del sistema
 * Acceso: Solo administradores
 * Validación: ID debe ser número entero positivo
 */
router.delete(
  '/:id',
  verificarToken,
  verificarRol([ROLES.ADMIN]),
  validateDeleteMarca,
  MarcaController.deleteMarca
);

export default router;
