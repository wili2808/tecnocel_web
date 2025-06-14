import { useState, useCallback } from 'react';

export interface ProductFilters {
  search: string;
  selectedDropdownCategory: string;
  selectedCategory: string | null;
  order: string;
  onlyStock: boolean;
}

const DEFAULT_FILTERS: ProductFilters = {
  search: '',
  selectedDropdownCategory: '',
  selectedCategory: null,
  order: '',
  onlyStock: false,
};

const STORAGE_KEY = 'catalogoFiltros';

interface UseProductFiltersReturn {
  filters: ProductFilters;
  updateFilters: (newFilters: Partial<ProductFilters>) => void;
  resetFilters: () => void;
}

export const useProductFilters = (): UseProductFiltersReturn => {
  // Recuperar filtros guardados del localStorage
  const [filters, setFilters] = useState<ProductFilters>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...DEFAULT_FILTERS, ...JSON.parse(saved) } : DEFAULT_FILTERS;
    } catch {
      return DEFAULT_FILTERS;
    }
  });

  const updateFilters = useCallback((newFilters: Partial<ProductFilters>) => {
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