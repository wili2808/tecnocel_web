import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

// Tipos
interface ItemCarrito {
  id: number;
  producto_id: number;
  cantidad: number;
  precio: number;
  detalles_personalizacion?: any;
  subtotal: number;
}

interface EstadoCarrito {
  id: number | null;
  items: ItemCarrito[];
  total: number;
  cargando: boolean;
  error: string | null;
}

type AccionCarrito =
  | { type: 'INICIALIZAR_CARRITO'; payload: any }
  | { type: 'AGREGAR_ITEM'; payload: ItemCarrito }
  | { type: 'ACTUALIZAR_CANTIDAD'; payload: { id: number; cantidad: number } }
  | { type: 'ELIMINAR_ITEM'; payload: number }
  | { type: 'ESTABLECER_CARGANDO'; payload: boolean }
  | { type: 'ESTABLECER_ERROR'; payload: string };

// Estado inicial
const estadoInicial: EstadoCarrito = {
  id: null,
  items: [],
  total: 0,
  cargando: false,
  error: null
};

// Reducer
function carritoReducer(estado: EstadoCarrito, accion: AccionCarrito): EstadoCarrito {
  switch (accion.type) {
    case 'INICIALIZAR_CARRITO':
      return {
        ...estado,
        id: accion.payload.id,
        items: accion.payload.items || [],
        total: accion.payload.total || 0
      };
    case 'AGREGAR_ITEM':
      return {
        ...estado,
        items: [...estado.items, accion.payload],
        total: estado.total + accion.payload.subtotal
      };
    case 'ACTUALIZAR_CANTIDAD':
      return {
        ...estado,
        items: estado.items.map(item =>
          item.id === accion.payload.id
            ? { ...item, cantidad: accion.payload.cantidad }
            : item
        ),
        total: estado.items.reduce((sum, item) =>
          item.id === accion.payload.id
            ? sum + item.precio * accion.payload.cantidad
            : sum + item.precio * item.cantidad
        , 0)
      };
    case 'ELIMINAR_ITEM':
      const itemAEliminar = estado.items.find(item => item.id === accion.payload);
      return {
        ...estado,
        items: estado.items.filter(item => item.id !== accion.payload),
        total: estado.total - (itemAEliminar ? itemAEliminar.subtotal : 0)
      };
    case 'ESTABLECER_CARGANDO':
      return { ...estado, cargando: accion.payload };
    case 'ESTABLECER_ERROR':
      return { ...estado, error: accion.payload };
    default:
      return estado;
  }
}

// Contexto
const CarritoContext = createContext<{
  estado: EstadoCarrito;
  obtenerCarrito: () => Promise<void>;
  agregarItem: (producto_id: number, cantidad: number, detalles_personalizacion?: any) => Promise<void>;
  actualizarCantidad: (item_id: number, cantidad: number) => Promise<void>;
  eliminarItem: (item_id: number) => Promise<void>;
} | null>(null);

// Hook personalizado
export const useCarrito = () => {
  const context = useContext(CarritoContext);
  if (!context) {
    throw new Error('useCarrito debe ser usado dentro de un CarritoProvider');
  }
  return context;
};

// Provider
export const CarritoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [estado, dispatch] = useReducer(carritoReducer, estadoInicial);

  // Obtener o crear carrito
  const obtenerCarrito = async () => {
    try {
      dispatch({ type: 'ESTABLECER_CARGANDO', payload: true });
      const { data } = await axios.post('/api/carrito/obtener-carrito');
      dispatch({ type: 'INICIALIZAR_CARRITO', payload: data });
    } catch (error) {
      dispatch({ type: 'ESTABLECER_ERROR', payload: 'Error al obtener el carrito' });
    } finally {
      dispatch({ type: 'ESTABLECER_CARGANDO', payload: false });
    }
  };

  // Agregar item al carrito
  const agregarItem = async (producto_id: number, cantidad: number, detalles_personalizacion?: any) => {
    try {
      dispatch({ type: 'ESTABLECER_CARGANDO', payload: true });
      const { data } = await axios.post('/api/carrito/items', {
        carrito_id: estado.id,
        producto_id,
        cantidad,
        detalles_personalizacion
      });
      dispatch({ type: 'AGREGAR_ITEM', payload: data });
    } catch (error) {
      dispatch({ type: 'ESTABLECER_ERROR', payload: 'Error al agregar item al carrito' });
    } finally {
      dispatch({ type: 'ESTABLECER_CARGANDO', payload: false });
    }
  };

  // Actualizar cantidad de un item
  const actualizarCantidad = async (item_id: number, cantidad: number) => {
    try {
      dispatch({ type: 'ESTABLECER_CARGANDO', payload: true });
      await axios.put(`/api/carrito/items/${item_id}/cantidad`, { cantidad });
      dispatch({ type: 'ACTUALIZAR_CANTIDAD', payload: { id: item_id, cantidad } });
    } catch (error) {
      dispatch({ type: 'ESTABLECER_ERROR', payload: 'Error al actualizar cantidad' });
    } finally {
      dispatch({ type: 'ESTABLECER_CARGANDO', payload: false });
    }
  };

  // Eliminar item del carrito
  const eliminarItem = async (item_id: number) => {
    try {
      dispatch({ type: 'ESTABLECER_CARGANDO', payload: true });
      await axios.delete(`/api/carrito/items/${item_id}`);
      dispatch({ type: 'ELIMINAR_ITEM', payload: item_id });
    } catch (error) {
      dispatch({ type: 'ESTABLECER_ERROR', payload: 'Error al eliminar item' });
    } finally {
      dispatch({ type: 'ESTABLECER_CARGANDO', payload: false });
    }
  };

  // Cargar carrito inicial
  useEffect(() => {
    obtenerCarrito();
  }, []);

  return (
    <CarritoContext.Provider
      value={{
        estado,
        obtenerCarrito,
        agregarItem,
        actualizarCantidad,
        eliminarItem
      }}
    >
      {children}
    </CarritoContext.Provider>
  );
};