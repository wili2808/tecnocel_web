import { Router } from 'express';
import { CompraController } from '../controllers/CompraController.js';
import { verificarToken, verificarPermiso } from '../middleware/authMiddleware.js';

const router = Router();

// ============================================================================
// RUTAS PROTEGIDAS - Requieren permisos específicos
// ============================================================================

/**
 * GET /api/compras/admin/estadisticas
 * Obtiene estadísticas de compras (hoy, semana, mes, gasto total del mes)
 * Permiso: ver_compras
 */
router.get(
  '/admin/estadisticas',
  verificarToken,
  verificarPermiso('ver_compras'),
  CompraController.obtenerEstadisticas
);

/**
 * GET /api/compras/admin/listar
 * Lista compras con paginación y filtros
 * Permiso: ver_compras
 */
router.get(
  '/admin/listar',
  verificarToken,
  verificarPermiso('ver_compras'),
  CompraController.listarCompras
);

/**
 * POST /api/compras/admin/registrar
 * Registra una nueva compra a un proveedor
 * Permiso: crear_compra
 */
router.post(
  '/admin/registrar',
  verificarToken,
  verificarPermiso('crear_compra'),
  CompraController.registrarCompra
);

/**
 * PATCH /api/compras/admin/:id/anular
 * Anula una compra activa (revertir stock)
 * Permiso: editar_compra
 */
router.patch(
  '/admin/:id/anular',
  verificarToken,
  verificarPermiso('editar_compra'),
  CompraController.anularCompra
);

/**
 * GET /api/compras/admin/:id
 * Obtiene detalle completo de una compra
 * Permiso: ver_compras
 */
router.get(
  '/admin/:id',
  verificarToken,
  verificarPermiso('ver_compras'),
  CompraController.obtenerDetalle
);

export default router;
