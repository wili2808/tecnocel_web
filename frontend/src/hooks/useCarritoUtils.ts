import { useCallback, useMemo } from 'react';
import type { ItemCarrito } from '../services/carritoService';

// ============================================================================
// HOOK DE UTILIDADES DEL CARRITO
// ============================================================================

/**
 * Hook con utilidades específicas del carrito
 * Puede ser usado independientemente del contexto
 */
export const useCarritoUtils = () => {
  // ============================================================================
  // FUNCIONES DE CÁLCULO
  // ============================================================================
  /**
   * Calcula el total del carrito
   */
  const calcularTotal = useCallback((items: ItemCarrito[]): number => {
    return items.reduce((total, item) => total + item.subtotal, 0);
  }, []);

  /**
   * Calcula la cantidad total de items
   */
  const calcularCantidadItems = useCallback((items: ItemCarrito[]): number => {
    return items.length;
  }, []);

  /**
   * Calcula la cantidad total de productos (sumando cantidades)
   */
  const calcularCantidadProductos = useCallback((items: ItemCarrito[]): number => {
    return items.reduce((total, item) => total + item.cantidad, 0);
  }, []);

  /**
   * Obtiene estadísticas del carrito
   */
  const obtenerEstadisticas = useCallback((items: ItemCarrito[]) => {
    const total = calcularTotal(items);
    const cantidadItems = calcularCantidadItems(items);
    const cantidadProductos = calcularCantidadProductos(items);
    const productosUnicos = new Set(items.map(item => item.id_producto)).size;
    
    return {
      total,
      cantidadItems,
      cantidadProductos,
      productosUnicos,
      promedioPorItem: cantidadItems > 0 ? total / cantidadItems : 0,
      promedioPorProducto: cantidadProductos > 0 ? total / cantidadProductos : 0
    };
  }, [calcularTotal, calcularCantidadItems, calcularCantidadProductos]);

  /**
   * Verifica si el carrito está vacío
   */
  const estaVacio = useCallback((items: ItemCarrito[]): boolean => {
    return items.length === 0;
  }, []);

  /**
   * Verifica si el carrito tiene items
   */
  const tieneItems = useCallback((items: ItemCarrito[]): boolean => {
    return items.length > 0;
  }, []);

  /**
   * Obtiene el item con mayor precio
   */
  const obtenerItemMasCaro = useCallback((items: ItemCarrito[]): ItemCarrito | null => {
    if (items.length === 0) return null;
    return items.reduce((max, item) => item.subtotal > max.subtotal ? item : max);
  }, []);

  /**
   * Obtiene el item con menor precio
   */
  const obtenerItemMasBarato = useCallback((items: ItemCarrito[]): ItemCarrito | null => {
    if (items.length === 0) return null;
    return items.reduce((min, item) => item.subtotal < min.subtotal ? item : min);
  }, []);

  /**
   * Agrupa items por producto (útil para mostrar cantidades totales)
   */
  const agruparItemsPorProducto = useCallback((items: ItemCarrito[]) => {
    const agrupados = new Map<number, {
      id_producto: number;
      cantidad_total: number;
      subtotal_total: number;
      items: ItemCarrito[];
    }>();

    items.forEach(item => {
      if (!agrupados.has(item.id_producto)) {
        agrupados.set(item.id_producto, {
          id_producto: item.id_producto,
          cantidad_total: 0,
          subtotal_total: 0,
          items: []
        });
      }

      const grupo = agrupados.get(item.id_producto)!;
      grupo.cantidad_total += item.cantidad;
      grupo.subtotal_total += item.subtotal;
      grupo.items.push(item);
    });

    return Array.from(agrupados.values());
  }, []);

  /**
   * Calcula el descuento total si se aplica un porcentaje
   */
  const calcularDescuento = useCallback((
    items: ItemCarrito[], 
    porcentajeDescuento: number
  ): { subtotal: number; descuento: number; total: number } => {
    const subtotal = calcularTotal(items);
    const descuento = subtotal * (porcentajeDescuento / 100);
    const total = subtotal - descuento;

    return {
      subtotal,
      descuento,
      total
    };
  }, [calcularTotal]);

  /**
   * Verifica si se puede aplicar un descuento
   */
  const puedeAplicarDescuento = useCallback((
    items: ItemCarrito[], 
    montoMinimo: number
  ): boolean => {
    const total = calcularTotal(items);
    return total >= montoMinimo;
  }, [calcularTotal]);

  /**
   * Obtiene el peso total del carrito (si los productos tienen peso)
   */
  const calcularPesoTotal = useCallback((items: ItemCarrito[]): number => {
    return items.reduce((total, item) => {
      // Aquí podrías agregar lógica para obtener el peso del producto
      // Por ahora retornamos 0
      return total;
    }, 0);
  }, []);

  /**
   * Verifica si todos los productos tienen stock disponible
   */
  const verificarStockDisponible = useCallback((items: ItemCarrito[]): {
    disponible: boolean;
    productosSinStock: ItemCarrito[];
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
    obtenerEstadisticas,
    estaVacio,
    tieneItems,
    obtenerItemMasCaro,
    obtenerItemMasBarato,
    agruparItemsPorProducto,
    calcularDescuento,
    puedeAplicarDescuento,
    calcularPesoTotal,
    verificarStockDisponible
  }), [
    calcularTotal,
    calcularCantidadItems,
    calcularCantidadProductos,
    obtenerEstadisticas,
    estaVacio,
    tieneItems,
    obtenerItemMasCaro,
    obtenerItemMasBarato,
    agruparItemsPorProducto,
    calcularDescuento,
    puedeAplicarDescuento,
    calcularPesoTotal,
    verificarStockDisponible
  ]);

  return memoizedValues;
};
