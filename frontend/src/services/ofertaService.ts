import axiosInstance from '../api/axiosConfig';
import type { Product, Oferta } from '../types';

/**
 * Constantes de configuración para el servicio de ofertas
 */
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Respuesta del servidor al obtener ofertas con conteo
 */
export interface OfertaResponse {
  success: boolean;
  data: Oferta[];
  count: number;
}

/**
 * Respuesta del servidor al obtener productos en oferta con paginación
 */
export interface ProductosOfertaResponse {
  success: boolean;
  data: Product[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    pages: number;
  };
}

/**
 * Respuesta del servidor con detalle completo de una oferta
 */
export interface OfertaDetalleResponse {
  success: boolean;
  data: Oferta & {
    productos: Product[];
    productosCount: number;
  };
}

/**
 * Respuesta del servidor con estadísticas generales de ofertas
 */
export interface OfertasEstadisticasResponse {
  success: boolean;
  data: {
    total: number;
    activas: number;
    expiradas: number;
    productosEnOferta: number;
    promedioDescuento: number;
  };
}

/**
 * Estructura de entrada en el cache con timestamp de expiración
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Interfaz para el gestor de cache del servicio
 */
interface CacheManager {
  get<T>(key: string): T | null;
  set<T>(key: string, data: T, duration?: number): void;
  clear(key?: string): void;
  isExpired(key: string): boolean;
}

/**
 * Implementación del gestor de cache local para ofertas
 * Almacena datos en memoria con expiración automática
 */
class LocalCacheManager implements CacheManager {
  private cache = new Map<string, CacheEntry<any>>();

  /**
   * Obtiene datos del cache si no han expirado
   * @param key - Clave del cache
   * @returns Datos almacenados o null si no existen o han expirado
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry || Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  /**
   * Almacena datos en el cache con duración de expiración
   * @param key - Clave del cache
   * @param data - Datos a almacenar
   * @param duration - Duración en milisegundos (por defecto: 5 minutos)
   */
  set<T>(key: string, data: T, duration: number = CACHE_DURATION): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + duration
    });
  }

  /**
   * Limpia entradas específicas o todo el cache
   * @param key - Clave específica a limpiar (opcional)
   */
  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Verifica si una entrada del cache ha expirado
   * @param key - Clave del cache a verificar
   * @returns true si la entrada ha expirado o no existe
   */
  isExpired(key: string): boolean {
    const entry = this.cache.get(key);
    return !entry || Date.now() > entry.expiresAt;
  }
}

/**
 * Utilidades para implementar lógica de reintentos con backoff exponencial
 */

/**
 * Función de utilidad para crear delays asíncronos
 * @param ms - Milisegundos a esperar
 * @returns Promise que se resuelve después del delay
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Implementa lógica de reintentos con backoff exponencial
 * @param fn - Función a ejecutar con reintentos
 * @param maxRetries - Número máximo de reintentos (por defecto: 3)
 * @param baseDelay - Delay base en milisegundos (por defecto: 1 segundo)
 * @returns Promise con el resultado de la función o el último error
 */
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  baseDelay: number = RETRY_DELAY
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Backoff exponencial
      const delayMs = baseDelay * Math.pow(2, attempt);
      console.warn(`Intento ${attempt + 1} falló, reintentando en ${delayMs}ms:`, error);
      await delay(delayMs);
    }
  }
  
  throw lastError!;
};

// Instancia del cache manager
const cacheManager = new LocalCacheManager();

/**
 * Claves utilizadas para organizar el cache del servicio
 */
const CACHE_KEYS = {
  OFERTAS_ACTIVAS: 'ofertas_activas',
  PRODUCTOS_OFERTA: 'productos_oferta',
  OFERTA_DETALLE: 'oferta_detalle',
  ESTADISTICAS: 'ofertas_estadisticas'
} as const;

/**
 * Servicio principal para manejar todas las operaciones relacionadas con ofertas
 * Incluye gestión de cache, reintentos automáticos y utilidades de cálculo
 */
