import axiosInstance from '../api/axiosConfig';
import type { DatosCompra, VentaConfirmada, CarritoResponse, ItemResponse, EliminarItemResponse } from '../types/carrito';

/**
 * Servicio para manejar todas las operaciones del carrito de compras
 * Incluye gestión de items, cantidades, confirmación de compra y conversión a venta
 * Implementado como objeto literal (singleton) siguiendo el patrón del proyecto
 */
const carritoService = {
  /**
   * Obtiene el carrito activo del cliente autenticado
   * @returns Promise con la información completa del carrito y sus items
   */
  async obtenerCarrito(): Promise<CarritoResponse> {
    const response = await axiosInstance.get('/carrito/');
    return response.data;
  },

  /**
   * Agrega un producto al carrito con la cantidad especificada
   * @param id_producto - ID del producto a agregar
   * @param cantidad - Cantidad del producto (debe ser mayor a 0)
   * @returns Promise con la confirmación del item agregado
   */
  async agregarItem(
    id_producto: number,
    cantidad: number
  ): Promise<ItemResponse> {
    const response = await axiosInstance.post('/carrito/items', {
      id_producto,
      cantidad
    });
    return response.data;
  },

  /**
   * Actualiza la cantidad de un item específico en el carrito
   * @param id_item - ID del item del carrito a actualizar
   * @param cantidad - Nueva cantidad del item
   * @returns Promise con la confirmación del item actualizado
   */
  async actualizarCantidad(id_item: number, cantidad: number): Promise<ItemResponse> {
    const response = await axiosInstance.put(`/carrito/items/${id_item}`, {
      cantidad
    });
    return response.data;
  },

  /**
   * Elimina un item específico del carrito
   * @param id_item - ID del item del carrito a eliminar
   * @returns Promise con la confirmación de la eliminación
   */
  async eliminarItem(id_item: number): Promise<EliminarItemResponse> {
    const response = await axiosInstance.delete(`/carrito/items/${id_item}`);
    return response.data;
  },

  /**
   * Vacía completamente el carrito del cliente
   * Elimina todos los items y reinicia el carrito
   * @returns Promise con mensaje de confirmación
   */
  async vaciarCarrito(): Promise<{ mensaje: string }> {
    const response = await axiosInstance.delete('/carrito/');
    return response.data;
  },

  /**
   * Confirma la compra y convierte el carrito en una venta
   * Procesa el pago y genera la orden de compra
   * @param datosCompra - Información necesaria para procesar la compra
   * @returns Promise con los datos de la venta confirmada
   */
  async confirmarCompra(datosCompra: DatosCompra): Promise<{ venta: VentaConfirmada }> {
    const response = await axiosInstance.post('/carrito/confirmar-compra', datosCompra);
    return response.data;
  },

  /**
   * Obtiene el historial de compras (ventas confirmadas) del cliente autenticado
   * Incluye detalles de productos, precios y fechas de cada compra
   * @param limit - Número máximo de compras a obtener (default: 10, max: 50)
   * @param offset - Número de compras a saltar para paginación (default: 0)
   * @returns Promise con el array de ventas realizadas
   */
  async obtenerHistorial(limit?: number, offset?: number): Promise<any> {
    const params: Record<string, number> = {};
    if (limit !== undefined) params.limit = limit;
    if (offset !== undefined) params.offset = offset;

    // NUEVO: Usar endpoint de ventas en lugar de carritos
    const response = await axiosInstance.get('/ventas/historial', { params });
    return response.data;
  },

  /**
   * Obtiene el detalle completo de una venta específica del cliente autenticado
   * @param id_venta - ID de la venta a consultar
   */
  async obtenerDetalleVenta(id_venta: number): Promise<any> {
    const response = await axiosInstance.get(`/ventas/${id_venta}`);
    return response.data;
  }
};

export default carritoService;