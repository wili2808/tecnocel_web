/**
 * @file Servicio de gestión de proveedores — Panel Admin
 *
 * Maneja todas las operaciones del panel administrativo relacionadas con proveedores:
 * - Listar proveedores (con búsqueda)
 * - Obtener detalle de proveedor
 * - Crear proveedor
 * - Actualizar proveedor
 *
 * Usa adminApi (axiosAdminConfig) que inyecta automáticamente el Bearer token
 * del usuario del sistema (admin/gerente/vendedor).
 */

import adminApi from '../api/axiosAdminConfig';
import type { ProveedorListItem, CreateProveedorData, UpdateProveedorData } from '../types';

export const proveedorAdminService = {
  /**
   * Obtiene listado de proveedores con búsqueda opcional
   */
  async listarProveedores(search?: string): Promise<{
    success: boolean;
    data: ProveedorListItem[];
    count: number;
  }> {
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;

      const response = await adminApi.get('/proveedores', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al obtener proveedores');
    }
  },

  /**
   * Obtiene detalle de un proveedor específico
   */
  async obtenerProveedor(idProveedor: number): Promise<{
    success: boolean;
    data: ProveedorListItem;
  }> {
    try {
      const response = await adminApi.get(`/proveedores/${idProveedor}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al obtener proveedor');
    }
  },

  /**
   * Crea un nuevo proveedor
   */
  async crearProveedor(data: CreateProveedorData): Promise<{
    success: boolean;
    data: ProveedorListItem;
  }> {
    try {
      const response = await adminApi.post('/proveedores', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al crear proveedor');
    }
  },

  /**
   * Actualiza información de un proveedor
   */
  async actualizarProveedor(idProveedor: number, data: UpdateProveedorData): Promise<{
    success: boolean;
    data: ProveedorListItem;
  }> {
    try {
      const response = await adminApi.put(`/proveedores/${idProveedor}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Error al actualizar proveedor');
    }
  }
};
