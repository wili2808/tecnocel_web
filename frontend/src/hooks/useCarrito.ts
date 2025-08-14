import { useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { ItemCarrito, DatosCompra } from '../services/carritoService';

// ============================================================================
// TIPOS DE ERROR
// ============================================================================

interface ApiError {
  response?: {
    status?: number;
    data?: {
      mensaje?: string;
      stock_disponible?: number;
      cantidad_actual_en_carrito?: number;
    };
  };
}

// ============================================================================
// HOOK DE LÓGICA DEL CARRITO
// ============================================================================

/**
 * Hook personalizado que encapsula toda la lógica del carrito
 * Separado del contexto para seguir buenas prácticas
 */
export const useCarrito = () => {
  const { isAuthenticated } = useAuth();

  // ============================================================================
  // FUNCIONES DE VALIDACIÓN
  // ============================================================================

  /**
   * Verifica si un producto ya está en el carrito
   */
  const isProductInCart = useCallback((items: ItemCarrito[], id_producto: number): boolean => {
    return items.some(item => item.id_producto === id_producto);
  }, []);

  /**
   * Obtiene la cantidad actual de un producto en el carrito
   */
  const getProductQuantityInCart = useCallback((items: ItemCarrito[], id_producto: number): number => {
    const item = items.find(item => item.id_producto === id_producto);
    return item ? item.cantidad : 0;
  }, []);

  /**
   * Verifica si se puede agregar más cantidad de un producto
   */
  const canAddMoreOfProduct = useCallback((
    items: ItemCarrito[], 
    id_producto: number, 
    stock: number
  ): boolean => {
    const currentQuantity = getProductQuantityInCart(items, id_producto);
    return currentQuantity < stock;
  }, [getProductQuantityInCart]);

  /**
   * Calcula el total del carrito basado en los items
   */
  const calculateTotal = useCallback((items: ItemCarrito[]): number => {
    return items.reduce((total, item) => total + item.subtotal, 0);
  }, []);

  /**
   * Calcula la cantidad total de items
   */
  const calculateTotalItems = useCallback((items: ItemCarrito[]): number => {
    return items.length;
  }, []);

  /**
   * Valida si se puede realizar una operación en el carrito
   */
  const validateCarritoOperation = useCallback((): { isValid: boolean; error?: string } => {
    if (!isAuthenticated) {
      return { 
        isValid: false, 
        error: 'Debe iniciar sesión para realizar esta operación' 
      };
    }
    return { isValid: true };
  }, [isAuthenticated]);

  /**
   * Maneja errores de la API del carrito
   */
  const handleCarritoError = useCallback((error: unknown): string => {
    const apiError = error as ApiError;
    
    if (apiError.response?.status === 400) {
      const mensajeError = apiError.response?.data?.mensaje || 'Error en la operación del carrito';

      // Manejo específico de errores de stock
      if (mensajeError.includes('Stock insuficiente') || mensajeError.includes('stock')) {
        const stockDisponible = apiError.response?.data?.stock_disponible;
        const cantidadEnCarrito = apiError.response?.data?.cantidad_actual_en_carrito;

        if (stockDisponible !== undefined && cantidadEnCarrito !== undefined) {
          return `Stock insuficiente. Disponible: ${stockDisponible}, En carrito: ${cantidadEnCarrito}`;
        } else {
          return `Stock insuficiente para la cantidad solicitada`;
        }
      }
      return mensajeError;
    }
    
    return apiError.response?.data?.mensaje || 'Error en la operación del carrito';
  }, []);

  /**
   * Prepara datos para agregar un item al carrito
   */
  const prepareItemData = useCallback((
    id_producto: number, 
    cantidad: number, 
    detalles_personalizacion?: Record<string, unknown>
  ) => {
    return {
      id_producto,
      cantidad,
      detalles_personalizacion
    };
  }, []);

  /**
   * Prepara datos para confirmar una compra
   */
  const prepareCompraData = useCallback((datosCompra: DatosCompra) => {
    return {
      observaciones: datosCompra.observaciones || '',
      moneda: datosCompra.moneda || 'BOB',
      metodo_pago: datosCompra.metodo_pago || 'efectivo'
    };
  }, []);

  /**
   * Valida la cantidad antes de agregar al carrito
   */
  const validateQuantity = useCallback((cantidad: number, stock: number): { isValid: boolean; error?: string } => {
    if (cantidad <= 0) {
      return { isValid: false, error: 'La cantidad debe ser mayor a 0' };
    }
    
    if (cantidad > stock) {
      return { isValid: false, error: `Stock insuficiente. Disponible: ${stock}` };
    }
    
    return { isValid: true };
  }, []);

  /**
   * Obtiene estadísticas del carrito
   */
  const getCarritoStats = useCallback((items: ItemCarrito[]) => {
    const total = calculateTotal(items);
    const cantidadItems = calculateTotalItems(items);
    const productosUnicos = new Set(items.map(item => item.id_producto)).size;
    
    return {
      total,
      cantidadItems,
      productosUnicos,
      promedioPorItem: cantidadItems > 0 ? total / cantidadItems : 0
    };
  }, [calculateTotal, calculateTotalItems]);

  /**
   * Filtra items del carrito por criterios
   */
  const filterCarritoItems = useCallback((
    items: ItemCarrito[], 
    filter: {
      porMarca?: string;
      porCategoria?: string;
      porPrecio?: { min?: number; max?: number };
      porStock?: boolean; // true = solo con stock, false = solo sin stock
    }
  ): ItemCarrito[] => {
    return items.filter(item => {
      // Filtro por marca
      if (filter.porMarca && item.producto) {
        // Aquí podrías agregar lógica para filtrar por marca si tienes esa información
      }
      
      // Filtro por precio
      if (filter.porPrecio) {
        const precio = parseFloat(item.producto?.precio_venta || '0');
        if (filter.porPrecio.min && precio < filter.porPrecio.min) return false;
        if (filter.porPrecio.max && precio > filter.porPrecio.max) return false;
      }
      
      // Filtro por stock
      if (filter.porStock !== undefined && item.producto) {
        const tieneStock = item.producto.stock > 0;
        if (filter.porStock !== tieneStock) return false;
      }
      
      return true;
    });
  }, []);

  // ============================================================================
  // VALOR MEMOIZADO
  // ============================================================================
  
  // Memoizar valores para evitar recálculos innecesarios
  const memoizedValues = useMemo(() => ({
    isProductInCart,
    getProductQuantityInCart,
    canAddMoreOfProduct,
    calculateTotal,
    calculateTotalItems,
    validateCarritoOperation,
    handleCarritoError,
    prepareItemData,
    prepareCompraData,
    validateQuantity,
    getCarritoStats,
    filterCarritoItems
  }), [
    isProductInCart,
    getProductQuantityInCart,
    canAddMoreOfProduct,
    calculateTotal,
    calculateTotalItems,
    validateCarritoOperation,
    handleCarritoError,
    prepareItemData,
    prepareCompraData,
    validateQuantity,
    getCarritoStats,
    filterCarritoItems
  ]);

  return memoizedValues;
};
