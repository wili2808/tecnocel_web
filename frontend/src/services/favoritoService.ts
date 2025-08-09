import axiosInstance from '../api/axiosConfig';
import type { Favorito } from '../types/product';

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

export interface FavoritoToggleResponse {
  success: boolean;
  message: string;
  action: 'added' | 'removed';
  esFavorito: boolean;
  data?: any;
}

export interface EstadisticasFavoritosResponse {
  success: boolean;
  data: {
    total: number;
    porCategoria: { [key: string]: number };
  };
}

export const favoritoService = {
  // Obtener favoritos de un cliente
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

  // Verificar si un producto es favorito
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

  // Alternar favorito (agregar/quitar)
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

  // Agregar a favoritos
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

  // Remover de favoritos
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

  // Obtener estadísticas de favoritos
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