import axiosInstance from '../api/axiosConfig';
import type { Product, Oferta } from '../types/product';

export interface OfertaResponse {
  success: boolean;
  data: Oferta[];
  count: number;
}

export interface ProductosOfertaResponse {
  success: boolean;
  data: Product[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    pages: number;
  };
}

export const ofertaService = {
  // Obtener ofertas activas
  async getOfertasActivas(): Promise<Oferta[]> {
    try {
      const response = await axiosInstance.get<OfertaResponse>('/ofertas/activas');
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener ofertas activas:', error);
      throw error;
    }
  },

  // Obtener productos en oferta
  async getProductosEnOferta(limit = 20, offset = 0): Promise<ProductosOfertaResponse> {
    try {
      const response = await axiosInstance.get<ProductosOfertaResponse>(
        `/ofertas/productos?limit=${limit}&offset=${offset}`
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener productos en oferta:', error);
      throw error;
    }
  }
};