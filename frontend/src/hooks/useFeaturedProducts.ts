import { useState, useEffect } from 'react';
import productService from '../services/productService';
import type { Product } from '../types/product';

interface UseFeaturedProductsReturn {
  featuredProducts: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useFeaturedProducts = (): UseFeaturedProductsReturn => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getFeaturedProducts();
      setFeaturedProducts(data || []); // Asegurar que siempre sea un array
    } catch (error: any) {
      console.error('Error fetching featured products:', error);
      setError(error.response?.data?.message || error.message || 'Error al cargar los productos destacados');
      setFeaturedProducts([]); // Fallback a array vacío en caso de error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  return {
    featuredProducts,
    loading,
    error,
    refetch: fetchFeaturedProducts,
  };
}; 