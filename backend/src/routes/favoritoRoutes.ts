import { Router } from 'express';
import FavoritoController from '../controllers/FavoritoController.js';
import { verificarTokenCliente } from '../middleware/authMiddleware.js';

const router = Router();

// --- Todas las rutas requieren autenticación del cliente ---
router.use(verificarTokenCliente);

/**
 * @swagger
 * /favoritos/cliente/{id_cliente}:
 *   get:
 *     summary: Obtener favoritos del cliente
 *     description: Obtiene la lista de productos favoritos de un cliente
 *     tags: [Favoritos]
 *     security:
 *       - bearerAuthCliente: []
 *     parameters:
 *       - in: path
 *         name: id_cliente
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de favoritos
 *       500:
 *         description: Error interno del servidor
 */
router.get('/cliente/:id_cliente', FavoritoController.getFavoritosCliente);
/**
 * @swagger
 * /favoritos/cliente/{id_cliente}/estadisticas:
 *   get:
 *     summary: Obtener estadísticas de favoritos
 *     description: Obtiene estadísticas sobre los favoritos del cliente
 *     tags: [Favoritos]
 *     security:
 *       - bearerAuthCliente: []
 *     parameters:
 *       - in: path
 *         name: id_cliente
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Estadísticas de favoritos
 *       500:
 *         description: Error interno del servidor
 */
router.get('/cliente/:id_cliente/estadisticas', FavoritoController.getEstadisticasFavoritos);
/**
 * @swagger
 * /favoritos/cliente/{id_cliente}/producto/{id_producto}:
 *   get:
 *     summary: Verificar favorito
 *     description: Verifica si un producto específico está en los favoritos del cliente
 *     tags: [Favoritos]
 *     security:
 *       - bearerAuthCliente: []
 *     parameters:
 *       - in: path
 *         name: id_cliente
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: id_producto
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Estado de favorito verificado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/cliente/:id_cliente/producto/:id_producto', FavoritoController.verificarFavorito);

/**
 * @swagger
 * /favoritos/cliente/{id_cliente}:
 *   post:
 *     summary: Agregar a favoritos
 *     description: Agrega un producto a la lista de favoritos del cliente
 *     tags: [Favoritos]
 *     security:
 *       - bearerAuthCliente: []
 *     parameters:
 *       - in: path
 *         name: id_cliente
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
 *               - id_producto
 *             properties:
 *               id_producto:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Producto agregado a favoritos
 *       400:
 *         description: Producto ya está en favoritos
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/cliente/:id_cliente', FavoritoController.addFavorito);
/**
 * @swagger
 * /favoritos/cliente/{id_cliente}/producto/{id_producto}:
 *   delete:
 *     summary: Eliminar de favoritos
 *     description: Elimina un producto de la lista de favoritos del cliente
 *     tags: [Favoritos]
 *     security:
 *       - bearerAuthCliente: []
 *     parameters:
 *       - in: path
 *         name: id_cliente
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: id_producto
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Producto eliminado de favoritos
 *       404:
 *         description: Favorito no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/cliente/:id_cliente/producto/:id_producto', FavoritoController.removeFavorito);
/**
 * @swagger
 * /favoritos/cliente/{id_cliente}/producto/{id_producto}/toggle:
 *   put:
 *     summary: Alternar favorito
 *     description: Agrega o elimina un producto de favoritos según su estado actual
 *     tags: [Favoritos]
 *     security:
 *       - bearerAuthCliente: []
 *     parameters:
 *       - in: path
 *         name: id_cliente
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: id_producto
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Estado de favorito alternado exitosamente
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put('/cliente/:id_cliente/producto/:id_producto/toggle', FavoritoController.toggleFavorito);

export default router;