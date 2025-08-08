import axiosInstance from '../api/axiosConfig';
import type { Marca } from '../types/product';

const marcaService = {
  // Obtener todas las marcas
  getMarcas: async (): Promise<Marca[]> => {
    try {
      const response = await axiosInstance.get('/almacen/marcas');
      return response.data;
    } catch (error) {
      console.error('Error fetching brands:', error);
      throw error;
    }
  },

  // Obtener una marca específica por ID
  getMarcaById: async (id: number): Promise<Marca> => {
    try {
      const response = await axiosInstance.get(`/almacen/marcas/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching brand by ID:', error);
      throw error;
    }
  }
};

export default marcaService;