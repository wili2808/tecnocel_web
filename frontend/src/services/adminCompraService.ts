import adminApi from '../api/axiosAdminConfig';
import type {  CompraListItem,  CompraDetalle,  EstadisticasCompras,  FiltrosComprasAdmin,  RegistrarCompraData} from '../types';

const adminCompraService = {
  /**
   * Obtiene estadísticas de compras (hoy, semana, mes, gasto total del mes)
   */
  async obtenerEstadisticas(): Promise<{ success: boolean; data: EstadisticasCompras }> {
    try {
      const response = await adminApi.get('/compras/admin/estadisticas');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al obtener estadísticas');
    }
  },

  /**
   * Lista compras con filtros opcionales y paginación
   */
  async listarCompras(
    filtros: FiltrosComprasAdmin = {},
    limit = 20,
    offset = 0,
    sortBy?: string,
    order?: 'ASC' | 'DESC'
  ): Promise<{ success: boolean; data: CompraListItem[]; total: number; limit: number; offset: number }> {
    try {
      const params: Record<string, string | number> = { limit, offset };
      if (filtros.fecha_inicio) params.fecha_inicio = filtros.fecha_inicio;
      if (filtros.fecha_fin) params.fecha_fin = filtros.fecha_fin;
      if (filtros.id_proveedor) params.id_proveedor = filtros.id_proveedor;
      if (filtros.estado) params.estado = filtros.estado;
      if (filtros.search) params.search = filtros.search;
      if (sortBy) params.sortBy = sortBy;
      if (order) params.order = order;

      const response = await adminApi.get('/compras/admin/listar', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al obtener compras');
    }
  },

  /**
   * Obtiene detalle completo de una compra
   */
  async obtenerDetalle(idCompra: number): Promise<{ success: boolean; data: CompraDetalle }> {
    try {
      const response = await adminApi.get(`/compras/admin/${idCompra}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al obtener detalle de compra');
    }
  },

  /**
   * Registra una nueva compra
   */
  async registrarCompra(data: RegistrarCompraData): Promise<{
    success: boolean;
    data: {
      id_compra: number;
      nro_compra: string;
      precio_total: string;
      estado: string;
      fyh_creacion: string;
    };
  }> {
    try {
      const response = await adminApi.post('/compras/admin/registrar', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al registrar compra');
    }
  },

  /**
   * Anula una compra (revertir stock)
   */
  async anularCompra(idCompra: number, motivo?: string): Promise<{
    success: boolean;
    data: {
      id_compra: number;
      nro_compra: string;
      estado: string;
    };
  }> {
    try {
      const response = await adminApi.patch(`/compras/admin/${idCompra}/anular`, { motivo });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al anular compra');
    }
  },

  //--- Helpers de formato

  /**
   * Formatea el estado de la compra para mostrar
   */
  formatearEstado(estado: 'activa' | 'anulada'): string {
    const map: Record<string, string> = {
      activa: 'Activa',
      anulada: 'Anulada'
    };
    return map[estado] || estado;
  },

  /**
   * Formatea número de compra como "C-00001"
   */
  formatearNumero(nroCompra: string | number): string {
    if (typeof nroCompra === 'string') return nroCompra;
    return `C-${String(nroCompra).padStart(5, '0')}`;
  },

  /**
   * Formatea total de compra usando locale argentino
   */
  formatearTotal(total: string | number): string {
    const numTotal = typeof total === 'string' ? parseFloat(total) : total;
    return numTotal.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  },

  /**
   * Formatea fecha al formato español
   */
  formatearFecha(fecha: string | Date): string {
    const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
};

export default adminCompraService;
