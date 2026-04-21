import { Router } from 'express';
import { DireccionController } from '../controllers/DireccionController.js';
import { verificarTokenCliente } from '../middleware/authMiddleware.js';

const router = Router();

// --- TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN DE CLIENTE ---
router.use(verificarTokenCliente);

/**
 * @swagger
 * /direcciones/cliente/{id_cliente}:
 *   get:
 *     summary: Obtener direcciones del cliente
 *     description: Obtiene todas las direcciones guardadas de un cliente
 *     tags: [Direcciones]
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
 *         description: Direcciones obtenidas
 *       500:
 *         description: Error interno del servidor
 */
router.get('/cliente/:id_cliente', DireccionController.getDireccionesCliente);

/**
 * @swagger
 * /direcciones/cliente/{id_cliente}/predeterminada:
 *   get:
 *     summary: Obtener dirección predeterminada
 *     description: Obtiene la dirección predeterminada de un cliente
 *     tags: [Direcciones]
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
 *         description: Dirección obtenida
 *       404:
 *         description: Dirección no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/cliente/:id_cliente/predeterminada', DireccionController.getDireccionPredeterminada);

/**
 * @swagger
 * /direcciones/{id}:
 *   get:
 *     summary: Obtener dirección por ID
 *     description: Obtiene una dirección específica por su ID
 *     tags: [Direcciones]
 *     security:
 *       - bearerAuthCliente: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dirección obtenida
 *       404:
 *         description: Dirección no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', DireccionController.getDireccionById);

/**
 * @swagger
 * /direcciones/cliente/{id_cliente}:
 *   post:
 *     summary: Crear nueva dirección
 *     description: Crea una nueva dirección para el cliente
 *     tags: [Direcciones]
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
 *               - direccion
 *               - ciudad
 *               - departamento
 *             properties:
 *               direccion:
 *                 type: string
 *               ciudad:
 *                 type: string
 *               departamento:
 *                 type: string
 *               codigo_postal:
 *                 type: string
 *               referencia:
 *                 type: string
 *               es_predeterminada:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Dirección creada
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/cliente/:id_cliente', DireccionController.createDireccion);

/**
 * @swagger
 * /direcciones/{id}:
 *   put:
 *     summary: Actualizar dirección
 *     description: Actualiza los datos de una dirección existente
 *     tags: [Direcciones]
 *     security:
 *       - bearerAuthCliente: []
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
 *               direccion:
 *                 type: string
 *               ciudad:
 *                 type: string
 *               departamento:
 *                 type: string
 *               codigo_postal:
 *                 type: string
 *               referencia:
 *                 type: string
 *               es_predeterminada:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Dirección actualizada
 *       404:
 *         description: Dirección no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put('/:id', DireccionController.updateDireccion);

/**
 * @swagger
 * /direcciones/{id}/predeterminada:
 *   put:
 *     summary: Establecer como predeterminada
 *     description: Marca una dirección como la predeterminada del cliente
 *     tags: [Direcciones]
 *     security:
 *       - bearerAuthCliente: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dirección predeterminada actualizada
 *       404:
 *         description: Dirección no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put('/:id/predeterminada', DireccionController.setPredeterminada);

/**
 * @swagger
 * /direcciones/{id}:
 *   delete:
 *     summary: Eliminar dirección
 *     description: Elimina (soft delete o permanente) una dirección
 *     tags: [Direcciones]
 *     security:
 *       - bearerAuthCliente: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dirección eliminada
 *       404:
 *         description: Dirección no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/:id', DireccionController.deleteDireccion);

export default router;