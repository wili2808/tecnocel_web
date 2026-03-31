/**
 * @file Tipos e Interfaces para Usuarios del Sistema
 *
 * Define las estructuras de datos que se transfieren entre el backend y frontend
 * para operaciones relacionadas con usuarios del sistema (administradores y empleados).
 * Estas interfaces aseguran type safety y establecen un contrato claro entre capas.
 *
 * @module UsuarioTypes
 */

// ============================================================================
// RESPONSES - Datos que se envían al frontend
// ============================================================================

/**
 * Respuesta básica de usuario del sistema
 *
 * Usado en: crearUsuario, actualizarUsuario (datos públicos sin contraseña)
 *
 * @interface UsuarioSistemaResponse
 * @example
 * {
 *   id: 1,
 *   nombres: "Juan Pérez",
 *   email: "admin@tecnocel.com",
 *   idRol: 1
 * }
 */
export interface UsuarioSistemaResponse {
  /** ID único del usuario */
  id: number;

  /** Nombres completos del usuario */
  nombres: string;

  /** Email del usuario (usado para login) */
  email: string;

  /** ID del rol asignado */
  idRol: number;

  /** Nombre del rol obtenido desde la BD (ej: "ADMINISTRADOR", "EMPLEADO", "VENDEDOR") */
  rolNombre: string;

  /** Permisos del usuario (array de nombres de permisos) */
  permisos?: string[];
}

/**
 * Respuesta de usuario con fecha de creación
 *
 * Usado en: crearUsuario (incluye timestamp de creación)
 *
 * @interface UsuarioCreacionResponse
 * @extends UsuarioSistemaResponse
 */
export interface UsuarioCreacionResponse extends UsuarioSistemaResponse {
  /** Fecha y hora de creación del usuario */
  fyhCreacion: Date;
}

/**
 * Respuesta de usuario con fecha de actualización
 *
 * Usado en: actualizarUsuario (incluye timestamp de actualización)
 *
 * @interface UsuarioActualizacionResponse
 * @extends UsuarioSistemaResponse
 */
export interface UsuarioActualizacionResponse extends UsuarioSistemaResponse {
  /** Fecha y hora de última actualización */
  fyhActualizacion: Date;
}

/**
 * Información del rol asociado a un usuario
 *
 * @interface RolInfo
 */
export interface RolInfo {
  /** ID del rol */
  id_rol: number;

  /** Nombre descriptivo del rol */
  rol: string;
}

/**
 * Item de usuario en lista (con datos de Sequelize)
 *
 * Usado en: GET /api/usuarios/admin/usuarios (array)
 * Representa la estructura directa del modelo Sequelize
 *
 * @interface UsuarioListItem
 */
export interface UsuarioListItem {
  /** ID único del usuario */
  id_usuario: number;

  /** Nombres completos */
  nombres: string;

  /** Email del usuario */
  email: string;

  /** ID del rol */
  id_rol: number;

  /** Fecha de creación */
  fyh_creacion: Date;

  /** Fecha de última actualización */
  fyh_actualizacion: Date;

  /** Información del rol (join con tabla Rol) */
  Rol?: RolInfo;
}

/**
 * Respuesta de listar usuarios del sistema
 *
 * Usado en: GET /api/usuarios/admin/usuarios
 *
 * @interface ListarUsuariosResponse
 * @example
 * {
 *   usuarios: [ ... ],
 *   total: 5,
 *   limit: 100,
 *   offset: 0
 * }
 */
export interface ListarUsuariosResponse {
  /** Array de usuarios */
  usuarios: UsuarioListItem[];

  /** Total de usuarios en el sistema */
  total: number;

  /** Límite de resultados por página */
  limit: number;

  /** Offset desde el inicio */
  offset: number;
}

/**
 * Respuesta de creación de usuario
 *
 * Usado en: POST /api/usuarios/admin/usuarios
 *
 * @interface CrearUsuarioResponse
 * @example
 * {
 *   mensaje: "Usuario creado exitosamente",
 *   usuario: {
 *     id: 5,
 *     nombres: "María González",
 *     email: "maria@tecnocel.com",
 *     idRol: 2,
 *     fyhCreacion: "2024-01-15T10:30:00.000Z"
 *   }
 * }
 */
export interface CrearUsuarioResponse {
  /** Mensaje de confirmación */
  mensaje: string;

  /** Datos del usuario creado */
  usuario: UsuarioCreacionResponse;
}

