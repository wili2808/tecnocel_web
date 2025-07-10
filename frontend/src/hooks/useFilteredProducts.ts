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

  // Debug de búsquedas rápidas cuando cambian los productos (solo en desarrollo)
  useEffect(() => {
    if (products.length > 0 && import.meta.env.DEV) {
      debugQuickSearches(products);
    }
  }, [products.length]); // Solo cuando cambia la cantidad de productos

  // Productos filtrados (memoizados)
  const filteredProducts = useMemo(() => {
    return filterProducts(products, filters);
  }, [products, filters]);

  // Contadores de búsquedas rápidas
  const quickSearchCounts = useMemo(() => {
    return getProductCountByQuickSearch(products);
  }, [products]);

  return {
    // Datos de productos
    allProducts: products,
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
    totalProducts: products.length,
    quickSearchCounts,
  };
}; 