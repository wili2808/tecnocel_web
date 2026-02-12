// ============================================================================
// TIPOS DE USUARIOS DEL SISTEMA (ADMIN/EMPLEADO)
// ============================================================================

/**
 * Respuesta de usuario del sistema (coincide con UsuarioSistemaResponse del backend)
 * Estructura normalizada que viene del login y operaciones CRUD
 */
export interface AdminUser {
  id: number;
  nombres: string;
  email: string;
  idRol: number;
  rol?: 'admin' | 'empleado';
}

/**
 * Item de usuario en listado (raw de Sequelize)
 * Usado en: GET /api/usuarios/admin/usuarios
 */
export interface UsuarioListItem {
  id_usuario: number;
  nombres: string;
  email: string;
  id_rol: number;
  fyh_creacion: Date;
  fyh_actualizacion: Date;
  Rol?: {
    id_rol: number;
    rol: string;
  };
}

/**
 * Respuesta de listar usuarios
 */
export interface ListarUsuariosResponse {
  usuarios: UsuarioListItem[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Datos para crear nuevo usuario del sistema
 */
export interface CrearUsuarioData {
  nombres: string;
  email: string;
  password: string;
  id_rol: number;
}

/**
 * Datos para actualizar usuario del sistema
 */
export interface ActualizarUsuarioData {
  nombres?: string;
  email?: string;
  password?: string;
  id_rol?: number;
}

// ============================================================================
// TIPOS PARA GESTIÓN DE CLIENTES DESDE PANEL ADMIN
// ============================================================================

/**
 * Item de cliente en listado admin (raw de Sequelize)
 * Usado en: GET /api/usuarios/admin/clientes
 */
export interface ClienteListItem {
  id_cliente: number;
  nombre_cliente: string;
  apellido_cliente: string;
  email_cliente: string;
  celular_cliente: string | null;
  nit_ci_cliente: string | null;
  is_web_enabled: boolean;
  email_verified: boolean;
  last_login: Date | null;
  fyh_creacion: Date;
  fyh_actualizacion: Date;
}

/**
 * Respuesta de listar clientes (admin)
 */
export interface ListarClientesResponse {
  clientes: ClienteListItem[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Respuesta de cliente normalizada para admin
 * Usado en: PUT /api/usuarios/admin/clientes/:id
 */
export interface ClienteAdminResponse {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  celular: string | null;
  nitCi: string | null;
  isWebEnabled: boolean;
  emailVerified: boolean;
}

/**
 * Datos para actualizar cliente desde panel admin
 */
export interface ActualizarClienteAdmin {
  nombre_cliente?: string;
  apellido_cliente?: string;
  celular_cliente?: string;
  nit_ci_cliente?: string;
  is_web_enabled?: boolean;
  email_verified?: boolean;
}
