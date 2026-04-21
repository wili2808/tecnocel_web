/**
 * Tipos para el módulo de Compras a Proveedores (frontend)
 */

export interface CompraListItem {
  id_compra: number;
  nro_compra: string;
  fecha_compra: string;
  comprobante: string;
  estado: 'activa' | 'anulada';
  precio_total: string;
  id_proveedor: number;
  nombre_proveedor: string;
  empresa_proveedor: string;
  id_usuario: number;
  nombre_usuario: string;
  cantidad_items: number;
  fyh_creacion: string;
}

export interface CompraItem {
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
  motivo_anulacion?: string;
  items: CompraItem[];
  Proveedor?: {
    nombre_proveedor: string;
    empresa: string;
    celular: string;
    email?: string;
    direccion: string;
  };
  Usuario?: {
    nombres: string;
    apellidos: string;
    email: string;
  };
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

export interface ProveedorListItem {
  id_proveedor: number;
  nombre_proveedor: string;
  empresa: string;
  celular: string;
  telefono?: string;
  email?: string;
  direccion: string;
  fyh_creacion?: string;
  fyh_actualizacion?: string;
}

export interface RegistrarCompraItemData {
  id_producto?: number;
  es_nuevo?: boolean;
  nuevo_codigo?: string;
  nuevo_nombre?: string;
  nuevo_precio_venta?: number;
  nuevo_id_categoria?: number;
  nuevo_id_marca?: number;
  cantidad: number;
  precio_unitario: number;
}

export interface RegistrarCompraData {
  id_proveedor: number;
  fecha_compra: string;
  comprobante: string;
  observaciones?: string;
  items: RegistrarCompraItemData[];
}

export interface CreateProveedorData {
  nombre_proveedor: string;
  empresa: string;
  celular: string;
  telefono?: string;
  email?: string;
  direccion: string;
}

export type UpdateProveedorData = Partial<CreateProveedorData>;
