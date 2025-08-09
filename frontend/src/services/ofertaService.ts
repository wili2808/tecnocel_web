import axiosInstance from '../api/axiosConfig';
import type { Product, Oferta } from '../types/product';

// Constantes de configuración
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Interfaces de respuesta
export interface OfertaResponse {
  success: boolean;
  data: Oferta[];
  count: number;
}

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

export interface OfertaDetalleResponse {
  success: boolean;
  data: Oferta & {
    productos: Product[];
    productosCount: number;
  };
}

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

// Interfaces para cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheManager {
  get<T>(key: string): T | null;
  set<T>(key: string, data: T, duration?: number): void;
  clear(key?: string): void;
  isExpired(key: string): boolean;
}

// Implementación del cache manager
class LocalCacheManager implements CacheManager {
  private cache = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry || Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set<T>(key: string, data: T, duration: number = CACHE_DURATION): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + duration
    });
  }

  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  isExpired(key: string): boolean {
    const entry = this.cache.get(key);
    return !entry || Date.now() > entry.expiresAt;
  }
}

// Utilidades para retry logic
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

// Claves de cache
const CACHE_KEYS = {
  OFERTAS_ACTIVAS: 'ofertas_activas',
  PRODUCTOS_OFERTA: 'productos_oferta',
  OFERTA_DETALLE: 'oferta_detalle',
  ESTADISTICAS: 'ofertas_estadisticas'
} as const;

export const ofertaService = {
  // Cache management
  cache: {
    clear: (key?: string) => cacheManager.clear(key),
    isExpired: (key: string) => cacheManager.isExpired(key),
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

  // Obtener ofertas activas con cache
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

  // Obtener productos en oferta con cache y paginación
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

  // Obtener detalle de una oferta específica
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

  // Obtener estadísticas de ofertas
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

  // Buscar ofertas por criterios
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

  // Verificar si un producto está en oferta
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

  // Obtener ofertas próximas a expirar
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

  // Limpiar cache específico o completo
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

  // Métodos de utilidad
  utils: {
    // Calcular tiempo restante de una oferta
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

    // Verificar si una oferta está activa
    isOfertaActive(oferta: Oferta): boolean {
      const now = new Date();
      const inicio = new Date(oferta.fecha_inicio);
      const fin = new Date(oferta.fecha_fin);
      return now >= inicio && now <= fin && oferta.activo;
    },

    // Calcular descuento aplicado
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