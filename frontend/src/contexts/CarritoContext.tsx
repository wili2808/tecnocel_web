import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useCarritoOperations } from '../hooks/useCarritoOperations';
import type { 
  ItemCarrito, 
  EstadoCarrito, 
  DatosCompra, 
  VentaConfirmada 
} from '../services/carritoService';

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

/**
 * Acciones disponibles para el reducer del carrito
 */
type AccionCarrito =
  | { type: 'INICIALIZAR_CARRITO'; payload: EstadoCarrito }
  | { type: 'INICIALIZAR_CARRITO_VACIO' }
  | { type: 'AGREGAR_ITEM'; payload: ItemCarrito }
  | { type: 'ACTUALIZAR_ITEM'; payload: { id_item: number; cantidad: number; subtotal: number } }
  | { type: 'ELIMINAR_ITEM'; payload: number }
  | { type: 'VACIAR_CARRITO' }
  | { type: 'ESTABLECER_CARGANDO'; payload: boolean }
  | { type: 'ESTABLECER_ERROR'; payload: string | null }
  | { type: 'ACTUALIZAR_TOTAL'; payload: number };

// ============================================================================
// ESTADO INICIAL
// ============================================================================

const estadoInicial: EstadoCarrito = {
  id_carrito: null,
  estado: 'activo',
  items: [],
  total_carrito: 0,
  cantidad_items: 0,
  cargando: false,
  error: null
};

// ============================================================================
// REDUCER
// ============================================================================

/**
 * Reducer que maneja las acciones del carrito y actualiza el estado
 */
function carritoReducer(estado: EstadoCarrito, accion: AccionCarrito): EstadoCarrito {
  switch (accion.type) {
    case 'INICIALIZAR_CARRITO':
      return {
        ...estado,
        id_carrito: accion.payload.id_carrito,
        estado: accion.payload.estado || 'activo',
        items: accion.payload.items || [],
        total_carrito: accion.payload.total_carrito || 0,
        cantidad_items: accion.payload.items?.length || 0,
        cargando: false,
        error: null
      };
    case 'INICIALIZAR_CARRITO_VACIO':
      return {
        ...estadoInicial,
        cargando: false
      };
    case 'AGREGAR_ITEM':
      const itemsConNuevo = [...estado.items, accion.payload];
      const nuevoTotalAgregar = itemsConNuevo.reduce((total, item) => total + item.subtotal, 0);
      return {
        ...estado,
        items: itemsConNuevo,
        cantidad_items: itemsConNuevo.length,
        total_carrito: nuevoTotalAgregar,
        error: null
      };
    case 'ACTUALIZAR_ITEM':
      const itemsActualizados = estado.items.map(item =>
        item.id_item === accion.payload.id_item
          ? { ...item, cantidad: accion.payload.cantidad, subtotal: accion.payload.subtotal }
          : item
      );
      const nuevoTotalActualizar = itemsActualizados.reduce((total, item) => total + item.subtotal, 0);
      return {
        ...estado,
        items: itemsActualizados,
        total_carrito: nuevoTotalActualizar,
        error: null
      };
    case 'ELIMINAR_ITEM':
      const itemsRestantes = estado.items.filter(item => item.id_item !== accion.payload);
      const nuevoTotalEliminar = itemsRestantes.reduce((total, item) => total + item.subtotal, 0);
      return {
        ...estado,
        items: itemsRestantes,
        cantidad_items: itemsRestantes.length,
        total_carrito: nuevoTotalEliminar,
        error: null
      };
    case 'VACIAR_CARRITO':
      return {
        ...estado,
        items: [],
        total_carrito: 0,
        cantidad_items: 0,
        error: null
      };
    case 'ACTUALIZAR_TOTAL':
      return {
        ...estado,
        total_carrito: accion.payload
      };
    case 'ESTABLECER_CARGANDO':
      return { ...estado, cargando: accion.payload };
    case 'ESTABLECER_ERROR':
      return { ...estado, error: accion.payload, cargando: false };
    default:
      return estado;
  }
}

