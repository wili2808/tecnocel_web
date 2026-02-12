/**
 * @file Tipos e Interfaces para Cliente
 *
 * Define las estructuras de datos que se transfieren entre el backend y frontend
 * para operaciones relacionadas con clientes. Estas interfaces aseguran type safety
 * y establecen un contrato claro entre capas.
 *
 * @module ClienteTypes
 */

// ============================================================================
// RESPONSES - Datos que se envían al frontend
// ============================================================================

/**
 * Respuesta básica de cliente (datos públicos)
 *
 * Usado en: login, register, verifyToken, actualizarPerfil
 *
 * @interface ClienteResponse
 * @example
 * {
 *   id: 5,
 *   nombre: "Juan",
 *   apellido: "Pérez",
 *   email: "juan@example.com",
 *   celular: "70123456",
 *   nitCi: "1234567"
 * }
 */
export interface ClienteResponse {
  /** ID único del cliente */
  id: number;

  /** Nombre del cliente */
  nombre: string;

  /** Apellido del cliente */
  apellido: string;

  /** Email del cliente (usado para login) */
  email: string;

  /** Número de celular (opcional) */
  celular: string | null;

  /** NIT o Cédula de Identidad (opcional) */
  nitCi: string | null;
}

/**
 * Respuesta completa de perfil de cliente
 *
 * Usado en: obtenerPerfil (incluye metadatos adicionales)
 * Extiende ClienteResponse con información de auditoría
 *
 * @interface ClientePerfilResponse
 * @extends ClienteResponse
 * @example
 * {
 *   id: 5,
 *   nombre: "Juan",
 *   apellido: "Pérez",
 *   email: "juan@example.com",
 *   celular: "70123456",
 *   nitCi: "1234567",
 *   miembroDesde: "2025-01-15T10:30:00.000Z",
 *   ultimoIngreso: "2025-01-22T14:20:00.000Z",
 *   isGoogleAccount: true,
 *   emailVerificado: true
 * }
 */
export interface ClientePerfilResponse extends ClienteResponse {
  /** Fecha de registro del cliente */
  miembroDesde: Date;

  /** Fecha del último login */
  ultimoIngreso: Date | null;

  /** Indica si la cuenta fue creada con Google OAuth */
  isGoogleAccount: boolean;

  /** Indica si el email fue verificado */
  emailVerificado: boolean;
}

/**
 * Respuesta de autenticación exitosa (login/register)
 *
 * Usado en: login, register, loginWithGoogle
 *
 * @interface AuthResponse
 * @example
 * {
 *   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   cliente: {
 *     id: 5,
 *     nombre: "Juan",
 *     apellido: "Pérez",
 *     email: "juan@example.com",
 *     celular: "70123456",
 *     nitCi: "1234567"
 *   }
 * }
 */
export interface AuthResponse {
  /** Token JWT para autenticación */
  token: string;

  /** Datos del cliente autenticado */
  cliente: ClienteResponse;
}

/**
 * Respuesta de registro exitoso
 *
 * Usado en: POST /api/clientes/register
 *
 * @interface RegistroResponse
 * @extends AuthResponse
 * @example
 * {
 *   mensaje: "Registro exitoso. ¡Bienvenido a TecnoCell!",
 *   token: "eyJhbGc...",
 *   cliente: { ... }
 * }
 */
export interface RegistroResponse extends AuthResponse {
  /** Mensaje de bienvenida */
  mensaje: string;
}

/**
 * Respuesta de verificación de token
 *
 * Usado en: GET /api/clientes/verify-token
 *
 * @interface VerifyTokenResponse
 * @example
 * {
 *   cliente: {
 *     id: 5,
 *     nombre: "Juan",
 *     apellido: "Pérez",
 *     email: "juan@example.com",
 *     celular: "70123456",
 *     nitCi: "1234567"
 *   }
 * }
 */
export interface VerifyTokenResponse {
  /** Datos del cliente autenticado */
  cliente: ClienteResponse;
}

/**
 * Respuesta de obtener perfil completo
 *
 * Usado en: GET /api/clientes/perfil
 *
 * @interface GetPerfilResponse
 * @example
 * {
 *   cliente: {
 *     id: 5,
 *     nombre: "Juan",
 *     apellido: "Pérez",
 *     email: "juan@example.com",
 *     celular: "70123456",
 *     nitCi: "1234567",
 *     miembroDesde: "2025-01-15T10:30:00.000Z",
 *     ultimoIngreso: "2025-01-22T14:20:00.000Z",
 *     isGoogleAccount: true,
 *     emailVerificado: true
 *   }
 * }
 */
export interface GetPerfilResponse {
  /** Datos completos del perfil del cliente */
  cliente: ClientePerfilResponse;
}

