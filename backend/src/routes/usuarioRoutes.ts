import { Router } from 'express';
import usuarioController from '../controllers/UsuarioController.js';
import { verificarToken } from '../middleware/authMiddleware.js';

const router = Router();

// Rutas públicas
router.post('/login', usuarioController.login.bind(usuarioController));

// Rutas protegidas (requieren autenticación)
router.get('/me', verificarToken, usuarioController.getMe.bind(usuarioController));

export default router;
