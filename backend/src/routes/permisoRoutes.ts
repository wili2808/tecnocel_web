import { Router } from 'express';
import { body, query, param } from 'express-validator';
import PermisoController from '../controllers/PermisoController.js';
import { verificarToken, verificarRol } from '../middleware/authMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

router.use(verificarToken);
router.use(verificarRol([ROLES.ADMIN]));

router.get(
  '/',
  PermisoController.getAll.bind(PermisoController)
);

router.get(
  '/roles',
  PermisoController.getRolesConPermisos.bind(PermisoController)
);

router.get(
  '/rol/:id_rol',
  [
    param('id_rol').isInt({ min: 1 }).withMessage('ID de rol inválido')
  ],
  PermisoController.getByRol.bind(PermisoController)
);

router.get(
  '/status',
  [
    query('id_rol').isInt({ min: 1 }).withMessage('ID de rol inválido')
  ],
  PermisoController.getAllWithStatus.bind(PermisoController)
);

router.put(
  '/sync',
  [
    body('id_rol').isInt({ min: 1 }).withMessage('ID de rol inválido'),
    body('permisos').isArray({ min: 0 }).withMessage('Debe ser un array de permisos')
  ],
  PermisoController.syncPermisos.bind(PermisoController)
);

export default router;
