import { Router } from 'express';
import almacenController from '../controllers/AlmacenController.js';
import { verificarToken, verificarPermiso } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * @swagger
 * /almacen/tipo-cambio:
 *   get:
 *     summary: Obtener tipo de cambio ARS/USD
 *     description: Retorna el tipo de cambio actual configurado en el sistema
 *     tags: [Almacen]
 *     responses:
 *       200:
 *         description: Tipo de cambio actual
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     tipo_cambio:
 *                       type: number
 *                     fyh_actualizacion:
 *                       type: string
 *       500:
 *         description: Error interno del servidor
 */
router.get('/tipo-cambio', almacenController.getTipoCambio.bind(almacenController));

/**
 * @swagger
 * /almacen/diagnostico:
 *   get:
 *     summary: Diagnóstico de productos
 *     description: Retorna estadísticas de productos para diagnóstico del sistema
 *     tags: [Almacen]
 *     responses:
 *       200:
 *         description: Diagnóstico exitoso
 *       500:
 *         description: Error interno del servidor
 */
router.get('/diagnostico', almacenController.diagnosticProducts.bind(almacenController));

/**
 * @swagger
 * /almacen/productos:
 *   get:
 *     summary: Listar todos los productos
 *     description: Retorna el catálogo completo de productos activos con paginación, categorías, marcas, imágenes y ofertas activas vigentes
 *     tags: [Almacen]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items por página
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de categoría
 *       - in: query
 *         name: marca
 *         schema:
 *           type: integer
 *         description: Filtrar por ID de marca
 *       - in: query
 *         name: precio_min
 *         schema:
 *           type: number
 *         description: Precio mínimo
 *       - in: query
 *         name: precio_max
 *         schema:
 *           type: number
 *         description: Precio máximo
 *     responses:
 *       200:
 *         description: Lista de productos paginada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     productos:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *       500:
 *         description: Error interno del servidor
 */
router.get('/productos', almacenController.getProducts.bind(almacenController));

/**
 * @swagger
 * /almacen/productos/destacados:
 *   get:
 *     summary: Listar productos destacados
 *     description: Retorna productos marcados como destacados para mostrar en homepage
 *     tags: [Almacen]
 *     responses:
 *       200:
 *         description: Lista de productos destacados
 *       500:
 *         description: Error interno del servidor
 */
router.get('/productos/destacados', almacenController.getFeaturedProducts.bind(almacenController));

/**
 * @swagger
 * /almacen/productos/buscar:
 *   get:
 *     summary: Buscar productos
 *     description: Búsqueda flexible con query params para filtrar productos
 *     tags: [Almacen]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: integer
 *         description: Filtrar por categoría
 *       - in: query
 *         name: marca
 *         schema:
 *           type: integer
 *         description: Filtrar por marca
 *       - in: query
 *         name: precio_min
 *         schema:
 *           type: number
 *         description: Precio mínimo
 *       - in: query
 *         name: precio_max
 *         schema:
 *           type: number
 *         description: Precio máximo
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items por página
 *     responses:
 *       200:
 *         description: Resultados de búsqueda paginados
 *       400:
 *         description: Solicitud inválida
 *       500:
 *         description: Error interno del servidor
 */
router.get('/productos/buscar', almacenController.searchProducts.bind(almacenController));

/**
 * @swagger
 * /almacen/productos/categoria/{categoriaId}:
 *   get:
 *     summary: Productos por categoría
 *     description: Retorna todos los productos de una categoría específica
 *     tags: [Almacen]
 *     parameters:
 *       - in: path
 *         name: categoriaId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la categoría
 *     responses:
 *       200:
 *         description: Lista de productos de la categoría
 *       500:
 *         description: Error interno del servidor
 */
router.get('/productos/categoria/:categoriaId', almacenController.getProductsByCategory.bind(almacenController));

