/**
 * Contexto del Carrito de Compras - Maneja el estado global del carrito
 * Proporciona funcionalidades para agregar, actualizar, eliminar y gestionar items del carrito
 * Incluye sincronización con backend, validaciones de stock y confirmación de compras
 * Utiliza useReducer para gestión eficiente del estado y useCarritoOperations para operaciones
 */
import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { useCarritoOperations } from '../hooks/useCarritoOperations';
import type { EstadoCarrito, DatosCompra, VentaConfirmada, AccionCarrito } from '../types/carrito';

/**
 * Estado inicial del carrito
 * Define valores por defecto para todos los campos del estado
 */
const estadoInicial: EstadoCarrito = {
  id_carrito: null,
  estado: 'activo',
  items: [],
  total_carrito: 0,
  cantidad_items: 0,
  cargando: false,
  error: null,
};

/**
 * Constantes de localStorage para sincronización multi-tab del carrito
 */
const CARRITO_CACHE_KEY = 'carrito_cache';
const CARRITO_TIMESTAMP_KEY = 'carrito_timestamp';

/**
 * Función auxiliar para calcular el total del carrito
 * Excluye items sin stock del cálculo
 * @param items - Array de items del carrito
 * @returns Total calculado solo con items que tienen stock
 */
function calcularTotalConStock(items: any[]): number {
  return items.filter((item) => item.tiene_stock !== false).reduce((total, item) => total + item.subtotal, 0);
}

/**
 * Guarda el carrito en localStorage para sincronización multi-tab
 * @param estado - Estado actual del carrito a guardar
 */