/**
 * Respuesta de actualización de perfil
 *
 * Usado en: PUT /api/clientes/perfil
 *
 * @interface UpdatePerfilResponse
 * @example
 * {
 *   mensaje: "Perfil actualizado exitosamente",
 *   cliente: {
 *     id: 5,
 *     nombre: "Juan Carlos",
 *     apellido: "Pérez",
 *     email: "juan@example.com",
 *     celular: "70987654",
 *     nitCi: "1234567"
 *   }
 * }
 */
export interface UpdatePerfilResponse {
  /** Mensaje de confirmación */
  mensaje: string;

  /** Datos actualizados del cliente */
  cliente: ClienteResponse;
}

/**
 * Respuesta de cliente para administradores (datos extendidos)
 *
 * Usado en: GET /api/usuarios/admin/clientes/:id
 *
 * @interface ClienteAdminResponse
 * @example
 * {
 *   id: 5,
 *   nombre: "Juan",
 *   apellido: "Pérez",
 *   email: "juan@example.com",
 *   celular: "70123456",
 *   nitCi: "1234567",
 *   isWebEnabled: true,
 *   emailVerified: true
 * }
 */
export interface ClienteAdminResponse extends ClienteResponse {
  /** Indica si el cliente tiene acceso web habilitado */
  isWebEnabled: boolean;

  /** Indica si el email fue verificado */
  emailVerified: boolean;
}

/**
 * Respuesta de actualización de cliente por admin
 *
 * Usado en: PUT /api/usuarios/admin/clientes/:id
 *
 * @interface UpdateClienteAdminResponse
 * @example
 * {
 *   mensaje: "Cliente actualizado exitosamente",
 *   cliente: {
 *     id: 5,
 *     nombre: "Juan",
 *     apellido: "Pérez",
 *     email: "juan@example.com",
 *     celular: "70123456",
 *     nitCi: "1234567",
 *     isWebEnabled: true,
 *     emailVerified: true
 *   }
 * }
 */
export interface UpdateClienteAdminResponse {
  /** Mensaje de confirmación */
  mensaje: string;

  /** Datos actualizados del cliente */
  cliente: ClienteAdminResponse;
}

/**
 * Item de cliente en lista (admin)
 *
 * Usado en: GET /api/usuarios/admin/clientes (array)
 *
 * @interface ClienteListItem
 * @example
 * {
 *   id_cliente: 5,
 *   nombre_cliente: "Juan",
 *   apellido_cliente: "Pérez",
 *   email_cliente: "juan@example.com",
 *   celular_cliente: "70123456",
 *   nit_ci_cliente: "1234567",
 *   is_web_enabled: true,
 *   email_verified: true,
 *   last_login: "2025-01-22T14:20:00.000Z",
 *   fyh_creacion: "2025-01-15T10:30:00.000Z",
 *   fyh_actualizacion: "2025-01-22T14:20:00.000Z"
 * }
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
 *
 * Usado en: GET /api/usuarios/admin/clientes
 *
 * @interface ListarClientesResponse
 * @example
 * {
 *   clientes: [ ... ],
 *   total: 150,
 *   limit: 50,
 *   offset: 0
 * }
 */
export interface ListarClientesResponse {
  /** Array de clientes */
  clientes: ClienteListItem[];

  /** Total de clientes que coinciden con el filtro */
  total: number;

  /** Límite de resultados por página */
  limit: number;

  /** Offset desde el inicio */
  offset: number;
}

// ============================================================================
// REQUESTS - Datos que se reciben del frontend
// ============================================================================

/**
 * Payload de registro de cliente
 *
 * Usado en: POST /api/clientes/register
 *
 * @interface RegistroClienteRequest
 * @example
 * {
 *   nombre_cliente: "Juan",
 *   apellido_cliente: "Pérez",
 *   email_cliente: "juan@example.com",
 *   contrasena: "MiPassword123",
 *   celular_cliente: "70123456",
 *   nit_ci_cliente: "1234567"
 * }
 */
export interface RegistroClienteRequest {
  /** Nombre del cliente (requerido, 2-100 chars, solo letras) */
  nombre_cliente: string;

  /** Apellido del cliente (requerido, 2-100 chars, solo letras) */
  apellido_cliente: string;

  /** Email único del cliente (requerido, email válido) */
  email_cliente: string;

  /** Contraseña (requerido, 8+ chars, letras + números) */
  contrasena: string;

  /** Celular (opcional, 8-15 dígitos) */
  celular_cliente?: string;

  /** NIT o CI (opcional) */
  nit_ci_cliente?: string;
}

