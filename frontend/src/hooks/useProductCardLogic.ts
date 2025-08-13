/**
 * Hook común para la lógica de ProductCard
 * Elimina duplicación entre ProductCard y ProductCardExtensive
 * Proporciona toda la funcionalidad necesaria para ambos componentes
 */
import { useState, useMemo, useCallback } from 'react';
import { useCarrito } from '../contexts/CarritoContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useFavoritosGlobal } from '../contexts/FavoritosGlobalContext';
import { useProductContext } from '../contexts/ProductContext';
import type { ProductCardProps } from '../types/product';

export const useProductCardLogic = ({
  id_producto,
  precio_venta,
  stock,
  precio_original,
  precio_oferta,
  en_oferta
}: Pick<ProductCardProps, 'id_producto' | 'precio_venta' | 'stock' | 'precio_original' | 'precio_oferta' | 'en_oferta'>) => {
  // ============================================================================
  // ESTADOS LOCALES
  // ============================================================================
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isOutOfStock] = useState(stock <= 0);

  // ============================================================================
  // CONTEXTOS Y HOOKS
  // ============================================================================
  const { agregarItem, isProductInCart, getProductQuantityInCart, canAddMoreOfProduct, sincronizarCarrito } = useCarrito();
  const { isAuthenticated } = useAuth();
  const { showNotification } = useNotification();
  const { isFavorito, toggleFavorito, loading: favoritoLoading } = useFavoritosGlobal();
  const { loadImageWithCache } = useProductContext();

  // ============================================================================
  // FUNCIONES MEMOIZADAS
  // ============================================================================
  
  // Formatear precio con caché de imágenes
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }, []);

  // Información de precios
  const priceInfo = useMemo(() => {
    const current = precio_oferta || Number(precio_venta);
    const original = precio_original || Number(precio_venta);
    const hasDiscount = precio_oferta && precio_oferta < Number(precio_venta);
    
    return {
      current,
      original,
      hasDiscount,
      discountPercentage: hasDiscount ? Math.round(((Number(precio_venta) - precio_oferta) / Number(precio_venta)) * 100) : 0
    };
  }, [precio_venta, precio_original, precio_oferta]);

  // Click en la tarjeta del producto
  const handleCardClick = useCallback(() => {
    // La navegación se maneja automáticamente por el Link
    // Solo registrar analytics si es necesario
  }, []);

  // Agregar al carrito
  const handleAddToCart = useCallback(async () => {
    if (!isAuthenticated) {
      showNotification('Debes iniciar sesión para agregar productos al carrito', 'warning', 3000);
      return;
    }

    if (isOutOfStock) {
      showNotification('Este producto está agotado', 'error', 3000);
      return;
    }

    // Validar stock disponible antes de agregar
    if (!canAddMoreOfProduct(id_producto, stock)) {
      showNotification(`Ya tienes la cantidad máxima disponible (${stock}) en tu carrito`, 'warning', 3000);
      return;
    }

    setIsAddingToCart(true);
    try {
      await agregarItem(id_producto, 1);
      setShowSuccess(true);
      showNotification('Producto agregado al carrito', 'success', 2000);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error: any) {
      // El error ya se maneja en el contexto, solo mostrar notificación genérica
      if (error.message && error.message.includes('Stock insuficiente')) {
        showNotification(error.message, 'error', 4000);
        // Forzar sincronización después de error de stock
        try {
          await sincronizarCarrito();
        } catch (syncError) {
          console.error('Error al sincronizar después de error de stock:', syncError);
        }
      } else {
        showNotification('Error al agregar al carrito', 'error', 3000);
      }
    } finally {
      setIsAddingToCart(false);
    }
  }, [id_producto, isAuthenticated, isOutOfStock, stock, canAddMoreOfProduct, agregarItem, showNotification, sincronizarCarrito]);

  // Toggle favorito
  const handleToggleFavorite = useCallback(async () => {
    if (!isAuthenticated) {
      showNotification('Debes iniciar sesión para usar favoritos', 'warning', 3000);
      return;
    }

    try {
      await toggleFavorito(id_producto);
    } catch (error) {
      showNotification('Error al actualizar favoritos', 'error', 3000);
    }
  }, [isAuthenticated, toggleFavorito, id_producto, showNotification]);

  // Cargar imagen con caché
  const loadImageWithCacheOptimized = useCallback(async (imageUrl: string) => {
    try {
      return await loadImageWithCache(imageUrl);
    } catch (error) {
      console.warn('Error al cargar imagen con caché:', error);
      return imageUrl; // Fallback a URL original
    }
  }, [loadImageWithCache]);

  // ============================================================================
  // CÁLCULOS Y TEXTOS
  // ============================================================================
  
  const stockText = useMemo(() => {
    if (isOutOfStock) return 'Agotado';
    if (stock <= 5) return `Solo ${stock} disponibles`;
    return 'En stock';
  }, [stock, isOutOfStock]);

  const overlayContent = useMemo(() => {
    if (isOutOfStock) {
      return {
        icon: 'remove_shopping_cart',
        text: 'Agotado',
        className: 'outOfStock'
      };
    }
    return null;
  }, [isOutOfStock]);

  const offerIndicator = useMemo(() => {
    // Verificar si hay oferta activa de manera eficiente
    const hasValidOffer = en_oferta && precio_oferta && precio_oferta < Number(precio_venta);
    
    if (hasValidOffer) {
      const discount = Math.round(((Number(precio_venta) - precio_oferta) / Number(precio_venta)) * 100);
      
      return {
        show: true,
        discountPercentage: discount,
        text: `-${discount}%`
      };
    }
    
    return { show: false };
  }, [en_oferta, precio_oferta, precio_venta]);

  // ============================================================================
  // ESTADOS DE CARGA
  // ============================================================================
  const carritoLoading = isAddingToCart;
  const isProductFavorite = isFavorito(id_producto);

  return {
    // Estados
    isAddingToCart,
    showSuccess,
    isOutOfStock,
    
    // Funciones
    formatPrice,
    priceInfo,
    handleCardClick,
    handleAddToCart,
    handleToggleFavorite,
    loadImageWithCache: loadImageWithCacheOptimized,
    
    // Estados de carga
    favoritoLoading,
    carritoLoading,
    isProductFavorite,
    
    // Datos calculados
    stockText,
    overlayContent,
    offerIndicator,
    
    // Funciones del carrito
    canAddMoreOfProduct: (id_producto: number, stock: number) => canAddMoreOfProduct(id_producto, stock),
    isProductInCart: (id_producto: number) => isProductInCart(id_producto),
    getProductQuantityInCart: (id_producto: number) => getProductQuantityInCart(id_producto)
  };
};