function guardarCarritoEnCache(estado: EstadoCarrito): void {
  try {
    const cacheData = {
      id_carrito: estado.id_carrito,
      estado: estado.estado,
      items: estado.items,
      total_carrito: estado.total_carrito,
      cantidad_items: estado.cantidad_items,
      tiene_items_sin_stock: estado.tiene_items_sin_stock,
      items_sin_stock: estado.items_sin_stock,
      tiene_cambios_precio: estado.tiene_cambios_precio,
      items_con_cambio_precio: estado.items_con_cambio_precio,
      diferencia_total: estado.diferencia_total,
    };
    localStorage.setItem(CARRITO_CACHE_KEY, JSON.stringify(cacheData));
    localStorage.setItem(CARRITO_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error al guardar carrito en caché:', error);
  }
}

/**
 * Limpia el carrito del localStorage
 */
function limpiarCacheCarrito(): void {
  try {
    localStorage.removeItem(CARRITO_CACHE_KEY);
    localStorage.removeItem(CARRITO_TIMESTAMP_KEY);
  } catch (error) {
    console.error('Error al limpiar caché del carrito:', error);
  }
}

// ============================================================================
// REDUCER
// ============================================================================

/**
 * Reducer que maneja las acciones del carrito y actualiza el estado
 * Implementa lógica inmutable para todas las operaciones del carrito
 * Calcula automáticamente totales y cantidades basados en los items
 */
function carritoReducer(estado: EstadoCarrito, accion: AccionCarrito): EstadoCarrito {
  switch (accion.type) {
    case 'INICIALIZAR_CARRITO':
      // Calcular total excluyendo items sin stock
      const itemsIniciales = accion.payload.items || [];
      const totalCalculado = calcularTotalConStock(itemsIniciales);

      return {
        ...estado,
        id_carrito: accion.payload.id_carrito,
        estado: accion.payload.estado || 'activo',
        items: itemsIniciales,
        total_carrito: totalCalculado,
        cantidad_items: itemsIniciales.length,
        cargando: false,
        error: null,
        // Mantener la información de stock validation del backend
        tiene_items_sin_stock: accion.payload.tiene_items_sin_stock,
        items_sin_stock: accion.payload.items_sin_stock,
      };
    case 'INICIALIZAR_CARRITO_VACIO':
      return {
        ...estadoInicial,
        cargando: false,
      };
    case 'AGREGAR_ITEM':
      const itemsConNuevo = [...estado.items, accion.payload];
      const nuevoTotalAgregar = calcularTotalConStock(itemsConNuevo);
      return {
        ...estado,
        items: itemsConNuevo,
        cantidad_items: itemsConNuevo.length,
        total_carrito: nuevoTotalAgregar,
        error: null,
      };
    case 'ACTUALIZAR_ITEM':
      const itemsActualizados = estado.items.map((item) =>
        item.id_item === accion.payload.id_item ? accion.payload : item,
      );
      const nuevoTotalActualizar = calcularTotalConStock(itemsActualizados);
      return {
        ...estado,
        items: itemsActualizados,
        total_carrito: nuevoTotalActualizar,
        error: null,
      };
    case 'ELIMINAR_ITEM':
      const itemsRestantes = estado.items.filter((item) => item.id_item !== accion.payload);
      const nuevoTotalEliminar = calcularTotalConStock(itemsRestantes);
      return {
        ...estado,
        items: itemsRestantes,
        cantidad_items: itemsRestantes.length,
        total_carrito: nuevoTotalEliminar,
        error: null,
      };
    case 'VACIAR_CARRITO':
      return {
        ...estado,
        items: [],
        total_carrito: 0,
        cantidad_items: 0,
        error: null,
      };
    case 'ACTUALIZAR_TOTAL':
      return {
        ...estado,
        total_carrito: accion.payload,
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
 * Define la API pública del contexto para componentes consumidores
 * Incluye operaciones CRUD completas y métodos de utilidad
 */
const CarritoContext = createContext<{
  estado: EstadoCarrito;
  obtenerCarrito: () => Promise<void>;
  agregarItem: (id_producto: number, cantidad: number) => Promise<void>;
  actualizarCantidad: (id_item: number, cantidad: number) => Promise<void>;
  eliminarItem: (id_item: number) => Promise<void>;
  vaciarCarrito: () => Promise<void>;
  confirmarCompra: (datosCompra: DatosCompra) => Promise<VentaConfirmada>;
  // Métodos útiles básicos
  isProductInCart: (id_producto: number) => boolean;
  getProductQuantityInCart: (id_producto: number) => number;
  canAddMoreOfProduct: (id_producto: number, stock: number) => boolean;
  // Método para forzar sincronización
  sincronizarCarrito: () => Promise<void>;
} | null>(null);

/**
 * Hook personalizado para acceder al contexto del carrito
 * Proporciona acceso seguro al contexto con validación de uso
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
 * Integra autenticación, operaciones del backend y gestión de estado local
 * Incluye optimizaciones para evitar re-renders innecesarios
 */
export const CarritoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ============================================================================
  // ESTADO Y HOOKS
  // ============================================================================

  const [estado, dispatch] = useReducer(carritoReducer, estadoInicial);
  const { isAuthenticated, userType } = useAuth();
  const { showNotification } = useNotification();

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
    sincronizarCarrito: sincronizarCarritoService,
  } = useCarritoOperations();

  // ============================================================================
  // OPERACIONES PRINCIPALES DEL CARRITO
  // ============================================================================

  /**
   * Obtiene el carrito activo del cliente desde el servidor
   * Inicializa el estado del carrito con datos del backend
   * Incluye manejo de errores y estados de carga
   * Además, valida el stock de los items y detecta cambios de precio para notificar al usuario
   */
  const obtenerCarrito = useCallback(async () => {
    // Solo cargar carrito para clientes autenticados (no admin/empleado)
    if (!isAuthenticated || userType !== 'cliente') {
      dispatch({ type: 'INICIALIZAR_CARRITO_VACIO' });
      return;
    }

    try {
      dispatch({ type: 'ESTABLECER_CARGANDO', payload: true });
      dispatch({ type: 'ESTABLECER_ERROR', payload: null });

      const carrito = await obtenerCarritoService();

      // VALIDAR STOCK: Detectar items sin stock suficiente
      if (carrito.tiene_items_sin_stock && carrito.items_sin_stock && carrito.items_sin_stock.length > 0) {
        const itemsSinStock = carrito.items_sin_stock;
        const count = itemsSinStock.length;

        // Crear mensaje detallado
        let mensaje =
          count === 1
            ? `"${itemsSinStock[0].nombre_producto}" ya no tiene stock suficiente.`
            : `${count} productos en tu carrito ya no tienen stock suficiente.`;

        // Agregar sugerencia si hay stock parcial
        const itemsConStockParcial = itemsSinStock.filter((i) => i.stock_disponible > 0);
        if (itemsConStockParcial.length > 0) {
          mensaje += ` Algunas unidades aún están disponibles.`;
        }

        // Mostrar notificación con duración extendida
        showNotification(
          mensaje,
          'warning',
          8000, // 8 segundos para que el usuario pueda leer
        );

        console.warn('Items sin stock detectados:', itemsSinStock);
      }

      // VALIDAR PRECIOS: Detectar cambios de precio en los items del carrito
      if (
        carrito.tiene_cambios_precio &&
        carrito.items_con_cambio_precio &&
        carrito.items_con_cambio_precio.length > 0
      ) {
        const itemsConCambio = carrito.items_con_cambio_precio;
        const count = itemsConCambio.length;

        // Determinar si son aumentos o disminuciones
        const aumentos = itemsConCambio.filter((i) => i.diferencia_precio > 0);
        const disminuciones = itemsConCambio.filter((i) => i.diferencia_precio < 0);

        let mensaje = '';
        if (aumentos.length > 0 && disminuciones.length === 0) {
          mensaje =
            count === 1
              ? `El precio de "${itemsConCambio[0].nombre_producto}" aumentó.`
              : `Los precios de ${count} productos aumentaron.`;
        } else if (disminuciones.length > 0 && aumentos.length === 0) {
          mensaje =
            count === 1
              ? `El precio de "${itemsConCambio[0].nombre_producto}" bajó.`
              : `Los precios de ${count} productos bajaron.`;
        } else {
          mensaje = `Los precios de ${count} productos cambiaron.`;
        }

        // Agregar información del total
        if (carrito.diferencia_total) {
          const diferenciaAbs = Math.abs(carrito.diferencia_total);
          mensaje +=
            carrito.diferencia_total > 0
              ? ` Total aumentó en ${diferenciaAbs.toFixed(2)} ARS.`
              : ` Total disminuyó en ${diferenciaAbs.toFixed(2)} ARS.`;
        }

        // Tipo de notificación según el cambio
        const tipoNotificacion = carrito.diferencia_total && carrito.diferencia_total > 0 ? 'warning' : 'info';

        showNotification(
          mensaje,
          tipoNotificacion,
          10000, // 10 segundos para leer
        );

        console.warn('Items con precio cambiado:', itemsConCambio);
      }

      dispatch({ type: 'INICIALIZAR_CARRITO', payload: carrito });
    } catch (error: any) {
      console.error('Error al obtener carrito:', error);
      dispatch({ type: 'ESTABLECER_ERROR', payload: error.message });
      dispatch({ type: 'INICIALIZAR_CARRITO_VACIO' });
    } finally {
      dispatch({ type: 'ESTABLECER_CARGANDO', payload: false });
    }
  }, [isAuthenticated, userType, obtenerCarritoService, showNotification]);

  /**
   * Agrega un producto al carrito
   * Maneja tanto productos nuevos como actualización de cantidades existentes
   * Incluye sincronización automática en caso de errores
   */
  const agregarItem = useCallback(
    async (id_producto: number, cantidad: number) => {
      if (!isAuthenticated) {
        dispatch({ type: 'ESTABLECER_ERROR', payload: 'Debe iniciar sesión para agregar productos al carrito' });
        return;
      }

      try {
        dispatch({ type: 'ESTABLECER_CARGANDO', payload: true });
        dispatch({ type: 'ESTABLECER_ERROR', payload: null });

        const resultado = await agregarItemService(id_producto, cantidad);

        // Si el item ya existía, se actualizó; si no, se agregó
        const itemExistente = estado.items.find((item) => item.id_producto === id_producto);

        if (itemExistente) {
          dispatch({
            type: 'ACTUALIZAR_ITEM',
            payload: resultado.item,
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
    },
    [isAuthenticated, estado.items, agregarItemService, obtenerCarrito],
  );

  /**
   * Actualiza la cantidad de un item en el carrito
   * Valida stock disponible y sincroniza con el backend
   */
  const actualizarCantidad = useCallback(
    async (id_item: number, cantidad: number) => {
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
          payload: resultado.item,
        });
        dispatch({ type: 'ACTUALIZAR_TOTAL', payload: resultado.total_carrito });
      } catch (error: any) {
        console.error('Error al actualizar cantidad:', error);
        dispatch({ type: 'ESTABLECER_ERROR', payload: error.message });
      } finally {
        dispatch({ type: 'ESTABLECER_CARGANDO', payload: false });
      }
    },
    [isAuthenticated, actualizarCantidadService],
  );

  /**
   * Elimina un item del carrito
   * Actualiza totales y sincroniza con el backend
   */
  const eliminarItem = useCallback(
    async (id_item: number) => {
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
    },
    [isAuthenticated, eliminarItemService],
  );

  /**
   * Vacía completamente el carrito
   * Limpia todos los items, resetea totales y elimina caché
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
      limpiarCacheCarrito();
    } catch (error: any) {
      console.error('Error al vaciar carrito:', error);
      dispatch({ type: 'ESTABLECER_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'ESTABLECER_CARGANDO', payload: false });
    }
  }, [isAuthenticated, vaciarCarritoService]);

  /**
   * Confirma la compra y convierte el carrito en venta
   * Procesa la transacción y limpia el carrito después del éxito
   */
  const confirmarCompra = useCallback(
    async (datosCompra: DatosCompra): Promise<VentaConfirmada> => {
      if (!isAuthenticated) {
        throw new Error('Debe iniciar sesión para realizar la compra');
      }

      try {
        dispatch({ type: 'ESTABLECER_CARGANDO', payload: true });
        dispatch({ type: 'ESTABLECER_ERROR', payload: null });

        const venta = await confirmarCompraService(datosCompra);

        // Limpiar carrito después de compra exitosa
        dispatch({ type: 'VACIAR_CARRITO' });
        limpiarCacheCarrito();
        return venta;
      } catch (error: any) {
        console.error('Error al confirmar compra:', error);

        // ✅ MANEJAR ERROR DE CAMBIO DE PRECIO (Fase 2)
        if (error.response?.data?.codigo === 'PRECIOS_CAMBIARON') {
          dispatch({
            type: 'ESTABLECER_ERROR',
            payload: error.response.data.mensaje,
          });

          // Re-obtener carrito para actualizar precios
          await obtenerCarrito();

          throw error; // Re-lanzar para que el componente pueda manejarlo
        }

        dispatch({ type: 'ESTABLECER_ERROR', payload: error.message });
        throw error;
      } finally {
        dispatch({ type: 'ESTABLECER_CARGANDO', payload: false });
      }
    },
    [isAuthenticated, confirmarCompraService, obtenerCarrito],
  );

  // ============================================================================
  // EFECTOS
  // ============================================================================

  // Cargar carrito cuando el usuario cliente se autentica
  useEffect(() => {
    if (isAuthenticated && userType === 'cliente') {
      obtenerCarrito();
    } else {
      dispatch({ type: 'INICIALIZAR_CARRITO_VACIO' });
      limpiarCacheCarrito();
    }
  }, [isAuthenticated, userType, obtenerCarrito]);

  /**
   * Guarda el carrito en localStorage cada vez que cambia
   * Permite sincronización multi-tab y restauración después de recargar
   */
  useEffect(() => {
    if (estado.id_carrito && estado.items.length > 0) {
      guardarCarritoEnCache(estado);
    }
  }, [estado]);

  /**
   * Sincronización cross-tab del carrito
   * Escucha cambios en localStorage desde otras pestañas/ventanas del navegador
   * Permite que cambios en el carrito (agregar/quitar items) se reflejen automáticamente
   */
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CARRITO_CACHE_KEY && e.newValue) {
        try {
          const carritoCacheado = JSON.parse(e.newValue);
          // Cargar carrito desde la otra tab
          dispatch({
            type: 'INICIALIZAR_CARRITO',
            payload: carritoCacheado,
          });
        } catch (error) {
          console.error('Error al sincronizar carrito desde otra tab:', error);
        }
      }
    };

    try {
      window.addEventListener('storage', handleStorageChange);
    } catch (error) {
      console.error('Error al configurar listener de storage para carrito:', error);
    }

    return () => {
      try {
        window.removeEventListener('storage', handleStorageChange);
      } catch (error) {
        console.error('Error al limpiar listener de storage:', error);
      }
    };
  }, []);

  // ============================================================================
  // MÉTODOS DE UTILIDAD
  // ============================================================================

  // Métodos útiles básicos para consultas del estado del carrito
  const isProductInCart = useCallback(
    (id_producto: number) => {
      return estado.items.some((item) => item.id_producto === id_producto);
    },
    [estado.items],
  );

  const getProductQuantityInCart = useCallback(
    (id_producto: number) => {
      const item = estado.items.find((item) => item.id_producto === id_producto);
      return item ? item.cantidad : 0;
    },
    [estado.items],
  );

  const canAddMoreOfProduct = useCallback(
    (id_producto: number, stock: number) => {
      const currentQuantity = getProductQuantityInCart(id_producto);
      return currentQuantity < stock;
    },
    [getProductQuantityInCart],
  );

  /**
   * Método para forzar sincronización del carrito
   * Útil para resolver inconsistencias entre frontend y backend
   */
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
  const contextValue = useMemo(
    () => ({
      estado,
      obtenerCarrito,
      agregarItem,
      actualizarCantidad,
      eliminarItem,
      vaciarCarrito,
      confirmarCompra,
      isProductInCart,
      getProductQuantityInCart,
      canAddMoreOfProduct,
      sincronizarCarrito,
    }),
    [
      estado,
      obtenerCarrito,
      agregarItem,
      actualizarCantidad,
      eliminarItem,
      vaciarCarrito,
      confirmarCompra,
      isProductInCart,
      getProductQuantityInCart,
      canAddMoreOfProduct,
      sincronizarCarrito,
    ],
  );

  return <CarritoContext.Provider value={contextValue}>{children}</CarritoContext.Provider>;
};
