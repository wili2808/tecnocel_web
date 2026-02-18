import type { Product } from './product';
import type { OfertaAplicada } from './oferta';

// ============================================================================
// TIPOS PRINCIPALES DEL CARRITO
// ============================================================================

/**
 * Item completo del carrito con producto expandido y validación de stock
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
  // ✅ VALIDACIÓN DE STOCK (agregado en Fase 1)
  stock_disponible?: number;      // Stock actual del producto
  tiene_stock?: boolean;           // true si hay stock suficiente
  sugerencia_cantidad?: number | null;  // Cantidad sugerida si no hay stock suficiente
  cantidad_faltante?: number;      // Cantidad que falta para completar el pedido
  // ✅ VALIDACIÓN DE PRECIOS (agregado en Fase 2)
  precio_guardado?: number;        // Precio cuando se agregó al carrito
  precio_actual?: number;          // Precio actual revalidado
  diferencia_precio?: number;      // Diferencia entre actual y guardado
  porcentaje_cambio?: number;      // Porcentaje de cambio
  precio_cambio?: boolean;         // true si hubo cambio significativo (>1%)
  subtotal_guardado?: number;      // Subtotal con precio guardado
  subtotal_actual?: number;        // Subtotal con precio actual
  oferta_guardada?: OfertaAplicada;  // Oferta al momento de agregar
  oferta_actual?: OfertaAplicada;    // Oferta actual vigente
}

/**
 * Información de un item sin stock
 */
export interface ItemSinStock {
  id_item: number;
  id_producto: number;
  nombre_producto: string;
  cantidad_solicitada: number;
  stock_disponible: number;
  sugerencia_cantidad: number | null;
}

/**
 * Información de cambio de precio de un item (Fase 2)
 */
export interface CambioPrecio {
  id_item: number;
  id_producto: number;
  nombre_producto: string;
  precio_guardado: number;
  precio_actual: number;
  diferencia_precio: number;
  porcentaje_cambio: number;
  subtotal_guardado: number;
  subtotal_actual: number;
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
  // ✅ VALIDACIÓN DE STOCK (agregado en Fase 1)
  tiene_items_sin_stock?: boolean;
  items_sin_stock?: ItemSinStock[];
  // ✅ VALIDACIÓN DE PRECIOS (agregado en Fase 2)
  total_actual?: number;              // Total con precios actuales revalidados
  diferencia_total?: number;          // Diferencia entre total actual y guardado
  tiene_cambios_precio?: boolean;     // true si hay items con cambios de precio
  items_con_cambio_precio?: CambioPrecio[];  // Items que cambiaron de precio
}

/**
 * Datos para confirmar compra
 */
export interface DatosCompra {
  observaciones?: string;
  moneda?: 'BOB' | 'USD' | 'EUR';
  metodo_pago?: 'efectivo' | 'tarjeta' | 'transferencia' | 'qr';
  // ✅ FASE 2: Aceptación de cambios de precio
  aceptar_cambio_precio?: boolean;
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


