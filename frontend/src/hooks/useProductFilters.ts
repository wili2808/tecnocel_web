import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export interface ProductUIFilters {
  search: string;
  selectedDropdownCategory: string;
  selectedCategory: string | null;
  order: string;
  onlyStock: boolean;
}

const DEFAULT_FILTERS: ProductUIFilters = {
  search: '',
  selectedDropdownCategory: '',
  selectedCategory: null,
  order: '',
  onlyStock: false,
};

const STORAGE_KEY = 'catalogoFiltros';

interface UseProductFiltersReturn {
  filters: ProductUIFilters;
  updateFilters: (newFilters: Partial<ProductUIFilters>) => void;
  resetFilters: () => void;
}

export const useProductFilters = (): UseProductFiltersReturn => {
  const location = useLocation();

  // Recuperar filtros guardados del localStorage
  const [filters, setFilters] = useState<ProductUIFilters>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT_FILTERS, ...JSON.parse(saved) } : DEFAULT_FILTERS;
    } catch {
      return DEFAULT_FILTERS;
    }
  });

  // Sincronizar con parámetros de URL al cargar
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const searchFromUrl = searchParams.get('search');
    
    if (searchFromUrl && searchFromUrl !== filters.search) {
      setFilters(prev => ({
        ...prev,
        search: searchFromUrl
      }));
    }
  }, [location.search, filters.search]);

  const updateFilters = useCallback((newFilters: Partial<ProductUIFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFilters));
  }, [filters]);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    filters,
    updateFilters,
    resetFilters,
  };
}; 