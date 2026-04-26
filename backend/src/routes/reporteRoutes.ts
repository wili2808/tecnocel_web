import { Router } from 'express';
import ReporteController from '../controllers/ReporteController.js';
import { verificarToken, verificarPermiso } from '../middleware/authMiddleware.js';

const router = Router();

// Todas las rutas de reportes requieren autenticación + permiso ver_reportes
router.use(verificarToken);
router.use(verificarPermiso('ver_reportes'));

// Reportes
/**
 * @swagger
 * /reportes/ventas:
 *   get:
 *     summary: Reporte de ventas
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del reporte
 */
router.get('/ventas', ReporteController.reporteVentas);
/**
 * @swagger
 * /reportes/vendedores:
 *   get:
 *     summary: Reporte de vendedores
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del reporte
 */
router.get('/vendedores', ReporteController.reporteVendedores);
/**
 * @swagger
 * /reportes/productos:
 *   get:
 *     summary: Reporte de productos
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del reporte
 */
router.get('/productos', ReporteController.reporteProductos);
/**
 * @swagger
 * /reportes/clientes:
 *   get:
 *     summary: Reporte de clientes
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del reporte
 */
router.get('/clientes', ReporteController.reporteClientes);
/**
 * @swagger
 * /reportes/cancelaciones:
 *   get:
 *     summary: Reporte de cancelaciones
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del reporte
 */
router.get('/cancelaciones', ReporteController.reporteCancelaciones);

// Exportar CSV
/**
 * @swagger
 * /reportes/exportar/{tipo}:
 *   get:
 *     summary: Exportar reporte a CSV
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tipo
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Archivo CSV
 */
router.get('/exportar/:tipo', ReporteController.exportarCSV);

export default router;
