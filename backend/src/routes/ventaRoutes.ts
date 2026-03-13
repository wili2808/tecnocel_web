/**
 * @file Rutas para operaciones de ventas
 *
 * Define los endpoints REST para ventas.
 *
 * RUTAS ADMIN (requieren verificarToken + verificarRol):
 * - GET  /api/ventas/admin/estadisticas  - Stats rápidas (hoy, semana, mes, ingresos)
 * - GET  /api/ventas/admin/listar        - Listado con filtros y paginación
 * - POST /api/ventas/admin/registrar     - Registrar venta manual
 * - PATCH /api/ventas/admin/:id/cancelar - Cancelar venta (solo admin rol 1)
 * - GET  /api/ventas/admin/:id_venta     - Detalle sin restricción de cliente
 *
 * RUTAS CLIENTE (requieren verificarTokenCliente):
 * - GET /api/ventas/historial            - Historial del cliente autenticado
 * - GET /api/ventas/:id_venta            - Detalle de venta propia
 *
 * @module ventaRoutes
 */

import { Router } from 'express';
import VentaController from '../controllers/VentaController.js';
import AdminVentaController from '../controllers/AdminVentaController.js';
import { verificarToken, verificarTokenCliente, verificarRol } from '../middleware/authMiddleware.js';
import { ROLES } from '../constants/roles.js';
import {
  validateObtenerHistorial,
  validateObtenerDetalle,
  validateListarVentasAdmin,
  validateRegistrarVentaManual,
  validateCancelarVenta,
  validateObtenerDetalleAdmin,
  validateTipoCambio,
  logVentaOperation,
  ventasRateLimit
} from '../middleware/validateVenta.js';

const router = Router();

// ============================================================================
// RUTAS ADMIN
// Deben registrarse ANTES del router.use(verificarTokenCliente)
// Las rutas estáticas van antes que las parametrizadas (/admin/:id_venta)
// ============================================================================

/**
 * GET /api/ventas/admin/estadisticas
 * Estadísticas de ventas: hoy, semana, mes, ingresos del mes
 * Roles: admin (1), empleado (2), vendedor (3)
 */
router.get('/admin/estadisticas',
  verificarToken,
  verificarRol([ROLES.ADMIN, ROLES.GERENTE, ROLES.VENDEDOR]),
  AdminVentaController.obtenerEstadisticasVentas
);

/**
 * GET /api/ventas/admin/listar
 * Listado de ventas con filtros opcionales: fecha, estado, tipo_venta, metodo_pago, search
 * Roles: admin (1), empleado (2), vendedor (3)
 */
router.get('/admin/listar',
  verificarToken,
  verificarRol([ROLES.ADMIN, ROLES.GERENTE, ROLES.VENDEDOR]),
  validateListarVentasAdmin,
  AdminVentaController.listarVentasAdmin
);

/**
 * POST /api/ventas/admin/registrar
 * Registrar una venta manual (sin flujo de carrito web)
 * Roles: admin (1), empleado (2), vendedor (3)
 */
router.post('/admin/registrar',
  verificarToken,
  verificarRol([ROLES.ADMIN, ROLES.GERENTE, ROLES.VENDEDOR]),
  validateRegistrarVentaManual,
  AdminVentaController.registrarVentaManual
);

/**
 * PATCH /api/ventas/admin/:id_venta/cancelar
 * Cancelar una venta y restaurar stock
 * Roles: admin (1) y vendedor (3)
 */
router.patch('/admin/:id_venta/cancelar',
  verificarToken,
  verificarRol([ROLES.ADMIN, ROLES.VENDEDOR]),
  validateCancelarVenta,
  AdminVentaController.cancelarVenta
);

/**
 * PATCH /api/ventas/admin/:id_venta/estado
 * Actualiza el estado de una venta (en_preparacion, enviado, entregado)
 * Roles: admin (1), gerente (2), vendedor (3)
 */
router.patch('/admin/:id_venta/estado',
  verificarToken,
  verificarRol([ROLES.ADMIN, ROLES.GERENTE, ROLES.VENDEDOR]),
  AdminVentaController.actualizarEstadoVenta.bind(AdminVentaController)
);

/**
 * GET /api/ventas/admin/tipo-cambio
 * Obtiene la cotización USD/ARS configurada
 * Roles: admin (1), empleado (2), vendedor (3)
 */
router.get('/admin/tipo-cambio',
  verificarToken,
  verificarRol([ROLES.ADMIN, ROLES.GERENTE, ROLES.VENDEDOR]),
  AdminVentaController.obtenerTipoCambio
);

/**
 * PUT /api/ventas/admin/tipo-cambio
 * Actualiza la cotización USD/ARS
 * Roles: SOLO admin (1) y empleado (2)
 */
router.put('/admin/tipo-cambio',
  verificarToken,
  verificarRol([ROLES.ADMIN, ROLES.GERENTE]),
  validateTipoCambio,
  AdminVentaController.actualizarTipoCambio
);

/**
 * GET /api/ventas/admin/:id_venta
 * Detalle completo de una venta (sin restricción de propietario)
 * Roles: admin (1), empleado (2), vendedor (3)
 */
router.get('/admin/:id_venta',
  verificarToken,
  verificarRol([ROLES.ADMIN, ROLES.GERENTE, ROLES.VENDEDOR]),
  validateObtenerDetalleAdmin,
  AdminVentaController.obtenerDetalleAdmin
);

// ============================================================================
// RUTAS CLIENTE
// El middleware global verificarTokenCliente aplica solo a las rutas de abajo
// ============================================================================

router.use(verificarTokenCliente);
router.use(ventasRateLimit);

/**
 * GET /api/ventas/historial
 * Historial de ventas del cliente autenticado
 */
router.get('/historial',
  logVentaOperation('obtener_historial'),
  validateObtenerHistorial,
  VentaController.obtenerHistorialCliente
);

/**
 * GET /api/ventas/:id_venta
 * Detalle de una venta específica (solo el cliente propietario)
 */
router.get('/:id_venta',
  logVentaOperation('obtener_detalle'),
  validateObtenerDetalle,
  VentaController.obtenerDetalle
);

export default router;
