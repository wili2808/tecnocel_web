/**
 * Tipos para el módulo de Compras a Proveedores
 */

// Request bodies
export interface RegistrarCompraItemBody {
  id_producto?: number; // undefined si es producto nuevo
  es_nuevo?: boolean; // true → crear producto al vuelo
  // Campos de producto nuevo (requeridos si es_nuevo = true):
  nuevo_codigo?: string;
  nuevo_nombre?: string;
  nuevo_precio_venta?: number | string;
  nuevo_id_categoria?: number;
  nuevo_id_marca?: number;
  // Campos comunes:
  cantidad: number;
  precio_unitario: number | string;
  precio_venta?: number | string;
}

export interface RegistrarCompraBody {
  id_proveedor: number;
  fecha_compra: string; // YYYY-MM-DD
  comprobante: string; // nro de factura del proveedor
  observaciones?: string;
  items: RegistrarCompraItemBody[];
}

export interface AnularCompraBody {
  motivo?: string;
}

export interface ListarComprasQuery {
  limit?: number;
  offset?: number;
  fecha_inicio?: string;
  fecha_fin?: string;
  id_proveedor?: number;
  estado?: 'activa' | 'anulada';
  search?: string;
}

// Response shapes
export interface CompraListItem {
  id_compra: number;
  nro_compra: number;
  fecha_compra: Date;
  comprobante: string;
  estado: 'activa' | 'anulada';
  precio_total: string;
  id_proveedor: number;
  nombre_proveedor: string;
  empresa_proveedor: string;
  id_usuario: number;
  nombre_usuario: string;
  cantidad_items: number;
  fyh_creacion: Date;
}

export interface CompraItemDetalle {
  id_detalle_compra: number;
  id_producto: number;
  nombre_producto: string;
  codigo_producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface CompraDetalle extends CompraListItem {
  observaciones?: string;
  items: CompraItemDetalle[];
}

export interface EstadisticasCompras {
  compras_hoy: number;
  compras_semana: number;
  compras_mes: number;
  gasto_mes: string;
}

export interface FiltrosComprasAdmin {
  fecha_inicio?: string;
  fecha_fin?: string;
  id_proveedor?: number;
  estado?: 'activa' | 'anulada';
  search?: string;
}
