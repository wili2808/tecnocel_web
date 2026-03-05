import adminApi from '../api/axiosAdminConfig';
import type {
  FiltrosReporteVentas,
  FiltrosReporteProductos,
  FiltrosReporteClientes,
  FiltrosReporte,
  ReporteVentasResponse,
  ReporteProductosResponse,
  ReporteClientesResponse,
  ReporteCancelacionesResponse
} from '../types/reporte';

export const reporteService = {
  async obtenerReporteVentas(filtros: FiltrosReporteVentas = {}): Promise<ReporteVentasResponse> {
    try {
      const response = await adminApi.get('/reportes/ventas', { params: filtros });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.mensaje || 'Error al obtener reporte de ventas');
    }
  },

  async obtenerReporteProductos(filtros: FiltrosReporteProductos = {}): Promise<ReporteProductosResponse> {
    try {
      const response = await adminApi.get('/reportes/productos', { params: filtros });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.mensaje || 'Error al obtener reporte de productos');
    }
  },

  async obtenerReporteClientes(filtros: FiltrosReporteClientes = {}): Promise<ReporteClientesResponse> {
    try {
      const response = await adminApi.get('/reportes/clientes', { params: filtros });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.mensaje || 'Error al obtener reporte de clientes');
    }
  },

  async obtenerReporteCancelaciones(filtros: FiltrosReporte = {}): Promise<ReporteCancelacionesResponse> {
    try {
      const response = await adminApi.get('/reportes/cancelaciones', { params: filtros });
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.mensaje || 'Error al obtener reporte de cancelaciones');
    }
  },

  async exportarCSV(tipo: string, filtros: FiltrosReporte = {}): Promise<void> {
    try {
      const response = await adminApi.get(`/reportes/exportar/${tipo}`, {
        params: filtros,
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Extraer filename del header o usar default
      const contentDisposition = response.headers['content-disposition'];
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      link.download = filenameMatch ? filenameMatch[1] : `reporte_${tipo}.csv`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      throw new Error(error.response?.data?.mensaje || 'Error al exportar reporte');
    }
  }
};

export default reporteService;
