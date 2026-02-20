/**
 * Constantes de roles del sistema.
 * Los valores deben coincidir con los IDs de la tabla tb_roles en la base de datos.
 *
 * Si un rol cambia de ID en la BD, actualizar SOLO este archivo.
 * Nunca usar los números directamente en el código — importar desde aquí.
 */
export const ROLES = {
  ADMIN:    1,
  GERENTE:  2,
  VENDEDOR: 3,
} as const;

/** Tipo que representa cualquier ID de rol válido */
export type RolId = typeof ROLES[keyof typeof ROLES];
