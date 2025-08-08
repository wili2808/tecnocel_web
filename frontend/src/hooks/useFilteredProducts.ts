import { useMemo, useEffect } from 'react';
import { useProducts } from './useProducts';
import { useCategories } from './useCategories';
import { useProductFilters } from './useProductFilters';
import { 
  filterProducts, 
  getProductCountByQuickSearch,
  debugQuickSearches 
} from '../utils/productFiltering';

interface UseFilteredProductsReturn {
  // Datos de productos
  allProducts: ReturnType<typeof useProducts>['products'];
  filteredProducts: ReturnType<typeof useProducts>['products'];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  
  // Categorías
  categories: ReturnType<typeof useCategories>['categories'];
  categoriesLoading: boolean;
  
  // Filtros
  filters: ReturnType<typeof useProductFilters>['filters'];
  updateFilters: ReturnType<typeof useProductFilters>['updateFilters'];
  resetFilters: ReturnType<typeof useProductFilters>['resetFilters'];
  
  // Estadísticas
  totalProducts: number;
  quickSearchCounts: Record<string, number>;
}

export const useFilteredProducts = (): UseFilteredProductsReturn => {
  // Hooks de datos
  const { products, loading, error, refetch } = useProducts();
  const { categories, loading: categoriesLoading } = useCategories();
  const { filters, updateFilters, resetFilters } = useProductFilters();

  // Asegurar que products siempre sea un array
  const safeProducts = products || [];

  // Debug de búsquedas rápidas cuando cambian los productos (solo en desarrollo)
  useEffect(() => {
    if (safeProducts.length > 0 && import.meta.env.DEV) {
      debugQuickSearches(safeProducts);
    }
  }, [safeProducts.length]); // Solo cuando cambia la cantidad de productos

  // Productos filtrados (memoizados)
  const filteredProducts = useMemo(() => {
    return filterProducts(safeProducts, filters);
  }, [safeProducts, filters]);

  // Contadores de búsquedas rápidas
  const quickSearchCounts = useMemo(() => {
    return getProductCountByQuickSearch(safeProducts);
  }, [safeProducts]);

  return {
    // Datos de productos
    allProducts: safeProducts,
    filteredProducts,
    loading,
    error,
    refetch,
    
    // Categorías
    categories,
    categoriesLoading,
    
    // Filtros
    filters,
    updateFilters,
    resetFilters,
    
    // Estadísticas
    totalProducts: safeProducts.length,
    quickSearchCounts,
  };
}; 