/**
 * Respuesta de actualización de usuario
 *
 * Usado en: PUT /api/usuarios/admin/usuarios/:id
 *
 * @interface ActualizarUsuarioResponse
 * @example
 * {
 *   mensaje: "Usuario actualizado exitosamente",
 *   usuario: {
 *     id: 5,
 *     nombres: "María González Rodríguez",
 *     email: "maria.gonzalez@tecnocel.com",
 *     idRol: 2,
 *     fyhActualizacion: "2024-01-20T15:45:00.000Z"
 *   }
 * }
 */
export interface ActualizarUsuarioResponse {
  /** Mensaje de confirmación */
  mensaje: string;

  /** Datos del usuario actualizado */
  usuario: UsuarioActualizacionResponse;
}

/**
 * Respuesta genérica de eliminación
 *
 * Usado en: DELETE /api/usuarios/admin/usuarios/:id
 *
 * @interface EliminarResponse
 * @example
 * {
 *   mensaje: "Usuario eliminado exitosamente"
 * }
 */
export interface EliminarResponse {
  /** Mensaje de confirmación */
  mensaje: string;
}

/**
 * Respuesta de autenticación de usuario del sistema
 *
 * Usado en: POST /api/usuarios/login
 *
 * @interface AuthUsuarioResponse
 * @example
 * {
 *   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   usuario: {
 *     id: 1,
 *     nombres: "Admin Principal",
 *     email: "admin@tecnocel.com",
 *     idRol: 1
 *   }
 * }
 */
export interface AuthUsuarioResponse {
  /** Token JWT para autenticación */
  token: string;

  /** Datos del usuario autenticado */
  usuario: UsuarioSistemaResponse;
}

// ============================================================================
// REQUESTS - Datos que se reciben del frontend
// ============================================================================

/**
 * Payload de creación de usuario
 *
 * Usado en: POST /api/usuarios/admin/usuarios
 *
 * @interface CrearUsuarioRequest
 * @example
 * {
 *   nombres: "María González",
 *   email: "maria@tecnocel.com",
 *   password: "Password123!",
 *   id_rol: 2
 * }
 */
export interface CrearUsuarioRequest {
  /** Nombres completos del usuario (requerido) */
  nombres: string;

  /** Email único del usuario (requerido) */
  email: string;

  /** Contraseña en texto plano (será hasheada, requerido) */
  password: string;

  /** ID del rol a asignar (requerido) */
  id_rol: number;
}

/**
 * Payload de actualización de usuario
 *
 * Usado en: PUT /api/usuarios/admin/usuarios/:id
 * Todos los campos son opcionales (actualización parcial)
 *
 * @interface ActualizarUsuarioRequest
 * @example
 * {
 *   nombres: "María González Rodríguez",
 *   email: "maria.gonzalez@tecnocel.com"
 * }
 */
export interface ActualizarUsuarioRequest {
  /** Nuevo nombre (opcional) */
  nombres?: string;

  /** Nuevo email (opcional) */
  email?: string;

  /** Nueva contraseña (opcional, será hasheada) */
  password?: string;

  /** Nuevo rol (opcional, solo admin puede cambiar) */
  id_rol?: number;
}

/**
 * Payload de login de usuario del sistema
 *
 * Usado en: POST /api/usuarios/login
 *
 * @interface LoginUsuarioRequest
 * @example
 * {
 *   email: "admin@tecnocel.com",
 *   password: "MiPassword123"
 * }
 */
export interface LoginUsuarioRequest {
  /** Email del usuario (requerido) */
  email: string;

  /** Contraseña en texto plano (requerido) */
  password: string;
}

// ============================================================================
// PAYLOAD DE JWT - Estructura del token decodificado
// ============================================================================

/**
 * Payload del JWT para usuarios del sistema
 *
 * Estructura que se codifica en el token JWT
 *
 * @interface UsuarioJWTPayload
 * @example
 * {
 *   sub: 1,
 *   role: "admin",
 *   idRol: 1,
 *   iat: 1705932000,
 *   exp: 1705960800
 * }
 */
export interface UsuarioJWTPayload {
  /** Subject: ID del usuario */
  sub: number;

  /** Rol del usuario en string */
  role: 'admin' | 'gerente';

  /** ID del rol */
  idRol: number;

  /** Issued at: timestamp de creación */
  iat?: number;

  /** Expiration: timestamp de expiración */
  exp?: number;
}

// NOTA: La estructura de req.usuario para usuario del sistema (UsuarioSession)
// está definida en ./express.d.ts para evitar duplicación