// ============================================================================
// CONTEXTO
// ============================================================================

/**
 * Contexto del carrito que proporciona el estado y métodos para manipularlo
 */
const CarritoContext = createContext<{
  estado: EstadoCarrito;
  obtenerCarrito: () => Promise<void>;
  agregarItem: (id_producto: number, cantidad: number, detalles_personalizacion?: any) => Promise<void>;
  actualizarCantidad: (id_item: number, cantidad: number) => Promise<void>;
  eliminarItem: (id_item: number) => Promise<void>;
  vaciarCarrito: () => Promise<void>;
  confirmarCompra: (datosCompra: DatosCompra) => Promise<VentaConfirmada>;
  agregarItemsPrueba: () => void;
  // Nuevos métodos útiles
  isProductInCart: (id_producto: number) => boolean;
  getProductQuantityInCart: (id_producto: number) => number;
  canAddMoreOfProduct: (id_producto: number, stock: number) => boolean;
  // Método para forzar sincronización
  sincronizarCarrito: () => Promise<void>;
} | null>(null);

/**
 * Hook personalizado para acceder al contexto del carrito
 */
export const useCarrito = () => {
  const context = useContext(CarritoContext);
  if (!context) {
    throw new Error('useCarrito debe ser usado dentro de un CarritoProvider');
  }
  return context;
};

// ============================================================================
// PROVIDER
// ============================================================================

/**
 * Proveedor del contexto del carrito que maneja el estado y las operaciones
 */
