import adminApi from '../api/axiosAdminConfig';
import type { Respuesta } from './commentService';

/**
 * Servicio para operaciones de moderación y respuesta oficial de administradores
 * Usa adminApi (token de admin) para todas las operaciones
 */
const adminCommentService = {
  /**
   * Crea una respuesta oficial del equipo a un comentario
   */
  crearRespuestaAdmin: async (idComentario: number, contenido: string): Promise<Respuesta> => {
    try {
      const response = await adminApi.post(`/comentarios/${idComentario}/respuestas/admin`, { contenido });
      return response.data.datos.respuesta;
    } catch (error) {
      console.error('Error creating admin reply:', error);
      throw error;
    }
  },

  /**
   * Cambia el estado de un comentario (activo/oculto/eliminado)
   */
  moderarComentario: async (idComentario: number, estado: 'activo' | 'oculto' | 'eliminado'): Promise<void> => {
    try {
      await adminApi.patch(`/comentarios/${idComentario}/moderar`, { estado });
    } catch (error) {
      console.error('Error moderating comment:', error);
      throw error;
    }
  },

  /**
   * Cambia el estado de una respuesta (activo/oculto/eliminado)
   */
  moderarRespuesta: async (idRespuesta: number, estado: 'activo' | 'oculto' | 'eliminado'): Promise<void> => {
    try {
      await adminApi.patch(`/comentarios/respuestas/${idRespuesta}/moderar`, { estado });
    } catch (error) {
      console.error('Error moderating reply:', error);
      throw error;
    }
  },

  /**
   * Elimina cualquier respuesta (acción de admin)
   */
  eliminarRespuestaAdmin: async (idRespuesta: number): Promise<void> => {
    try {
      await adminApi.delete(`/comentarios/respuestas/${idRespuesta}/admin`);
    } catch (error) {
      console.error('Error deleting reply as admin:', error);
      throw error;
    }
  },

  /**
   * Elimina la propia respuesta del usuario del sistema (sin permiso requerido)
   * Solo permite eliminar si el usuario actual es owner de la respuesta
   */
  eliminarRespuestaPropia: async (idRespuesta: number): Promise<void> => {
    try {
      await adminApi.delete(`/comentarios/respuestas/${idRespuesta}/propia`);
    } catch (error) {
      console.error('Error deleting own reply:', error);
      throw error;
    }
  },

  /**
   * Elimina el propio comentario del usuario del sistema (sin permiso requerido)
   * Solo permite eliminar si el usuario actual es owner del comentario
   */
  eliminarComentarioPropio: async (idComentario: number): Promise<void> => {
    try {
      await adminApi.delete(`/comentarios/${idComentario}/propio`);
    } catch (error) {
      console.error('Error deleting own comment:', error);
      throw error;
    }
  },

  /**
   * Elimina cualquier comentario (requiere permiso eliminar_comentarios)
   */
  eliminarComentarioAdmin: async (idComentario: number): Promise<void> => {
    try {
      await adminApi.delete(`/comentarios/${idComentario}/admin`);
    } catch (error) {
      console.error('Error deleting comment as admin:', error);
      throw error;
    }
  }
};

export default adminCommentService;
