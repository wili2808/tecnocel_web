import { Router } from 'express';
import ReporteController from '../controllers/ReporteController.js';
import { verificarToken, verificarRol } from '../middleware/authMiddleware.js';
import { ROLES } from '../constants/roles.js';

const router = Router();

// Todas las rutas de reportes requieren autenticación + rol admin o gerente
router.use(verificarToken);
router.use(verificarRol([ROLES.ADMIN, ROLES.GERENTE]));

// Reportes
router.get('/ventas', ReporteController.reporteVentas);
router.get('/vendedores', ReporteController.reporteVendedores);
router.get('/productos', ReporteController.reporteProductos);
router.get('/clientes', ReporteController.reporteClientes);
router.get('/cancelaciones', ReporteController.reporteCancelaciones);

// Exportar CSV
router.get('/exportar/:tipo', ReporteController.exportarCSV);

export default router;
