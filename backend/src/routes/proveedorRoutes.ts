import { Router } from 'express';
import { ProveedorController } from '../controllers/ProveedorController.js';
import { verificarToken, verificarPermiso } from '../middleware/authMiddleware.js';

const router = Router();

// --- RUTAS PROTEGIDAS ---

/**
 * @swagger
 * /proveedores:
 *   get:
 *     summary: Obtener proveedores
 *     description: Obtiene listado de proveedores con búsqueda opcional
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de proveedores
 *       403:
 *         description: Sin permisos
 */
router.get(
  '/',
  verificarToken,
  verificarPermiso('ver_proveedores'),
  ProveedorController.listarProveedores
);

/**
 * @swagger
 * /proveedores/{id}:
 *   get:
 *     summary: Obtener detalle de proveedor
 *     description: Obtiene detalle de un proveedor específico
 *     tags: [Proveedores]
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
 *         description: Detalle del proveedor
 *       404:
 *         description: Proveedor no encontrado
 */
router.get(
  '/:id',
  verificarToken,
  verificarPermiso('ver_proveedores'),
  ProveedorController.obtenerProveedor
);

/**
 * @swagger
 * /proveedores:
 *   post:
 *     summary: Crear proveedor
 *     description: Crea un nuevo proveedor
 *     tags: [Proveedores]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *               contacto:
 *                 type: string
 *     responses:
 *       201:
 *         description: Proveedor creado
 *       400:
 *         description: Datos inválidos
 */
router.post(
  '/',
  verificarToken,
  verificarPermiso('crear_proveedor'),
  ProveedorController.crearProveedor
);

/**
 * @swagger
 * /proveedores/{id}:
 *   put:
 *     summary: Actualizar proveedor
 *     description: Actualiza información de un proveedor
 *     tags: [Proveedores]
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
 *               contacto:
 *                 type: string
 *     responses:
 *       200:
 *         description: Proveedor actualizado
 *       400:
 *         description: Datos inválidos
 */
router.put(
  '/:id',
  verificarToken,
  verificarPermiso('editar_proveedor'),
  ProveedorController.actualizarProveedor
);

export default router;
