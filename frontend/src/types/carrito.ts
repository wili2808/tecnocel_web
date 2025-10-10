import type { Product } from './product';

// ============================================================================
// TIPOS PRINCIPALES DEL CARRITO
// ============================================================================

/**
 * Item completo del carrito con producto expandido
 */
export interface ItemCarritoCompleto {
  id_item: number;
  id_carrito: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  fyh_creacion: string;
  fyh_actualizacion: string;
  producto?: Product;  // Producto completo con todas las propiedades
}

/**
 * Estado del carrito en la aplicación
 */
export interface EstadoCarrito {
  id_carrito: number | null;
  estado: 'activo' | 'completado' | 'abandonado';
  items: ItemCarritoCompleto[];
  total_carrito: number;
  cantidad_items: number;
  cargando: boolean;
  error: string | null;
}

/**
 * Datos para confirmar compra
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
  item: ItemCarritoCompleto;
  total_carrito: number;
}

/**
 * Respuesta del servidor al eliminar item
 */
export interface EliminarItemResponse {
  mensaje: string;
  total_carrito: number;
}

// ============================================================================
// TIPOS DE ACCIONES DEL REDUCER
// ============================================================================

export type AccionCarrito =
  | { type: 'INICIALIZAR_CARRITO'; payload: EstadoCarrito }
  | { type: 'INICIALIZAR_CARRITO_VACIO' }
  | { type: 'AGREGAR_ITEM'; payload: ItemCarritoCompleto }
  | { type: 'ACTUALIZAR_ITEM'; payload: ItemCarritoCompleto }
  | { type: 'ELIMINAR_ITEM'; payload: number }
  | { type: 'VACIAR_CARRITO' }
  | { type: 'ESTABLECER_CARGANDO'; payload: boolean }
  | { type: 'ESTABLECER_ERROR'; payload: string | null }
  | { type: 'ACTUALIZAR_TOTAL'; payload: number };


