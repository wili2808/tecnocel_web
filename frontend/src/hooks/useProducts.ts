import { useState, useEffect } from 'react';
import productService from '../services/productService';
import type { ProductCardProps } from '../components/product/ProductCard';

interface UseProductsReturn {
  products: ProductCardProps[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useProducts = (): UseProductsReturn => {
  const [products, setProducts] = useState<ProductCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getProducts();
      const mappedProducts = data.map((prod: any) => ({
        id_producto: prod.id_producto,
        nombre: prod.nombre,
        descripcion: prod.descripcion,
        imagen: prod.imagen,
        precio_venta: prod.precio_venta,
        stock: prod.stock,
        id_categoria: prod.id_categoria,
      }));
      setProducts(mappedProducts);
    } catch (error: any) {
      setError(error.response?.data?.message || error.message || 'Error al cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
  };
}; 