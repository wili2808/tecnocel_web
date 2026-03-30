export interface ReporteMetodoPago {
  metodo_pago: string;
  total: number;
}

export interface ReporteVentasPeriodo {
  periodo: string;
  ventas: number;
  ingresos_ars: number;
  ingresos_usd: number;
  ticket_promedio: number;
}

export interface ReporteVentasResumenRaw {
  total_ventas: number;
  ingresos_ars: number;
  ingresos_usd: number;
  ventas_ars: number;
  ventas_usd: number;
}

export interface ReporteProductoResumen {
  productos_distintos_vendidos: number;
  unidades_totales: number;
  ingreso_total_productos: number;
}

export interface ReporteProductoVendido {
  id_producto: number;
  nombre: string;
  codigo: string;
  categoria: string;
  marca: string;
  unidades_vendidas: number;
  ingreso_total: number;
  precio_venta_actual: number;
  stock_actual: number;
}

export interface ReporteStockBajo {
  id_producto: number;
  nombre: string;
  stock: number;
  stock_minimo: number;
}

export interface ReporteCountResult {
  total: number;
}

export interface ReporteClienteTop {
  id_cliente: number;
  nombre: string;
  email: string;
  total_compras: number;
  monto_ars: number;
  monto_usd: number;
  ultima_compra: string;
}

export interface ReporteCancelacionResumen {
  total_cancelaciones: number;
  monto_ars: number;
  monto_usd: number;
}

export interface ReporteCancelacionItem {
  id_venta: number;
  nro_venta: string;
  fecha_cancelacion: string;
  monto: number;
  moneda: string;
  monto_ars: number;
  monto_usd: number | null;
  motivo: string;
  cancelado_por: string;
}

// ============================================================================
// REPORTE DE VENDEDORES
// ============================================================================

export interface ReporteVendedorResumen {
  total_vendedores_activos: number;
  total_ventas_periodo: number;
  vendedor_top_ingresos: string;
  vendedor_top_ventas: string;
}

export interface ReporteVendedorItem {
  id_vendedor: number;
  nombre: string;
  ventas: number;
  ingresos_ars: number;
  ingresos_usd: number;
  ticket_promedio: number;
  porcentaje_ventas: number;
}
