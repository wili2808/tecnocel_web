/**
 * @file Rutas para operaciones de ventas
 *
 * Define los endpoints REST para consultar ventas confirmadas.
 * Todas las rutas requieren autenticación de cliente.
 *
 * Endpoints disponibles:
 * - GET /api/ventas/historial - Obtener historial de ventas del cliente
 * - GET /api/ventas/:id_venta - Obtener detalle de una venta específica
 *
 * @module ventaRoutes
 */

import { Router } from 'express';
import VentaController from '../controllers/VentaController.js';
import { verificarTokenCliente } from '../middleware/authMiddleware.js';
import {
  validateObtenerHistorial,
  validateObtenerDetalle,
  logVentaOperation,
  ventasRateLimit
} from '../middleware/validateVenta.js';

const router = Router();

// ============================================================================
// MIDDLEWARE GLOBAL
// ============================================================================

// Todas las rutas de ventas requieren autenticación de cliente
router.use(verificarTokenCliente);

// Rate limiting para prevenir abuso
router.use(ventasRateLimit);

// ============================================================================
// ENDPOINTS DE CONSULTA
// ============================================================================

/**
 * GET /api/ventas/historial
 *
 * Obtiene el historial de ventas del cliente autenticado.
 *
 * Query params:
 * - limit: Número máximo de ventas a retornar (1-50, default: 10)
 * - offset: Número de ventas a saltar para paginación (default: 0)
 *
 * Requiere: Bearer token del cliente
 *
 * Respuesta 200:
 * [
 *   {
 *     id_venta: number,
 *     numero_venta: string,      // Formato: "V-00001"
 *     fecha_venta: string,        // ISO 8601
 *     total: number,              // Total pagado
 *     estado: "completada",
 *     items: [
 *       {
 *         nombre_producto: string,
 *         cantidad: number,
 *         precio_unitario: number,
 *         subtotal: number
 *       }
 *     ]
 *   }
 * ]
 *
 * @example
 * GET /api/ventas/historial?limit=10&offset=0
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */
router.get('/historial',
  logVentaOperation('obtener_historial'),
  validateObtenerHistorial,
  VentaController.obtenerHistorialCliente
);

/**
 * GET /api/ventas/:id_venta
 *
 * Obtiene el detalle completo de una venta específica.
 * Solo permite acceso al cliente dueño de la venta.
 *
 * Params:
 * - id_venta: ID de la venta a consultar
 *
 * Requiere: Bearer token del cliente
 *
 * Respuesta 200:
 * {
 *   id_venta: number,
 *   numero_venta: string,
 *   fecha_venta: string,
 *   total: number,
 *   estado: "completada",
 *   observaciones: string | null,
 *   moneda: string,
 *   valor_dolar: number | null,
 *   cliente: {
 *     id_cliente: number,
 *     nombre_cliente: string,
 *     apellido_cliente: string,
 *     correo: string
 *   },
 *   items: [...]
 * }
 *
 * @example
 * GET /api/ventas/5
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */
router.get('/:id_venta',
  logVentaOperation('obtener_detalle'),
  validateObtenerDetalle,
  VentaController.obtenerDetalle
);

export default router;
