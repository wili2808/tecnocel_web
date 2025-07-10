import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSearch } from '../contexts/SearchContext';

export interface ProductUIFilters {
  search: string;
  selectedDropdownCategory: string;
  selectedQuickSearch: string | null;
  order: string;
  onlyStock: boolean;
}

const DEFAULT_FILTERS: ProductUIFilters = {
  search: '',
  selectedDropdownCategory: '',
  selectedQuickSearch: null,
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
  const { debouncedSearchQuery } = useSearch();

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
    const searchFromUrl = searchParams.get('search') || '';
    
    setFilters(prev => {
      if (searchFromUrl !== prev.search) {
        return {
          ...prev,
          search: searchFromUrl
        };
      }
      return prev;
    });
  }, [location.search]); // Solo depende de la URL

  // Actualizar filtros cuando cambie la búsqueda del contexto
  useEffect(() => {
    setFilters(prev => {
      if (debouncedSearchQuery !== prev.search) {
        return {
          ...prev,
          search: debouncedSearchQuery
        };
      }
      return prev;
    });
  }, [debouncedSearchQuery]); // Solo depende de la búsqueda debounced

  const updateFilters = useCallback((newFilters: Partial<ProductUIFilters>) => {
    setFilters(prev => {
      const updatedFilters = { ...prev, ...newFilters };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFilters));
      return updatedFilters;
    });
  }, []); // Sin dependencias para evitar recreación

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