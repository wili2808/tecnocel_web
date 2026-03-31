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

// Login de usuarios del sistema (admin/empleado)
router.post('/login', loginRateLimit, usuarioController.login.bind(usuarioController));

// ============================================================================
// RUTAS PROTEGIDAS - INFORMACIÓN PERSONAL
// ============================================================================

// Obtener datos del usuario autenticado
router.get('/me', verificarToken, usuarioController.getMe.bind(usuarioController));

// ============================================================================
// RUTAS DE ADMINISTRACIÓN - GESTIÓN DE ROLES
// Requieren: Permisos específicos
// ============================================================================

// Estadísticas del dashboard: usuarios, clientes y productos
router.get('/admin/dashboard-stats', verificarToken, UsuarioAdminController.obtenerEstadisticasDashboard);

// Listar todos los roles disponibles
router.get('/admin/roles', verificarToken, verificarPermiso('ver_roles'), UsuarioAdminController.listarRoles);

// ============================================================================
// RUTAS DE ADMINISTRACIÓN - GESTIÓN DE USUARIOS
// Requieren: Permisos específicos
// ============================================================================

// Listar todos los usuarios del sistema
router.get('/admin/usuarios', verificarToken, verificarPermiso('ver_usuarios'), UsuarioAdminController.listarUsuarios);

// Obtener información de un usuario específico
router.get('/admin/usuarios/:id', verificarToken, verificarPermiso('ver_usuarios'), UsuarioAdminController.obtenerUsuario);

// Crear nuevo usuario del sistema
router.post('/admin/usuarios', verificarToken, verificarPermiso('crear_usuario'), validateCrearUsuario, UsuarioAdminController.crearUsuario);

// Actualizar información de un usuario del sistema
router.put('/admin/usuarios/:id', verificarToken, verificarPermiso('editar_usuario'), validateActualizarUsuario, UsuarioAdminController.actualizarUsuario);

// Eliminar un usuario del sistema
router.delete('/admin/usuarios/:id', verificarToken, verificarPermiso('eliminar_usuario'), UsuarioAdminController.eliminarUsuario);

// ============================================================================
// RUTAS DE ADMINISTRACIÓN - GESTIÓN DE CLIENTES
// Requieren: Permisos específicos
// ============================================================================

// Crear nuevo cliente
router.post('/admin/clientes', verificarToken, verificarPermiso('crear_cliente'), UsuarioAdminController.crearCliente);

// Listar todos los clientes
router.get('/admin/clientes', verificarToken, verificarPermiso('ver_clientes'), UsuarioAdminController.listarClientes);

// Obtener información de un cliente específico
router.get('/admin/clientes/:id', verificarToken, verificarPermiso('ver_clientes'), UsuarioAdminController.obtenerCliente);

// Actualizar información de un cliente
router.put('/admin/clientes/:id', verificarToken, verificarPermiso('editar_cliente'), validateActualizarCliente, UsuarioAdminController.actualizarCliente);

export default router;
