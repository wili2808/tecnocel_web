import { useState, useEffect } from 'react';
import productService from '../services/productService';
import type { Product } from '../types/product';

interface UseProductReturn {
  product: Product | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useProduct = (id: number): UseProductReturn => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getProductById(id);
      setProduct(data);
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || 'Error al cargar el producto');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  return {
    product,
    loading,
    error,
    refetch: fetchProduct,
  };
}; 