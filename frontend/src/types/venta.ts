// ============================================================================
// TIPOS PARA GESTIÓN DE VENTAS — PANEL ADMIN
// ============================================================================

/**
 * Item en el listado de ventas del admin
 * Corresponde a la respuesta de GET /api/ventas/admin/listar
 */
export interface VentaListItem {
  id_venta: number;
  nro_venta: string;             // Formato "V-00001"
  fyh_creacion: string;          // ISO 8601
  id_cliente: number | null;
  nombre_cliente: string | null; // null = venta sin cliente registrado
  email_cliente: string | null;
  cantidad_items: number;
  total_pagado: number;
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia' | 'qr' | null;
  tipo_venta: 'web' | 'manual';
  estado: 'completada' | 'cancelada' | 'pendiente';
  id_vendedor: number | null;
  nombre_vendedor: string | null;
}

/**
 * Item individual en el detalle de una venta
 */
export interface VentaDetalleItem {
  id_producto: number;
  nombre_producto: string;
  codigo: string | null;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

/**
 * Detalle completo de una venta
 * Corresponde a la respuesta de GET /api/ventas/admin/:id_venta
 */
export interface VentaDetalle {
  id_venta: number;
  nro_venta: string;
  fyh_creacion: string;
  fyh_actualizacion: string;
  total_pagado: number;
  estado: 'completada' | 'cancelada' | 'pendiente';
  estado_reembolso: 'sin_reembolso' | 'pendiente' | 'procesado' | 'rechazado' | null;
  fecha_despacho: string | null;
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia' | 'qr' | null;
  tipo_venta: 'web' | 'manual';
  moneda: string | null;
  observaciones: string | null;
  cliente: {
    id_cliente: number;
    nombre_cliente: string;
    apellido_cliente: string;
    correo: string;
  } | null;
  vendedor: {
    id_vendedor: number;
    nombres: string;
  } | null;
  cancelacion: {
    motivo: string | null;
    fyh_cancelacion: string;
    cancelado_por: string | null;
  } | null;
  items: VentaDetalleItem[];
}

/**
 * Producto en el buscador del wizard de venta manual
 */
export interface ProductoParaVenta {
  id_producto: number;
  nombre: string;
  codigo: string;
  precio_venta: number;
  stock: number;
}

/**
 * Item agregado al formulario del wizard de venta manual (estado local)
 */
export interface ItemVentaManual {
  id_producto: number;
  nombre: string;
  cantidad: number;
  precio_unitario: number;     // precio efectivo (manual o del catálogo)
  precio_catalogo: number;     // precio original del catálogo
  es_precio_manual: boolean;   // true si el vendedor modificó el precio
  subtotal: number;
}

/**
 * Body del POST /api/ventas/admin/registrar
 */
export interface RegistrarVentaManualData {
  id_cliente: number | null;
  items: {
    id_producto: number;
    cantidad: number;
    precio_unitario_manual?: number | null;
  }[];
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia' | 'qr';
  observaciones?: string;
  moneda?: 'ARS' | 'USD';
  /** Cotización USD/ARS al momento de la venta. Solo se envía cuando moneda=USD */
  valor_dolar?: number | null;
}

/**
 * Estadísticas rápidas de ventas
 * Corresponde a GET /api/ventas/admin/estadisticas
 */
export interface EstadisticasVentas {
  ventas_hoy: number;
  ventas_semana: number;
  ventas_mes: number;
  ingresos_mes: number;
}

/**
 * Respuesta paginada del listado de ventas admin
 */
export interface ListarVentasAdminResponse {
  ventas: VentaListItem[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Filtros para el listado de ventas admin
 */
export interface FiltrosVentasAdmin {
  fecha_inicio?: string;
  fecha_fin?: string;
  estado?: 'completada' | 'cancelada' | 'pendiente' | '';
  tipo_venta?: 'web' | 'manual' | '';
  metodo_pago?: 'efectivo' | 'tarjeta' | 'transferencia' | 'qr' | '';
  search?: string;
}
