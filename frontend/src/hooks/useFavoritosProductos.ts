import { useState, useEffect, useCallback } from 'react';
import { favoritoService } from '../services/favoritoService';
import type { FavoritoResponse } from '../services/favoritoService';
import { useAuth } from '../contexts/AuthContext';
import { useFavoritosGlobal } from '../contexts/FavoritosGlobalContext';

// Tipo específico para productos de favoritos (estructura reducida)
type FavoritoProduct = {
  id_producto: number;
  nombre: string;
  descripcion: string | null;
  precio_venta: string;
  imagen_url?: string | null;
  stock: number;
  // Propiedades adicionales que pueden estar presentes
  imagenes?: any[];
  precio_original?: number;
  precio_oferta?: number;
  descuento_porcentaje?: number;
  en_oferta?: boolean;
};

export const useFavoritosProductos = (limit = 20) => {
  const { user } = useAuth();
  const { 
    loading: globalLoading, 
    error: globalError,
    refreshFavoritos: refreshGlobalFavoritos 
  } = useFavoritosGlobal();
  
  const [productos, setProductos] = useState<FavoritoProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: limit,
    offset: 0,
    pages: 0
  });

  // Cargar productos favoritos
  const loadFavoritosProductos = useCallback(async (offset = 0) => {
    if (!user?.id) {
      setProductos([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response: FavoritoResponse = await favoritoService.getFavoritos(
        user.id, 
        limit, 
        offset
      );
      
      // Extraer productos de la respuesta y filtrar undefined
      const productosData = response.data
        .map(favorito => favorito.producto)
        .filter((producto): producto is NonNullable<typeof producto> => producto !== undefined);
      
      // Debug: Verificar estructura de productos
      productosData.forEach(producto => {
        console.log(`Producto ${producto.id_producto} - ${producto.nombre}:`, {
          imagen_url: producto.imagen_url,
          precio_venta: producto.precio_venta,
          stock: producto.stock
        });
      });
      
      if (offset === 0) {
        setProductos(productosData);
      } else {
        setProductos(prev => [...prev, ...productosData]);
      }
      
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (err) {
      setError('Error al cargar productos favoritos');
      console.error('Error fetching favoritos productos:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, limit]);

  // Cargar más productos
  const loadMore = useCallback(() => {
    if (pagination.offset + pagination.limit < pagination.total && !loading) {
      loadFavoritosProductos(pagination.offset + pagination.limit);
    }
  }, [pagination, loading, loadFavoritosProductos]);

  // Remover producto de favoritos
  const removeFromFavoritos = useCallback(async (productId: number) => {
    if (!user?.id) return false;

    try {
      await favoritoService.removeFavorito(user.id, productId);
      
      // ✅ ACTUALIZAR ESTADO LOCAL
      setProductos(prev => prev.filter(p => p.id_producto !== productId));
      setPagination(prev => ({ ...prev, total: prev.total - 1 }));
      
      // ✅ CRÍTICO: Refrescar el contexto global para sincronizar ProductCard
      await refreshGlobalFavoritos();
      
      return true;
    } catch (error) {
      console.error('Error al remover de favoritos:', error);
      return false;
    }
  }, [user?.id, refreshGlobalFavoritos]);

  // Verificar si hay más productos para cargar
  const hasMore = pagination.offset + pagination.limit < pagination.total;

  // Cargar favoritos cuando cambie el usuario o el limit
  useEffect(() => {
    loadFavoritosProductos();
  }, [loadFavoritosProductos]);

  // ✅ SINCRONIZAR CON EL CONTEXTO GLOBAL cuando cambie
  useEffect(() => {
    if (globalError) {
      setError(globalError);
    }
  }, [globalError]);

  return {
    productos,
    loading: loading || globalLoading,
    error: error || globalError,
    pagination,
    loadMore,
    hasMore,
    removeFromFavoritos,
    refresh: () => loadFavoritosProductos(0)
  };
};