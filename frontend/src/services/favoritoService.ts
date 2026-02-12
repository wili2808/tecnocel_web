import axiosInstance from '../api/axiosConfig';
import type { Favorito } from '../types/cliente';

/**
 * Respuesta del servidor al obtener favoritos con paginación
 */
export interface FavoritoResponse {
  success: boolean;
  data: Favorito[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    pages: number;
  };
}

/**
 * Respuesta del servidor al alternar el estado de favorito
 */
export interface FavoritoToggleResponse {
  success: boolean;
  message: string;
  action: 'added' | 'removed';
  esFavorito: boolean;
  data?: any;
}

/**
 * Respuesta del servidor con estadísticas de favoritos
 */
export interface EstadisticasFavoritosResponse {
  success: boolean;
  data: {
    total: number;
    porCategoria: { [key: string]: number };
  };
}

/**
 * Servicio para manejar todas las operaciones relacionadas con favoritos
 * Incluye gestión de favoritos, verificación de estado y estadísticas
 */
export const favoritoService = {
  /**
   * Obtiene la lista de productos favoritos de un cliente específico
   * @param idCliente - ID del cliente cuyos favoritos se quieren obtener
   * @param limit - Número máximo de favoritos a retornar (por defecto: 20)
   * @param offset - Número de favoritos a omitir para paginación (por defecto: 0)
   * @returns Promise con la lista paginada de favoritos
   */
  async getFavoritos(idCliente: number, limit = 20, offset = 0): Promise<FavoritoResponse> {
    try {
      const response = await axiosInstance.get<FavoritoResponse>(
        `/favoritos/cliente/${idCliente}?limit=${limit}&offset=${offset}`
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener favoritos:', error);
      throw error;
    }
  },

  /**
   * Verifica si un producto específico está en la lista de favoritos de un cliente
   * @param idCliente - ID del cliente
   * @param idProducto - ID del producto a verificar
   * @returns Promise con true si es favorito, false en caso contrario
   */
  async verificarFavorito(idCliente: number, idProducto: number): Promise<boolean> {
    try {
      const response = await axiosInstance.get<{ success: boolean; esFavorito: boolean }>(
        `/favoritos/cliente/${idCliente}/producto/${idProducto}`
      );
      return response.data.esFavorito;
    } catch (error) {
      console.error('Error al verificar favorito:', error);
      return false;
    }
  },

  /**
   * Alterna el estado de favorito de un producto (agregar/quitar)
   * @param idCliente - ID del cliente
   * @param idProducto - ID del producto a alternar
   * @returns Promise con la confirmación de la acción realizada
   */
  async toggleFavorito(idCliente: number, idProducto: number): Promise<FavoritoToggleResponse> {
    try {
      const response = await axiosInstance.put<FavoritoToggleResponse>(
        `/favoritos/cliente/${idCliente}/producto/${idProducto}/toggle`
      );
      return response.data;
    } catch (error) {
      console.error('Error al alternar favorito:', error);
      throw error;
    }
  },

  /**
   * Agrega un producto específico a la lista de favoritos de un cliente
   * @param idCliente - ID del cliente
   * @param idProducto - ID del producto a agregar a favoritos
   * @returns Promise con la confirmación de la operación
   */
  async addFavorito(idCliente: number, idProducto: number): Promise<any> {
    try {
      const response = await axiosInstance.post(`/favoritos/cliente/${idCliente}`, {
        id_producto: idProducto
      });
      return response.data;
    } catch (error) {
      console.error('Error al agregar favorito:', error);
      throw error;
    }
  },

  /**
   * Remueve un producto específico de la lista de favoritos de un cliente
   * @param idCliente - ID del cliente
   * @param idProducto - ID del producto a remover de favoritos
   * @returns Promise con la confirmación de la operación
   */
  async removeFavorito(idCliente: number, idProducto: number): Promise<any> {
    try {
      const response = await axiosInstance.delete(
        `/favoritos/cliente/${idCliente}/producto/${idProducto}`
      );
      return response.data;
    } catch (error) {
      console.error('Error al remover favorito:', error);
      throw error;
    }
  },

  /**
   * Obtiene estadísticas de favoritos de un cliente específico
   * Incluye total de favoritos y distribución por categorías
   * @param idCliente - ID del cliente
   * @returns Promise con las estadísticas de favoritos
   */
  async getEstadisticas(idCliente: number): Promise<EstadisticasFavoritosResponse> {
    try {
      const response = await axiosInstance.get<EstadisticasFavoritosResponse>(
        `/favoritos/cliente/${idCliente}/estadisticas`
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas de favoritos:', error);
      throw error;
    }
  }
};