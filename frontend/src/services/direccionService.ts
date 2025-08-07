import axiosInstance from '../api/axiosConfig';
import type { Direccion } from '../types/product';

export interface DireccionResponse {
  success: boolean;
  data: Direccion[];
  count: number;
}

export interface DireccionSingleResponse {
  success: boolean;
  data: Direccion;
}

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

export const direccionService = {
  // Obtener direcciones de un cliente
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

  // Obtener dirección predeterminada
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

  // Obtener dirección por ID
  async getDireccionById(id: number): Promise<Direccion> {
    try {
      const response = await axiosInstance.get<DireccionSingleResponse>(`/direcciones/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener dirección:', error);
      throw error;
    }
  },

  // Crear nueva dirección
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

  // Actualizar dirección
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

  // Establecer como predeterminada
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

  // Eliminar dirección
  async deleteDireccion(id: number): Promise<void> {
    try {
      await axiosInstance.delete(`/direcciones/${id}`);
    } catch (error) {
      console.error('Error al eliminar dirección:', error);
      throw error;
    }
  }
};