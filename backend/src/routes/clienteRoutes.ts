import { Router } from 'express';
import ClienteController from '../controllers/ClienteController.js';
import GoogleAuthController from '../controllers/GoogleAuthController.js';
import { validateClienteRegistration } from '../middleware/validateRegistration.js';
import { verificarTokenCliente } from '../middleware/authMiddleware.js';
import { loginRateLimit } from '../middleware/loginRateLimit.js';

const router = Router();

// ============================================================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================================================

// Registro
router.post('/register', validateClienteRegistration, ClienteController.register);
// Login
router.post('/login', loginRateLimit, ClienteController.login);
// Login con Google
router.post('/google-login', loginRateLimit, GoogleAuthController.googleLogin);
// Verificación de email
router.get('/verify-email', ClienteController.verifyEmail);
// Solicitud de recuperación de contraseña
router.post('/forgot-password', ClienteController.forgotPassword);
// Restablecimiento de contraseña
router.post('/reset-password', ClienteController.resetPassword);

// ============================================================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================================================

// Verificación de token (requiere token válido)
router.get('/verify-token', verificarTokenCliente, ClienteController.verifyToken);

// Obtener perfil completo del cliente autenticado
router.get('/perfil', verificarTokenCliente, ClienteController.obtenerPerfil);

// Actualizar perfil del cliente autenticado
router.put('/perfil', verificarTokenCliente, ClienteController.actualizarPerfil);

// Cambiar contraseña del cliente autenticado
router.put('/cambiar-contrasena', verificarTokenCliente, ClienteController.cambiarContrasena);

export default router; 