import adminApi from '../api/axiosAdminConfig';
import axiosInstance from '../api/axiosConfig';

export interface Configuracion {
  clave: string;
  valor: string;
  fyh_actualizacion?: string;
}

export const configuracionService = {
  /**
   * Obtiene todas las configuraciones del sistema
   */
  getAll: async (): Promise<Configuracion[]> => {
    const { data } = await adminApi.get('/configuracion');
    return data;
  },

  /**
   * Obtiene configuraciones públicas (sin requerir token)
   */
  getPublic: async (): Promise<Configuracion[]> => {
    const { data } = await axiosInstance.get('/configuracion/public');
    return data;
  },

  /**
   * Obtiene una configuración específica por su clave
   */
  getByKey: async (clave: string): Promise<Configuracion> => {
    const { data } = await adminApi.get(`/configuracion/${clave}`);
    return data;
  },

  /**
   * Actualiza o crea una configuración
   */
  update: async (clave: string, valor: string): Promise<any> => {
    const { data } = await adminApi.put(`/configuracion/${clave}`, { valor });
    return data;
  },

  /**
   * Actualiza múltiples configuraciones a la vez
   */
  updateMultiple: async (configuraciones: Record<string, string>): Promise<any> => {
    const { data } = await adminApi.post('/configuracion/bulk', { configuraciones });
    return data;
  }
};
