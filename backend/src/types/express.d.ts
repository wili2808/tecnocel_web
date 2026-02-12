/**
 * @file Extensión de tipos de Express
 *
 * Extiende los tipos de Express para incluir propiedades personalizadas
 * agregadas por middleware (como req.usuario).
 *
 * Este archivo permite que TypeScript reconozca las propiedades adicionales
 * sin errores de compilación.
 *
 * @module ExpressTypes
 */

// ============================================================================
// INTERFACES DE SESIÓN (req.usuario)
// ============================================================================

/**
 * Estructura de req.usuario para clientes web
 * Adjuntado por middleware verificarTokenCliente
 *
 * @interface ClienteSession
 * @example
 * {
 *   id: 5,
 *   nombre: "Juan",
 *   email: "juan@example.com"
 * }
 */
export interface ClienteSession {
  /** ID del cliente */
  id: number;

  /** Nombre del cliente */
  nombre: string;

  /** Email del cliente */
  email: string;
}

/**
 * Estructura de req.usuario para usuarios del sistema (admin/empleado)
 * Adjuntado por middleware verificarToken
 *
 * @interface UsuarioSession
 * @example
 * {
 *   id: 1,
 *   nombres: "Admin Principal",
 *   email: "admin@tecnocel.com",
 *   idRol: 1
 * }
 */
export interface UsuarioSession {
  /** ID del usuario del sistema */
  id: number;

  /** Nombre completo del usuario */
  nombres: string;

  /** Email del usuario */
  email: string;

  /** ID del rol (1: Admin, 2: Empleado, etc.) */
  idRol: number;
}

// ============================================================================
// EXTENSIÓN GLOBAL DE EXPRESS
// ============================================================================

declare global {
  namespace Express {
    /**
     * Extensión del Request de Express
     *
     * Agrega la propiedad 'usuario' que puede contener:
     * - ClienteSession: cuando el middleware verificarTokenCliente procesa la petición
     * - UsuarioSession: cuando el middleware verificarToken procesa la petición
     */
    interface Request {
      /**
       * Información del usuario autenticado (Cliente o Usuario del sistema)
       *
       * Esta propiedad es agregada por los middleware de autenticación:
       * - verificarTokenCliente: agrega datos del Cliente
       * - verificarToken: agrega datos del Usuario del sistema
       *
       * @example
       * // En un controlador protegido para clientes:
       * const clienteId = req.usuario?.id;
       * const clienteNombre = req.usuario?.nombre;
       *
       * @example
       * // En un controlador protegido para admin:
       * const isAdmin = req.usuario?.idRol === 1;
       */
      usuario?: ClienteSession | UsuarioSession;
    }
  }
}