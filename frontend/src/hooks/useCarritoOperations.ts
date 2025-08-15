import { useCallback } from 'react';
import { CarritoService } from '../services/carritoService';
import type { DatosCompra, VentaConfirmada } from '../types/carrito';
import { useCarrito } from './useCarrito';

// ============================================================================
// HOOK DE OPERACIONES DEL CARRITO - VERSIÓN BÁSICA
// ============================================================================

/**
 * Hook que maneja las operaciones básicas del carrito
 * Solo funcionalidades esenciales para carrito básico + checkout
 */
export const useCarritoOperations = () => {
  // ============================================================================
  // HOOKS DE LÓGICA
  // ============================================================================
  
  const {
    validateCarritoOperation,
    handleCarritoError,
    prepareCompraData,
    validateQuantity
  } = useCarrito();

  /**
   * Obtiene el carrito activo del cliente
   */
  const obtenerCarrito = useCallback(async () => {
    const validation = validateCarritoOperation();
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    try {
      const response = await CarritoService.obtenerCarrito();
      return response.carrito;
    } catch (error: any) {
      const mensajeError = handleCarritoError(error);
      throw new Error(mensajeError);
    }
  }, [validateCarritoOperation, handleCarritoError]);

  /**
   * Agrega un producto al carrito
   */
  const agregarItem = useCallback(async (
    id_producto: number, 
    cantidad: number, 
    stock?: number
  ) => {
    const validation = validateCarritoOperation();
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Validar cantidad si se proporciona stock
    if (stock !== undefined) {
      const quantityValidation = validateQuantity(cantidad, stock);
      if (!quantityValidation.isValid) {
        throw new Error(quantityValidation.error);
      }
    }

    try {
      const response = await CarritoService.agregarItem(id_producto, cantidad);
      
      return {
        item: response.item,
        total_carrito: response.total_carrito
      };
    } catch (error: any) {
      const mensajeError = handleCarritoError(error);
      throw new Error(mensajeError);
    }
  }, [validateCarritoOperation, validateQuantity, handleCarritoError]);

  /**
   * Actualiza la cantidad de un item en el carrito
   */
  const actualizarCantidad = useCallback(async (
    id_item: number, 
    cantidad: number,
    stock?: number
  ) => {
    const validation = validateCarritoOperation();
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Validar cantidad si se proporciona stock
    if (stock !== undefined) {
      const quantityValidation = validateQuantity(cantidad, stock);
      if (!quantityValidation.isValid) {
        throw new Error(quantityValidation.error);
      }
    }

    try {
      const response = await CarritoService.actualizarCantidad(id_item, cantidad);
      return {
        item: response.item,
        total_carrito: response.total_carrito
      };
    } catch (error: any) {
      const mensajeError = handleCarritoError(error);
      throw new Error(mensajeError);
    }
  }, [validateCarritoOperation, validateQuantity, handleCarritoError]);

  /**
   * Elimina un item del carrito
   */
  const eliminarItem = useCallback(async (id_item: number) => {
    const validation = validateCarritoOperation();
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    try {
      const response = await CarritoService.eliminarItem(id_item);
      return {
        mensaje: response.mensaje,
        total_carrito: response.total_carrito
      };
    } catch (error: any) {
      const mensajeError = handleCarritoError(error);
      throw new Error(mensajeError);
    }
  }, [validateCarritoOperation, handleCarritoError]);

  /**
   * Vacía completamente el carrito
   */
  const vaciarCarrito = useCallback(async () => {
    const validation = validateCarritoOperation();
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    try {
      const response = await CarritoService.vaciarCarrito();
      return response.mensaje;
    } catch (error: any) {
      const mensajeError = handleCarritoError(error);
      throw new Error(mensajeError);
    }
  }, [validateCarritoOperation, handleCarritoError]);

  /**
   * Confirma la compra y convierte el carrito en venta
   */
  const confirmarCompra = useCallback(async (datosCompra: DatosCompra): Promise<VentaConfirmada> => {
    const validation = validateCarritoOperation();
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    try {
      const compraData = prepareCompraData(datosCompra);
      const response = await CarritoService.confirmarCompra(compraData);
      return response.venta;
    } catch (error: any) {
      const mensajeError = handleCarritoError(error);
      throw new Error(mensajeError);
    }
  }, [validateCarritoOperation, prepareCompraData, handleCarritoError]);

  /**
   * Sincroniza el carrito con el servidor
   */
  const sincronizarCarrito = useCallback(async () => {
    const validation = validateCarritoOperation();
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    try {
      const response = await CarritoService.obtenerCarrito();
      return response.carrito;
    } catch (error: any) {
      const mensajeError = handleCarritoError(error);
      throw new Error(mensajeError);
    }
  }, [validateCarritoOperation, handleCarritoError]);

  // ============================================================================
  // RETORNO DEL HOOK
  // ============================================================================
  
  return {
    obtenerCarrito,
    agregarItem,
    actualizarCantidad,
    eliminarItem,
    vaciarCarrito,
    confirmarCompra,
    sincronizarCarrito
  };
};
