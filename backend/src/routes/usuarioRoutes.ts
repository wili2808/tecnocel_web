import { Router } from 'express';
import usuarioController from '../controllers/UsuarioController.js';
import UsuarioAdminController from '../controllers/UsuarioAdminController.js';
import { verificarToken, verificarRol } from '../middleware/authMiddleware.js';
import { validateCrearUsuario, validateActualizarUsuario, validateActualizarCliente } from '../middleware/validateUsuario.js';

const router = Router();

// ============================================================================
// RUTAS PÚBLICAS
// ============================================================================

// Login de usuarios del sistema (admin/empleado)
router.post('/login', usuarioController.login.bind(usuarioController));

// ============================================================================
// RUTAS PROTEGIDAS - INFORMACIÓN PERSONAL
// ============================================================================

// Obtener datos del usuario autenticado
router.get('/me', verificarToken, usuarioController.getMe.bind(usuarioController));

// ============================================================================
// RUTAS DE ADMINISTRACIÓN - GESTIÓN DE USUARIOS
// Requieren: Autenticación + Rol Admin (1) o Empleado (2)
// ============================================================================

// Listar todos los usuarios del sistema
router.get('/admin/usuarios', verificarToken, verificarRol([1, 2]), UsuarioAdminController.listarUsuarios);

// Obtener información de un usuario específico
router.get('/admin/usuarios/:id', verificarToken, verificarRol([1, 2]), UsuarioAdminController.obtenerUsuario);

// Crear nuevo usuario del sistema
router.post('/admin/usuarios', verificarToken, verificarRol([1]), validateCrearUsuario, UsuarioAdminController.crearUsuario);

// Actualizar información de un usuario del sistema
router.put('/admin/usuarios/:id', verificarToken, verificarRol([1, 2]), validateActualizarUsuario, UsuarioAdminController.actualizarUsuario);

// Eliminar un usuario del sistema
router.delete('/admin/usuarios/:id', verificarToken, verificarRol([1]),UsuarioAdminController.eliminarUsuario);

// ============================================================================
// RUTAS DE ADMINISTRACIÓN - GESTIÓN DE CLIENTES
// Requieren: Autenticación + Rol Admin (1) o Empleado (2)
// ============================================================================

// Listar todos los clientes
router.get('/admin/clientes', verificarToken, verificarRol([1, 2]), UsuarioAdminController.listarClientes);

// Obtener información de un cliente específico
router.get('/admin/clientes/:id', verificarToken, verificarRol([1, 2]), UsuarioAdminController.obtenerCliente);

// Actualizar información de un cliente
router.put('/admin/clientes/:id', verificarToken, verificarRol([1, 2]), validateActualizarCliente, UsuarioAdminController.actualizarCliente);

export default router;
