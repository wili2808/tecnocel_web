import axiosInstance from '../api/axiosConfig';

/**
 * Estructura de un item en el carrito
 */
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

/**
 * Estado del carrito
 */
export interface EstadoCarrito {
  id_carrito: number | null;
  estado: 'activo' | 'completado' | 'abandonado';
  items: ItemCarrito[];
  total_carrito: number;
  cantidad_items: number;
  cargando: boolean;
  error: string | null;
}

/**
 * Datos de respuesta de compra
 */
export interface DatosCompra {
  observaciones?: string;
  moneda?: 'BOB' | 'USD' | 'EUR';
  metodo_pago?: 'efectivo' | 'tarjeta' | 'transferencia' | 'qr';
}

/**
 * Respuesta de venta confirmada
 */
export interface VentaConfirmada {
  id_venta: number;
  nro_venta: number;
  total_pagado: number;
  fyh_creacion: string;
}

/**
 * Respuesta del servidor al obtener carrito
 */
export interface CarritoResponse {
  carrito: EstadoCarrito;
}

/**
 * Respuesta del servidor al agregar/actualizar item
 */
export interface ItemResponse {
  item: ItemCarrito;
  total_carrito: number;
}

/**
 * Respuesta del servidor al eliminar item
 */
export interface EliminarItemResponse {
  mensaje: string;
  total_carrito: number;
}

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
    cantidad: number, 
    detalles_personalizacion?: any
  ): Promise<ItemResponse> {
    const response = await axiosInstance.post('/carrito/items', {
      id_producto,
      cantidad,
      detalles_personalizacion
    });
    return response.data;
  }

  /**
   * Actualiza la cantidad de un item en el carrito
   */
  static async actualizarCantidad(
    id_item: number, 
    cantidad: number
  ): Promise<ItemResponse> {
    const response = await axiosInstance.put(`/carrito/items/${id_item}`, {
      cantidad
    });
    return response.data;
  }

  /**
   * Elimina un item del carrito
   */
  static async eliminarItem(id_item: number): Promise<EliminarItemResponse> {
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
