/**
 * Hook personalizado useBrands
 * Encapsula toda la lógica de carga y manejo de marcas
 * Proporciona funcionalidades para obtener marcas y contar productos
 */
import { useState, useEffect, useCallback } from 'react';
import marcaService from '../services/marcaService';
import productService from '../services/productService';
import type { Marca, Product } from '../types';

interface UseBrandsReturn {
  brands: Marca[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getBrandById: (id: number) => Marca | undefined;
  productCounts: Map<number, number>;
  productsLoading: boolean;
}

/**
 * Hook personalizado para gestionar marcas
 * Carga marcas desde el servidor y calcula contadores de productos
 * @returns Objeto con estado de marcas, funciones y utilidades
 */
export const useBrands = (): UseBrandsReturn => {
  // ============================================================================
  // ESTADOS LOCALES
  // ============================================================================

  const [brands, setBrands] = useState<Marca[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [productCounts, setProductCounts] = useState<Map<number, number>>(
    new Map()
  );
  const [productsLoading, setProductsLoading] = useState<boolean>(false);

  // ============================================================================
  // FUNCIONES DE CARGA
  // ============================================================================

  /**
   * Carga las marcas desde el servidor
   * Maneja estados de loading y error
   */
  const loadBrands = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await marcaService.getMarcas();

      // Filtrar solo marcas activas
      const activeBrands = data.filter((brand) => brand.activo);

      setBrands(activeBrands);
    } catch (err) {
      console.error('Error loading brands:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Error al cargar las marcas. Por favor, intenta de nuevo.'
      );
      setBrands([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Carga productos y calcula el contador por marca
   * Opcional: solo se ejecuta si se necesitan los contadores
   */
  const loadProductCounts = useCallback(async () => {
    try {
      setProductsLoading(true);

      // Obtener todos los productos
      const { productos: products } = await productService.getProducts({ limit: 1000 });

      // Calcular contadores por marca
      const counts = new Map<number, number>();

      products.forEach((product: Product) => {
        if (product.id_marca) {
          const currentCount = counts.get(product.id_marca) || 0;
          counts.set(product.id_marca, currentCount + 1);
        }
      });

      setProductCounts(counts);
    } catch (err) {
      console.error('Error loading product counts:', err);
      // No lanzar error, los contadores son opcionales
    } finally {
      setProductsLoading(false);
    }
  }, []);

  // ============================================================================
  // EFECTOS
  // ============================================================================

  /**
   * Cargar marcas al montar el componente
   */
  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  /**
   * Cargar contadores de productos después de cargar marcas
   */
  useEffect(() => {
    if (brands.length > 0) {
      loadProductCounts();
    }
  }, [brands.length, loadProductCounts]);

  // ============================================================================
  // FUNCIONES AUXILIARES
  // ============================================================================

  /**
   * Obtiene una marca específica por ID
   * @param id - ID de la marca a buscar
   * @returns Marca encontrada o undefined
   */
  const getBrandById = useCallback(
    (id: number): Marca | undefined => {
      return brands.find((brand) => brand.id_marca === id);
    },
    [brands]
  );

  /**
   * Función para forzar recarga de datos
   * Útil para refrescar después de cambios
   */
  const refetch = useCallback(async () => {
    await loadBrands();
    await loadProductCounts();
  }, [loadBrands, loadProductCounts]);

  // ============================================================================
  // RETORNO
  // ============================================================================

  return {
    brands,
    loading,
    error,
    refetch,
    getBrandById,
    productCounts,
    productsLoading,
  };
};

export default useBrands;
