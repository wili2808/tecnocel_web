import { Router } from 'express';
import { CompraController } from '../controllers/CompraController.js';
import { verificarToken, verificarRol } from '../middleware/authMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// ============================================================================
// RUTAS PROTEGIDAS - Requieren autenticación (token válido)
// Todos los usuarios autenticados (ADMIN, GERENTE, VENDEDOR) pueden ver y registrar
// Solo ADMIN y GERENTE pueden anular
// ============================================================================

/**
 * GET /api/compras/admin/estadisticas
 * Obtiene estadísticas de compras (hoy, semana, mes, gasto total del mes)
 * Acceso: ADMIN(1), GERENTE(2), VENDEDOR(3)
 */
router.get(
  '/admin/estadisticas',
  verificarToken,
  verificarRol([ROLES.ADMIN, ROLES.GERENTE, ROLES.VENDEDOR]),
  CompraController.obtenerEstadisticas
);

/**
 * GET /api/compras/admin/listar
 * Lista compras con paginación y filtros
 * Acceso: ADMIN(1), GERENTE(2), VENDEDOR(3)
 * Query: ?limit=20&offset=0&fecha_inicio=YYYY-MM-DD&fecha_fin=YYYY-MM-DD&id_proveedor=N&estado=activa&search=texto
 */
router.get(
  '/admin/listar',
  verificarToken,
  verificarRol([ROLES.ADMIN, ROLES.GERENTE, ROLES.VENDEDOR]),
  CompraController.listarCompras
);

/**
 * POST /api/compras/admin/registrar
 * Registra una nueva compra a un proveedor
 * Acceso: ADMIN(1), GERENTE(2), VENDEDOR(3)
 * Body: RegistrarCompraBody
 */
router.post(
  '/admin/registrar',
  verificarToken,
  verificarRol([ROLES.ADMIN, ROLES.GERENTE, ROLES.VENDEDOR]),
  CompraController.registrarCompra
);

/**
 * PATCH /api/compras/admin/:id/anular
 * Anula una compra activa (revertir stock)
 * Acceso: Solo ADMIN(1) y GERENTE(2)
 * Body: AnularCompraBody
 */
router.patch(
  '/admin/:id/anular',
  verificarToken,
  verificarRol([ROLES.ADMIN, ROLES.GERENTE]),
  CompraController.anularCompra
);

/**
 * GET /api/compras/admin/:id
 * Obtiene detalle completo de una compra
 * Acceso: ADMIN(1), GERENTE(2), VENDEDOR(3)
 */
router.get(
  '/admin/:id',
  verificarToken,
  verificarRol([ROLES.ADMIN, ROLES.GERENTE, ROLES.VENDEDOR]),
  CompraController.obtenerDetalle
);

export default router;
