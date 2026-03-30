// ============================================================================
// TIPOS DE REPORTES - PANEL DE ADMINISTRACIÓN
// ============================================================================

// Filtros comunes para todos los reportes
export interface FiltrosReporte {
  fecha_inicio?: string;
  fecha_fin?: string;
  agrupacion?: 'dia' | 'semana' | 'mes';
}

export interface FiltrosReporteVentas extends FiltrosReporte {
  metodo_pago?: string;
  tipo_venta?: string;
  id_vendedor?: number | 'null';
}

export interface FiltrosReporteProductos extends FiltrosReporte {
  limite?: number;
  orden?: 'mas_vendidos' | 'menos_vendidos' | 'mayor_ingreso';
}

export interface FiltrosReporteClientes extends FiltrosReporte {
  limite?: number;
}

export interface FiltrosReporteVendedores extends FiltrosReporte {
  limite?: number;
}

// ============================================================================
// REPORTE DE VENTAS
// ============================================================================

export interface ReporteVentasResumen {
  total_ventas: number;
  ingresos_ars: number;     // total normalizado a pesos argentinos
  ingresos_usd: number;     // total normalizado a dólares
  ventas_ars: number;       // cantidad de ventas cobradas en ARS
  ventas_usd: number;       // cantidad de ventas cobradas en USD
  ticket_promedio: number;  // ticket promedio en ARS
  ventas_web: number;
  ventas_manual: number;
  metodo_mas_usado: string;
}

export interface ReporteVentaItem {
  periodo: string;
  ventas: number;
  ingresos_ars: number;
  ingresos_usd: number;
  ticket_promedio: number;
}

export interface ReporteVentasResponse {
  resumen: ReporteVentasResumen;
  datos: ReporteVentaItem[];
}

// ============================================================================
// REPORTE DE PRODUCTOS
// ============================================================================

export interface ReporteProductosResumen {
  productos_distintos_vendidos: number;
  unidades_totales: number;
  ingreso_total_productos: number;
}

export interface ProductoReporteItem {
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

export interface ProductoStockBajo {
  id_producto: number;
  nombre: string;
  stock: number;
  stock_minimo: number;
}

export interface ReporteProductosResponse {
  resumen: ReporteProductosResumen;
  mas_vendidos: ProductoReporteItem[];
  stock_bajo: ProductoStockBajo[];
}

// ============================================================================
// REPORTE DE CLIENTES
// ============================================================================

export interface ReporteClientesResumen {
  clientes_nuevos_periodo: number;
  clientes_con_compras: number;
  clientes_totales: number;
}

export interface ClienteReporteItem {
  id_cliente: number;
  nombre: string;
  email: string;
  total_compras: number;
  monto_ars: number;         // total gastado en ARS equivalente
  monto_usd: number;         // total gastado en USD equivalente
  ultima_compra: string;
}

export interface ReporteClientesResponse {
  resumen: ReporteClientesResumen;
  top_clientes: ClienteReporteItem[];
}

// ============================================================================
// REPORTE DE VENDEDORES
// ============================================================================

export interface ReporteVendedoresResumen {
  total_vendedores_activos: number;
  total_ventas_periodo: number;
  vendedor_top_ingresos: string;
  vendedor_top_ventas: string;
}

export interface VendedorReporteItem {
  id_vendedor: number;
  nombre: string;
  ventas: number;
  ingresos_ars: number;
  ingresos_usd: number;
  ticket_promedio: number;
  porcentaje_ventas: number;
}

export interface ReporteVendedoresResponse {
  resumen: ReporteVendedoresResumen;
  datos: VendedorReporteItem[];
}

// ============================================================================
// REPORTE DE CANCELACIONES
// ============================================================================

export interface ReporteCancelacionesResumen {
  total_cancelaciones: number;
  monto_ars: number;         // total cancelado en ARS equivalente
  monto_usd: number;         // total cancelado en USD equivalente
  tasa_cancelacion: number;
}

export interface CancelacionReporteItem {
  id_venta: number;
  nro_venta: string;
  fecha_cancelacion: string;
  monto: number;             // monto en la moneda original de la venta
  moneda: string;            // 'ARS' o 'USD'
  monto_ars: number;         // equivalente en pesos
  monto_usd: number | null;  // equivalente en dólares (null si no hay tipo de cambio)
  motivo: string;
  cancelado_por: string;
}

export interface ReporteCancelacionesResponse {
  resumen: ReporteCancelacionesResumen;
  datos: CancelacionReporteItem[];
}

// ============================================================================
// TIPOS DE PESTAÑA
// ============================================================================

export type ReporteTab = 'ventas' | 'vendedores' | 'productos' | 'clientes' | 'cancelaciones';
