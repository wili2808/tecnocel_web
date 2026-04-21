import { Router } from 'express';
import { CaracteristicaController } from '../controllers/CaracteristicaController.js';
import { verificarToken, verificarRol } from '../middleware/authMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// --- RUTAS PÚBLICAS (sin autenticación) ---

/**
 * @swagger
 * /caracteristicas/tipos:
 *   get:
 *     summary: Obtener tipos de características
 *     description: Retorna la lista de tipos de características disponibles y activos
 *     tags: [Caracteristicas]
 *     responses:
 *       200:
 *         description: Lista de tipos de características
 *       500:
 *         description: Error interno del servidor
 */
router.get('/tipos', CaracteristicaController.getTiposCaracteristicas);
/**
 * @swagger
 * /caracteristicas/producto/{id_producto}:
 *   get:
 *     summary: Obtener características de un producto
 *     description: Retorna las características asociadas a un producto
 *     tags: [Caracteristicas]
 *     parameters:
 *       - in: path
 *         name: id_producto
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Lista de características del producto
 *       500:
 *         description: Error interno del servidor
 */
router.get('/producto/:id_producto', CaracteristicaController.getCaracteristicasProducto);

// --- RUTAS PROTEGIDAS (requieren autenticación) ---

/**
 * @swagger
 * /caracteristicas/tipos/todas:
 *   get:
 *     summary: Obtener todos los tipos (activos e inactivos)
 *     description: Retorna todos los tipos de características (requiere autenticación)
 *     tags: [Caracteristicas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista completa de tipos de características
 *       500:
 *         description: Error interno del servidor
 */
router.get('/tipos/todas', verificarToken, CaracteristicaController.getAllTipos);
/**
 * @swagger
 * /caracteristicas/tipos:
 *   post:
 *     summary: Crear tipo de característica
 *     description: Crea un nuevo tipo de característica
 *     tags: [Caracteristicas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre_tipo
 *             properties:
 *               nombre_tipo:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               tipo_dato:
 *                 type: string
 *               unidad_medida:
 *                 type: string
 *               opciones_seleccion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tipo de característica creado
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/tipos', verificarToken, verificarRol([ROLES.ADMIN, ROLES.GERENTE]), CaracteristicaController.createTipoCaracteristica);
/**
 * @swagger
 * /caracteristicas/tipos/{id_tipo}:
 *   put:
 *     summary: Actualizar tipo de característica
 *     description: Modifica los datos de un tipo de característica existente
 *     tags: [Caracteristicas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_tipo
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
 *               nombre_tipo:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               tipo_dato:
 *                 type: string
 *               unidad_medida:
 *                 type: string
 *               opciones_seleccion:
 *                 type: string
 *               activo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Tipo actualizado
 *       404:
 *         description: Tipo no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put('/tipos/:id_tipo', verificarToken, verificarRol([ROLES.ADMIN, ROLES.GERENTE]), CaracteristicaController.updateTipoCaracteristica);
/**
 * @swagger
 * /caracteristicas/tipos/{id_tipo}:
 *   delete:
 *     summary: Desactivar tipo de característica
 *     description: Cambia el estado del tipo a inactivo
 *     tags: [Caracteristicas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_tipo
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tipo desactivado
 *       404:
 *         description: Tipo no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/tipos/:id_tipo', verificarToken, verificarRol([ROLES.ADMIN]), CaracteristicaController.deleteTipoCaracteristica);
/**
 * @swagger
 * /caracteristicas/producto/{id_producto}:
 *   post:
 *     summary: Agregar característica a producto
 *     description: Asocia un tipo de característica con un valor específico a un producto
 *     tags: [Caracteristicas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_producto
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
 *               - id_tipo
 *               - valor
 *             properties:
 *               id_tipo:
 *                 type: integer
 *               valor:
 *                 type: string
 *     responses:
 *       201:
 *         description: Característica agregada
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Producto o tipo no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/producto/:id_producto', verificarToken, verificarRol([ROLES.ADMIN, ROLES.GERENTE]), CaracteristicaController.addCaracteristicaProducto);
/**
 * @swagger
 * /caracteristicas/{id_caracteristica}:
 *   put:
 *     summary: Actualizar característica de producto
 *     description: Modifica el valor de una característica existente en un producto
 *     tags: [Caracteristicas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_caracteristica
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
 *               - valor
 *             properties:
 *               valor:
 *                 type: string
 *     responses:
 *       200:
 *         description: Característica actualizada
 *       400:
 *         description: Valor no proporcionado
 *       404:
 *         description: Característica no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put('/:id_caracteristica', verificarToken, verificarRol([ROLES.ADMIN, ROLES.GERENTE]), CaracteristicaController.updateCaracteristicaProducto);
/**
 * @swagger
 * /caracteristicas/{id_caracteristica}:
 *   delete:
 *     summary: Eliminar característica de producto
 *     description: Elimina permanentemente la asociación de una característica con un producto
 *     tags: [Caracteristicas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id_caracteristica
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Característica eliminada
 *       404:
 *         description: Característica no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/:id_caracteristica', verificarToken, verificarRol([ROLES.ADMIN, ROLES.GERENTE]), CaracteristicaController.deleteCaracteristicaProducto);

export default router;
