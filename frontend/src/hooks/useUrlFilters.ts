/**
 * Hook personalizado useUrlFilters
 * Lee parámetros de filtrado desde la URL (query params)
 * Permite deep linking y compartir URLs con filtros aplicados
 *
 * Parámetros soportados:
 * - marca: ID de marca (número)
 * - categoria: ID de categoría (número)
 * - search: Búsqueda de texto
 * - order: Ordenamiento de productos
 * - solo_con_stock: Mostrar solo productos con stock (boolean)
 */
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ProductFilters } from '../types';

/**
 * Interfaz de retorno del hook
 * Contiene los filtros extraídos de la URL
 */
export interface UrlFilters {
  marca?: number;
  categoria?: number;
  search?: string;
  order?: string;
  solo_con_stock?: boolean;
  solo_ofertas?: boolean;
}

/**
 * Hook que extrae filtros de los query params de la URL
 *
 * @returns Objeto con los filtros encontrados en la URL
 *
 * @example
 * ```tsx
 * // URL: /productos?marca=5&categoria=2&search=laptop
 * const urlFilters = useUrlFilters();
 * // urlFilters = { marca: 5, categoria: 2, search: 'laptop' }
 * ```
 */
export const useUrlFilters = (): UrlFilters => {
  // ============================================================================
  // HOOKS
  // ============================================================================

  const [searchParams] = useSearchParams();

  // ============================================================================
  // EXTRACCIÓN Y PARSEO DE PARÁMETROS
  // ============================================================================

  /**
   * Memoiza los filtros para evitar re-renders innecesarios
   * Solo se recalcula cuando cambian los searchParams
   */
  const filters = useMemo<UrlFilters>(() => {
    const result: UrlFilters = {};

    // ============================================================================
    // MARCA - Parsear como número
    // ============================================================================
    const marcaParam = searchParams.get('marca');
    if (marcaParam) {
      const marcaId = parseInt(marcaParam, 10);
      if (!isNaN(marcaId) && marcaId > 0) {
        result.marca = marcaId;
      }
    }

    // ============================================================================
    // CATEGORÍA - Parsear como número
    // ============================================================================
    const categoriaParam = searchParams.get('categoria');
    if (categoriaParam) {
      const categoriaId = parseInt(categoriaParam, 10);
      if (!isNaN(categoriaId) && categoriaId > 0) {
        result.categoria = categoriaId;
      }
    }

    // ============================================================================
    // BÚSQUEDA - String directo
    // ============================================================================
    const searchParam = searchParams.get('search');
    if (searchParam && searchParam.trim()) {
      result.search = searchParam.trim();
    }

    // ============================================================================
    // ORDENAMIENTO - String directo
    // ============================================================================
    const orderParam = searchParams.get('order');
    if (orderParam && orderParam.trim()) {
      result.order = orderParam.trim();
    }

    // ============================================================================
    // SOLO CON STOCK - Parsear como boolean
    // ============================================================================
    const stockParam = searchParams.get('solo_con_stock');
    if (stockParam) {
      result.solo_con_stock = stockParam === 'true' || stockParam === '1';
    }

    // ============================================================================
    // SOLO OFERTAS - Parsear como boolean
    // ============================================================================
    const ofertasParam = searchParams.get('solo_ofertas');
    if (ofertasParam) {
      result.solo_ofertas = ofertasParam === 'true' || ofertasParam === '1';
    }

    return result;
  }, [searchParams]);

  return filters;
};

/**
 * Función helper para convertir filtros a query string
 * Útil para actualizar la URL cuando cambian los filtros
 *
 * @param filters - Objeto con los filtros a convertir
 * @returns String con los query params formateados
 *
 * @example
 * ```tsx
 * const queryString = filtersToQueryString({ marca: 5, search: 'laptop' });
 * // queryString = 'marca=5&search=laptop'
 * ```
 */
export const filtersToQueryString = (filters: Partial<ProductFilters>): string => {
  const params = new URLSearchParams();

  if (filters.marca) {
    params.set('marca', filters.marca.toString());
  }

  if (filters.categoria) {
    params.set('categoria', filters.categoria.toString());
  }

  if (filters.busqueda && filters.busqueda.trim()) {
    params.set('search', filters.busqueda);
  }

  if (filters.order && filters.order.trim()) {
    params.set('order', filters.order.trim());
  }

  if (filters.solo_con_stock) {
    params.set('solo_con_stock', 'true');
  }

  if (filters.solo_ofertas) {
    params.set('solo_ofertas', 'true');
  }

  return params.toString();
};

/**
 * Función helper para construir URL completa con filtros
 *
 * @param basePath - Ruta base (ej: '/productos')
 * @param filters - Filtros a aplicar
 * @returns URL completa con query params
 *
 * @example
 * ```tsx
 * const url = buildFilteredUrl('/productos', { marca: 5 });
 * // url = '/productos?marca=5'
 * ```
 */
export const buildFilteredUrl = (basePath: string, filters: Partial<ProductFilters>): string => {
  const queryString = filtersToQueryString(filters);
  return queryString ? `${basePath}?${queryString}` : basePath;
};

export default useUrlFilters;
