import { useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { ItemCarritoCompleto, DatosCompra } from '../types/carrito';

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
// HOOK DE LÓGICA DEL CARRITO - VERSIÓN BÁSICA
// ============================================================================

/**
 * Hook personalizado que encapsula la lógica básica del carrito
 * Solo funcionalidades esenciales para carrito básico + checkout
 */
export const useCarrito = () => {
  const { isAuthenticated } = useAuth();

  // ============================================================================
  // FUNCIONES DE VALIDACIÓN BÁSICAS
  // ============================================================================

  /**
   * Verifica si un producto ya está en el carrito
   */
  const isProductInCart = useCallback((items: ItemCarritoCompleto[], id_producto: number): boolean => {
    return items.some(item => item.id_producto === id_producto);
  }, []);

  /**
   * Obtiene la cantidad actual de un producto en el carrito
   */
  const getProductQuantityInCart = useCallback((items: ItemCarritoCompleto[], id_producto: number): number => {
    const item = items.find(item => item.id_producto === id_producto);
    return item ? item.cantidad : 0;
  }, []);

  /**
   * Verifica si se puede agregar más cantidad de un producto
   */
  const canAddMoreOfProduct = useCallback((
    items: ItemCarritoCompleto[], 
    id_producto: number, 
    stock: number
  ): boolean => {
    const currentQuantity = getProductQuantityInCart(items, id_producto);
    return currentQuantity < stock;
  }, [getProductQuantityInCart]);

  /**
   * Calcula el total del carrito basado en los items
   */
  const calculateTotal = useCallback((items: ItemCarritoCompleto[]): number => {
    return items.reduce((total, item) => total + item.subtotal, 0);
  }, []);

  /**
   * Calcula la cantidad total de items
   */
  const calculateTotalItems = useCallback((items: ItemCarritoCompleto[]): number => {
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
    prepareCompraData,
    validateQuantity
  }), [
    isProductInCart,
    getProductQuantityInCart,
    canAddMoreOfProduct,
    calculateTotal,
    calculateTotalItems,
    validateCarritoOperation,
    handleCarritoError,
    prepareCompraData,
    validateQuantity
  ]);

  return memoizedValues;
};
