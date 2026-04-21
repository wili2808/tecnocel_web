import { Router } from 'express';
import CarritoController from '../controllers/CarritoController.js';
import { verificarTokenCliente } from '../middleware/authMiddleware.js';
import {
  validateAgregarItem,
  validateActualizarCantidad,
  validateEliminarItem,
  validateConfirmarCompra,
  validateObtenerHistorial,
  verificarLimitesCarrito,
  logCarritoOperation,
  verificarDisponibilidadProducto,
  carritoRateLimitDiferenciado
} from '../middleware/validateCarrito.js';

const router = Router();

// -- Rutas protegidas (requieren autenticación) --

router.use(verificarTokenCliente);

// --- Rate limiting diferenciado para operaciones de carrito ---

router.use(carritoRateLimitDiferenciado);

/**
 * @swagger
 * /carrito:
 *   get:
 *     summary: Obtener carrito
 *     description: Obtiene el carrito activo del cliente autenticado
 *     tags: [Carrito]
 *     security:
 *       - bearerAuthCliente: []
 *     responses:
 *       200:
 *         description: Carrito obtenido exitosamente
 *       401:
 *         description: Cliente no autenticado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', 
  logCarritoOperation('obtener_carrito'),
  CarritoController.obtenerCarrito
);

/**
 * @swagger
 * /carrito/items:
 *   post:
 *     summary: Agregar producto al carrito
 *     description: Agrega un producto al carrito activo o actualiza su cantidad si ya existe
 *     tags: [Carrito]
 *     security:
 *       - bearerAuthCliente: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_producto
 *               - cantidad
 *             properties:
 *               id_producto:
 *                 type: integer
 *               cantidad:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Producto agregado al carrito
 *       400:
 *         description: Datos inválidos o stock insuficiente
 *       401:
 *         description: Cliente no autenticado
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/items', 
  logCarritoOperation('agregar_item'),
  validateAgregarItem,
  verificarDisponibilidadProducto,
  verificarLimitesCarrito,
  CarritoController.agregarItem
);

/**
 * @swagger
 * /carrito/items/{id_item}:
 *   put:
 *     summary: Actualizar cantidad de un item
 *     description: Actualiza la cantidad de un producto específico en el carrito
 *     tags: [Carrito]
 *     security:
 *       - bearerAuthCliente: []
 *     parameters:
 *       - in: path
 *         name: id_item
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cantidad
 *             properties:
 *               cantidad:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Cantidad actualizada exitosamente
 *       400:
 *         description: Datos inválidos o stock insuficiente
 *       404:
 *         description: Item no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put('/items/:id_item', 
  logCarritoOperation('actualizar_cantidad'),
  validateActualizarCantidad,
  verificarLimitesCarrito,
  CarritoController.actualizarCantidad
);

/**
 * @swagger
 * /carrito/items/{id_item}:
 *   delete:
 *     summary: Eliminar un item del carrito
 *     description: Elimina un producto específico del carrito activo
 *     tags: [Carrito]
 *     security:
 *       - bearerAuthCliente: []
 *     parameters:
 *       - in: path
 *         name: id_item
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item eliminado exitosamente
 *       404:
 *         description: Item no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/items/:id_item', 
  logCarritoOperation('eliminar_item'),
  validateEliminarItem,
  CarritoController.eliminarItem
);

/**
 * @swagger
 * /carrito:
 *   delete:
 *     summary: Vaciar carrito completo
 *     description: Elimina todos los items del carrito activo
 *     tags: [Carrito]
 *     security:
 *       - bearerAuthCliente: []
 *     responses:
 *       200:
 *         description: Carrito vaciado exitosamente
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/', 
  logCarritoOperation('vaciar_carrito'),
  CarritoController.vaciarCarrito
);

/**
 * @swagger
 * /carrito/confirmar-compra:
 *   post:
 *     summary: Confirmar compra
 *     description: Convierte el carrito activo en una nueva venta
 *     tags: [Carrito]
 *     security:
 *       - bearerAuthCliente: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_direccion_envio
 *               - tipo_envio
 *               - metodo_pago
 *             properties:
 *               id_direccion_envio:
 *                 type: integer
 *               tipo_envio:
 *                 type: string
 *               metodo_pago:
 *                 type: string
 *     responses:
 *       201:
 *         description: Compra confirmada y venta creada
 *       400:
 *         description: Carrito vacío, sin stock o datos inválidos
 *       404:
 *         description: Carrito no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/confirmar-compra', 
  logCarritoOperation('confirmar_compra'),
  validateConfirmarCompra,
  CarritoController.confirmarCompra
);

/**
 * @swagger
 * /carrito/historial:
 *   get:
 *     summary: Obtener historial de carritos
 *     description: Obtiene el historial de carritos pasados del cliente
 *     tags: [Carrito]
 *     security:
 *       - bearerAuthCliente: []
 *     responses:
 *       200:
 *         description: Historial de carritos obtenido
 *       500:
 *         description: Error interno del servidor
 */
router.get('/historial', 
  logCarritoOperation('obtener_historial'),
  validateObtenerHistorial,
  CarritoController.obtenerHistorial
);

export default router; 