import { Router } from 'express';
import { registro, login } from '../controllers/authController.js';
import { verificarToken } from '../middleware/authMiddleware.js';

const router = Router();

// Rutas públicas de autenticación
router.post('/registro', registro);
router.post('/login', login);

// Ruta para verificar el token y obtener datos del usuario
router.get('/verify', verificarToken, (req, res) => {
  res.json({ user: req.usuario });
});

// Ruta protegida para obtener el perfil del usuario
router.get('/perfil', verificarToken, (req, res) => {
  res.json({ mensaje: 'Perfil de usuario', usuario: req.usuario });
});

export default router;