import { Router } from 'express';
import ClienteController from '../controllers/ClienteController.js';
import GoogleAuthController from '../controllers/GoogleAuthController.js';
import { validateClienteRegistration } from '../middleware/validateRegistration.js';
import { verificarTokenCliente } from '../middleware/authMiddleware.js';
import { loginRateLimit } from '../middleware/loginRateLimit.js';

const router = Router();

// --- RUTAS PÚBLICAS (sin autenticación) ---

/**
 * @swagger
 * /clientes/register:
 *   post:
 *     summary: Registrar nuevo cliente
 *     description: Crea un nuevo cliente en la plataforma, con contraseña y verificación de email
 *     tags: [Clientes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre_cliente
 *               - apellido_cliente
 *               - email_cliente
 *               - contrasena
 *             properties:
 *               nombre_cliente:
 *                 type: string
 *               apellido_cliente:
 *                 type: string
 *               email_cliente:
 *                 type: string
 *               contrasena:
 *                 type: string
 *               celular_cliente:
 *                 type: string
 *               nit_ci_cliente:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registro exitoso
 *       400:
 *         description: Faltan campos obligatorios
 *       403:
 *         description: Cliente existente sin acceso web
 *       409:
 *         description: El email ya está registrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/register', validateClienteRegistration, ClienteController.register);
/**
 * @swagger
 * /clientes/login:
 *   post:
 *     summary: Iniciar sesión
 *     description: Autentica un cliente y genera un token JWT
 *     tags: [Clientes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email_cliente
 *               - contrasena
 *             properties:
 *               email_cliente:
 *                 type: string
 *               contrasena:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 *       400:
 *         description: Faltan email o contraseña
 *       401:
 *         description: Contraseña incorrecta
 *       403:
 *         description: Cuenta no habilitada o sin contraseña
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/login', loginRateLimit, ClienteController.login);
/**
 * @swagger
 * /clientes/google-login:
 *   post:
 *     summary: Iniciar sesión con Google
 *     description: Autentica un cliente usando Google OAuth
 *     tags: [Clientes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token de Google OAuth
 *     responses:
 *       200:
 *         description: Login con Google exitoso
 *       400:
 *         description: Solicitud inválida
 *       500:
 *         description: Error interno del servidor
 */
router.post('/google-login', loginRateLimit, GoogleAuthController.googleLogin);
/**
 * @swagger
 * /clientes/verify-email:
 *   get:
 *     summary: Verificar email
 *     description: Verifica el email de un cliente mediante token de verificación
 *     tags: [Clientes]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de verificación
 *     responses:
 *       200:
 *         description: Cuenta verificada exitosamente
 *       400:
 *         description: Token inválido o expirado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/verify-email', ClienteController.verifyEmail);
/**
 * @swagger
 * /clientes/verify-email/resend:
 *   post:
 *     summary: Reenviar email de verificación
 *     description: Reenvía el email con el enlace de verificación
 *     tags: [Clientes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email_cliente
 *             properties:
 *               email_cliente:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email reenviado exitosamente
 *       400:
 *         description: Faltan campos obligatorios
 *       429:
 *         description: Demasiados intentos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/verify-email/resend', ClienteController.resendVerificationEmail);
/**
 * @swagger
 * /clientes/forgot-password:
 *   post:
 *     summary: Solicitar recuperación de contraseña
 *     description: Envía un email con instrucciones para restablecer la contraseña
 *     tags: [Clientes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email_cliente
 *             properties:
 *               email_cliente:
 *                 type: string
 *     responses:
 *       200:
 *         description: Solicitud procesada
 *       400:
 *         description: Email es obligatorio
 *       429:
 *         description: Demasiados intentos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/forgot-password', ClienteController.forgotPassword);
/**
 * @swagger
 * /clientes/reset-password:
 *   post:
 *     summary: Restablecer contraseña
 *     description: Completa el proceso de restablecimiento de contraseña
 *     tags: [Clientes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - nueva_contrasena
 *             properties:
 *               token:
 *                 type: string
 *               nueva_contrasena:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña restablecida correctamente
 *       400:
 *         description: Token inválido o expirado
 *       500:
 *         description: Error interno del servidor
 */
router.post('/reset-password', ClienteController.resetPassword);
/**
 * @swagger
 * /clientes/activar-cuenta:
 *   post:
 *     summary: Activar cuenta
 *     description: Activa una cuenta creada por un administrador y establece la contraseña del cliente
 *     tags: [Clientes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - nueva_contrasena
 *             properties:
 *               token:
 *                 type: string
 *               nueva_contrasena:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cuenta activada exitosamente
 *       400:
 *         description: Enlace inválido, expirado o faltan campos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/activar-cuenta', ClienteController.activarCuenta);

// --- RUTAS PROTEGIDAS (requieren autenticación) ---

/**
 * @swagger
 * /clientes/verify-token:
 *   get:
 *     summary: Verificar token
 *     description: Verifica validez del token JWT y retorna datos del cliente
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token válido, retorna datos del cliente
 *       401:
 *         description: Sesión no válida o expirada
 *       403:
 *         description: Cuenta inactiva o no autorizada
 *       500:
 *         description: Error interno del servidor
 */
router.get('/verify-token', verificarTokenCliente, ClienteController.verifyToken);
/**
 * @swagger
 * /clientes/perfil:
 *   get:
 *     summary: Obtener perfil
 *     description: Obtiene el perfil completo del cliente autenticado
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del cliente
 *       401:
 *         description: Sesión no válida o expirada
 *       404:
 *         description: Perfil no encontrado o cuenta inactiva
 *       500:
 *         description: Error interno del servidor
 */
router.get('/perfil', verificarTokenCliente, ClienteController.obtenerPerfil);
/**
 * @swagger
 * /clientes/perfil:
 *   put:
 *     summary: Actualizar perfil
 *     description: Actualiza el perfil del cliente autenticado (nombre, apellido, celular, NIT/CI)
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre_cliente:
 *                 type: string
 *               apellido_cliente:
 *                 type: string
 *               celular_cliente:
 *                 type: string
 *               nit_ci_cliente:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Sesión no válida
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Cliente no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put('/perfil', verificarTokenCliente, ClienteController.actualizarPerfil);
/**
 * @swagger
 * /clientes/cambiar-contrasena:
 *   put:
 *     summary: Cambiar contraseña
 *     description: Cambia la contraseña del cliente autenticado
 *     tags: [Clientes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contrasena_actual
 *               - nueva_contrasena
 *             properties:
 *               contrasena_actual:
 *                 type: string
 *               nueva_contrasena:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña cambiada exitosamente
 *       400:
 *         description: Faltan campos o datos inválidos
 *       401:
 *         description: Sesión no válida o contraseña actual incorrecta
 *       500:
 *         description: Error interno del servidor
 */
router.put('/cambiar-contrasena', verificarTokenCliente, ClienteController.cambiarContrasena);

export default router; 