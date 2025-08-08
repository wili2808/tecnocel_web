import { useState, useEffect } from 'react';
import productService from '../services/productService';
import type { Product } from '../types/product';

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useProducts = (): UseProductsReturn => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await productService.getProducts();
      
      // El backend devuelve directamente un array de productos
      // No necesitamos acceder a data.productos
      const productos = Array.isArray(data) ? data : [];
      
      setProducts(productos);
    } catch (error: any) {
      console.error('Error al cargar productos:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Error al cargar los productos';
      setError(errorMessage);
      // En caso de error, mantener array vacío
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products: products || [], // Asegurar que siempre sea un array
    loading,
    error,
    refetch: fetchProducts,
  };
}; 