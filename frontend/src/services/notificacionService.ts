import axiosInstance from '../api/axiosConfig';
import type { NotificacionesResponse, NoLeidasResponse } from '../types/notificacion';

/**
 * Servicio para manejar todas las operaciones relacionadas con notificaciones de clientes
 */
export const notificacionService = {
  /**
   * Obtiene la lista paginada de notificaciones del cliente autenticado
   * @param pagina - Número de página (por defecto: 1)
   * @param limite - Cantidad de notificaciones por página (por defecto: 20)
   * @returns Promise con la lista paginada de notificaciones
   */
  async getNotificaciones(pagina = 1, limite = 20): Promise<NotificacionesResponse> {
    const response = await axiosInstance.get<NotificacionesResponse>(
      `/notificaciones?pagina=${pagina}&limite=${limite}`
    );
    return response.data;
  },

  /**
   * Obtiene la cantidad de notificaciones no leídas del cliente autenticado
   * @returns Promise con el conteo de notificaciones no leídas
   */
  async getNoLeidas(): Promise<NoLeidasResponse> {
    const response = await axiosInstance.get<NoLeidasResponse>('/notificaciones/no-leidas');
    return response.data;
  },

  /**
   * Marca una notificación específica como leída
   * @param id - ID de la notificación a marcar como leída
   */
  async marcarLeida(id: number): Promise<void> {
    await axiosInstance.put(`/notificaciones/${id}/leer`);
  },

  /**
   * Marca todas las notificaciones del cliente como leídas
   */
  async marcarTodasLeidas(): Promise<void> {
    await axiosInstance.put('/notificaciones/leer-todas');
  },

  /**
   * Elimina una notificación específica del cliente
   * @param id - ID de la notificación a eliminar
   */
  async eliminarNotificacion(id: number): Promise<void> {
    await axiosInstance.delete(`/notificaciones/${id}`);
  },

  /**
   * Elimina todas las notificaciones del cliente autenticado
   */
  async eliminarTodas(): Promise<void> {
    await axiosInstance.delete('/notificaciones/eliminar-todas');
  },
};
