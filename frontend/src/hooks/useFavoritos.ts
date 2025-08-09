/**
 * Hook de Favoritos - Wrapper del contexto global para mantener compatibilidad
 * Optimización: Usa el contexto global para evitar consultas redundantes
 */
import { useFavoritosGlobal } from '../contexts/FavoritosGlobalContext';

export const useFavoritos = () => {
  const {
    favoritosCompletos,
    loading,
    error,
    isFavorito,
    toggleFavorito,
    addFavorito,
    removeFavorito,
    loadFavoritos,
    refreshFavoritos,
    clearFavoritos,
    getFavoritosCount,
    getFavoritosIds,
    getFavoritosCompletos
  } = useFavoritosGlobal();

  // Mantener compatibilidad con la API anterior
  const favoritosArray = getFavoritosIds();

  return {
    // API original mantenida para compatibilidad
    favoritos: favoritosArray,
    loading,
    isFavorito,
    toggleFavorito,
    loadFavoritos,
    
    // Nuevas funcionalidades disponibles
    favoritosCompletos,
    error,
    addFavorito,
    removeFavorito,
    refreshFavoritos,
    clearFavoritos,
    getFavoritosCount,
    getFavoritosIds,
    getFavoritosCompletos
  };
};