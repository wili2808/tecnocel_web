import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import axiosInstance from '../api/axiosConfig';
import { useAuth } from './AuthContext';

/**
 * Estructura de un item en el carrito actualizada para el backend
 */
interface ItemCarrito {
  id_item: number;
  id_carrito: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  fyh_creacion: string;
  fyh_actualizacion: string;
  producto?: {
    id_producto: number;
    nombre: string;
    descripcion: string;
    precio_venta: string;
    imagen: string;
    stock: number;
  };
}

/**
 * Estado del carrito actualizado
 */
interface EstadoCarrito {
  id_carrito: number | null;
  estado: 'activo' | 'completado' | 'abandonado';
  items: ItemCarrito[];
  total_carrito: number;
  cantidad_items: number;
  cargando: boolean;
  error: string | null;
}

/**
 * Datos de respuesta de compra
 */
interface DatosCompra {
  observaciones?: string;
  moneda?: 'BOB' | 'USD' | 'EUR';
  metodo_pago?: 'efectivo' | 'tarjeta' | 'transferencia' | 'qr';
}

/**
 * Respuesta de venta confirmada
 */
interface VentaConfirmada {
  id_venta: number;
  nro_venta: number;
  total_pagado: number;
  fyh_creacion: string;
}

/**
 * Acciones disponibles para el reducer del carrito
 */
type AccionCarrito =
  | { type: 'INICIALIZAR_CARRITO'; payload: any }
  | { type: 'INICIALIZAR_CARRITO_VACIO' }
  | { type: 'AGREGAR_ITEM'; payload: ItemCarrito }
  | { type: 'ACTUALIZAR_ITEM'; payload: { id_item: number; cantidad: number; subtotal: number } }
  | { type: 'ELIMINAR_ITEM'; payload: number }
  | { type: 'VACIAR_CARRITO' }
  | { type: 'ESTABLECER_CARGANDO'; payload: boolean }
  | { type: 'ESTABLECER_ERROR'; payload: string | null }
  | { type: 'ACTUALIZAR_TOTAL'; payload: number };

const estadoInicial: EstadoCarrito = {
  id_carrito: null,
  estado: 'activo',
  items: [],
  total_carrito: 0,
  cantidad_items: 0,
  cargando: false,
  error: null
};

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

/**
 * Proveedor del contexto del carrito que maneja el estado y las operaciones
 */
