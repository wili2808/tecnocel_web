import { Router } from 'express';
import { ProveedorController } from '../controllers/ProveedorController.js';
import { verificarToken, verificarPermiso } from '../middleware/authMiddleware.js';

const router = Router();

// ============================================================================
// RUTAS PROTEGIDAS - Requieren permisos específicos
// ============================================================================

/**
 * GET /proveedores
 * Obtiene listado de proveedores con búsqueda opcional
 * Permiso: ver_proveedores
 */
router.get(
  '/',
  verificarToken,
  verificarPermiso('ver_proveedores'),
  ProveedorController.listarProveedores
);

/**
 * GET /proveedores/:id
 * Obtiene detalle de un proveedor específico
 * Permiso: ver_proveedores
 */
router.get(
  '/:id',
  verificarToken,
  verificarPermiso('ver_proveedores'),
  ProveedorController.obtenerProveedor
);

/**
 * POST /proveedores
 * Crea un nuevo proveedor
 * Permiso: crear_proveedor
 */
router.post(
  '/',
  verificarToken,
  verificarPermiso('crear_proveedor'),
  ProveedorController.crearProveedor
);

/**
 * PUT /proveedores/:id
 * Actualiza información de un proveedor
 * Permiso: editar_proveedor
 */
router.put(
  '/:id',
  verificarToken,
  verificarPermiso('editar_proveedor'),
  ProveedorController.actualizarProveedor
);

export default router;
