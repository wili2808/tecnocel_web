/**
 * Hook común para la lógica de ProductCard
 * Elimina duplicación entre ProductCard y ProductCardExtensive
 * Proporciona toda la funcionalidad necesaria para ambos componentes
 * Centraliza la lógica de carrito, favoritos y manejo de imágenes
 */
import { useState, useMemo, useCallback } from 'react';
import { useCarrito } from '../contexts/CarritoContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

import { useProductContext } from '../contexts/ProductContext';
import type { ProductCardProps } from '../types/product';

export const useProductCardLogic = ({
  id_producto,
  precio_venta,
  stock,
  precio_original,
  precio_oferta
}: Pick<ProductCardProps, 'id_producto' | 'precio_venta' | 'stock' | 'precio_original' | 'precio_oferta'>) => {
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

  const { loadImageWithCache } = useProductContext();

  // ============================================================================
  // FUNCIONES MEMOIZADAS
  // ============================================================================
  
  /**
   * Formatear precio con formato argentino
   * Convierte números a formato de moneda local con símbolo ARS
   */
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }, []);

  /**
   * Información de precios calculada y memoizada
   * Incluye precios actuales, originales y cálculo de descuentos
   */
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

  /**
   * Click en la tarjeta del producto
   * La navegación se maneja automáticamente por el Link
   * Solo registrar analytics si es necesario
   */
  const handleCardClick = useCallback(() => {
    // La navegación se maneja automáticamente por el Link
    // Solo registrar analytics si es necesario
  }, []);

  /**
   * Agregar producto al carrito con validaciones completas
   * Verifica autenticación, stock disponible y cantidad máxima
   * Incluye manejo de errores y sincronización automática
   */
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



  /**
   * Cargar imagen con caché optimizado
   * Incluye manejo de errores y fallback a URL original
   */
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
  
  /**
   * Texto del stock con pluralización correcta
   * Muestra información clara sobre la disponibilidad
   */
  const stockText = useMemo(() => {
    if (isOutOfStock) return 'Agotado';
    if (stock <= 5) return `Solo ${stock} disponibles`;
    return 'En stock';
  }, [stock, isOutOfStock]);

  /**
   * Contenido del overlay para productos agotados
   * Define icono, texto y clase CSS según el estado
   */
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

  // ============================================================================
  // ESTADOS DE CARGA
  // ============================================================================
  const carritoLoading = isAddingToCart;

  // ============================================================================
  // RETORNO DEL HOOK
  // ============================================================================
  
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
    loadImageWithCache: loadImageWithCacheOptimized,
    
    // Estados de carga
    carritoLoading,
    
    // Datos calculados
    stockText,
    overlayContent,
    
    // Funciones del carrito
    canAddMoreOfProduct: (id_producto: number, stock: number) => canAddMoreOfProduct(id_producto, stock),
    isProductInCart: (id_producto: number) => isProductInCart(id_producto),
    getProductQuantityInCart: (id_producto: number) => getProductQuantityInCart(id_producto)
  };
};
