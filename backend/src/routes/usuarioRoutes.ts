import { Router } from 'express';
import { body } from 'express-validator';
import usuarioController from '../controllers/UsuarioController.js';
import UsuarioAdminController from '../controllers/UsuarioAdminController.js';
import { verificarToken, verificarRol } from '../middleware/authMiddleware.js';

const router = Router();

// ============================================================================
// RUTAS PÚBLICAS
// ============================================================================

/**
 * POST /api/usuarios/login
 * Login de usuarios del sistema (admin/empleado)
 */
router.post('/login', usuarioController.login.bind(usuarioController));

// ============================================================================
// RUTAS PROTEGIDAS - INFORMACIÓN PERSONAL
// ============================================================================

/**
 * GET /api/usuarios/me
 * Obtener información del usuario autenticado
 * Requiere: Token JWT válido
 */
router.get('/me', verificarToken, usuarioController.getMe.bind(usuarioController));

// ============================================================================
// RUTAS DE ADMINISTRACIÓN - GESTIÓN DE USUARIOS
// Requieren: Autenticación + Rol Admin (1) o Empleado (2)
// ============================================================================

/**
 * GET /api/usuarios/admin/usuarios
 * Listar todos los usuarios del sistema
 * Acceso: Admin y Empleado
 */
router.get(
  '/admin/usuarios',
  verificarToken,
  verificarRol([1, 2]), // Admin y Empleado
  UsuarioAdminController.listarUsuarios
);

/**
 * GET /api/usuarios/admin/usuarios/:id
 * Obtener información de un usuario específico
 * Acceso: Admin y Empleado
 */
router.get(
  '/admin/usuarios/:id',
  verificarToken,
  verificarRol([1, 2]),
  UsuarioAdminController.obtenerUsuario
);

/**
 * POST /api/usuarios/admin/usuarios
 * Crear nuevo usuario del sistema
 * Acceso: Solo Admin
 */
router.post(
  '/admin/usuarios',
  verificarToken,
  verificarRol([1]), // Solo Admin
  [
    body('nombres').notEmpty().withMessage('El nombre es requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('id_rol').isInt().withMessage('El rol es requerido')
  ],
  UsuarioAdminController.crearUsuario
);

/**
 * PUT /api/usuarios/admin/usuarios/:id
 * Actualizar usuario existente
 * Acceso: Admin (cualquier usuario) o Empleado (solo su propia cuenta)
 */
router.put(
  '/admin/usuarios/:id',
  verificarToken,
  verificarRol([1, 2]),
  [
    body('nombres').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('email').optional().isEmail().withMessage('Email inválido'),
    body('password').optional().isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('id_rol').optional().isInt().withMessage('El rol debe ser un número')
  ],
  UsuarioAdminController.actualizarUsuario
);

/**
 * DELETE /api/usuarios/admin/usuarios/:id
 * Eliminar usuario del sistema
 * Acceso: Solo Admin
 */
router.delete(
  '/admin/usuarios/:id',
  verificarToken,
  verificarRol([1]),
  UsuarioAdminController.eliminarUsuario
);

// ============================================================================
// RUTAS DE ADMINISTRACIÓN - GESTIÓN DE CLIENTES
// Requieren: Autenticación + Rol Admin (1) o Empleado (2)
// ============================================================================

/**
 * GET /api/usuarios/admin/clientes
 * Listar todos los clientes de la tienda web
 * Acceso: Admin y Empleado
 */
router.get(
  '/admin/clientes',
  verificarToken,
  verificarRol([1, 2]),
  UsuarioAdminController.listarClientes
);

/**
 * GET /api/usuarios/admin/clientes/:id
 * Obtener información de un cliente específico
 * Acceso: Admin y Empleado
 */
router.get(
  '/admin/clientes/:id',
  verificarToken,
  verificarRol([1, 2]),
  UsuarioAdminController.obtenerCliente
);

/**
 * PUT /api/usuarios/admin/clientes/:id
 * Actualizar información de un cliente
 * Acceso: Admin (completo) o Empleado (limitado)
 */
router.put(
  '/admin/clientes/:id',
  verificarToken,
  verificarRol([1, 2]),
  [
    body('nombre_cliente').optional().notEmpty(),
    body('apellido_cliente').optional().notEmpty(),
    body('celular_cliente').optional().notEmpty(),
    body('nit_ci_cliente').optional().notEmpty(),
    body('is_web_enabled').optional().isBoolean(),
    body('email_verified').optional().isBoolean()
  ],
  UsuarioAdminController.actualizarCliente
);

export default router;
