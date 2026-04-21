import { Router } from 'express';
import { OfertaController } from '../controllers/OfertaController.js';
import { verificarToken, verificarPermiso } from '../middleware/authMiddleware.js';

const router = Router();

// --- Rutas públicas ---
/**
 * @swagger
 * /ofertas/activas:
 *   get:
 *     summary: Obtener ofertas activas
 *     tags: [Ofertas]
 *     responses:
 *       200:
 *         description: Lista de ofertas activas
 */
router.get('/activas', OfertaController.getOfertasActivas);
/**
 * @swagger
 * /ofertas/productos:
 *   get:
 *     summary: Obtener productos en oferta
 *     tags: [Ofertas]
 *     responses:
 *       200:
 *         description: Lista de productos en oferta
 */
router.get('/productos', OfertaController.getProductosEnOferta);

// --- Rutas de administración (requieren permisos específicos) ---
/**
 * @swagger
 * /ofertas/todas:
 *   get:
 *     summary: Obtener todas las ofertas (admin)
 *     tags: [Ofertas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todas las ofertas
 */
router.get('/todas', verificarToken, verificarPermiso('ver_ofertas'), OfertaController.getAllOfertas);
/**
 * @swagger
 * /ofertas/producto/{id_producto}:
 *   get:
 *     summary: Obtener ofertas por producto (admin)
 *     tags: [Ofertas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_producto
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de ofertas del producto
 */
router.get('/producto/:id_producto', verificarToken, verificarPermiso('ver_ofertas'), OfertaController.getOfertasByProducto);
/**
 * @swagger
 * /ofertas/{id}:
 *   get:
 *     summary: Obtener oferta por ID (admin)
 *     tags: [Ofertas]
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
 *         description: Detalle de oferta
 */
router.get('/:id', verificarToken, verificarPermiso('ver_ofertas'), OfertaController.getOfertaById);
/**
 * @swagger
 * /ofertas:
 *   post:
 *     summary: Crear oferta
 *     tags: [Ofertas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *     responses:
 *       201:
 *         description: Oferta creada
 */
router.post('/', verificarToken, verificarPermiso('crear_oferta'), OfertaController.createOferta);
/**
 * @swagger
 * /ofertas/{id}:
 *   put:
 *     summary: Actualizar oferta
 *     tags: [Ofertas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               nombre:
 *                 type: string
 *     responses:
 *       200:
 *         description: Oferta actualizada
 */
router.put('/:id', verificarToken, verificarPermiso('editar_oferta'), OfertaController.updateOferta);
/**
 * @swagger
 * /ofertas/{id}:
 *   delete:
 *     summary: Eliminar oferta
 *     tags: [Ofertas]
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
 *         description: Oferta eliminada
 */
router.delete('/:id', verificarToken, verificarPermiso('eliminar_oferta'), OfertaController.deleteOferta);
/**
 * @swagger
 * /ofertas/{id_oferta}/productos:
 *   post:
 *     summary: Asignar productos a oferta
 *     tags: [Ofertas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_oferta
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Productos asignados
 */
router.post('/:id_oferta/productos', verificarToken, verificarPermiso('editar_oferta'), OfertaController.asignarProductosOferta);
/**
 * @swagger
 * /ofertas/{id_oferta}/productos/{id_producto}:
 *   delete:
 *     summary: Quitar producto de oferta
 *     tags: [Ofertas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_oferta
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
 *         description: Producto removido
 */
router.delete('/:id_oferta/productos/:id_producto', verificarToken, verificarPermiso('editar_oferta'), OfertaController.removeProductoOferta);

export default router;
