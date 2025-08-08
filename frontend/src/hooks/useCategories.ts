import { useState, useEffect } from 'react';
import productService from '../services/productService';
import type { Category } from '../types/product';

interface UseCategoriesReturn {
  categories: Category[];
  loading: boolean;
  error: string | null;
}

export const useCategories = (): UseCategoriesReturn => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await productService.getCategorias();
        // Asegurar que siempre sea un array
        setCategories(data || []);
      } catch (error: any) {
        setError(error.response?.data?.message || error.message || 'Error al cargar las categorías');
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return {
    categories: categories || [], // Asegurar que siempre sea un array
    loading,
    error,
  };
}; 