/**
 * @swagger
 * /almacen/productos/{id}:
 *   get:
 *     summary: Obtener producto por ID
 *     description: Retorna el detalle completo de un producto incluyendo imágenes, características y ofertas
 *     tags: [Almacen]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Detalle del producto
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/productos/:id', almacenController.getProductById.bind(almacenController));

/**
 * @swagger
 * /almacen/categorias:
 *   get:
 *     summary: Listar todas las categorías
 *     description: Retorna el árbol completo de categorías con subcategorías
 *     tags: [Almacen]
 *     responses:
 *       200:
 *         description: Lista de categorías
 *       500:
 *         description: Error interno del servidor
 *   post:
 *     summary: Crear categoría
 *     description: Crea una nueva categoría de productos
 *     tags: [Almacen]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre_categoria
 *             properties:
 *               nombre_categoria:
 *                 type: string
 *               id_categoria_padre:
 *                 type: integer
 *                 description: ID de categoría padre (para subcategorías)
 *     responses:
 *       201:
 *         description: Categoría creada
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos
 *       500:
 *         description: Error interno del servidor
 */
router.get('/categorias', almacenController.getAllCategories.bind(almacenController));

// --- Rutas protegidas (requieren autenticación y permisos) ---

router.use(verificarToken);

/**
 * @swagger
 * /almacen/categorias:
 *   post:
 *     summary: Crear categoría
 *     description: Crea una nueva categoría de productos
 *     tags: [Almacen]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre_categoria
 *             properties:
 *               nombre_categoria:
 *                 type: string
 *               id_categoria_padre:
 *                 type: integer
 *                 description: ID de categoría padre (para subcategorías)
 *     responses:
 *       201:
 *         description: Categoría creada
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/categorias', verificarPermiso('crear_categoria'), almacenController.createCategoria.bind(almacenController));

/**
 * @swagger
 * /almacen/categorias/{id}:
 *   put:
 *     summary: Actualizar categoría
 *     description: Actualiza el nombre de una categoría existente
 *     tags: [Almacen]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la categoría
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre_categoria:
 *                 type: string
 *     responses:
 *       200:
 *         description: Categoría actualizada
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Categoría no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.put('/categorias/:id', verificarPermiso('editar_categoria'), almacenController.updateCategoria.bind(almacenController));

/**
 * @swagger
 * /almacen/categorias/{id}:
 *   delete:
 *     summary: Eliminar categoría
 *     description: Elimina una categoría (solo si no tiene productos asociados)
 *     tags: [Almacen]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la categoría
 *     responses:
 *       200:
 *         description: Categoría eliminada
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Categoría no encontrada
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/categorias/:id', verificarPermiso('eliminar_categoria'), almacenController.deleteCategoria.bind(almacenController));

/**
 * @swagger
 * /almacen/productos:
 *   post:
 *     summary: Crear producto
 *     description: Crea un nuevo producto en el catálogo
 *     tags: [Almacen]
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
 *               - descripcion
 *               - precio
 *               - stock
 *               - id_categoria
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               precio:
 *                 type: number
 *               stock:
 *                 type: integer
 *               id_categoria:
 *                 type: integer
 *               id_marca:
 *                 type: integer
 *               es_destacado:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Producto creado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/productos', verificarPermiso('crear_producto'), almacenController.createProduct.bind(almacenController));

/**
 * @swagger
 * /almacen/productos/{id}:
 *   put:
 *     summary: Actualizar producto
 *     description: Actualiza un producto existente del catálogo
 *     tags: [Almacen]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *               precio:
 *                 type: number
 *               stock:
 *                 type: integer
 *               id_categoria:
 *                 type: integer
 *               id_marca:
 *                 type: integer
 *               es_destacado:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Producto actualizado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put('/productos/:id', verificarPermiso('editar_producto'), almacenController.updateProduct.bind(almacenController));

/**
 * @swagger
 * /almacen/productos/{id}:
 *   delete:
 *     summary: Eliminar producto
 *     description: Elimina un producto del catálogo
 *     tags: [Almacen]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto eliminado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/productos/:id', verificarPermiso('eliminar_producto'), almacenController.deleteProduct.bind(almacenController));

/**
 * @swagger
 * /almacen/productos/{id}/stock:
 *   patch:
 *     summary: Actualizar stock de producto
 *     description: Actualiza únicamente el stock de un producto
 *     tags: [Almacen]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del producto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stock
 *             properties:
 *               stock:
 *                 type: integer
 *                 description: Nueva cantidad en stock
 *     responses:
 *       200:
 *         description: Stock actualizado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos
 *       404:
 *         description: Producto no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.patch('/productos/:id/stock', verificarPermiso('editar_producto'), almacenController.updateStock.bind(almacenController));

export default router;
