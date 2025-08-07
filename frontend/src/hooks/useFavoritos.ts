import { useState, useEffect, useCallback } from 'react';
import { favoritoService } from '../services/favoritoService';
import { useAuth } from '../contexts/AuthContext';

export const useFavoritos = () => {
  const { user } = useAuth();
  const [favoritos, setFavoritos] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar favoritos del usuario
  const loadFavoritos = useCallback(async () => {
    if (!user?.id_cliente) return;

    try {
      setLoading(true);
      const response = await favoritoService.getFavoritos(user.id_cliente);
      const favoritosIds = response.data.map(fav => fav.id_producto);
      setFavoritos(favoritosIds);
    } catch (error) {
      console.error('Error al cargar favoritos:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id_cliente]);

  // Verificar si un producto es favorito
  const isFavorito = useCallback((productId: number): boolean => {
    return favoritos.includes(productId);
  }, [favoritos]);

  // Alternar favorito
  const toggleFavorito = useCallback(async (productId: number) => {
    if (!user?.id_cliente) return false;

    try {
      const response = await favoritoService.toggleFavorito(user.id_cliente, productId);
      
      if (response.action === 'added') {
        setFavoritos(prev => [...prev, productId]);
      } else {
        setFavoritos(prev => prev.filter(id => id !== productId));
      }
      
      return response.esFavorito;
    } catch (error) {
      console.error('Error al alternar favorito:', error);
      return false;
    }
  }, [user?.id_cliente]);

  // Cargar favoritos cuando cambie el usuario
  useEffect(() => {
    loadFavoritos();
  }, [loadFavoritos]);

  return {
    favoritos,
    loading,
    isFavorito,
    toggleFavorito,
    loadFavoritos
  };
};