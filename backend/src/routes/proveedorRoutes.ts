import { Router } from 'express';
import { ProveedorController } from '../controllers/ProveedorController.js';
import { verificarToken, verificarRol } from '../middleware/authMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// ============================================================================
// RUTAS PROTEGIDAS - Requieren autenticación (token válido)
// ============================================================================

/**
 * GET /proveedores
 * Obtiene listado de proveedores con búsqueda opcional
 * Acceso: Usuarios autenticados (ADMIN, GERENTE, VENDEDOR)
 * Query: ?search=texto
 */
router.get(
  '/',
  verificarToken,
  verificarRol([ROLES.ADMIN, ROLES.GERENTE, ROLES.VENDEDOR]),
  ProveedorController.listarProveedores
);

/**
 * GET /proveedores/:id
 * Obtiene detalle de un proveedor específico
 * Acceso: Usuarios autenticados (ADMIN, GERENTE, VENDEDOR)
 */
router.get(
  '/:id',
  verificarToken,
  verificarRol([ROLES.ADMIN, ROLES.GERENTE, ROLES.VENDEDOR]),
  ProveedorController.obtenerProveedor
);

/**
 * POST /proveedores
 * Crea un nuevo proveedor
 * Acceso: Solo ADMIN(1) y GERENTE(2)
 * Body: CreateProveedorBody
 */
router.post(
  '/',
  verificarToken,
  verificarRol([ROLES.ADMIN, ROLES.GERENTE]),
  ProveedorController.crearProveedor
);

/**
 * PUT /proveedores/:id
 * Actualiza información de un proveedor
 * Acceso: Solo ADMIN(1) y GERENTE(2)
 * Body: UpdateProveedorBody (campos opcionales)
 */
router.put(
  '/:id',
  verificarToken,
  verificarRol([ROLES.ADMIN, ROLES.GERENTE]),
  ProveedorController.actualizarProveedor
);

export default router;
