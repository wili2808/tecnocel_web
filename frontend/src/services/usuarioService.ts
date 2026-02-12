/**
 * @file Servicio de gestión de USUARIOS DEL SISTEMA (admin/empleado)
 *
 * Maneja autenticación, autorización y CRUD de usuarios del sistema
 * Incluye gestión administrativa de clientes desde el panel de administración
 * NO maneja autenticación de clientes (ver clienteService.ts)
 */

import axios from 'axios';
import type {
  AdminUser,
  CrearUsuarioData,
  ActualizarUsuarioData,
  ActualizarClienteAdmin
} from '../types/usuario';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Constantes para almacenamiento local
const ADMIN_TOKEN_KEY = 'admin_token';
const ADMIN_USER_KEY = 'admin_user';
const ADMIN_TIMESTAMP_KEY = 'admin_timestamp';

// ============================================================================
// CONFIGURACIÓN DE AXIOS
// ============================================================================

/**
 * Instancia de axios configurada para peticiones admin
 */
const adminApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Interceptor para agregar token de autorización a todas las peticiones
 */
adminApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Interceptor para manejar errores de autenticación
 * Solo limpia tokens en 401, sin hacer redirect (AuthContext maneja la redirección)
 */
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido - limpiar sesión
      usuarioService.clearAuthToken();
    }
    return Promise.reject(error);
  }
);

