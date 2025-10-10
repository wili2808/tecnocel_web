import axiosInstance from '../api/axiosConfig';
import type { Marca } from '../types';

/**
 * Servicio para manejar todas las operaciones relacionadas con marcas de productos
 * Incluye consulta de marcas disponibles y obtención de información específica
 */
const marcaService = {
  /**
   * Obtiene todas las marcas disponibles en el sistema
   * Retorna la lista completa de marcas para filtros y selección
   * @returns Promise con array de todas las marcas disponibles
   */
  getMarcas: async (): Promise<Marca[]> => {
    try {
      const response = await axiosInstance.get('/almacen/marcas');
      return response.data;
    } catch (error) {
      console.error('Error fetching brands:', error);
      throw error;
    }
  },

  /**
   * Obtiene una marca específica por su ID único
   * Útil para mostrar información detallada de una marca particular
   * @param id - ID único de la marca a obtener
   * @returns Promise con los datos completos de la marca
   */
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