import { Router } from 'express';
import ReporteController from '../controllers/ReporteController.js';
import { verificarToken, verificarPermiso } from '../middleware/authMiddleware.js';

const router = Router();

// Todas las rutas de reportes requieren autenticación + permiso ver_reportes
router.use(verificarToken);
router.use(verificarPermiso('ver_reportes'));

// Reportes
router.get('/ventas', ReporteController.reporteVentas);
router.get('/vendedores', ReporteController.reporteVendedores);
router.get('/productos', ReporteController.reporteProductos);
router.get('/clientes', ReporteController.reporteClientes);
router.get('/cancelaciones', ReporteController.reporteCancelaciones);

// Exportar CSV
router.get('/exportar/:tipo', ReporteController.exportarCSV);

export default router;
