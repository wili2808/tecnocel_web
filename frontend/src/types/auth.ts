// ============================================================================
// TIPOS DE AUTENTICACIÓN Y SESIÓN
// ============================================================================

import type { OverridableTokenClientConfig } from '@react-oauth/google';

// Re-exportar entidades para mantener compatibilidad con imports existentes
export type { Cliente, Direccion, Favorito } from './cliente';
export type { AdminUser } from './usuario';

// Importar para uso interno en este archivo
import type { Cliente } from './cliente';
import type { AdminUser } from './usuario';

/**
 * Tipo de usuario en el sistema
 * - cliente: Usuario final de la tienda web
 * - admin: Administrador del sistema (acceso completo)
 * - empleado: Empleado del sistema (acceso limitado)
 */
export type UserType = 'cliente' | 'admin' | 'empleado';

/**
 * Tipo union para cualquier usuario autenticado
 */
export type User = Cliente | AdminUser;

// ============================================================================
// ESTADO Y CONTEXTO DE AUTENTICACIÓN
// ============================================================================

/**
 * Estado interno del contexto de autenticación
 * Mantiene información del usuario, token y estados de operación
 * Soporta tanto clientes como usuarios del sistema (admin/empleado)
 */
export interface AuthState {
  user: User | null;
  userType: UserType | null;
  token: string | null;
  isVerifying: boolean;
  isInitialized: boolean;
  error: string | null;
}

/**
 * Métodos y propiedades del contexto de autenticación
 * Define la API pública del contexto para componentes consumidores
 * Incluye autenticación para clientes y usuarios del sistema
 */
export interface AuthContextType {
  user: User | null;
  userType: UserType | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isEmpleado: boolean;
  isCliente: boolean;
  token: string | null;
  isVerifying: boolean;
  isInitialized: boolean;
  error: string | null;
  login: (email: string, pass: string) => Promise<void>;
  loginAdmin: (email: string, pass: string) => Promise<void>;
  register: (data: RegisterData) => Promise<RegisterResult>;
  logout: () => void;
  googleLogin: (overrideConfig?: OverridableTokenClientConfig) => void;
  clearError: () => void;
}

// ============================================================================
// RESPUESTAS Y ERRORES DE AUTENTICACIÓN
// ============================================================================

/**
 * Respuesta de autenticación del servidor para endpoints de CLIENTES
 * Estructura que devuelve el backend en login, register y googleLogin
 */
export interface AuthResponse {
  token: string;
  cliente?: Cliente;
  mensaje?: string;
}

/**
 * Resultado del registro devuelto por AuthContext.register()
 * Garantiza que cliente siempre existe (a diferencia de AuthResponse donde es opcional)
 */
export interface RegisterResult {
  token: string;
  cliente: Cliente;
  mensaje?: string;
}

/**
 * Estructura de errores de autenticación
 */
export interface AuthError {
  code: string;
  message: string;
  details?: unknown;
}

// ============================================================================
// DATOS DE FORMULARIOS DE AUTENTICACIÓN
// ============================================================================

/**
 * Datos para login
 */
export interface LoginData {
  email: string;
  password: string;
}

/**
 * Datos para registro de nuevo cliente
 */
export interface RegisterData {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  confirmPassword: string;
  celular?: string;
  nitCi?: string;
}

/**
 * Datos para cambio de contraseña
 */
export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Datos para solicitar recuperación de contraseña
 */
export interface ResetPasswordData {
  email: string;
}

/**
 * Datos para establecer nueva contraseña (recuperación)
 */
export interface NewPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}
