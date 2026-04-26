import adminApi from '../api/axiosAdminConfig';
import type { PermisosPorModulo, PermisosPorRolResponse, RolesConPermisos, SyncPermisosRequest } from '../types/permiso';

const permisoService = {

  async getAll(): Promise<PermisosPorModulo> {
    try {
      const response = await adminApi.get('/permisos');
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener permisos:', error);
      throw error;
    }
  },

  async getPermisosPorRol(idRol: number): Promise<PermisosPorRolResponse> {
    try {
      const response = await adminApi.get(`/permisos/rol/${idRol}`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener permisos del rol:', error);
      throw error;
    }
  },

  async getPermisosConEstado(idRol: number): Promise<{ permisos: { id_permiso: number; nombre: string; descripcion: string | null; modulo: string; accion: string }[]; asignados: number[] }> {
    try {
      const response = await adminApi.get(`/permisos/status?id_rol=${idRol}`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener estado de permisos:', error);
      throw error;
    }
  },

  async getRoles(): Promise<RolesConPermisos[]> {
    try {
      const response = await adminApi.get('/permisos/roles');
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener roles:', error);
      throw error;
    }
  },

  async syncPermisos(data: SyncPermisosRequest): Promise<void> {
    try {
      await adminApi.put('/permisos/sync', data);
    } catch (error) {
      console.error('Error al sincronizar permisos:', error);
      throw error;
    }
  }
};

export default permisoService;