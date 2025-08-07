import { Router } from 'express';
import { FavoritoController } from '../controllers/FavoritoController.js';

const router = Router();

// Todas las rutas requieren autenticación del cliente
// TODO: Agregar middleware de autenticación de cliente

// Rutas de favoritos
router.get('/cliente/:id_cliente', FavoritoController.getFavoritosCliente);
router.get('/cliente/:id_cliente/estadisticas', FavoritoController.getEstadisticasFavoritos);
router.get('/cliente/:id_cliente/producto/:id_producto', FavoritoController.verificarFavorito);

router.post('/cliente/:id_cliente', FavoritoController.addFavorito);
router.delete('/cliente/:id_cliente/producto/:id_producto', FavoritoController.removeFavorito);
router.put('/cliente/:id_cliente/producto/:id_producto/toggle', FavoritoController.toggleFavorito);

export default router;