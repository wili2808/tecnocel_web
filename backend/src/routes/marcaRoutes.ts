import { Router } from 'express';
import { MarcaController } from '../controllers/MarcaController.js';
import { verificarToken, verificarPermiso } from '../middleware/authMiddleware.js';
import {
  validateCreateMarca,
  validateUpdateMarca,
  validateDeleteMarca,
  validateGetMarcaById
} from '../middleware/validateMarca.js';

const router = Router();

// --- RUTAS PÚBLICAS - No requieren autenticación ---

/**
 * @swagger
 * /marcas:
 *   get:
 *     summary: Obtener todas las marcas
 *     description: Obtiene todas las marcas activas del sistema
 *     tags: [Marcas]
 *     responses:
 *       200:
 *         description: Lista de marcas
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', MarcaController.getAllMarcas);

/**
 * @swagger
 * /marcas/{id}:
 *   get:
 *     summary: Obtener marca por ID
 *     description: Obtiene una marca específica por su ID
 *     tags: [Marcas]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Marca obtenida
 *       404:
 *         description: Marca no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', validateGetMarcaById, MarcaController.getMarcaById);

// --- RUTAS DE ADMINISTRACIÓN - Requieren permisos específicos ---

/**
 * @swagger
 * /marcas:
 *   post:
 *     summary: Crear marca
 *     description: Crea una nueva marca en el sistema
 *     tags: [Marcas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre_marca
 *             properties:
 *               nombre_marca:
 *                 type: string
 *               descripcion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Marca creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos
 *       500:
 *         description: Error interno del servidor
 */
router.post(
  '/',
  verificarToken,
  verificarPermiso('crear_marca'),
  validateCreateMarca,
  MarcaController.createMarca
);

/**
 * @swagger
 * /marcas/{id}:
 *   put:
 *     summary: Actualizar marca
 *     description: Actualiza una marca existente
 *     tags: [Marcas]
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
 *               nombre_marca:
 *                 type: string
 *               descripcion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Marca actualizada exitosamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: No tiene permisos
 *       404:
 *         description: Marca no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put(
  '/:id',
  verificarToken,
  verificarPermiso('editar_marca'),
  validateUpdateMarca,
  MarcaController.updateMarca
);

/**
 * @swagger
 * /marcas/{id}:
 *   delete:
 *     summary: Eliminar marca
 *     description: Elimina (soft delete) una marca del sistema
 *     tags: [Marcas]
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
 *         description: Marca eliminada exitosamente
 *       403:
 *         description: No tiene permisos
 *       404:
 *         description: Marca no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete(
  '/:id',
  verificarToken,
  verificarPermiso('eliminar_marca'),
  validateDeleteMarca,
  MarcaController.deleteMarca
);

export default router;