export const ofertaService = {
  /**
   * Gestión del cache del servicio
   */
  cache: {
    /**
     * Limpia entradas específicas o todo el cache
     * @param key - Clave específica a limpiar (opcional)
     */
    clear: (key?: string) => cacheManager.clear(key),
    
    /**
     * Verifica si una entrada del cache ha expirado
     * @param key - Clave del cache a verificar
     * @returns true si la entrada ha expirado
     */
    isExpired: (key: string) => cacheManager.isExpired(key),
    
    /**
     * Obtiene estadísticas del cache (implementación simplificada)
     * @returns Estadísticas básicas del cache
     */
    getStats: () => {
      const stats = {
        totalEntries: 0,
        expiredEntries: 0,
        validEntries: 0
      };
      
      // Nota: Esta es una implementación simplificada
      // En una implementación real, necesitarías acceso a las claves del cache
      return stats;
    }
  },

  /**
   * Obtiene ofertas activas con soporte de cache
   * @param useCache - Indica si se debe usar cache (por defecto: true)
   * @returns Promise con array de ofertas activas
   */
  async getOfertasActivas(useCache: boolean = true): Promise<Oferta[]> {
    const cacheKey = CACHE_KEYS.OFERTAS_ACTIVAS;
    
    // Verificar cache
    if (useCache) {
      const cached = cacheManager.get<Oferta[]>(cacheKey);
      if (cached) {
        console.log('Ofertas activas cargadas desde cache');
        return cached;
      }
    }

    try {
      const response = await retryWithBackoff(async () => {
        return await axiosInstance.get<OfertaResponse>('/ofertas/activas');
      });

      const ofertas = response.data.data;
      
      // Guardar en cache
      cacheManager.set(cacheKey, ofertas);
      console.log(`${ofertas.length} ofertas activas cargadas desde servidor`);
      
      return ofertas;
    } catch (error) {
      console.error('Error al obtener ofertas activas:', error);
      throw new Error('No se pudieron cargar las ofertas activas');
    }
  },

  /**
   * Obtiene productos en oferta con paginación y soporte de cache
   * @param limit - Número máximo de productos por página (por defecto: 20)
   * @param offset - Número de productos a omitir (por defecto: 0)
   * @param useCache - Indica si se debe usar cache (por defecto: true)
   * @returns Promise con productos en oferta y metadatos de paginación
   */
  async getProductosEnOferta(
    limit: number = 20, 
    offset: number = 0, 
    useCache: boolean = true
  ): Promise<ProductosOfertaResponse> {
    const cacheKey = `${CACHE_KEYS.PRODUCTOS_OFERTA}_${limit}_${offset}`;
    
    // Verificar cache (solo para la primera página)
    if (useCache && offset === 0) {
      const cached = cacheManager.get<ProductosOfertaResponse>(cacheKey);
      if (cached) {
        console.log('Productos en oferta cargados desde cache');
        return cached;
      }
    }

    try {
      const response = await retryWithBackoff(async () => {
        return await axiosInstance.get<ProductosOfertaResponse>(
          `/ofertas/productos?limit=${limit}&offset=${offset}`
        );
      });

      const result = response.data;
      
      // Guardar en cache (solo la primera página)
      if (offset === 0) {
        cacheManager.set(cacheKey, result);
      }
      
      console.log(`${result.data.length} productos en oferta cargados desde servidor`);
      return result;
    } catch (error) {
      console.error('Error al obtener productos en oferta:', error);
      throw new Error('No se pudieron cargar los productos en oferta');
    }
  },

  /**
   * Obtiene el detalle completo de una oferta específica
   * @param ofertaId - ID de la oferta a obtener
   * @returns Promise con el detalle completo de la oferta
   */
  async getOfertaDetalle(ofertaId: number): Promise<OfertaDetalleResponse['data']> {
    const cacheKey = `${CACHE_KEYS.OFERTA_DETALLE}_${ofertaId}`;
    
    // Verificar cache
    const cached = cacheManager.get<OfertaDetalleResponse['data']>(cacheKey);
    if (cached) {
      console.log(`Detalle de oferta ${ofertaId} cargado desde cache`);
      return cached;
    }

    try {
      const response = await retryWithBackoff(async () => {
        return await axiosInstance.get<OfertaDetalleResponse>(`/ofertas/${ofertaId}/detalle`);
      });

      const oferta = response.data.data;
      
      // Guardar en cache
      cacheManager.set(cacheKey, oferta);
      console.log(`Detalle de oferta ${ofertaId} cargado desde servidor`);
      
      return oferta;
    } catch (error) {
      console.error(`Error al obtener detalle de oferta ${ofertaId}:`, error);
      throw new Error(`No se pudo cargar el detalle de la oferta ${ofertaId}`);
    }
  },

  /**
   * Obtiene estadísticas generales de todas las ofertas
   * @returns Promise con estadísticas de ofertas (totales, activas, expiradas, etc.)
   */
  async getEstadisticas(): Promise<OfertasEstadisticasResponse['data']> {
    const cacheKey = CACHE_KEYS.ESTADISTICAS;
    
    // Verificar cache
    const cached = cacheManager.get<OfertasEstadisticasResponse['data']>(cacheKey);
    if (cached) {
      console.log('Estadísticas de ofertas cargadas desde cache');
      return cached;
    }

    try {
      const response = await retryWithBackoff(async () => {
        return await axiosInstance.get<OfertasEstadisticasResponse>('/ofertas/estadisticas');
      });

      const stats = response.data.data;
      
      // Guardar en cache con duración más corta
      cacheManager.set(cacheKey, stats, 2 * 60 * 1000); // 2 minutos
      console.log('Estadísticas de ofertas cargadas desde servidor');
      
      return stats;
    } catch (error) {
      console.error('Error al obtener estadísticas de ofertas:', error);
      throw new Error('No se pudieron cargar las estadísticas de ofertas');
    }
  },

  /**
   * Busca ofertas según criterios específicos
   * @param criterios - Criterios de búsqueda (nombre, tipo de descuento, estado, etc.)
   * @returns Promise con ofertas que coinciden con los criterios
   */
  async buscarOfertas(criterios: {
    nombre?: string;
    tipoDescuento?: 'porcentaje' | 'monto_fijo';
    activo?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<OfertaResponse> {
    try {
      const params = new URLSearchParams();
      
      if (criterios.nombre) params.append('nombre', criterios.nombre);
      if (criterios.tipoDescuento) params.append('tipo_descuento', criterios.tipoDescuento);
      if (criterios.activo !== undefined) params.append('activo', criterios.activo.toString());
      if (criterios.limit) params.append('limit', criterios.limit.toString());
      if (criterios.offset) params.append('offset', criterios.offset.toString());

      const response = await retryWithBackoff(async () => {
        return await axiosInstance.get<OfertaResponse>(`/ofertas/buscar?${params.toString()}`);
      });

      console.log(`Búsqueda de ofertas completada: ${response.data.data.length} resultados`);
      return response.data;
    } catch (error) {
      console.error('Error al buscar ofertas:', error);
      throw new Error('No se pudo realizar la búsqueda de ofertas');
    }
  },

  /**
   * Verifica si un producto específico está en oferta
   * @param productId - ID del producto a verificar
   * @returns Promise con información sobre el estado de oferta del producto
   */
  async verificarProductoEnOferta(productId: number): Promise<{
    enOferta: boolean;
    oferta?: Oferta;
    precioOferta?: number;
  }> {
    try {
      const response = await retryWithBackoff(async () => {
        return await axiosInstance.get(`/ofertas/producto/${productId}/verificar`);
      });

      return response.data;
    } catch (error) {
      console.error(`Error al verificar oferta para producto ${productId}:`, error);
      return { enOferta: false };
    }
  },

  /**
   * Obtiene ofertas que están próximas a expirar
   * @param dias - Número de días para considerar "próximas a expirar" (por defecto: 7)
   * @returns Promise con ofertas próximas a expirar
   */
  async getOfertasProximasAExpirar(dias: number = 7): Promise<Oferta[]> {
    try {
      const response = await retryWithBackoff(async () => {
        return await axiosInstance.get<OfertaResponse>(`/ofertas/proximas-expirar?dias=${dias}`);
      });

      console.log(`${response.data.data.length} ofertas próximas a expirar cargadas`);
      return response.data.data;
    } catch (error) {
      console.error('Error al obtener ofertas próximas a expirar:', error);
      throw new Error('No se pudieron cargar las ofertas próximas a expirar');
    }
  },

  /**
   * Limpia el cache del servicio según un patrón específico
   * @param pattern - Patrón para limpiar cache específico (opcional)
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      // Limpiar cache que coincida con el patrón
      Object.values(CACHE_KEYS).forEach(key => {
        if (key.includes(pattern)) {
          cacheManager.clear(key);
        }
      });
    } else {
      // Limpiar todo el cache
      cacheManager.clear();
    }
    console.log('Cache de ofertas limpiado');
  },

  /**
   * Métodos de utilidad para cálculos y verificaciones
   */
  utils: {
    /**
     * Calcula el tiempo restante de una oferta en formato legible
     * @param oferta - Oferta para calcular tiempo restante
     * @returns String con el tiempo restante (ej: "2 días", "5 horas")
     */
    calculateTimeRemaining(oferta: Oferta): string {
      const now = new Date();
      const fin = new Date(oferta.fecha_fin);
      const diff = fin.getTime() - now.getTime();

      if (diff <= 0) return 'Expirada';

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      if (days > 0) {
        return `${days} día${days > 1 ? 's' : ''}`;
      } else if (hours > 0) {
        return `${hours} hora${hours > 1 ? 's' : ''}`;
      } else {
        return 'Menos de 1 hora';
      }
    },

    /**
     * Verifica si una oferta está actualmente activa
     * @param oferta - Oferta a verificar
     * @returns true si la oferta está activa y dentro de su período válido
     */
    isOfertaActive(oferta: Oferta): boolean {
      const now = new Date();
      const inicio = new Date(oferta.fecha_inicio);
      const fin = new Date(oferta.fecha_fin);
      return now >= inicio && now <= fin && oferta.activo;
    },

    /**
     * Calcula el descuento aplicado en una oferta
     * @param precioOriginal - Precio original del producto
     * @param precioOferta - Precio con oferta aplicada
     * @returns Objeto con monto y porcentaje de descuento
     */
    calculateDiscount(precioOriginal: number, precioOferta: number): {
      monto: number;
      porcentaje: number;
    } {
      const monto = precioOriginal - precioOferta;
      const porcentaje = (monto / precioOriginal) * 100;
      
      return {
        monto: Math.round(monto * 100) / 100,
        porcentaje: Math.round(porcentaje * 100) / 100
      };
    }
  }
};