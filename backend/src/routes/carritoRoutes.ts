import { Router } from 'express';
import CarritoController from '../controllers/CarritoController.js';
import { verificarTokenCliente } from '../middleware/authMiddleware.js';
import {
  validateAgregarItem,
  validateActualizarCantidad,
  validateEliminarItem,
  validateConfirmarCompra,
  validateObtenerHistorial,
  verificarLimitesCarrito,
  logCarritoOperation,
  verificarDisponibilidadProducto,
  carritoRateLimitDiferenciado
} from '../middleware/validateCarrito.js';

const router = Router();

// Todas las rutas del carrito requieren autenticación de cliente
router.use(verificarTokenCliente);

// Rate limiting diferenciado para operaciones de carrito
router.use(carritoRateLimitDiferenciado);

// Obtener carrito activo del cliente
router.get('/', 
  logCarritoOperation('obtener_carrito'),
  CarritoController.obtenerCarrito
);

// Agregar producto al carrito
router.post('/items', 
  logCarritoOperation('agregar_item'),
  validateAgregarItem,
  verificarDisponibilidadProducto,
  verificarLimitesCarrito,
  CarritoController.agregarItem
);

// Actualizar cantidad de un item
router.put('/items/:id_item', 
  logCarritoOperation('actualizar_cantidad'),
  validateActualizarCantidad,
  verificarLimitesCarrito,
  CarritoController.actualizarCantidad
);

// Eliminar un item del carrito
router.delete('/items/:id_item', 
  logCarritoOperation('eliminar_item'),
  validateEliminarItem,
  CarritoController.eliminarItem
);

// Vaciar carrito completo
router.delete('/', 
  logCarritoOperation('vaciar_carrito'),
  CarritoController.vaciarCarrito
);

// Confirmar compra (convertir carrito en venta)
router.post('/confirmar-compra', 
  logCarritoOperation('confirmar_compra'),
  validateConfirmarCompra,
  CarritoController.confirmarCompra
);

// Obtener historial de carritos
router.get('/historial', 
  logCarritoOperation('obtener_historial'),
  validateObtenerHistorial,
  CarritoController.obtenerHistorial
);

export default router; 