import { Router } from 'express';
import { ConfiguracionController } from '../controllers/ConfiguracionController.js';
import { verificarToken, verificarRol } from '../middleware/authMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Ruta pública para configuraciones no sensibles (ej. modo mantenimiento)
router.get('/public', ConfiguracionController.getPublic);

// Todas las rutas de configuración requieren ser usuario del sistema
router.use(verificarToken);

// Cualquier usuario del sistema puede VER las configuraciones
router.get('/', ConfiguracionController.getAll);
router.get('/:clave', ConfiguracionController.getByKey);

// Solo ADMIN y GERENTE pueden actualizar configuraciones
router.put('/:clave', verificarRol([ROLES.ADMIN, ROLES.GERENTE]), ConfiguracionController.update);
router.post('/bulk', verificarRol([ROLES.ADMIN, ROLES.GERENTE]), ConfiguracionController.bulkUpdate);

export default router;
