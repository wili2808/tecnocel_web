import axiosInstance from '../api/axiosConfig';
import adminApi from '../api/axiosAdminConfig';
import type { MensajeContacto, CreateMensajeBody, MensajesPaginatedResponse } from '../types/mensaje';

/**
 * Servicio para manejar todas las operaciones relacionadas con los mensajes de contacto
 * Permite tanto el envío desde la web pública como la gestión administrativa
 */
const mensajeService = {
  /**
   * Envía un nuevo mensaje de contacto (Acceso Público)
   * Utilizado por el formulario de la página de Contacto
   * 
   * @param data - Datos del formulario de contacto
   * @returns Promise con el resultado de la operación
   */
  enviarMensaje: async (data: CreateMensajeBody): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await axiosInstance.post('/mensajes', data);
      return response.data;
    } catch (error) {
      console.error('Error enviando mensaje de contacto:', error);
      throw error;
    }
  },

  /**
   * Obtiene mensajes con paginación y filtros (Acceso Admin)
   * Utilizado por el Panel de Administración
   * 
   * @param page - Número de página
   * @param limit - Cantidad de elementos por página
   * @param leido - Filtro opcional por estado de lectura
   * @returns Promise con la lista de mensajes y metadata de paginación
   */
  getMensajes: async (page = 1, limit = 20, leido?: boolean): Promise<MensajesPaginatedResponse['data']> => {
    try {
      const params: any = { page, limit };
      if (leido !== undefined) params.leido = leido;

      const response = await adminApi.get('/mensajes', { params });
      return response.data.data;
    } catch (error) {
      console.error('Error obteniendo mensajes:', error);
      throw error;
    }
  },

  /**
   * Obtiene el detalle completo de un mensaje específico
   * 
   * @param id - ID del mensaje
   * @returns Promise con los datos del mensaje
   */
  getMensajeById: async (id: number): Promise<MensajeContacto> => {
    try {
      const response = await adminApi.get(`/mensajes/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error obteniendo mensaje por ID:', error);
      throw error;
    }
  },

  /**
   * Marca un mensaje como leído o no leído
   * 
   * @param id - ID del mensaje
   * @param leido - Nuevo estado de lectura
   * @returns Promise con el resultado de la operación
   */
  updateStatus: async (id: number, leido: boolean): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await adminApi.patch(`/mensajes/${id}/status`, { leido });
      return response.data;
    } catch (error) {
      console.error('Error actualizando estado del mensaje:', error);
      throw error;
    }
  },

  /**
   * Elimina permanentemente un mensaje de contacto
   * 
   * @param id - ID del mensaje a eliminar
   * @returns Promise con el resultado de la operación
   */
  deleteMensaje: async (id: number): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await adminApi.delete(`/mensajes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error eliminando mensaje:', error);
      throw error;
    }
  }
};

export default mensajeService;
