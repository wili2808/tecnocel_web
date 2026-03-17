// Response shapes - cliente
export interface VentaItemResumen {
  id_producto: number;
  nombre: string;
  codigo: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  imagen_url: string | null;
}

export interface EnvioDireccionResumen {
  nombre_direccion?: string | null;
  calle: string | null;
  numero: string | null;
  piso: string | null;
  departamento: string | null;
  barrio: string | null;
  ciudad: string | null;
  provincia: string | null;
  codigo_postal?: string | null;
  pais?: string | null;
  referencia?: string | null;
  telefono_contacto?: string | null;
}

export interface EnvioResumen {
  tipo_entrega: string;
  estado_envio: string;
  fyh_despacho?: string | null;
  direccion_envio: EnvioDireccionResumen | null;
}

export interface CancelacionResumen {
  fecha_cancelacion: string;
  motivo: string | null;
}

export interface VentaHistorialItem {
  id_venta: number;
  nro_venta: string;
  fecha_venta: string;
  total: number;
  estado: string;
  metodo_pago: string | null;
  moneda: string | null;
  valor_dolar: number | null;
  estado_reembolso: string | null;
  envio: EnvioResumen | null;
  cancelacion: CancelacionResumen | null;
  items: VentaItemResumen[];
}

export interface VentaDetalleCliente extends VentaHistorialItem {
  cliente: { id_cliente: number; nombre: string; email: string } | null;
  observaciones: string | null;
}

// Response shapes - admin
export interface VentaAdminListItem {
  id_venta: number;
  nro_venta: string;
  fyh_creacion: string;
  id_cliente: number | null;
  nombre_cliente: string;
  email_cliente: string;
  cantidad_items: number;
  total_pagado: number;
  metodo_pago: string | null;
  tipo_venta: string;
  estado: string;
  id_vendedor: number | null;
  nombre_vendedor: string;
}

export interface VentaItemDetalle {
  id_item: number;
  id_producto: number;
  nombre_producto: string;
  codigo_producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface VentaAdminDetalle extends VentaAdminListItem {
  observaciones: string | null;
  moneda: string | null;
  valor_dolar: number | null;
  estado_reembolso: string | null;
  envio: EnvioResumen | null;
  cancelacion: CancelacionResumen | null;
  items: VentaItemDetalle[];
}

export interface VentaItemValidado {
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

// Request bodies
export interface RegistrarVentaItem {
  id_producto: number;
  cantidad: number;
  precio_unitario_manual?: number | string;
}

export interface RegistrarVentaManualBody {
  id_cliente?: number;
  items: RegistrarVentaItem[];
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia' | 'qr';
  observaciones?: string;
  moneda?: string;
  valor_dolar?: number;
}

export interface CancelarVentaBody {
  motivo?: string;
}

export interface ActualizarTipoCambioBody {
  valor: number;
}
