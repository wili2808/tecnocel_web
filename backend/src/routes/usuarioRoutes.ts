import { Router } from 'express';
import usuarioController from '../controllers/UsuarioController.js';
import UsuarioAdminController from '../controllers/UsuarioAdminController.js';
import { verificarToken, verificarRol } from '../middleware/authMiddleware.js';
import { ROLES } from '../constants/roles.js';
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
// Requieren: Autenticación + Rol Admin (1)
// ============================================================================

// Estadísticas del dashboard: usuarios, clientes y productos
router.get('/admin/dashboard-stats', verificarToken, verificarRol([ROLES.ADMIN, ROLES.GERENTE, ROLES.VENDEDOR]), UsuarioAdminController.obtenerEstadisticasDashboard);

// Listar todos los roles disponibles
router.get('/admin/roles', verificarToken, verificarRol([ROLES.ADMIN]), UsuarioAdminController.listarRoles);

// ============================================================================
// RUTAS DE ADMINISTRACIÓN - GESTIÓN DE USUARIOS
// Requieren: Autenticación + Rol Admin (1) o Empleado (2)
// ============================================================================

// Listar todos los usuarios del sistema
router.get('/admin/usuarios', verificarToken, verificarRol([ROLES.ADMIN, ROLES.GERENTE]), UsuarioAdminController.listarUsuarios);

// Obtener información de un usuario específico
router.get('/admin/usuarios/:id', verificarToken, verificarRol([ROLES.ADMIN, ROLES.GERENTE]), UsuarioAdminController.obtenerUsuario);

// Crear nuevo usuario del sistema
router.post('/admin/usuarios', verificarToken, verificarRol([ROLES.ADMIN]), validateCrearUsuario, UsuarioAdminController.crearUsuario);

// Actualizar información de un usuario del sistema
router.put('/admin/usuarios/:id', verificarToken, verificarRol([ROLES.ADMIN, ROLES.GERENTE]), validateActualizarUsuario, UsuarioAdminController.actualizarUsuario);

// Eliminar un usuario del sistema
router.delete('/admin/usuarios/:id', verificarToken, verificarRol([ROLES.ADMIN]),UsuarioAdminController.eliminarUsuario);

// ============================================================================
// RUTAS DE ADMINISTRACIÓN - GESTIÓN DE CLIENTES
// Requieren: Autenticación + Rol Admin (1), Empleado (2) o Vendedor (3)
// ============================================================================

// Crear nuevo cliente (todos los roles del sistema)
router.post('/admin/clientes', verificarToken, verificarRol([ROLES.ADMIN, ROLES.GERENTE, ROLES.VENDEDOR]), UsuarioAdminController.crearCliente);

// Listar todos los clientes
router.get('/admin/clientes', verificarToken, verificarRol([ROLES.ADMIN, ROLES.GERENTE, ROLES.VENDEDOR]), UsuarioAdminController.listarClientes);

// Obtener información de un cliente específico
router.get('/admin/clientes/:id', verificarToken, verificarRol([ROLES.ADMIN, ROLES.GERENTE, ROLES.VENDEDOR]), UsuarioAdminController.obtenerCliente);

// Actualizar información de un cliente (solo Admin)
router.put('/admin/clientes/:id', verificarToken, verificarRol([ROLES.ADMIN]), validateActualizarCliente, UsuarioAdminController.actualizarCliente);

export default router;
