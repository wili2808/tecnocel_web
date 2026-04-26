/**
 * Utility para normalizar respuestas API del backend
 *
 * Proporciona helpers consistentes para todas las respuestas HTTP:
 * - Item único: { success: true, data: T }
 * - Lista: { success: true, data: T[] }
 * - Lista con paginación: { success: true, data: { items: T[], pagination } }
 * - Mensaje simple: { success: true, message: string }
 * - Error: { success: false, error: string }
 */

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  details?: any;
}

/**
 * Respuesta para item único o dato simple
 */
export const ok = <T = any>(data: T): ApiSuccess<T> => ({
  success: true,
  data,
});

/**
 * Respuesta para lista sin paginación
 */
export const okList = <T = any>(items: T[]): ApiSuccess<T[]> => ({
  success: true,
  data: items,
});

/**
 * Respuesta para lista CON paginación
 */
export const okPaginated = <T = any>(
  items: T[],
  pagination: PaginationMeta
): ApiSuccess<{ items: T[]; pagination: PaginationMeta }> => ({
  success: true,
  data: { items, pagination },
});

/**
 * Respuesta para operación exitosa con mensaje
 */
export const okMessage = (
  message: string,
  data?: any
): { success: true; message: string; data?: any } => ({
  success: true,
  message,
  ...(data !== undefined && { data }),
});

/**
 * Respuesta de error
 */
export const errorResponse = (
  error: string,
  details?: any
): ApiError => ({
  success: false,
  error,
  ...(details !== undefined && { details }),
});
