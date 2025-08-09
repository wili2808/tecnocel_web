/**
 * Contexto Global de Favoritos - Maneja el estado global de favoritos del cliente
 * Optimización: Centraliza el manejo de favoritos para evitar consultas redundantes
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
    favoritos: Set<number>; // Set de IDs de productos favoritos para búsqueda O(1)
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

interface FavoritosGlobalProviderProps {
    children: React.ReactNode;
}

/**
 * Proveedor del contexto global de favoritos
 * Centraliza el manejo de favoritos para optimizar consultas y cache
 */
export const FavoritosGlobalProvider: React.FC<FavoritosGlobalProviderProps> = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const { showNotification } = useNotification();

    // Estado del contexto
    const [state, setState] = useState<FavoritosState>({
        favoritos: new Set(),
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
     * Carga los favoritos del usuario desde el servidor
     */
    const loadFavoritos = useCallback(async () => {
        if (!isAuthenticated || !user?.id_cliente) {
            setState(prev => ({
                ...prev,
                favoritos: new Set(),
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
                if (parsed.userId === user.id_cliente && Date.now() - parsed.timestamp < CACHE_DURATION) {
                    setState(prev => ({
                        ...prev,
                        favoritos: new Set(parsed.favoritosIds),
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

        // Si no hay cache válido en localStorage, verificar cache en memoria
        if (isCacheValid()) {
            console.log('Favoritos cargados desde cache en memoria');
            return;
        }

        try {
            setState(prev => ({ ...prev, loading: true, error: null }));

            const response = await favoritoService.getFavoritos(user.id_cliente);

            const favoritosIds = new Set(response.data.map(fav => fav.id_producto));
            const favoritosCompletos = response.data as Favorito[];

            // Guardar en cache (localStorage y memoria)
            const cacheData = {
                userId: user.id_cliente,
                favoritosIds: Array.from(favoritosIds),
                favoritosCompletos,
                timestamp: Date.now()
            };
            localStorage.setItem(FAVORITOS_CACHE_KEY, JSON.stringify(cacheData));

            setState(prev => ({
                ...prev,
                favoritos: favoritosIds,
                favoritosCompletos,
                loading: false,
                lastUpdated: Date.now()
            }));

            console.log(`Favoritos cargados desde servidor: ${favoritosIds.size} productos`);
        } catch (error) {
            console.error('Error al cargar favoritos:', error);
            setState(prev => ({
                ...prev,
                loading: false,
                error: 'Error al cargar favoritos'
            }));

            showNotification('Error al cargar favoritos. Inténtalo de nuevo.', 'error', 5000);
        }
    }, [isAuthenticated, user?.id_cliente, isCacheValid, showNotification]);

    /**
     * Refresca los favoritos (fuerza recarga)
     */
    const refreshFavoritos = useCallback(async () => {
        invalidateCache();
        await loadFavoritos();
    }, [invalidateCache, loadFavoritos]);

    /**
     * Verifica si un producto es favorito
     */
    const isFavorito = useCallback((productId: number): boolean => {
        return state.favoritos.has(productId);
    }, [state.favoritos]);

    /**
     * Alterna el estado de favorito de un producto
     */
    const toggleFavorito = useCallback(async (productId: number): Promise<boolean> => {
        if (!isAuthenticated || !user?.id_cliente) {
            showNotification('¡Inicia sesión para agregar productos a favoritos!', 'info', 4000);
            return false;
        }

        try {
            const response = await favoritoService.toggleFavorito(user.id_cliente, productId);

            // Actualizar estado optimísticamente
            setState(prev => {
                const newFavoritos = new Set(prev.favoritos);
                const newFavoritosCompletos = [...prev.favoritosCompletos];

                if (response.action === 'added') {
                    newFavoritos.add(productId);
                    // Agregar a favoritos completos si tenemos los datos del producto
                    if (response.data?.producto) {
                        newFavoritosCompletos.push({
                            id_favorito: response.data.id_favorito,
                            id_cliente: user.id_cliente,
                            id_producto: productId,
                            fyh_creacion: new Date().toISOString(),
                            producto: response.data.producto
                        });
                    }
                } else {
                    newFavoritos.delete(productId);
                    // Remover de favoritos completos
                    const index = newFavoritosCompletos.findIndex(fav => fav.id_producto === productId);
                    if (index !== -1) {
                        newFavoritosCompletos.splice(index, 1);
                    }
                }

                const newState = {
                    ...prev,
                    favoritos: newFavoritos,
                    favoritosCompletos: newFavoritosCompletos,
                    lastUpdated: Date.now()
                };

                // Actualizar cache en localStorage
                const cacheData = {
                    userId: user.id_cliente,
                    favoritosIds: Array.from(newFavoritos),
                    favoritosCompletos: newFavoritosCompletos,
                    timestamp: Date.now()
                };
                localStorage.setItem(FAVORITOS_CACHE_KEY, JSON.stringify(cacheData));

                return newState;
            });

            // Mostrar notificación de éxito
            const message = response.action === 'added'
                ? 'Producto agregado a favoritos'
                : 'Producto removido de favoritos';
            showNotification(message, 'success', 2000);

            return response.esFavorito;
        } catch (error) {
            console.error('Error al alternar favorito:', error);

            // Revertir cambios en caso de error
            await refreshFavoritos();

            showNotification('Error al actualizar favoritos. Inténtalo de nuevo.', 'error', 5000);
            return false;
        }
    }, [isAuthenticated, user?.id_cliente, showNotification, refreshFavoritos]);

    /**
     * Agrega un producto a favoritos
     */
    const addFavorito = useCallback(async (productId: number): Promise<boolean> => {
        if (isFavorito(productId)) {
            return true; // Ya es favorito
        }
        return await toggleFavorito(productId);
    }, [isFavorito, toggleFavorito]);

    /**
     * Remueve un producto de favoritos
     */
    const removeFavorito = useCallback(async (productId: number): Promise<boolean> => {
        if (!isFavorito(productId)) {
            return true; // Ya no es favorito
        }
        return await toggleFavorito(productId);
    }, [isFavorito, toggleFavorito]);

    /**
     * Limpia todos los favoritos (útil para logout)
     */
    const clearFavoritos = useCallback(() => {
        setState({
            favoritos: new Set(),
            favoritosCompletos: [],
            loading: false,
            error: null,
            lastUpdated: null
        });
        // Limpiar cache de localStorage
        localStorage.removeItem(FAVORITOS_CACHE_KEY);
    }, []);

    /**
     * Obtiene la cantidad de favoritos
     */
    const getFavoritosCount = useCallback((): number => {
        return state.favoritos.size;
    }, [state.favoritos]);

    /**
     * Obtiene los IDs de productos favoritos
     */
    const getFavoritosIds = useCallback((): number[] => {
        return Array.from(state.favoritos);
    }, [state.favoritos]);

    /**
     * Obtiene los favoritos completos con datos del producto
     */
    const getFavoritosCompletos = useCallback((): Favorito[] => {
        return state.favoritosCompletos;
    }, [state.favoritosCompletos]);

    // Cargar favoritos cuando el usuario se autentica
    useEffect(() => {
        if (isAuthenticated && user?.id_cliente) {
            loadFavoritos();
        } else {
            clearFavoritos();
        }
    }, [isAuthenticated, user?.id_cliente, loadFavoritos, clearFavoritos]);

    // Memoizar el valor del contexto para evitar re-renders innecesarios
    const contextValue = useMemo<FavoritosContextType>(() => ({
        // Estado
        favoritos: state.favoritos,
        favoritosCompletos: state.favoritosCompletos,
        loading: state.loading,
        error: state.error,
        lastUpdated: state.lastUpdated,

        // Métodos principales
        isFavorito,
        toggleFavorito,
        addFavorito,
        removeFavorito,

        // Métodos de gestión
        loadFavoritos,
        refreshFavoritos,
        clearFavoritos,

        // Métodos de utilidad
        getFavoritosCount,
        getFavoritosIds,
        getFavoritosCompletos,

        // Métodos de cache
        isCacheValid,
        invalidateCache
    }), [
        state,
        isFavorito,
        toggleFavorito,
        addFavorito,
        removeFavorito,
        loadFavoritos,
        refreshFavoritos,
        clearFavoritos,
        getFavoritosCount,
        getFavoritosIds,
        getFavoritosCompletos,
        isCacheValid,
        invalidateCache
    ]);

    return (
        <FavoritosContext.Provider value={contextValue}>
            {children}
        </FavoritosContext.Provider>
    );
};

export default FavoritosGlobalProvider;
