// ============================================================================
// TIPOS DE AUTENTICACIÓN Y USUARIOS
// ============================================================================

/**
 * Interfaz para Clientes - Tabla tb_clientes
 */
export interface Cliente {
  id_cliente: number;
  nombre_cliente: string;
  apellido_cliente: string;
  nit_ci_cliente: string;
  celular_cliente: string;
  email_cliente: string;
  password_hash?: string | null;
  is_web_enabled: boolean;
  last_login?: string | null;
  email_verified: boolean;
  verification_token?: string | null;
  reset_token?: string | null;
  reset_token_expires?: string | null;
  fyh_creacion: string;
  fyh_actualizacion: string;
  google_id?: string | null;
}

/**
 * Interfaz para Direcciones - Tabla tb_direcciones
 */
export interface Direccion {
  id_direccion: number;
  id_cliente: number;
  nombre_direccion: string;
  calle: string;
  numero: string;
  piso?: string | null;
  departamento?: string | null;
  barrio?: string | null;
  ciudad: string;
  provincia: string;
  codigo_postal?: string | null;
  pais: string;
  referencia?: string | null;
  es_predeterminada: boolean;
  es_facturacion: boolean;
  telefono_contacto?: string | null;
  fyh_creacion: string;
  fyh_actualizacion: string;
}

/**
 * Interfaz para Favoritos - Tabla tb_favoritos
 */
export interface Favorito {
  id_favorito: number;
  id_cliente: number;
  id_producto: number;
  fyh_creacion: string;
  producto?: {
    id_producto: number;
    nombre: string;
    descripcion: string | null;
    precio_venta: string;
    imagen_url?: string | null;
    stock: number;
  };
}

// ============================================================================
// TIPOS DE AUTENTICACIÓN
// ============================================================================

/**
 * Tipo para datos de autenticación
 */
export interface AuthData {
  token: string;
  user: Cliente;
  expires_at: string;
}

/**
 * Tipo para login
 */
export interface LoginData {
  email: string;
  password: string;
}

/**
 * Tipo para registro
 */
export interface RegisterData {
  nombre_cliente: string;
  apellido_cliente: string;
  email_cliente: string;
  celular_cliente: string;
  nit_ci_cliente: string;
  password: string;
  confirmPassword: string;
}

/**
 * Tipo para cambio de contraseña
 */
export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Tipo para recuperación de contraseña
 */
export interface ResetPasswordData {
  email: string;
}

/**
 * Tipo para nueva contraseña
 */
export interface NewPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}
