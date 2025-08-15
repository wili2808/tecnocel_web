import { useCallback, useMemo } from 'react';
import type { ItemCarritoCompleto } from '../types/carrito';

// ============================================================================
// HOOK DE UTILIDADES DEL CARRITO - VERSIÓN BÁSICA
// ============================================================================

/**
 * Hook con utilidades básicas del carrito
 * Solo funcionalidades esenciales para carrito básico + checkout
 */
export const useCarritoUtils = () => {
  // ============================================================================
  // FUNCIONES BÁSICAS DE CÁLCULO
  // ============================================================================
  /**
   * Calcula el total del carrito
   */
  const calcularTotal = useCallback((items: ItemCarritoCompleto[]): number => {
    return items.reduce((total, item) => total + item.subtotal, 0);
  }, []);

  /**
   * Calcula la cantidad total de items
   */
  const calcularCantidadItems = useCallback((items: ItemCarritoCompleto[]): number => {
    return items.length;
  }, []);

  /**
   * Calcula la cantidad total de productos (sumando cantidades)
   */
  const calcularCantidadProductos = useCallback((items: ItemCarritoCompleto[]): number => {
    return items.reduce((total, item) => total + item.cantidad, 0);
  }, []);

  /**
   * Verifica si el carrito está vacío
   */
  const estaVacio = useCallback((items: ItemCarritoCompleto[]): boolean => {
    return items.length === 0;
  }, []);

  /**
   * Verifica si el carrito tiene items
   */
  const tieneItems = useCallback((items: ItemCarritoCompleto[]): boolean => {
    return items.length > 0;
  }, []);

  /**
   * Verifica si todos los productos tienen stock disponible
   */
  const verificarStockDisponible = useCallback((items: ItemCarritoCompleto[]): {
    disponible: boolean;
    productosSinStock: ItemCarritoCompleto[];
  } => {
    const productosSinStock = items.filter(item => 
      item.producto && item.producto.stock < item.cantidad
    );

    return {
      disponible: productosSinStock.length === 0,
      productosSinStock
    };
  }, []);

  // ============================================================================
  // VALOR MEMOIZADO
  // ============================================================================
  
  // Memoizar valores para evitar recálculos innecesarios
  const memoizedValues = useMemo(() => ({
    calcularTotal,
    calcularCantidadItems,
    calcularCantidadProductos,
    estaVacio,
    tieneItems,
    verificarStockDisponible
  }), [
    calcularTotal,
    calcularCantidadItems,
    calcularCantidadProductos,
    estaVacio,
    tieneItems,
    verificarStockDisponible
  ]);

  return memoizedValues;
};
