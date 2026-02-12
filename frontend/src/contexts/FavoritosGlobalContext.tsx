/**
 * Contexto Global de Favoritos - Maneja el estado global de favoritos del cliente
 * OPTIMIZACIÓN: Patrón de suscripción granular para evitar re-renders innecesarios
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import { favoritoService } from '../services/favoritoService';
import { useNotification } from './NotificationContext';

// Constantes
const FAVORITOS_CACHE_KEY = import.meta.env.VITE_FAVORITOS_CACHE_KEY || 'favoritos_cache';
const CACHE_DURATION = parseInt(import.meta.env.VITE_FAVORITOS_CACHE_DURATION || '300000'); // 5 minutos por defecto

/**
 * Estructura de un favorito
 */
export interface Favorito {
    id_favorito: number;
    id_cliente: number;
    id_producto: number;
    fyh_creacion: string;
    producto?: {
        id_producto: number;
        nombre: string;
        descripcion: string | null;
        precio_venta: string;
        imagen_url?: string | null;
        stock: number;
    };
}

/**
 * Estado del contexto de favoritos
 */
interface FavoritosState {
    favoritos: Map<number, boolean>; // Map de productId -> isFavorite para O(1) lookup
    favoritosCompletos: Favorito[]; // Array completo de favoritos con datos del producto
    loading: boolean;
    error: string | null;
    lastUpdated: number | null;
}

/**
 * Métodos del contexto de favoritos
 */
interface FavoritosContextType extends FavoritosState {
    // Métodos principales
    isFavorito: (productId: number) => boolean;
    toggleFavorito: (productId: number) => Promise<boolean>;
    addFavorito: (productId: number) => Promise<boolean>;
    removeFavorito: (productId: number) => Promise<boolean>;

    // Métodos de gestión
    loadFavoritos: () => Promise<void>;
    refreshFavoritos: () => Promise<void>;
    clearFavoritos: () => void;
    removeAllFavoritos: (productIds: number[]) => Promise<boolean>; // ✅ NUEVO MÉTODO
    syncWithBackend: () => Promise<void>; // ✅ NUEVO MÉTODO

    // Métodos de utilidad
    getFavoritosCount: () => number;
    getFavoritosIds: () => number[];
    getFavoritosCompletos: () => Favorito[];

    // Métodos de cache
    isCacheValid: () => boolean;
    invalidateCache: () => void;
}

// Creación del contexto
const FavoritosContext = createContext<FavoritosContextType | undefined>(undefined);

/**
 * Hook personalizado para usar el contexto de favoritos
 */
export const useFavoritosGlobal = () => {
    const context = useContext(FavoritosContext);
    if (context === undefined) {
        throw new Error('useFavoritosGlobal debe ser usado dentro de un FavoritosGlobalProvider');
    }
    return context;
};

/**
 * Hook optimizado para verificar si un producto específico es favorito
 * SOLO se re-renderiza cuando cambia el estado de favorito del producto específico
 */
export const useFavoritoProducto = (productId: number) => {
    const context = useContext(FavoritosContext);
    if (context === undefined) {
        throw new Error('useFavoritoProducto debe ser usado dentro de un FavoritosGlobalProvider');
    }

    // Usar useMemo para memoizar el estado de favorito específico
    const isFavorito = useMemo(() => {
        return context.favoritos.get(productId) || false;
    }, [context.favoritos, productId]);

    // Memoizar las funciones para evitar re-creaciones
    const toggleFavorito = useCallback(async () => {
        return await context.toggleFavorito(productId);
    }, [context.toggleFavorito, productId]);

    const addFavorito = useCallback(async () => {
        return await context.addFavorito(productId);
    }, [context.addFavorito, productId]);

    const removeFavorito = useCallback(async () => {
        return await context.removeFavorito(productId);
    }, [context.removeFavorito, productId]);

    return {
        isFavorito,
        toggleFavorito,
        addFavorito,
        removeFavorito,
        loading: context.loading
    };
};

interface FavoritosGlobalProviderProps {
    children: React.ReactNode;
}

/**
 * Proveedor del contexto global de favoritos
 * OPTIMIZACIÓN: Uso de Map para búsquedas O(1) y memoización del contexto
 */
