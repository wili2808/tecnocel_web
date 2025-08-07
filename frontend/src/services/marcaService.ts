import axiosInstance from '../api/axiosConfig';
import { Marca } from '../types/product';

export interface MarcaResponse {
  success: boolean;
  data: Marca[];
  count: number;
}

export const marcaService = {
  // Obtener todas las marcas
  async getMarcas(): Promise<Marca[]> {
    try {
      const response = await axiosInstance.get<MarcaResponse>('/marcas');
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener marcas:', error);
      throw error;
    }
  },

  // Obtener marca por ID
  async getMarcaById(id: number): Promise<Marca> {
    try {
      const response = await axiosInstance.get<{ success: boolean; data: Marca }>(`/marcas/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener marca:', error);
      throw error;
    }
  }
};