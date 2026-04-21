import axiosInstance from '../api/axiosConfig';
import type { Oferta, OfertaResponse, ProductosOfertaResponse, OfertaDetalleResponse, OfertasEstadisticasResponse } from '../types';

// --- CONSTANTES DE CONFIGURACIÓN ---

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo

// --- UTILIDADES DE REINTENTOS Y BACKOFF ---

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

/**
 * Servicio principal para manejar todas las operaciones relacionadas con ofertas
 * Incluye gestión de cache, reintentos automáticos y utilidades de cálculo
 */
const ofertaService = {
  /**
   * Obtiene ofertas activas
   * El caché es manejado a nivel de contexto (OfertasGlobalContext)
   * @returns Promise con array de ofertas activas
   */
  async getOfertasActivas(): Promise<Oferta[]> {
    try {
      const response = await retryWithBackoff(async () => {
        return await axiosInstance.get<OfertaResponse>('/ofertas/activas');
      });

      const ofertas = response.data.data;
      console.log(`${ofertas.length} ofertas activas cargadas desde servidor`);

      return ofertas;
    } catch (error) {
      console.error('Error al obtener ofertas activas:', error);
      throw new Error('No se pudieron cargar las ofertas activas');
    }
  },

  /**
   * Obtiene productos en oferta con paginación
   * El caché es manejado a nivel de contexto (OfertasGlobalContext)
   * @param limit - Número máximo de productos por página (por defecto: 20)
   * @param offset - Número de productos a omitir (por defecto: 0)
   * @returns Promise con productos en oferta y metadatos de paginación
   */
  async getProductosEnOferta(
    limit: number = 20,
    offset: number = 0
  ): Promise<ProductosOfertaResponse> {
    try {
      const response = await retryWithBackoff(async () => {
        return await axiosInstance.get<ProductosOfertaResponse>(
          `/ofertas/productos?limit=${limit}&offset=${offset}`
        );
      });

      const result = response.data;
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
    try {
      const response = await retryWithBackoff(async () => {
        return await axiosInstance.get<OfertaDetalleResponse>(`/ofertas/${ofertaId}/detalle`);
      });

      const oferta = response.data.data;
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
    try {
      const response = await retryWithBackoff(async () => {
        return await axiosInstance.get<OfertasEstadisticasResponse>('/ofertas/estadisticas');
      });

      const stats = response.data.data;
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

export default ofertaService;