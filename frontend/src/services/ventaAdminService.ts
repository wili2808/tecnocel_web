/**
 * @file Servicio de gestión de ventas — Panel Admin
 *
 * Maneja todas las operaciones del panel administrativo relacionadas con ventas:
 * - Listar ventas con filtros y paginación
 * - Ver detalle de cualquier venta
 * - Registrar ventas manuales
 * - Cancelar ventas (solo admin)
 * - Estadísticas de ventas
 *
 * Usa adminApi (axiosAdminConfig) que inyecta automáticamente el Bearer token
 * del usuario del sistema (admin/empleado/vendedor).
 */

import adminApi from '../api/axiosAdminConfig';
import type {
  ListarVentasAdminResponse,
  VentaDetalle,
  RegistrarVentaManualData,
  EstadisticasVentas,
  FiltrosVentasAdmin
} from '../types/venta';

export const ventaAdminService = {

  /**
   * Lista ventas con filtros opcionales y paginación
   */
  async listarVentas(
    filtros: FiltrosVentasAdmin = {},
    limit = 50,
    offset = 0
  ): Promise<ListarVentasAdminResponse> {
    try {
      const params: Record<string, string | number> = { limit, offset };
      if (filtros.fecha_inicio) params.fecha_inicio = filtros.fecha_inicio;
      if (filtros.fecha_fin)    params.fecha_fin    = filtros.fecha_fin;
      if (filtros.estado)       params.estado       = filtros.estado;
      if (filtros.tipo_venta)   params.tipo_venta   = filtros.tipo_venta;
      if (filtros.metodo_pago)  params.metodo_pago  = filtros.metodo_pago;
      if (filtros.search)       params.search       = filtros.search;

      const response = await adminApi.get('/ventas/admin/listar', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.mensaje || 'Error al obtener ventas');
    }
  },

  /**
   * Obtiene el detalle completo de una venta específica
   */
  async obtenerDetalle(id_venta: number): Promise<VentaDetalle> {
    try {
      const response = await adminApi.get(`/ventas/admin/${id_venta}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.mensaje || 'Error al obtener detalle de la venta');
    }
  },

  /**
   * Registra una venta manual desde el panel admin
   */
  async registrarVentaManual(data: RegistrarVentaManualData): Promise<{ mensaje: string; venta: any }> {
    try {
      const response = await adminApi.post('/ventas/admin/registrar', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.mensaje || 'Error al registrar la venta');
    }
  },

  /**
   * Cancela una venta y restaura el stock (solo admin)
   */
  async cancelarVenta(id_venta: number, motivo?: string): Promise<{ mensaje: string }> {
    try {
      const response = await adminApi.patch(`/ventas/admin/${id_venta}/cancelar`, { motivo });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.mensaje || 'Error al cancelar la venta');
    }
  },

  /**
   * Obtiene estadísticas de ventas (hoy, semana, mes, ingresos)
   */
  async obtenerEstadisticas(): Promise<EstadisticasVentas> {
    try {
      const response = await adminApi.get('/ventas/admin/estadisticas');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.mensaje || 'Error al obtener estadísticas');
    }
  },

  /**
   * Obtiene la cotización USD/ARS configurada
   */
  async getTipoCambio(): Promise<{ valor: number; fyh_actualizacion: string | null }> {
    try {
      const res = await adminApi.get('/ventas/admin/tipo-cambio');
      return res.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.mensaje || 'Error al obtener tipo de cambio');
    }
  },

  /**
   * Actualiza la cotización USD/ARS (solo admin y empleado)
   */
  async updateTipoCambio(valor: number): Promise<{ mensaje: string; valor: number }> {
    try {
      const res = await adminApi.put('/ventas/admin/tipo-cambio', { valor });
      return res.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.mensaje || 'Error al actualizar tipo de cambio');
    }
  },

  // ── Helpers de formato ────────────────────────────────────────────────────

  formatearMetodoPago(metodo: string | null): string {
    const labels: Record<string, string> = {
      efectivo:      'Efectivo',
      tarjeta:       'Tarjeta',
      transferencia: 'Transferencia',
      qr:            'QR'
    };
    return metodo ? (labels[metodo] || metodo) : '—';
  },

  formatearTipoVenta(tipo: string): string {
    return tipo === 'manual' ? 'Manual' : 'Web';
  },

  formatearEstado(estado: string): string {
    const labels: Record<string, string> = {
      completada: 'Completada',
      cancelada:  'Cancelada',
      pendiente:  'Pendiente'
    };
    return labels[estado] || estado;
  },

  formatearTotal(total: number, moneda = '$'): string {
    return `${moneda} ${total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
};

export default ventaAdminService;