export const CarritoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [estado, dispatch] = useReducer(carritoReducer, estadoInicial);
  const { isAuthenticated } = useAuth();

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

      const response = await axiosInstance.get('/carrito/');

      if (response.data.carrito) {
        dispatch({ type: 'INICIALIZAR_CARRITO', payload: response.data.carrito });
      } else {
        dispatch({ type: 'INICIALIZAR_CARRITO_VACIO' });
      }
    } catch (error: any) {
      console.error('Error al obtener carrito:', error);
      const mensajeError = error.response?.data?.mensaje || 'Error al cargar el carrito';
      dispatch({ type: 'ESTABLECER_ERROR', payload: mensajeError });
      dispatch({ type: 'INICIALIZAR_CARRITO_VACIO' });
    } finally {
      dispatch({ type: 'ESTABLECER_CARGANDO', payload: false });
    }
  }, [isAuthenticated]);

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

      const response = await axiosInstance.post('/carrito/items', {
        id_producto,
        cantidad,
        detalles_personalizacion
      });

      if (response.data.item) {
        // Si el item ya existía, se actualizó; si no, se agregó
        const itemExistente = estado.items.find(item => item.id_producto === id_producto);

        if (itemExistente) {
          dispatch({
            type: 'ACTUALIZAR_ITEM',
            payload: {
              id_item: response.data.item.id_item,
              cantidad: response.data.item.cantidad,
              subtotal: response.data.item.subtotal
            }
          });
        } else {
          dispatch({ type: 'AGREGAR_ITEM', payload: response.data.item });
        }

        dispatch({ type: 'ACTUALIZAR_TOTAL', payload: response.data.total_carrito });
      }
    } catch (error: any) {
      console.error('Error al agregar item:', error);

      // Manejar errores específicos del backend
      if (error.response?.status === 400) {
        const mensajeError = error.response?.data?.mensaje || 'Error al agregar producto al carrito';

        // Si es error de stock, mostrar mensaje específico
        if (mensajeError.includes('Stock insuficiente') || mensajeError.includes('stock')) {
          const stockDisponible = error.response?.data?.stock_disponible;
          const cantidadEnCarrito = error.response?.data?.cantidad_actual_en_carrito;

          if (stockDisponible !== undefined && cantidadEnCarrito !== undefined) {
            dispatch({
              type: 'ESTABLECER_ERROR',
              payload: `Stock insuficiente. Disponible: ${stockDisponible}, En carrito: ${cantidadEnCarrito}`
            });
          } else {
            dispatch({
              type: 'ESTABLECER_ERROR',
              payload: `Stock insuficiente para la cantidad solicitada`
            });
          }
        } else {
          dispatch({ type: 'ESTABLECER_ERROR', payload: mensajeError });
        }
      } else {
        const mensajeError = error.response?.data?.mensaje || 'Error al agregar producto al carrito';
        dispatch({ type: 'ESTABLECER_ERROR', payload: mensajeError });
      }

      // IMPORTANTE: Sincronizar el estado del carrito desde el backend en caso de error
      // Esto asegura que el estado local esté siempre sincronizado
      try {
        await obtenerCarrito();
      } catch (syncError) {
        console.error('Error al sincronizar carrito después de error:', syncError);
        // Si falla la sincronización, limpiar el estado local
        dispatch({ type: 'INICIALIZAR_CARRITO_VACIO' });
      }
    } finally {
      dispatch({ type: 'ESTABLECER_CARGANDO', payload: false });
    }
  }, [isAuthenticated, estado.items, obtenerCarrito]);

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

      const response = await axiosInstance.put(`/carrito/items/${id_item}`, {
        cantidad
      });

      if (response.data.item) {
        dispatch({
          type: 'ACTUALIZAR_ITEM',
          payload: {
            id_item: response.data.item.id_item,
            cantidad: response.data.item.cantidad,
            subtotal: response.data.item.subtotal
          }
        });
        dispatch({ type: 'ACTUALIZAR_TOTAL', payload: response.data.total_carrito });
      }
    } catch (error: any) {
      console.error('Error al actualizar cantidad:', error);
      const mensajeError = error.response?.data?.mensaje || 'Error al actualizar la cantidad';
      dispatch({ type: 'ESTABLECER_ERROR', payload: mensajeError });
    } finally {
      dispatch({ type: 'ESTABLECER_CARGANDO', payload: false });
    }
  }, [isAuthenticated]);

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

      const response = await axiosInstance.delete(`/carrito/items/${id_item}`);

      dispatch({ type: 'ELIMINAR_ITEM', payload: id_item });
      dispatch({ type: 'ACTUALIZAR_TOTAL', payload: response.data.total_carrito });
    } catch (error: any) {
      console.error('Error al eliminar item:', error);
      const mensajeError = error.response?.data?.mensaje || 'Error al eliminar producto del carrito';
      dispatch({ type: 'ESTABLECER_ERROR', payload: mensajeError });
    } finally {
      dispatch({ type: 'ESTABLECER_CARGANDO', payload: false });
    }
  }, [isAuthenticated]);

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

      await axiosInstance.delete('/carrito/');

      dispatch({ type: 'VACIAR_CARRITO' });
    } catch (error: any) {
      console.error('Error al vaciar carrito:', error);
      const mensajeError = error.response?.data?.mensaje || 'Error al vaciar el carrito';
      dispatch({ type: 'ESTABLECER_ERROR', payload: mensajeError });
    } finally {
      dispatch({ type: 'ESTABLECER_CARGANDO', payload: false });
    }
  }, [isAuthenticated]);

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

      const response = await axiosInstance.post('/carrito/confirmar-compra', datosCompra);

      if (response.data.venta) {
        // Limpiar carrito después de compra exitosa
        dispatch({ type: 'VACIAR_CARRITO' });
        return response.data.venta;
      } else {
        throw new Error('Respuesta inválida del servidor');
      }
    } catch (error: any) {
      console.error('Error al confirmar compra:', error);
      const mensajeError = error.response?.data?.mensaje || 'Error al procesar la compra';
      dispatch({ type: 'ESTABLECER_ERROR', payload: mensajeError });
      throw new Error(mensajeError);
    } finally {
      dispatch({ type: 'ESTABLECER_CARGANDO', payload: false });
    }
  }, [isAuthenticated]);

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

      const response = await axiosInstance.get('/carrito/');

      if (response.data.carrito) {
        dispatch({ type: 'INICIALIZAR_CARRITO', payload: response.data.carrito });
      } else {
        dispatch({ type: 'INICIALIZAR_CARRITO_VACIO' });
      }
    } catch (error: any) {
      console.error('Error al sincronizar carrito:', error);
      const mensajeError = error.response?.data?.mensaje || 'Error al sincronizar el carrito';
      dispatch({ type: 'ESTABLECER_ERROR', payload: mensajeError });
    } finally {
      dispatch({ type: 'ESTABLECER_CARGANDO', payload: false });
    }
  }, [isAuthenticated]);

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