export const FavoritosGlobalProvider: React.FC<FavoritosGlobalProviderProps> = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const { showNotification } = useNotification();

    // OPTIMIZACIÓN: Usar useRef para evitar dependencias circulares
    const showNotificationRef = useRef(showNotification);

    // Actualizar la referencia cuando showNotification cambie
    useEffect(() => {
        showNotificationRef.current = showNotification;
    }, [showNotification]);

    // Estado del contexto
    const [state, setState] = useState<FavoritosState>({
        favoritos: new Map(),
        favoritosCompletos: [],
        loading: false,
        error: null,
        lastUpdated: null
    });

    /**
     * Verifica si el cache es válido
     */
    const isCacheValid = useCallback((): boolean => {
        if (!state.lastUpdated) return false;
        return Date.now() - state.lastUpdated < CACHE_DURATION;
    }, [state.lastUpdated]);

    /**
     * Invalida el cache
     */
    const invalidateCache = useCallback(() => {
        setState(prev => ({
            ...prev,
            lastUpdated: null
        }));
        // También limpiar localStorage
        localStorage.removeItem(FAVORITOS_CACHE_KEY);
    }, []);

    /**
     * Sincroniza el cache con el estado actual
     * ✅ FIX: También limpia el cache cuando no hay favoritos
     */
    const syncCache = useCallback(() => {
        if (!isAuthenticated || !user?.id) {
            // Usuario no autenticado, limpiar cache
            localStorage.removeItem(FAVORITOS_CACHE_KEY);
            return;
        }

        if (state.favoritos.size > 0) {
            // Hay favoritos, guardar en cache
            const cacheData = {
                userId: user.id,
                favoritosIds: Array.from(state.favoritos.keys()),
                favoritosCompletos: state.favoritosCompletos,
                timestamp: Date.now()
            };
            localStorage.setItem(FAVORITOS_CACHE_KEY, JSON.stringify(cacheData));
        } else {
            // ✅ FIX: No hay favoritos, limpiar el cache
            localStorage.removeItem(FAVORITOS_CACHE_KEY);
        }
    }, [isAuthenticated, user?.id, state.favoritos, state.favoritosCompletos]);

    /**
     * Carga los favoritos del usuario desde el servidor
     */
    const loadFavoritos = useCallback(async () => {
        if (!isAuthenticated || !user?.id) {
            setState(prev => ({
                ...prev,
                favoritos: new Map(),
                favoritosCompletos: [],
                loading: false,
                error: null
            }));
            // Limpiar cache cuando no hay usuario autenticado
            localStorage.removeItem(FAVORITOS_CACHE_KEY);
            return;
        }

        // Verificar cache en localStorage primero
        const cachedData = localStorage.getItem(FAVORITOS_CACHE_KEY);
        if (cachedData) {
            try {
                const parsed = JSON.parse(cachedData);
                // Verificar que el cache sea del usuario actual y esté vigente
                if (parsed.userId === user.id && Date.now() - parsed.timestamp < CACHE_DURATION) {
                    const favoritosMap = new Map();
                    parsed.favoritosIds.forEach((id: number) => favoritosMap.set(id, true));

                    setState(prev => ({
                        ...prev,
                        favoritos: favoritosMap,
                        favoritosCompletos: parsed.favoritosCompletos,
                        loading: false,
                        lastUpdated: parsed.timestamp
                    }));
                    console.log('Favoritos cargados desde cache localStorage');
                    return;
                }
            } catch (error) {
                console.error('Error al parsear cache de localStorage:', error);
                localStorage.removeItem(FAVORITOS_CACHE_KEY);
            }
        }

        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const response = await favoritoService.getFavoritos(user.id);

            // Crear Map para búsquedas O(1)
            const favoritosMap = new Map();
            response.data.forEach((favorito: Favorito) => {
                favoritosMap.set(favorito.id_producto, true);
            });

            const newState = {
                favoritos: favoritosMap,
                favoritosCompletos: response.data,
                loading: false,
                error: null,
                lastUpdated: Date.now()
            };

            setState(newState);

            // Guardar en cache
            const cacheData = {
                userId: user.id,
                favoritosIds: Array.from(favoritosMap.keys()),
                favoritosCompletos: response.data,
                timestamp: Date.now()
            };
            localStorage.setItem(FAVORITOS_CACHE_KEY, JSON.stringify(cacheData));

        } catch (error) {
            console.error('Error al cargar favoritos:', error);
            setState(prev => ({
                ...prev,
                loading: false,
                error: 'Error al cargar favoritos'
            }));
        }
    }, [isAuthenticated, user?.id]); // OPTIMIZACIÓN: Remover showNotification de dependencias

    /**
     * Verifica si un producto es favorito
     */
    const isFavorito = useCallback((productId: number): boolean => {
        return state.favoritos.get(productId) || false;
    }, [state.favoritos]);

    /**
     * Agrega un producto a favoritos
     */
    const addFavorito = useCallback(async (productId: number): Promise<boolean> => {
        if (!isAuthenticated || !user?.id) {
            showNotificationRef.current('Debes iniciar sesión para agregar favoritos', 'warning');
            return false;
        }

        try {
            const response = await favoritoService.addFavorito(user.id, productId);

            if (response.success) {
                // Actualizar estado optimizado - solo el producto específico
                setState(prev => {
                    const newFavoritos = new Map(prev.favoritos);
                    newFavoritos.set(productId, true);

                    return {
                        ...prev,
                        favoritos: newFavoritos,
                        lastUpdated: Date.now()
                    };
                });

                // ✅ El syncCache se ejecutará automáticamente por el useEffect

                showNotificationRef.current('Producto agregado a favoritos', 'success');
                return true;
            } else {
                showNotificationRef.current(response.message || 'Error al agregar favorito', 'error');
                return false;
            }
        } catch (error: any) {
            console.error('Error al agregar favorito:', error);

            // Manejar errores específicos
            if (error.response?.status === 409) {
                showNotificationRef.current('El producto ya está en favoritos', 'warning');
                // Sincronizar estado con el backend - el producto YA está en favoritos
                setState(prev => {
                    const newFavoritos = new Map(prev.favoritos);
                    newFavoritos.set(productId, true);
                    return { ...prev, favoritos: newFavoritos };
                });

                // ✅ El syncCache se ejecutará automáticamente por el useEffect

                return true; // Considerar como éxito ya que el objetivo se logró
            } else if (error.response?.status === 404) {
                showNotificationRef.current('Producto no encontrado', 'error');
                return false;
            } else {
                showNotificationRef.current('Error al agregar favorito', 'error');
                return false;
            }
        }
    }, [isAuthenticated, user?.id]);

    /**
     * Remueve un producto de favoritos
     */
    const removeFavorito = useCallback(async (productId: number): Promise<boolean> => {
        if (!isAuthenticated || !user?.id) {
            showNotificationRef.current('Debes iniciar sesión para quitar favoritos', 'warning');
            return false;
        }

        try {
            const response = await favoritoService.removeFavorito(user.id, productId);

            if (response.success) {
                // Actualizar estado optimizado - solo el producto específico
                setState(prev => {
                    const newFavoritos = new Map(prev.favoritos);
                    newFavoritos.delete(productId);

                    return {
                        ...prev,
                        favoritos: newFavoritos,
                        lastUpdated: Date.now()
                    };
                });

                // ✅ El syncCache se ejecutará automáticamente por el useEffect

                showNotificationRef.current('Producto removido de favoritos', 'success');
                return true;
            } else {
                showNotificationRef.current(response.message || 'Error al quitar favorito', 'error');
                return false;
            }
        } catch (error: any) {
            console.error('Error al quitar favorito:', error);

            // Manejar errores específicos
            if (error.response?.status === 404) {
                showNotificationRef.current('El producto no está en favoritos', 'warning');
                // Sincronizar estado con el backend - remover del estado local
                setState(prev => {
                    const newFavoritos = new Map(prev.favoritos);
                    newFavoritos.delete(productId);
                    return { ...prev, favoritos: newFavoritos };
                });

                // ✅ El syncCache se ejecutará automáticamente por el useEffect

                return true; // Considerar como éxito ya que el objetivo se logró
            } else {
                showNotificationRef.current('Error al quitar favorito', 'error');
                return false;
            }
        }
    }, [isAuthenticated, user?.id]);

    /**
     * Toggle de favorito (agregar/quitar)
     * OPTIMIZACIÓN: Manejo inteligente de desincronización con backend
     */
    const toggleFavorito = useCallback(async (productId: number): Promise<boolean> => {
        const isCurrentlyFavorite = state.favoritos.get(productId);

        if (isCurrentlyFavorite) {
            // El frontend piensa que está en favoritos, intentar quitar
            const result = await removeFavorito(productId);
            return result;
        } else {
            // El frontend piensa que NO está en favoritos, intentar agregar
            const result = await addFavorito(productId);

            // Si hay error 409 (ya está en favoritos), significa que hay desincronización
            // En este caso, el addFavorito ya sincronizó el estado, así que el toggle fue exitoso
            return result;
        }
    }, [addFavorito, removeFavorito, state.favoritos]); // Incluir state.favoritos para detectar cambios

    /**
     * Refresca los favoritos desde el servidor
     */
    const refreshFavoritos = useCallback(async () => {
        invalidateCache();
        await loadFavoritos();
    }, [invalidateCache, loadFavoritos]);

    /**
     * Limpia todos los favoritos del estado
     */
    const clearFavoritos = useCallback(() => {
        setState(prev => ({
            ...prev,
            favoritos: new Map(),
            favoritosCompletos: [],
            lastUpdated: null
        }));
        localStorage.removeItem(FAVORITOS_CACHE_KEY);
    }, []);

    /**
     * ✅ NUEVO: Elimina múltiples favoritos de manera eficiente
     * Usado para sincronizar cuando se eliminan todos desde UserPanel
     * ✅ FIX: Mejor manejo de sincronización de cache
     */
    const removeAllFavoritos = useCallback(async (productIds: number[]): Promise<boolean> => {
        if (!isAuthenticated || !user?.id || productIds.length === 0) {
            return false;
        }

        try {
            // ✅ OPTIMIZACIÓN: Eliminar todos los favoritos en paralelo
            const removePromises = productIds.map(productId =>
                favoritoService.removeFavorito(user.id, productId)
            );

            const results = await Promise.allSettled(removePromises);

            // Verificar si todas las eliminaciones fueron exitosas
            const allSuccess = results.every(result => result.status === 'fulfilled');

            if (!allSuccess) {
                console.warn('Algunas eliminaciones fallaron, sincronizando con backend...');
            }

            // ✅ ACTUALIZAR ESTADO GLOBAL INMEDIATAMENTE
            setState(prev => {
                const newFavoritos = new Map(prev.favoritos);
                productIds.forEach(id => newFavoritos.delete(id));

                return {
                    ...prev,
                    favoritos: newFavoritos,
                    favoritosCompletos: prev.favoritosCompletos.filter(
                        f => !productIds.includes(f.id_producto)
                    ),
                    lastUpdated: Date.now()
                };
            });

            // ✅ FIX: El syncCache se ejecutará automáticamente por el useEffect
            // No necesitamos setTimeout ya que tenemos useEffect que observa state.favoritos

            return true;
        } catch (error) {
            console.error('Error al eliminar múltiples favoritos:', error);
            return false;
        }
    }, [isAuthenticated, user?.id]);

    /**
     * ✅ NUEVO: Sincroniza el estado local con el backend
     * Útil después de operaciones masivas o cuando hay desincronización
     */
    const syncWithBackend = useCallback(async () => {
        if (!isAuthenticated || !user?.id) return;

        try {
            // Obtener favoritos actuales del backend
            const response = await favoritoService.getFavoritos(user.id);

            // Crear nuevo Map con datos del backend
            const favoritosMap = new Map();
            response.data.forEach((favorito: Favorito) => {
                favoritosMap.set(favorito.id_producto, true);
            });

            // Actualizar estado con datos del backend
            setState(prev => ({
                ...prev,
                favoritos: favoritosMap,
                favoritosCompletos: response.data,
                lastUpdated: Date.now(),
                error: null
            }));

            // ✅ El syncCache se ejecutará automáticamente por el useEffect

            console.log('Estado de favoritos sincronizado con backend');
        } catch (error) {
            console.error('Error al sincronizar con backend:', error);
            setState(prev => ({
                ...prev,
                error: 'Error al sincronizar favoritos'
            }));
        }
    }, [isAuthenticated, user?.id]);

    /**
     * Obtiene el conteo de favoritos
     */
    const getFavoritosCount = useCallback((): number => {
        return state.favoritos.size;
    }, []); // ✅ SIN DEPENDENCIAS - Función estable

    /**
     * Obtiene los IDs de productos favoritos
     */
    const getFavoritosIds = useCallback((): number[] => {
        return Array.from(state.favoritos.keys());
    }, []); // ✅ SIN DEPENDENCIAS - Función estable

    /**
     * Obtiene los favoritos completos
     */
    const getFavoritosCompletos = useCallback((): Favorito[] => {
        return state.favoritosCompletos;
    }, []); // ✅ SIN DEPENDENCIAS - Función estable

    // Memoizar el contexto para evitar re-renders innecesarios
    const contextValue = useMemo(() => ({
        ...state,
        isFavorito,
        toggleFavorito,
        addFavorito,
        removeFavorito,
        loadFavoritos,
        refreshFavoritos,
        clearFavoritos,
        removeAllFavoritos,
        syncWithBackend, // ✅ NUEVO MÉTODO
        getFavoritosCount,
        getFavoritosIds,
        getFavoritosCompletos,
        isCacheValid,
        invalidateCache
    }), [
        // OPTIMIZACIÓN: Dependencias granulares para evitar re-renders masivos
        state.favoritos,
        state.favoritosCompletos,
        state.loading,
        state.error,
        state.lastUpdated,
        isFavorito,
        toggleFavorito,
        addFavorito,
        removeFavorito,
        loadFavoritos,
        refreshFavoritos,
        clearFavoritos,
        removeAllFavoritos,
        syncWithBackend, // ✅ NUEVA DEPENDENCIA
        getFavoritosCount,
        getFavoritosIds,
        getFavoritosCompletos,
        isCacheValid,
        invalidateCache
    ]);

    // Sincronizar cache cuando cambie el estado de favoritos
    useEffect(() => {
        syncCache();
    }, [state.favoritos, state.favoritosCompletos, syncCache]);

    // Cargar favoritos al montar el componente y cuando cambie la autenticación
    useEffect(() => {
        loadFavoritos();
    }, [loadFavoritos]);

    return (
        <FavoritosContext.Provider value={contextValue}>
            {children}
        </FavoritosContext.Provider>
    );
};
