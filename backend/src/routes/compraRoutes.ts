import { Router } from 'express';
import { CompraController } from '../controllers/CompraController.js';
import { verificarToken, verificarPermiso } from '../middleware/authMiddleware.js';

const router = Router();

// --- RUTAS PROTEGIDAS ---

/**
 * @swagger
 * /compras/admin/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de compras
 *     description: Obtiene estadísticas de compras (hoy, semana, mes, gasto total del mes)
 *     tags: [Compras]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas
 *       403:
 *         description: No tiene permisos
 *       500:
 *         description: Error interno
 */
router.get(
  '/admin/estadisticas',
  verificarToken,
  verificarPermiso('ver_compras'),
  CompraController.obtenerEstadisticas
);

/**
 * @swagger
 * /compras/admin/listar:
 *   get:
 *     summary: Listar compras
 *     description: Lista compras con paginación y filtros
 *     tags: [Compras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *       - in: query
 *         name: busqueda
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de compras
 *       403:
 *         description: No tiene permisos
 *       500:
 *         description: Error interno
 */
router.get(
  '/admin/listar',
  verificarToken,
  verificarPermiso('ver_compras'),
  CompraController.listarCompras
);

/**
 * @swagger
 * /compras/admin/registrar:
 *   post:
 *     summary: Registrar compra
 *     description: Registra una nueva compra a un proveedor
 *     tags: [Compras]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_proveedor
 *               - items
 *             properties:
 *               id_proveedor:
 *                 type: integer
 *               numero_factura:
 *                 type: string
 *               observaciones:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id_producto
 *                     - cantidad
 *                     - costo_unitario
 *                   properties:
 *                     id_producto:
 *                       type: integer
 *                     cantidad:
 *                       type: integer
 *                     costo_unitario:
 *                       type: number
 *     responses:
 *       201:
 *         description: Compra registrada
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos
 *       500:
 *         description: Error interno
 */
router.post(
  '/admin/registrar',
  verificarToken,
  verificarPermiso('crear_compra'),
  CompraController.registrarCompra
);

/**
 * @swagger
 * /compras/admin/{id}/anular:
 *   patch:
 *     summary: Anular compra
 *     description: Anula una compra activa y revierte el stock
 *     tags: [Compras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Compra anulada exitosamente
 *       403:
 *         description: No tiene permisos
 *       404:
 *         description: Compra no encontrada
 *       500:
 *         description: Error interno
 */
router.patch(
  '/admin/:id/anular',
  verificarToken,
  verificarPermiso('editar_compra'),
  CompraController.anularCompra
);

/**
 * @swagger
 * /compras/admin/{id}:
 *   get:
 *     summary: Obtener detalle de compra
 *     description: Obtiene el detalle completo de una compra
 *     tags: [Compras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Detalle de la compra
 *       403:
 *         description: No tiene permisos
 *       404:
 *         description: Compra no encontrada
 *       500:
 *         description: Error interno
 */
router.get(
  '/admin/:id',
  verificarToken,
  verificarPermiso('ver_compras'),
  CompraController.obtenerDetalle
);

export default router;
