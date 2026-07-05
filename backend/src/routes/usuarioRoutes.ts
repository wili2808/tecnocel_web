import { Router } from 'express';
import usuarioController from '../controllers/UsuarioController.js';
import UsuarioAdminController from '../controllers/UsuarioAdminController.js';
import { verificarToken, verificarPermiso } from '../middleware/authMiddleware.js';
import { validateCrearUsuario, validateActualizarUsuario, validateActualizarCliente } from '../middleware/validateUsuario.js';
import { loginRateLimit } from '../middleware/loginRateLimit.js';

const router = Router();

// ============================================================================
// RUTAS PÚBLICAS
// ============================================================================

/**
 * @swagger
 * /usuarios/login:
 *   post:
 *     summary: Inicio de sesión de usuarios del sistema
 *     description: Autentica a un usuario interno (admin, gerente, vendedor) y devuelve un JWT
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso, JWT generado
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', loginRateLimit, usuarioController.login.bind(usuarioController));

// ============================================================================
// RUTAS PROTEGIDAS - INFORMACIÓN PERSONAL
// ============================================================================

/**
 * @swagger
 * /usuarios/me:
 *   get:
 *     summary: Obtener usuario autenticado
 *     description: Devuelve los datos del usuario actual según su JWT
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario
 *       401:
 *         description: Token inválido
 */
router.get('/me', verificarToken, usuarioController.getMe.bind(usuarioController));

// ============================================================================
// RUTAS DE ADMINISTRACIÓN - GESTIÓN DE ROLES
// Requieren: Permisos específicos
// ============================================================================

/**
 * @swagger
 * /usuarios/admin/dashboard-stats:
 *   get:
 *     summary: Estadísticas del dashboard
 *     description: Obtiene métricas de usuarios, clientes y productos para el panel principal
 *     tags: [Usuarios - Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas del sistema
 *       401:
 *         description: No autenticado
 */
router.get('/admin/dashboard-stats', verificarToken, UsuarioAdminController.obtenerEstadisticasDashboard);

/**
 * @swagger
 * /usuarios/admin/roles:
 *   get:
 *     summary: Listar roles disponibles
 *     description: Obtiene todos los roles del sistema
 *     tags: [Usuarios - Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de roles
 *       403:
 *         description: Sin permisos
 */
router.get('/admin/roles', verificarToken, verificarPermiso('ver_roles'), UsuarioAdminController.listarRoles);

// ============================================================================
// RUTAS DE ADMINISTRACIÓN - GESTIÓN DE USUARIOS
// Requieren: Permisos específicos
// ============================================================================

/**
 * @swagger
 * /usuarios/admin/usuarios:
 *   get:
 *     summary: Listar usuarios del sistema
 *     description: Obtiene el listado de todos los usuarios internos
 *     tags: [Usuarios - Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *       403:
 *         description: Sin permisos
 */
router.get('/admin/usuarios', verificarToken, verificarPermiso('ver_usuarios'), UsuarioAdminController.listarUsuarios);

/**
 * @swagger
 * /usuarios/admin/usuarios/{id}:
 *   get:
 *     summary: Obtener detalle de usuario
 *     description: Obtiene información de un usuario interno específico
 *     tags: [Usuarios - Admin]
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
 *         description: Datos del usuario
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/admin/usuarios/:id', verificarToken, verificarPermiso('ver_usuarios'), UsuarioAdminController.obtenerUsuario);

/**
 * @swagger
 * /usuarios/admin/usuarios:
 *   post:
 *     summary: Crear usuario del sistema
 *     description: Crea un nuevo usuario interno con rol asignado
 *     tags: [Usuarios - Admin]
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
 *               - email
 *               - password
 *               - id_rol
 *             properties:
 *               nombre:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               id_rol:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Usuario creado
 *       400:
 *         description: Datos inválidos
 */
router.post('/admin/usuarios', verificarToken, verificarPermiso('crear_usuario'), validateCrearUsuario, UsuarioAdminController.crearUsuario);

/**
 * @swagger
 * /usuarios/admin/usuarios/{id}:
 *   put:
 *     summary: Actualizar usuario
 *     description: Actualiza los datos de un usuario interno
 *     tags: [Usuarios - Admin]
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
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               id_rol:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *       404:
 *         description: Usuario no encontrado
 */
router.put('/admin/usuarios/:id', verificarToken, verificarPermiso('editar_usuario'), validateActualizarUsuario, UsuarioAdminController.actualizarUsuario);

/**
 * @swagger
 * /usuarios/admin/usuarios/{id}:
 *   delete:
 *     summary: Eliminar usuario
 *     description: Elimina un usuario interno del sistema
 *     tags: [Usuarios - Admin]
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
 *         description: Usuario eliminado
 *       403:
 *         description: No se puede eliminar (protección)
 */
router.delete('/admin/usuarios/:id', verificarToken, verificarPermiso('eliminar_usuario'), UsuarioAdminController.eliminarUsuario);

// ============================================================================
// RUTAS DE ADMINISTRACIÓN - GESTIÓN DE CLIENTES
// Requieren: Permisos específicos
// ============================================================================

/**
 * @swagger
 * /usuarios/admin/clientes:
 *   post:
 *     summary: Crear cliente desde admin
 *     description: Crea un nuevo cliente desde el panel administrativo y envía email de activación
 *     tags: [Usuarios - Admin]
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
 *               - email
 *             properties:
 *               nombre:
 *                 type: string
 *               email:
 *                 type: string
 *               celular:
 *                 type: string
 *               nit_ci:
 *                 type: string
 *     responses:
 *       201:
 *         description: Cliente creado
 *       400:
 *         description: Datos inválidos
 */
router.post('/admin/clientes', verificarToken, verificarPermiso('crear_cliente'), UsuarioAdminController.crearCliente);

/**
 * @swagger
 * /usuarios/admin/clientes:
 *   get:
 *     summary: Listar clientes
 *     description: Obtiene el listado de clientes registrados
 *     tags: [Usuarios - Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de clientes
 *       403:
 *         description: Sin permisos
 */
router.get('/admin/clientes', verificarToken, verificarPermiso('ver_clientes'), UsuarioAdminController.listarClientes);

/**
 * @swagger
 * /usuarios/admin/clientes/{id}:
 *   get:
 *     summary: Obtener detalle de cliente
 *     description: Obtiene información completa de un cliente
 *     tags: [Usuarios - Admin]
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
 *         description: Datos del cliente
 *       404:
 *         description: Cliente no encontrado
 */
router.get('/admin/clientes/:id', verificarToken, verificarPermiso('ver_clientes'), UsuarioAdminController.obtenerCliente);

/**
 * @swagger
 * /usuarios/admin/clientes/{id}:
 *   put:
 *     summary: Actualizar cliente
 *     description: Actualiza los datos de un cliente registrado
 *     tags: [Usuarios - Admin]
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
 *               email:
 *                 type: string
 *               celular:
 *                 type: string
 *               nit_ci:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cliente actualizado
 *       404:
 *         description: Cliente no encontrado
 */
router.put('/admin/clientes/:id', verificarToken, verificarPermiso('editar_cliente'), validateActualizarCliente, UsuarioAdminController.actualizarCliente);

export default router;