export const CarritoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [estado, dispatch] = useReducer(carritoReducer, estadoInicial);
  const { isAuthenticated } = useAuth();
  
  // ============================================================================
  // HOOKS DE OPERACIONES
  // ============================================================================
  
  // Usar el hook de operaciones del carrito
  const {
    obtenerCarrito: obtenerCarritoService,
    agregarItem: agregarItemService,
    actualizarCantidad: actualizarCantidadService,
    eliminarItem: eliminarItemService,
    vaciarCarrito: vaciarCarritoService,
    confirmarCompra: confirmarCompraService,
    sincronizarCarrito: sincronizarCarritoService
  } = useCarritoOperations();

  /**
   * Obtiene el carrito activo del cliente desde el servidor
   */
  const obtenerCarrito = useCallback(async () => {
    if (!isAuthenticated) {
      dispatch({ type: 'INICIALIZAR_CARRITO_VACIO' });
      return;
    }

    try {
      dispatch({ type: 'ESTABLECER_CARGANDO', payload: true });
      dispatch({ type: 'ESTABLECER_ERROR', payload: null });

      const carrito = await obtenerCarritoService();
      dispatch({ type: 'INICIALIZAR_CARRITO', payload: carrito });
    } catch (error: any) {
      console.error('Error al obtener carrito:', error);
      dispatch({ type: 'ESTABLECER_ERROR', payload: error.message });
      dispatch({ type: 'INICIALIZAR_CARRITO_VACIO' });
    } finally {
      dispatch({ type: 'ESTABLECER_CARGANDO', payload: false });
    }
  }, [isAuthenticated, obtenerCarritoService]);

  /**
   * Agrega un producto al carrito
   */
  const agregarItem = useCallback(async (id_producto: number, cantidad: number, detalles_personalizacion?: any) => {
    if (!isAuthenticated) {
      dispatch({ type: 'ESTABLECER_ERROR', payload: 'Debe iniciar sesión para agregar productos al carrito' });
      return;
    }

    try {
      dispatch({ type: 'ESTABLECER_CARGANDO', payload: true });
      dispatch({ type: 'ESTABLECER_ERROR', payload: null });

      const resultado = await agregarItemService(id_producto, cantidad, detalles_personalizacion);

      // Si el item ya existía, se actualizó; si no, se agregó
      const itemExistente = estado.items.find(item => item.id_producto === id_producto);

      if (itemExistente) {
        dispatch({
          type: 'ACTUALIZAR_ITEM',
          payload: {
            id_item: resultado.item.id_item,
            cantidad: resultado.item.cantidad,
            subtotal: resultado.item.subtotal
          }
        });
      } else {
        dispatch({ type: 'AGREGAR_ITEM', payload: resultado.item });
      }

      dispatch({ type: 'ACTUALIZAR_TOTAL', payload: resultado.total_carrito });
    } catch (error: any) {
      console.error('Error al agregar item:', error);
      dispatch({ type: 'ESTABLECER_ERROR', payload: error.message });

      // IMPORTANTE: Sincronizar el estado del carrito desde el backend en caso de error
      try {
        await obtenerCarrito();
      } catch (syncError) {
        console.error('Error al sincronizar carrito después de error:', syncError);
        dispatch({ type: 'INICIALIZAR_CARRITO_VACIO' });
      }
    } finally {
      dispatch({ type: 'ESTABLECER_CARGANDO', payload: false });
    }
  }, [isAuthenticated, estado.items, agregarItemService, obtenerCarrito]);

  /**
   * Actualiza la cantidad de un item en el carrito
   */
  const actualizarCantidad = useCallback(async (id_item: number, cantidad: number) => {
    if (!isAuthenticated) {
      dispatch({ type: 'ESTABLECER_ERROR', payload: 'Debe iniciar sesión para modificar el carrito' });
      return;
    }

    try {
      dispatch({ type: 'ESTABLECER_CARGANDO', payload: true });
      dispatch({ type: 'ESTABLECER_ERROR', payload: null });

      const resultado = await actualizarCantidadService(id_item, cantidad);

      dispatch({
        type: 'ACTUALIZAR_ITEM',
        payload: {
          id_item: resultado.item.id_item,
          cantidad: resultado.item.cantidad,
          subtotal: resultado.item.subtotal
        }
      });
      dispatch({ type: 'ACTUALIZAR_TOTAL', payload: resultado.total_carrito });
    } catch (error: any) {
      console.error('Error al actualizar cantidad:', error);
      dispatch({ type: 'ESTABLECER_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'ESTABLECER_CARGANDO', payload: false });
    }
  }, [isAuthenticated, actualizarCantidadService]);

  /**
   * Elimina un item del carrito
   */
  const eliminarItem = useCallback(async (id_item: number) => {
    if (!isAuthenticated) {
      dispatch({ type: 'ESTABLECER_ERROR', payload: 'Debe iniciar sesión para modificar el carrito' });
      return;
    }

    try {
      dispatch({ type: 'ESTABLECER_CARGANDO', payload: true });
      dispatch({ type: 'ESTABLECER_ERROR', payload: null });

      const resultado = await eliminarItemService(id_item);

      dispatch({ type: 'ELIMINAR_ITEM', payload: id_item });
      dispatch({ type: 'ACTUALIZAR_TOTAL', payload: resultado.total_carrito });
    } catch (error: any) {
      console.error('Error al eliminar item:', error);
      dispatch({ type: 'ESTABLECER_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'ESTABLECER_CARGANDO', payload: false });
    }
  }, [isAuthenticated, eliminarItemService]);

  /**
   * Vacía completamente el carrito
   */
  const vaciarCarrito = useCallback(async () => {
    if (!isAuthenticated) {
      dispatch({ type: 'ESTABLECER_ERROR', payload: 'Debe iniciar sesión para vaciar el carrito' });
      return;
    }

    try {
      dispatch({ type: 'ESTABLECER_CARGANDO', payload: true });
      dispatch({ type: 'ESTABLECER_ERROR', payload: null });

      await vaciarCarritoService();
      dispatch({ type: 'VACIAR_CARRITO' });
    } catch (error: any) {
      console.error('Error al vaciar carrito:', error);
      dispatch({ type: 'ESTABLECER_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'ESTABLECER_CARGANDO', payload: false });
    }
  }, [isAuthenticated, vaciarCarritoService]);

  /**
   * Confirma la compra y convierte el carrito en venta
   */
  const confirmarCompra = useCallback(async (datosCompra: DatosCompra): Promise<VentaConfirmada> => {
    if (!isAuthenticated) {
      throw new Error('Debe iniciar sesión para realizar la compra');
    }

    try {
      dispatch({ type: 'ESTABLECER_CARGANDO', payload: true });
      dispatch({ type: 'ESTABLECER_ERROR', payload: null });

      const venta = await confirmarCompraService(datosCompra);

      // Limpiar carrito después de compra exitosa
      dispatch({ type: 'VACIAR_CARRITO' });
      return venta;
    } catch (error: any) {
      console.error('Error al confirmar compra:', error);
      dispatch({ type: 'ESTABLECER_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'ESTABLECER_CARGANDO', payload: false });
    }
  }, [isAuthenticated, confirmarCompraService]);

  /**
   * Agrega items de prueba al carrito (solo para desarrollo)
   */
  const agregarItemsPrueba = useCallback(async () => {
    if (!isAuthenticated) {
      dispatch({ type: 'ESTABLECER_ERROR', payload: 'Debe iniciar sesión para usar esta función' });
      return;
    }

    try {
      // Agregar algunos productos de prueba
      await agregarItem(1, 1);
      await agregarItem(2, 2);
    } catch (error) {
      console.error('Error al agregar items de prueba:', error);
    }
  }, [isAuthenticated, agregarItem]);

  // ============================================================================
  // EFECTOS
  // ============================================================================
  
  // Cargar carrito cuando el usuario se autentica
  useEffect(() => {
    if (isAuthenticated) {
      obtenerCarrito();
    } else {
      dispatch({ type: 'INICIALIZAR_CARRITO_VACIO' });
    }
  }, [isAuthenticated, obtenerCarrito]);

  // Nuevos métodos útiles
  const isProductInCart = useCallback((id_producto: number) => {
    return estado.items.some(item => item.id_producto === id_producto);
  }, [estado.items]);

  const getProductQuantityInCart = useCallback((id_producto: number) => {
    const item = estado.items.find(item => item.id_producto === id_producto);
    return item ? item.cantidad : 0;
  }, [estado.items]);

  const canAddMoreOfProduct = useCallback((id_producto: number, stock: number) => {
    const currentQuantity = getProductQuantityInCart(id_producto);
    return currentQuantity < stock;
  }, [getProductQuantityInCart]);

  // Método para forzar sincronización
  const sincronizarCarrito = useCallback(async () => {
    if (!isAuthenticated) {
      dispatch({ type: 'ESTABLECER_ERROR', payload: 'Debe iniciar sesión para sincronizar el carrito' });
      return;
    }

    try {
      dispatch({ type: 'ESTABLECER_CARGANDO', payload: true });
      dispatch({ type: 'ESTABLECER_ERROR', payload: null });

      const carrito = await sincronizarCarritoService();
      dispatch({ type: 'INICIALIZAR_CARRITO', payload: carrito });
    } catch (error: any) {
      console.error('Error al sincronizar carrito:', error);
      dispatch({ type: 'ESTABLECER_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'ESTABLECER_CARGANDO', payload: false });
    }
  }, [isAuthenticated, sincronizarCarritoService]);

  // ============================================================================
  // VALOR DEL CONTEXTO OPTIMIZADO
  // ============================================================================
  
  // OPTIMIZACIÓN: Memoizar el valor del contexto para evitar re-renders innecesarios
  const contextValue = useMemo(() => ({
    estado,
    obtenerCarrito,
    agregarItem,
    actualizarCantidad,
    eliminarItem,
    vaciarCarrito,
    confirmarCompra,
    agregarItemsPrueba,
    isProductInCart,
    getProductQuantityInCart,
    canAddMoreOfProduct,
    sincronizarCarrito
  }), [
    estado,
    obtenerCarrito,
    agregarItem,
    actualizarCantidad,
    eliminarItem,
    vaciarCarrito,
    confirmarCompra,
    agregarItemsPrueba,
    isProductInCart,
    getProductQuantityInCart,
    canAddMoreOfProduct,
    sincronizarCarrito
  ]);

  return (
    <CarritoContext.Provider value={contextValue}>
      {children}
    </CarritoContext.Provider>
  );
};