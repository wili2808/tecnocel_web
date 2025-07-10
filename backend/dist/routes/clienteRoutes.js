import { Router } from 'express';
import ClienteController from '../controllers/ClienteController.js';
import { validateClienteRegistration } from '../middleware/validateRegistration.js';
import { verificarTokenCliente } from '../middleware/authMiddleware.js';
const router = Router();
// Registro
router.post('/register', validateClienteRegistration, ClienteController.register);
// Login
router.post('/login', ClienteController.login);
// Verificación de token (requiere token válido)
router.get('/verify-token', verificarTokenCliente, ClienteController.verifyToken);
// Verificación de email
router.get('/verify-email', ClienteController.verifyEmail);
// Solicitud de recuperación de contraseña
router.post('/forgot-password', ClienteController.forgotPassword);
// Restablecimiento de contraseña
router.post('/reset-password', ClienteController.resetPassword);
export default router;
//# sourceMappingURL=clienteRoutes.js.map