import axiosInstance from '../api/axiosConfig';
import type { Direccion } from '../types/cliente';

/**
 * Respuesta del servidor al obtener múltiples direcciones
 */
export interface DireccionResponse {
  success: boolean;
  data: Direccion[];
  count: number;
}

/**
 * Respuesta del servidor al obtener una dirección específica
 */
export interface DireccionSingleResponse {
  success: boolean;
  data: Direccion;
}

/**
 * Datos necesarios para crear una nueva dirección
 */
export interface CreateDireccionData {
  nombre_direccion: string;
  calle: string;
  numero: string;
  piso?: string;
  departamento?: string;
  barrio?: string;
  ciudad: string;
  provincia: string;
  codigo_postal?: string;
  pais?: string;
  referencia?: string;
  es_predeterminada?: boolean;
  es_facturacion?: boolean;
  telefono_contacto?: string;
}

/**
 * Servicio para manejar todas las operaciones relacionadas con direcciones
 * Incluye CRUD de direcciones, gestión de direcciones predeterminadas y facturación
 */
export const direccionService = {
  /**
   * Obtiene todas las direcciones asociadas a un cliente específico
   * @param idCliente - ID del cliente cuyas direcciones se quieren obtener
   * @returns Promise con array de direcciones del cliente
   */
  async getDirecciones(idCliente: number): Promise<Direccion[]> {
    try {
      const response = await axiosInstance.get<DireccionResponse>(
        `/direcciones/cliente/${idCliente}`
      );
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener direcciones:', error);
      throw error;
    }
  },

  /**
   * Obtiene la dirección predeterminada de un cliente
   * @param idCliente - ID del cliente
   * @returns Promise con la dirección predeterminada o null si no existe
   */
  async getDireccionPredeterminada(idCliente: number): Promise<Direccion | null> {
    try {
      const response = await axiosInstance.get<DireccionSingleResponse>(
        `/direcciones/cliente/${idCliente}/predeterminada`
      );
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener dirección predeterminada:', error);
      return null;
    }
  },

  /**
   * Obtiene una dirección específica por su ID único
   * @param id - ID único de la dirección a obtener
   * @returns Promise con los datos completos de la dirección
   */
  async getDireccionById(id: number): Promise<Direccion> {
    try {
      const response = await axiosInstance.get<DireccionSingleResponse>(`/direcciones/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener dirección:', error);
      throw error;
    }
  },

  /**
   * Crea una nueva dirección para un cliente específico
   * @param idCliente - ID del cliente para quien se crea la dirección
   * @param data - Datos de la nueva dirección
   * @returns Promise con la dirección creada
   */
  async createDireccion(idCliente: number, data: CreateDireccionData): Promise<Direccion> {
    try {
      const response = await axiosInstance.post<DireccionSingleResponse>(
        `/direcciones/cliente/${idCliente}`,
        data
      );
      return response.data.data;
    } catch (error) {
      console.error('Error al crear dirección:', error);
      throw error;
    }
  },

  /**
   * Actualiza una dirección existente
   * @param id - ID de la dirección a actualizar
   * @param data - Datos a actualizar en la dirección
   * @returns Promise con la dirección actualizada
   */
  async updateDireccion(id: number, data: Partial<CreateDireccionData>): Promise<Direccion> {
    try {
      const response = await axiosInstance.put<DireccionSingleResponse>(
        `/direcciones/${id}`,
        data
      );
      return response.data.data;
    } catch (error) {
      console.error('Error al actualizar dirección:', error);
      throw error;
    }
  },

  /**
   * Establece una dirección como predeterminada para el cliente
   * @param id - ID de la dirección a establecer como predeterminada
   * @returns Promise con la dirección actualizada
   */
  async setPredeterminada(id: number): Promise<Direccion> {
    try {
      const response = await axiosInstance.put<DireccionSingleResponse>(
        `/direcciones/${id}/predeterminada`
      );
      return response.data.data;
    } catch (error) {
      console.error('Error al establecer dirección predeterminada:', error);
      throw error;
    }
  },

  /**
   * Elimina una dirección específica del sistema
   * @param id - ID de la dirección a eliminar
   * @returns Promise que se resuelve cuando la dirección es eliminada
   */
  async deleteDireccion(id: number): Promise<void> {
    try {
      await axiosInstance.delete(`/direcciones/${id}`);
    } catch (error) {
      console.error('Error al eliminar dirección:', error);
      throw error;
    }
  }
};