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
 * @swagger
 * /ventas/admin/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de ventas
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de ventas
 */
router.get('/admin/estadisticas',
  verificarToken,
  verificarPermiso('ver_ventas'),
  AdminVentaController.obtenerEstadisticasVentas
);

/**
 * @swagger
 * /ventas/admin/listar:
 *   get:
 *     summary: Listar ventas
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de ventas
 */
router.get('/admin/listar',
  verificarToken,
  verificarPermiso('ver_ventas'),
  validateListarVentasAdmin,
  AdminVentaController.listarVentasAdmin
);

/**
 * @swagger
 * /ventas/admin/registrar:
 *   post:
 *     summary: Registrar venta manual
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cliente_id:
 *                 type: integer
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Venta registrada
 */
router.post('/admin/registrar',
  verificarToken,
  verificarPermiso('crear_venta'),
  validateRegistrarVentaManual,
  AdminVentaController.registrarVentaManual
);

/**
 * @swagger
 * /ventas/admin/{id_venta}/cancelar:
 *   patch:
 *     summary: Cancelar venta
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_venta
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Venta cancelada
 */
router.patch('/admin/:id_venta/cancelar',
  verificarToken,
  verificarPermiso('cancelar_venta'),
  validateCancelarVenta,
  AdminVentaController.cancelarVenta
);

/**
 * @swagger
 * /ventas/admin/{id_venta}/estado:
 *   patch:
 *     summary: Actualizar estado de venta
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_venta
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               estado:
 *                 type: string
 *     responses:
 *       200:
 *         description: Estado actualizado
 */
router.patch('/admin/:id_venta/estado',
  verificarToken,
  verificarPermiso('editar_venta'),
  AdminVentaController.actualizarEstadoVenta.bind(AdminVentaController)
);

/**
 * @swagger
 * /ventas/admin/tipo-cambio:
 *   get:
 *     summary: Obtener tipo de cambio
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tipo de cambio
 */
router.get('/admin/tipo-cambio',
  verificarToken,
  verificarPermiso('ver_configuracion'),
  AdminVentaController.obtenerTipoCambio
);

/**
 * @swagger
 * /ventas/admin/tipo-cambio:
 *   put:
 *     summary: Actualizar tipo de cambio
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cotizacion:
 *                 type: number
 *     responses:
 *       200:
 *         description: Tipo de cambio actualizado
 */
router.put('/admin/tipo-cambio',
  verificarToken,
  verificarPermiso('editar_configuracion'),
  validateTipoCambio,
  AdminVentaController.actualizarTipoCambio
);

/**
 * @swagger
 * /ventas/admin/{id_venta}/comprobante:
 *   get:
 *     summary: Descargar comprobante
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_venta
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: PDF del comprobante
 */
router.get('/admin/:id_venta/comprobante',
  verificarToken,
  verificarPermiso('ver_ventas'),
  AdminVentaController.descargarComprobante.bind(AdminVentaController)
);

/**
 * @swagger
 * /ventas/admin/{id_venta}/enviar-comprobante:
 *   post:
 *     summary: Enviar comprobante por email
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_venta
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Email enviado
 */
router.post('/admin/:id_venta/enviar-comprobante',
  verificarToken,
  verificarPermiso('ver_ventas'),
  AdminVentaController.enviarComprobante.bind(AdminVentaController)
);

/**
 * @swagger
 * /ventas/admin/{id_venta}:
 *   get:
 *     summary: Detalle de venta
 *     tags: [Ventas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_venta
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalle de la venta
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
 * @swagger
 * /ventas/historial:
 *   get:
 *     summary: Historial de ventas del cliente
 *     tags: [Ventas]
 *     security:
 *       - bearerAuthCliente: []
 *     responses:
 *       200:
 *         description: Historial de ventas
 */
router.get('/historial',
  logVentaOperation('obtener_historial'),
  validateObtenerHistorial,
  VentaController.obtenerHistorialCliente
);

/**
 * @swagger
 * /ventas/{id_venta}:
 *   get:
 *     summary: Detalle de venta de cliente
 *     tags: [Ventas]
 *     security:
 *       - bearerAuthCliente: []
 *     parameters:
 *       - in: path
 *         name: id_venta
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalle de la venta
 */
router.get('/:id_venta',
  logVentaOperation('obtener_detalle'),
  validateObtenerDetalle,
  VentaController.obtenerDetalle
);

export default router;
