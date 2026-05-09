import { Router } from 'express';
import { ConfiguracionController } from '../controllers/ConfiguracionController.js';
import { verificarToken, verificarRol } from '../middleware/authMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Ruta pública para configuraciones no sensibles (ej. modo mantenimiento)
router.get('/public', ConfiguracionController.getPublic);

// Todas las rutas de configuración requieren ser usuario del sistema
router.use(verificarToken);

// Solo ADMIN y GERENTE pueden ver y editar configuraciones generales
router.get('/', verificarRol([ROLES.ADMIN, ROLES.GERENTE]), ConfiguracionController.getAll);
router.get('/:clave', verificarRol([ROLES.ADMIN, ROLES.GERENTE]), ConfiguracionController.getByKey);

// Solo ADMIN puede actualizar configuraciones
router.put('/:clave', verificarRol([ROLES.ADMIN]), ConfiguracionController.update);
router.post('/bulk', verificarRol([ROLES.ADMIN]), ConfiguracionController.bulkUpdate);

export default router;
