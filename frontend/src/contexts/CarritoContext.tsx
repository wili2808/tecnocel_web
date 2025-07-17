import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import axios from 'axios';

/**
 * Estructura de un item en el carrito
 */
interface ItemCarrito {
  id: number;
  producto_id: number;
  cantidad: number;
  precio: number;
  detalles_personalizacion?: any;
  subtotal: number;
}

/**
 * Estado del carrito
 */
interface EstadoCarrito {
  id: number | null;
  items: ItemCarrito[];
  total: number;
  cargando: boolean;
  error: string | null;
}

/**
 * Acciones disponibles para el reducer del carrito
 */
type AccionCarrito =
  | { type: 'INICIALIZAR_CARRITO'; payload: any }
  | { type: 'INICIALIZAR_CARRITO_VACIO' }
  | { type: 'AGREGAR_ITEM'; payload: ItemCarrito }
  | { type: 'ACTUALIZAR_CANTIDAD'; payload: { id: number; cantidad: number } }
  | { type: 'ELIMINAR_ITEM'; payload: number }
  | { type: 'ESTABLECER_CARGANDO'; payload: boolean }
  | { type: 'ESTABLECER_ERROR'; payload: string };

const estadoInicial: EstadoCarrito = {
  id: 1, // ID temporal para carrito local
  items: [],
  total: 0,
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
        id: accion.payload.id,
        items: accion.payload.items || [],
        total: accion.payload.total || 0,
        error: null
      };
    case 'INICIALIZAR_CARRITO_VACIO':
      return {
        ...estado,
        id: 1, // ID temporal para carrito local
        items: [],
        total: 0,
        error: null
      };
    case 'AGREGAR_ITEM':
      const nuevosItems = [...estado.items, accion.payload];
      return {
        ...estado,
        items: nuevosItems,
        total: nuevosItems.reduce((sum, item) => sum + item.subtotal, 0)
      };
    case 'ACTUALIZAR_CANTIDAD':
      const itemsActualizados = estado.items.map(item =>
        item.id === accion.payload.id
          ? { ...item, cantidad: accion.payload.cantidad, subtotal: item.precio * accion.payload.cantidad }
          : item
      );
      return {
        ...estado,
        items: itemsActualizados,
        total: itemsActualizados.reduce((sum, item) => sum + item.subtotal, 0)
      };
    case 'ELIMINAR_ITEM':
      const itemsRestantes = estado.items.filter(item => item.id !== accion.payload);
      return {
        ...estado,
        items: itemsRestantes,
        total: itemsRestantes.reduce((sum, item) => sum + item.subtotal, 0)
      };
    case 'ESTABLECER_CARGANDO':
      return { ...estado, cargando: accion.payload };
    case 'ESTABLECER_ERROR':
      return { ...estado, error: accion.payload };
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
  agregarItem: (producto_id: number, cantidad: number, detalles_personalizacion?: any) => Promise<void>;
  actualizarCantidad: (item_id: number, cantidad: number) => Promise<void>;
  eliminarItem: (item_id: number) => Promise<void>;
  agregarItemsPrueba: () => void;
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

  /**
   * Obtiene o crea un carrito desde el servidor
   * Como el backend no está implementado, inicializa directamente en modo local
   */
  const obtenerCarrito = useCallback(async () => {
    console.log('Carrito inicializado en modo local (backend no implementado)');
    // Inicializar directamente en modo local sin llamadas HTTP
    dispatch({ type: 'INICIALIZAR_CARRITO_VACIO' });
  }, []);

  /**
   * Agrega un nuevo item al carrito
   * Funciona directamente en modo local
   */
  const agregarItem = useCallback(async (producto_id: number, cantidad: number, detalles_personalizacion?: any) => {
    const nuevoItem = {
      id: Date.now(), // ID temporal
      producto_id,
      cantidad,
      precio: 25000, // Precio simulado
      detalles_personalizacion,
      subtotal: 25000 * cantidad
    };
    dispatch({ type: 'AGREGAR_ITEM', payload: nuevoItem });
  }, []);

  /**
   * Actualiza la cantidad de un item existente
   * Funciona directamente en modo local
   */
  const actualizarCantidad = useCallback(async (item_id: number, cantidad: number) => {
    dispatch({ type: 'ACTUALIZAR_CANTIDAD', payload: { id: item_id, cantidad } });
  }, []);

  /**
   * Elimina un item del carrito
   * Funciona directamente en modo local
   */
  const eliminarItem = useCallback(async (item_id: number) => {
    dispatch({ type: 'ELIMINAR_ITEM', payload: item_id });
  }, []);

  /**
   * Agrega items de prueba al carrito para testing
   */
  const agregarItemsPrueba = useCallback(() => {
    const itemsPrueba = [
      {
        id: 1,
        producto_id: 1,
        cantidad: 1,
        precio: 38990,
        detalles_personalizacion: null,
        subtotal: 38990
      },
      {
        id: 2,
        producto_id: 2,
        cantidad: 1,
        precio: 23900,
        detalles_personalizacion: null,
        subtotal: 23900
      }
    ];

    itemsPrueba.forEach(item => {
      dispatch({ type: 'AGREGAR_ITEM', payload: item });
    });
  }, []);

  useEffect(() => {
    // Inicializar el carrito directamente en modo local
    obtenerCarrito();
  }, [obtenerCarrito]);

  return (
    <CarritoContext.Provider
      value={{
        estado,
        obtenerCarrito,
        agregarItem,
        actualizarCantidad,
        eliminarItem,
        agregarItemsPrueba
      }}
    >
      {children}
    </CarritoContext.Provider>
  );
};