/**
 * Payload de login de cliente
 *
 * Usado en: POST /api/clientes/login
 *
 * @interface LoginClienteRequest
 * @example
 * {
 *   email_cliente: "juan@example.com",
 *   contrasena: "MiPassword123"
 * }
 */
export interface LoginClienteRequest {
  /** Email del cliente (requerido) */
  email_cliente: string;

  /** Contraseña en texto plano (será hasheada, requerido) */
  contrasena: string;
}

/**
 * Payload de login con Google
 *
 * Usado en: POST /api/clientes/google-login
 *
 * @interface GoogleLoginRequest
 * @example
 * {
 *   access_token: "ya29.a0AfH6SMB..."
 * }
 */
export interface GoogleLoginRequest {
  /** Token de acceso de Google OAuth (requerido) */
  access_token: string;
}

/**
 * Payload de recuperación de contraseña
 *
 * Usado en: POST /api/clientes/forgot-password
 *
 * @interface ForgotPasswordRequest
 * @example
 * {
 *   email_cliente: "juan@example.com"
 * }
 */
export interface ForgotPasswordRequest {
  /** Email del cliente (requerido) */
  email_cliente: string;
}

/**
 * Payload de restablecimiento de contraseña
 *
 * Usado en: POST /api/clientes/reset-password
 *
 * @interface ResetPasswordRequest
 * @example
 * {
 *   reset_token: "abc-123-def-456",
 *   nueva_contrasena: "NuevaPassword456"
 * }
 */
export interface ResetPasswordRequest {
  /** Token de recuperación (UUID, requerido) */
  reset_token: string;

  /** Nueva contraseña (requerido) */
  nueva_contrasena: string;
}

/**
 * Payload de actualización de perfil
 *
 * Usado en: PUT /api/clientes/perfil
 * Todos los campos son opcionales (actualización parcial)
 *
 * @interface ActualizarPerfilRequest
 * @example
 * {
 *   nombre_cliente: "Juan Carlos",
 *   celular_cliente: "70987654"
 * }
 */
export interface ActualizarPerfilRequest {
  /** Nuevo nombre (opcional) */
  nombre_cliente?: string;

  /** Nuevo apellido (opcional) */
  apellido_cliente?: string;

  /** Nuevo celular (opcional) */
  celular_cliente?: string;

  /** Nuevo NIT/CI (opcional) */
  nit_ci_cliente?: string;
}

/**
 * Payload de cambio de contraseña
 *
 * Usado en: PUT /api/clientes/cambiar-contrasena
 *
 * @interface CambiarContrasenaRequest
 * @example
 * {
 *   contrasena_actual: "MiPassword123",
 *   contrasena_nueva: "NuevaPassword456"
 * }
 */
export interface CambiarContrasenaRequest {
  /** Contraseña actual (para verificación, requerido) */
  contrasena_actual: string;

  /** Nueva contraseña (requerido) */
  contrasena_nueva: string;
}

/**
 * Payload de actualización de cliente por admin
 *
 * Usado en: PUT /api/usuarios/admin/clientes/:id
 * Todos los campos son opcionales
 *
 * @interface ActualizarClienteAdminRequest
 * @example
 * {
 *   nombre_cliente: "Juan Carlos",
 *   celular_cliente: "70987654",
 *   is_web_enabled: true
 * }
 */
export interface ActualizarClienteAdminRequest {
  /** Nuevo nombre (opcional) */
  nombre_cliente?: string;

  /** Nuevo apellido (opcional) */
  apellido_cliente?: string;

  /** Nuevo celular (opcional) */
  celular_cliente?: string;

  /** Nuevo NIT/CI (opcional) */
  nit_ci_cliente?: string;

  /** Habilitar/deshabilitar acceso web (opcional, admin solo) */
  is_web_enabled?: boolean;

  /** Marcar email como verificado/no verificado (opcional, admin solo) */
  email_verified?: boolean;
}

// ============================================================================
// PAYLOAD DE JWT - Estructura del token decodificado
// ============================================================================

/**
 * Payload del JWT para clientes
 *
 * Estructura que se codifica en el token JWT
 *
 * @interface ClienteJWTPayload
 * @example
 * {
 *   sub: 5,
 *   role: "cliente",
 *   iat: 1705932000,
 *   exp: 1705960800
 * }
 */
export interface ClienteJWTPayload {
  /** Subject: ID del cliente */
  sub: number;

  /** Rol del usuario */
  role: 'cliente';

  /** Issued at: timestamp de creación */
  iat?: number;

  /** Expiration: timestamp de expiración */
  exp?: number;
}

// NOTA: La estructura de req.usuario para cliente (ClienteSession)
// está definida en ./express.d.ts para evitar duplicación