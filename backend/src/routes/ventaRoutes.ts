/**
 * @file Rutas para operaciones de ventas
 *
 * Define los endpoints REST para ventas.
 *
 * RUTAS ADMIN (requieren verificarToken + verificarPermiso):
 * - GET  /api/ventas/admin/estadisticas           - Stats rápidas (hoy, semana, mes, ingresos)
 * - GET  /api/ventas/admin/listar                 - Listado con filtros y paginación
 * - POST /api/ventas/admin/registrar              - Registrar venta manual
 * - PATCH /api/ventas/admin/:id/cancelar          - Cancelar venta
 * - GET  /api/ventas/admin/:id_venta/comprobante  - Descargar PDF del comprobante
 * - POST /api/ventas/admin/:id_venta/enviar-comprobante - Enviar comprobante por email
 * - GET  /api/ventas/admin/:id_venta              - Detalle sin restricción de cliente
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
import { verificarToken, verificarTokenCliente, verificarPermiso } from '../middleware/authMiddleware.js';
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
 * Permiso: ver_ventas
 */
router.get('/admin/estadisticas',
  verificarToken,
  verificarPermiso('ver_ventas'),
  AdminVentaController.obtenerEstadisticasVentas
);

/**
 * GET /api/ventas/admin/listar
 * Listado de ventas con filtros opcionales: fecha, estado, tipo_venta, metodo_pago, search
 * Permiso: ver_ventas
 */
router.get('/admin/listar',
  verificarToken,
  verificarPermiso('ver_ventas'),
  validateListarVentasAdmin,
  AdminVentaController.listarVentasAdmin
);

/**
 * POST /api/ventas/admin/registrar
 * Registrar una venta manual (sin flujo de carrito web)
 * Permiso: crear_venta
 */
router.post('/admin/registrar',
  verificarToken,
  verificarPermiso('crear_venta'),
  validateRegistrarVentaManual,
  AdminVentaController.registrarVentaManual
);

/**
 * PATCH /api/ventas/admin/:id_venta/cancelar
 * Cancelar una venta y restaurar stock
 * Permiso: cancelar_venta
 */
router.patch('/admin/:id_venta/cancelar',
  verificarToken,
  verificarPermiso('cancelar_venta'),
  validateCancelarVenta,
  AdminVentaController.cancelarVenta
);

/**
 * PATCH /api/ventas/admin/:id_venta/estado
 * Actualiza el estado de una venta (en_preparacion, enviado, entregado)
 * Permiso: editar_venta
 */
router.patch('/admin/:id_venta/estado',
  verificarToken,
  verificarPermiso('editar_venta'),
  AdminVentaController.actualizarEstadoVenta.bind(AdminVentaController)
);

/**
 * GET /api/ventas/admin/tipo-cambio
 * Obtiene la cotización USD/ARS configurada
 * Permiso: ver_configuracion
 */
router.get('/admin/tipo-cambio',
  verificarToken,
  verificarPermiso('ver_configuracion'),
  AdminVentaController.obtenerTipoCambio
);

/**
 * PUT /api/ventas/admin/tipo-cambio
 * Actualiza la cotización USD/ARS
 * Permiso: editar_configuracion
 */
router.put('/admin/tipo-cambio',
  verificarToken,
  verificarPermiso('editar_configuracion'),
  validateTipoCambio,
  AdminVentaController.actualizarTipoCambio
);

/**
 * GET /api/ventas/admin/:id_venta/comprobante
 * Genera y descarga el comprobante de una venta en PDF
 * Permiso: ver_ventas
 */
router.get('/admin/:id_venta/comprobante',
  verificarToken,
  verificarPermiso('ver_ventas'),
  AdminVentaController.descargarComprobante.bind(AdminVentaController)
);

/**
 * POST /api/ventas/admin/:id_venta/enviar-comprobante
 * Envía el comprobante por email al cliente registrado en la venta
 * Permiso: ver_ventas
 */
router.post('/admin/:id_venta/enviar-comprobante',
  verificarToken,
  verificarPermiso('ver_ventas'),
  AdminVentaController.enviarComprobante.bind(AdminVentaController)
);

/**
 * GET /api/ventas/admin/:id_venta
 * Detalle completo de una venta (sin restricción de propietario)
 * Permiso: ver_ventas
 */
router.get('/admin/:id_venta',
  verificarToken,
  verificarPermiso('ver_ventas'),
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