export const usuarioService = {

  // ==========================================================================
  // AUTENTICACIÓN
  // ==========================================================================

  /**
   * Login de usuario administrador o empleado
   *
   * @param email - Email del usuario del sistema
   * @param password - Contraseña
   * @returns Objeto con token y datos del usuario
   * @throws Error si las credenciales son inválidas
   *
   * @example
   * const { token, usuario } = await usuarioService.loginAdmin('admin@tecnocel.com', 'password');
   */
  async loginAdmin(email: string, password: string): Promise<{ token: string; usuario: AdminUser }> {
    try {
      const response = await axios.post(`${API_URL}/usuarios/login`, {
        email,
        contrasena: password
      });

      const { token } = response.data;
      const rawUsuario = response.data.usuario;

      // Agregar campo 'rol' derivado de idRol para facilitar type guards en el frontend
      const usuario: AdminUser = {
        ...rawUsuario,
        rol: rawUsuario.idRol === 1 ? 'admin' as const : 'empleado' as const,
      };

      // Guardar en localStorage
      this.saveAuthData({ user: usuario, token });

      return { token, usuario };
    } catch (error: any) {
      throw new Error(error.response?.data?.mensaje || 'Error al iniciar sesión');
    }
  },

  /**
   * Verificar token de administrador
   *
   * @returns Datos del usuario autenticado
   * @throws Error si el token es inválido
   */
  async verifyAdminToken() {
    try {
      const response = await adminApi.get('/usuarios/me');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.mensaje || 'Token inválido');
    }
  },

  /**
   * Guardar datos de autenticación en localStorage
   *
   * @param data - Objeto con user y token
   */
  saveAuthData({ user, token }: { user: AdminUser; token: string }) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
    localStorage.setItem(ADMIN_TIMESTAMP_KEY, Date.now().toString());
  },

  /**
   * Limpiar datos de autenticación de localStorage
   */
  clearAuthToken() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    localStorage.removeItem(ADMIN_TIMESTAMP_KEY);
  },

  /**
   * Obtener token almacenado
   */
  getToken(): string | null {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  },

  /**
   * Obtener usuario almacenado
   */
  getStoredUser(): AdminUser | null {
    const userStr = localStorage.getItem(ADMIN_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Obtiene los datos de autenticación almacenados en localStorage
   * Verifica la expiración automáticamente (24 horas)
   * @returns Datos de autenticación o null si no existen o han expirado
   */
  getAuthData(): { token: string; usuario: AdminUser } | null {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    const userStr = localStorage.getItem(ADMIN_USER_KEY);
    const timestamp = localStorage.getItem(ADMIN_TIMESTAMP_KEY);

    if (!token || !userStr || !timestamp) {
      return null;
    }

    // Verificar expiración (24 horas)
    const isExpired = Date.now() - parseInt(timestamp) > 86400000;
    if (isExpired) {
      this.clearAuthToken();
      return null;
    }

    try {
      return { token, usuario: JSON.parse(userStr) as AdminUser };
    } catch {
      this.clearAuthToken();
      return null;
    }
  },

  // ==========================================================================
  // GESTIÓN DE USUARIOS DEL SISTEMA
  // ==========================================================================

  /**
   * Listar usuarios del sistema con paginación
   *
   * @param limit - Cantidad de registros por página
   * @param offset - Desplazamiento para paginación
   * @returns Lista de usuarios con total
   */
  async listarUsuarios(limit: number = 100, offset: number = 0) {
    try {
      const response = await adminApi.get('/usuarios/admin/usuarios', {
        params: { limit, offset }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.mensaje || 'Error al obtener usuarios');
    }
  },

  /**
   * Obtener información de un usuario específico
   *
   * @param id - ID del usuario
   * @returns Datos completos del usuario
   */
  async obtenerUsuario(id: number) {
    try {
      const response = await adminApi.get(`/usuarios/admin/usuarios/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.mensaje || 'Error al obtener usuario');
    }
  },

  /**
   * Crear nuevo usuario del sistema
   *
   * @param data - Datos del nuevo usuario
   * @returns Usuario creado
   */
  async crearUsuario(data: CrearUsuarioData) {
    try {
      const response = await adminApi.post('/usuarios/admin/usuarios', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.mensaje || 'Error al crear usuario');
    }
  },

  /**
   * Actualizar usuario existente
   *
   * @param id - ID del usuario
   * @param data - Datos a actualizar
   * @returns Usuario actualizado
   */
  async actualizarUsuario(id: number, data: ActualizarUsuarioData) {
    try {
      const response = await adminApi.put(`/usuarios/admin/usuarios/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.mensaje || 'Error al actualizar usuario');
    }
  },

  /**
   * Eliminar usuario del sistema
   *
   * @param id - ID del usuario a eliminar
   * @returns Mensaje de confirmación
   */
  async eliminarUsuario(id: number) {
    try {
      const response = await adminApi.delete(`/usuarios/admin/usuarios/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.mensaje || 'Error al eliminar usuario');
    }
  },

  // ==========================================================================
  // GESTIÓN DE CLIENTES (VISTA ADMINISTRATIVA)
  // ==========================================================================

  /**
   * Listar clientes de la tienda web
   *
   * @param limit - Cantidad de registros por página
   * @param offset - Desplazamiento para paginación
   * @param search - Término de búsqueda opcional
   * @returns Lista de clientes con total
   */
  async listarClientes(limit: number = 50, offset: number = 0, search?: string) {
    try {
      const response = await adminApi.get('/usuarios/admin/clientes', {
        params: { limit, offset, search }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.mensaje || 'Error al obtener clientes');
    }
  },

  /**
   * Obtener información de un cliente específico
   *
   * @param id - ID del cliente
   * @returns Datos completos del cliente
   */
  async obtenerCliente(id: number) {
    try {
      const response = await adminApi.get(`/usuarios/admin/clientes/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.mensaje || 'Error al obtener cliente');
    }
  },

  /**
   * Actualizar información de un cliente desde panel admin
   *
   * @param id - ID del cliente
   * @param data - Datos a actualizar
   * @returns Cliente actualizado
   */
  async actualizarCliente(id: number, data: ActualizarClienteAdmin) {
    try {
      const response = await adminApi.put(`/usuarios/admin/clientes/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.mensaje || 'Error al actualizar cliente');
    }
  },

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  /**
   * Verificar si el usuario es administrador
   *
   * @param user - Usuario a verificar
   * @returns true si es administrador (idRol === 1)
   */
  isAdmin(user: AdminUser | null): boolean {
    return user?.idRol === 1;
  },

  /**
   * Verificar si el usuario es empleado
   *
   * @param user - Usuario a verificar
   * @returns true si es empleado (idRol === 2)
   */
  isEmpleado(user: AdminUser | null): boolean {
    return user?.idRol === 2;
  },

  /**
   * Obtener nombre del rol
   *
   * @param id_rol - ID del rol
   * @returns Nombre descriptivo del rol
   */
  getRolName(id_rol: number): string {
    const roles: { [key: number]: string } = {
      1: 'Administrador',
      2: 'Empleado'
    };
    return roles[id_rol] || 'Desconocido';
  }
};

export default usuarioService;
