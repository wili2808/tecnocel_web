import axiosInstance from '../api/axiosConfig';
import type { 
  DatosCompra, 
  VentaConfirmada,
  CarritoResponse,
  ItemResponse,
  EliminarItemResponse
} from '../types/carrito';

/**
 * Servicio para manejar todas las operaciones del carrito
 */
export class CarritoService {
  /**
   * Obtiene el carrito activo del cliente
   */
  static async obtenerCarrito(): Promise<CarritoResponse> {
    const response = await axiosInstance.get('/carrito/');
    return response.data;
  }

  /**
   * Agrega un producto al carrito
   */
  static async agregarItem(
    id_producto: number, 
    cantidad: number
  ): Promise<ItemResponse> {
    const response = await axiosInstance.post('/carrito/items', {
      id_producto,
      cantidad
    });
    return response.data;
  }

  /**
   * Actualiza la cantidad de un item en el carrito
   */
  static async actualizarCantidad (id_item: number, cantidad: number): Promise <ItemResponse> {
    const response = await axiosInstance.put(`/carrito/items/${id_item}`, {
      cantidad
    });
    return response.data;
  }

  /**
   * Elimina un item del carrito
   */
  static async eliminarItem (id_item: number): Promise <EliminarItemResponse> {
    const response = await axiosInstance.delete(`/carrito/items/${id_item}`);
    return response.data;
  }

  /**
   * Vacía completamente el carrito
   */
  static async vaciarCarrito(): Promise<{ mensaje: string }> {
    const response = await axiosInstance.delete('/carrito/');
    return response.data;
  }

  /**
   * Confirma la compra y convierte el carrito en venta
   */
  static async confirmarCompra(datosCompra: DatosCompra): Promise<{ venta: VentaConfirmada }> {
    const response = await axiosInstance.post('/carrito/confirmar-compra', datosCompra);
    return response.data;
  }
}

// ============================================================================
// EXPORTAR TIPOS PARA COMPATIBILIDAD
// ============================================================================

// Re-exportar tipos para mantener compatibilidad con código existente
export type {
  CarritoResponse,
  ItemResponse,
  EliminarItemResponse
} from '../types/carrito';

// Mantener tipos legacy para compatibilidad gradual
export interface ItemCarrito {
  id_item: number;
  id_carrito: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  fyh_creacion: string;
  fyh_actualizacion: string;
  producto?: {
    id_producto: number;
    nombre: string;
    descripcion: string;
    precio_venta: string;
    imagen: string;
    stock: number;
  };
}
