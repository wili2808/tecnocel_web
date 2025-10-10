/**
 * Contexto Global de Ofertas - Maneja el estado global de ofertas del sistema
 * Optimización: Centraliza el manejo de ofertas para evitar consultas redundantes
 */
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { ofertaService } from '../services/ofertaService';
import type { Oferta, Product } from '../types';

// Constantes
const OFERTAS_CACHE_KEY = import.meta.env.VITE_OFERTAS_CACHE_KEY || 'ofertas_cache';
const CACHE_DURATION = parseInt(import.meta.env.VITE_OFERTAS_CACHE_DURATION || '300000'); // 5 minutos por defecto
const REFRESH_INTERVAL = parseInt(import.meta.env.VITE_OFERTAS_REFRESH_INTERVAL || '60000'); // 1 minuto por defecto

/**
 * Estructura de una oferta con información adicional
 */
export interface OfertaConProductos extends Oferta {
    productos?: Product[];
    productosCount?: number;
    isActive?: boolean;
    timeRemaining?: string;
}

/**
 * Estado del contexto de ofertas
 */
interface OfertasState {
    ofertas: Oferta[];
    productosEnOferta: Product[];
    ofertasActivas: Oferta[];
    ofertasExpiradas: Oferta[];
    loading: boolean;
    error: string | null;
    lastUpdated: number | null;
    cache: {
        ofertas: Map<number, Oferta>;
        productos: Map<number, Product>;
        ofertasActivas: Set<number>;
        ofertasExpiradas: Set<number>;
    };
}

/**
 * Métodos del contexto de ofertas
 */
interface OfertasContextType extends OfertasState {
    // Métodos principales
    getOfertaById: (id: number) => Oferta | undefined;
    getProductosPorOferta: (ofertaId: number) => Product[];
    isProductoEnOferta: (productId: number) => boolean;
    getOfertaInfo: (productId: number) => OfertaConProductos | null;

    // Métodos de gestión
    loadOfertas: () => Promise<void>;
    refreshOfertas: () => Promise<void>;
    clearOfertas: () => void;

    // Métodos de utilidad
    getOfertasActivas: () => Oferta[];
    getOfertasExpiradas: () => Oferta[];
    getOfertasCount: () => number;
    getProductosEnOfertaCount: () => number;

    // Métodos de cache
    isCacheValid: () => boolean;
    invalidateCache: () => void;

    // Métodos de cálculo
    calculateTimeRemaining: (oferta: Oferta) => string;
    isOfertaActive: (oferta: Oferta) => boolean;

    // Nuevos métodos del servicio mejorado
    getEstadisticas: () => Promise<any>;
    buscarOfertas: (criterios: {
        nombre?: string;
        tipoDescuento?: 'porcentaje' | 'monto_fijo';
        activo?: boolean;
        limit?: number;
        offset?: number;
    }) => Promise<any>;
    getOfertasProximasAExpirar: (dias?: number) => Promise<Oferta[]>;
    verificarProductoEnOferta: (productId: number) => Promise<{
        enOferta: boolean;
        oferta?: Oferta;
        precioOferta?: number;
    }>;
}

// Creación del contexto
const OfertasContext = createContext<OfertasContextType | undefined>(undefined);

/**
 * Hook personalizado para usar el contexto de ofertas
 */
export const useOfertasGlobal = () => {
    const context = useContext(OfertasContext);
    if (context === undefined) {
        throw new Error('useOfertasGlobal debe ser usado dentro de un OfertasGlobalProvider');
    }
    return context;
};

interface OfertasGlobalProviderProps {
    children: React.ReactNode;
}

/**
 * Proveedor del contexto global de ofertas
 * Centraliza el manejo de ofertas para optimizar consultas y cache
 */
export const OfertasGlobalProvider: React.FC<OfertasGlobalProviderProps> = ({ children }) => {
    // Estado del contexto
    const [state, setState] = useState<OfertasState>({
        ofertas: [],
        productosEnOferta: [],
        ofertasActivas: [],
        ofertasExpiradas: [],
        loading: false,
        error: null,
        lastUpdated: null,
        cache: {
            ofertas: new Map(),
            productos: new Map(),
            ofertasActivas: new Set(),
            ofertasExpiradas: new Set()
        }
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
        localStorage.removeItem(OFERTAS_CACHE_KEY);
    }, []);

    /**
     * Calcula el tiempo restante de una oferta
     */
    const calculateTimeRemaining = useCallback((oferta: Oferta): string => {
        const now = new Date();
        const fin = new Date(oferta.fecha_fin);
        const diff = fin.getTime() - now.getTime();

        if (diff <= 0) return 'Expirada';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) {
            return `${days} día${days > 1 ? 's' : ''}`;
        } else if (hours > 0) {
            return `${hours} hora${hours > 1 ? 's' : ''}`;
        } else {
            return 'Menos de 1 hora';
        }
    }, []);

    /**
     * Verifica si una oferta está activa
     */
    const isOfertaActive = useCallback((oferta: Oferta): boolean => {
        const now = new Date();
        const inicio = new Date(oferta.fecha_inicio);
        const fin = new Date(oferta.fecha_fin);
        return now >= inicio && now <= fin && oferta.activo;
    }, []);

    /**
     * Carga las ofertas desde el servidor o cache
     */
    const loadOfertas = useCallback(async () => {
        // Verificar cache primero - MEJORADO para evitar llamadas duplicadas
        try {
            const cachedData = localStorage.getItem(OFERTAS_CACHE_KEY);
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                if (parsed.timestamp && Date.now() - parsed.timestamp < CACHE_DURATION) {
                    // Solo log en desarrollo
                    if (process.env.NODE_ENV === 'development') {
                        console.log('🔄 Ofertas cargadas desde cache (evitando llamada duplicada)');
                    }

                    // Reconstruir Maps y Sets desde cache con tipos explícitos
                    const ofertasMap = new Map<number, Oferta>(
                        parsed.ofertas.map((o: Oferta) => [o.id_oferta, o])
                    );
                    const productosMap = new Map<number, Product>(
                        parsed.productosEnOferta.map((p: Product) => [p.id_producto, p])
                    );
                    const ofertasActivasSet = new Set<number>(parsed.ofertasActivas);
                    const ofertasExpiradasSet = new Set<number>(parsed.ofertasExpiradas);

                    setState(prev => ({
                        ...prev,
                        ofertas: parsed.ofertas as Oferta[],
                        productosEnOferta: parsed.productosEnOferta as Product[],
                        ofertasActivas: parsed.ofertas.filter((o: Oferta) => isOfertaActive(o)),
                        ofertasExpiradas: parsed.ofertas.filter((o: Oferta) => !isOfertaActive(o)),
                        cache: {
                            ofertas: ofertasMap,
                            productos: productosMap,
                            ofertasActivas: ofertasActivasSet,
                            ofertasExpiradas: ofertasExpiradasSet
                        },
                        lastUpdated: parsed.timestamp as number,
                        loading: false
                    }));
                    return;
                }
            }
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.warn('Error al cargar cache de ofertas:', error);
            }
        }

        // Solo cargar desde servidor si no hay cache válido
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));

            // Usar el servicio mejorado con retry logic y cache integrado
            const [ofertasData, productosData] = await Promise.all([
                ofertaService.getOfertasActivas(true), // Usar cache del servicio
                ofertaService.getProductosEnOferta(100, 0, true) // Usar cache del servicio
            ]);

            // Separar ofertas activas y expiradas
            const ofertasActivas = ofertasData.filter(isOfertaActive);
            const ofertasExpiradas = ofertasData.filter(o => !isOfertaActive(o));

            // Crear Maps y Sets para cache
            const ofertasMap = new Map(ofertasData.map(o => [o.id_oferta, o]));
            const productosMap = new Map(productosData.data.map(p => [p.id_producto, p]));
            const ofertasActivasSet = new Set(ofertasActivas.map(o => o.id_oferta));
            const ofertasExpiradasSet = new Set(ofertasExpiradas.map(o => o.id_oferta));

            // Guardar en cache ANTES de actualizar el estado
            const cacheData = {
                ofertas: ofertasData,
                productosEnOferta: productosData.data,
                ofertasActivas: Array.from(ofertasActivasSet),
                ofertasExpiradas: Array.from(ofertasExpiradasSet),
                timestamp: Date.now()
            };
            localStorage.setItem(OFERTAS_CACHE_KEY, JSON.stringify(cacheData));

            // Actualizar estado con timestamp del cache
            setState(prev => ({
                ...prev,
                ofertas: ofertasData,
                productosEnOferta: productosData.data,
                ofertasActivas,
                ofertasExpiradas,
                cache: {
                    ofertas: ofertasMap,
                    productos: productosMap,
                    ofertasActivas: ofertasActivasSet,
                    ofertasExpiradas: ofertasExpiradasSet
                },
                loading: false,
                lastUpdated: cacheData.timestamp
            }));

            if (process.env.NODE_ENV === 'development') {
                console.log(`✅ Ofertas cargadas desde servidor: ${ofertasData.length} ofertas, ${productosData.data.length} productos`);
            }
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                console.error('Error al cargar ofertas:', error);
            }
            setState(prev => ({
                ...prev,
                loading: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            }));
        }
    }, [isOfertaActive]);

    /**
     * Refresca las ofertas (fuerza recarga)
     */
    const refreshOfertas = useCallback(async () => {
        invalidateCache();
        await loadOfertas();
    }, [invalidateCache, loadOfertas]);

    /**
     * Obtiene una oferta por ID
     */
    const getOfertaById = useCallback((id: number): Oferta | undefined => {
        return state.cache.ofertas.get(id);
    }, [state.cache.ofertas]);

    /**
     * Obtiene productos por oferta
     */
    const getProductosPorOferta = useCallback((ofertaId: number): Product[] => {
        return state.productosEnOferta.filter(producto =>
            producto.ofertas?.some(oferta => oferta.id_oferta === ofertaId)
        );
    }, [state.productosEnOferta]);

    /**
     * Verifica si un producto está en oferta
     */
    const isProductoEnOferta = useCallback((productId: number): boolean => {
        const producto = state.cache.productos.get(productId);
        return producto?.en_oferta || false;
    }, [state.cache.productos]);

    /**
     * Obtiene información completa de oferta para un producto
     */
    const getOfertaInfo = useCallback((productId: number): OfertaConProductos | null => {
        const producto = state.cache.productos.get(productId);
        if (!producto?.en_oferta || !producto.ofertas) return null;

        const oferta = producto.ofertas[0]; // Tomar la primera oferta
        if (!oferta) return null;

        return {
            ...oferta,
            productos: [producto],
            productosCount: 1,
            isActive: isOfertaActive(oferta),
            timeRemaining: calculateTimeRemaining(oferta)
        };
    }, [state.cache.productos, isOfertaActive, calculateTimeRemaining]);

    /**
     * Obtiene ofertas activas
     */
    const getOfertasActivas = useCallback((): Oferta[] => {
        return state.ofertasActivas;
    }, [state.ofertasActivas]);

    /**
     * Obtiene ofertas expiradas
     */
    const getOfertasExpiradas = useCallback((): Oferta[] => {
        return state.ofertasExpiradas;
    }, [state.ofertasExpiradas]);

    /**
     * Obtiene el conteo de ofertas
     */
    const getOfertasCount = useCallback((): number => {
        return state.ofertas.length;
    }, [state.ofertas]);

    /**
     * Obtiene el conteo de productos en oferta
     */
    const getProductosEnOfertaCount = useCallback((): number => {
        return state.productosEnOferta.length;
    }, [state.productosEnOferta]);

    /**
     * Limpia todas las ofertas (útil para logout)
     */
    const clearOfertas = useCallback(() => {
        setState({
            ofertas: [],
            productosEnOferta: [],
            ofertasActivas: [],
            ofertasExpiradas: [],
            loading: false,
            error: null,
            lastUpdated: null,
            cache: {
                ofertas: new Map(),
                productos: new Map(),
                ofertasActivas: new Set(),
                ofertasExpiradas: new Set()
            }
        });
        // Limpiar cache de localStorage y del servicio
        localStorage.removeItem(OFERTAS_CACHE_KEY);
        ofertaService.clearCache();
    }, []);

    /**
     * Obtiene estadísticas de ofertas
     */
    const getEstadisticas = useCallback(async () => {
        try {
            return await ofertaService.getEstadisticas();
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            return null;
        }
    }, []);

    /**
     * Busca ofertas por criterios
     */
    const buscarOfertas = useCallback(async (criterios: {
        nombre?: string;
        tipoDescuento?: 'porcentaje' | 'monto_fijo';
        activo?: boolean;
        limit?: number;
        offset?: number;
    }) => {
        try {
            return await ofertaService.buscarOfertas(criterios);
        } catch (error) {
            console.error('Error al buscar ofertas:', error);
            throw error;
        }
    }, []);

    /**
     * Obtiene ofertas próximas a expirar
     */
    const getOfertasProximasAExpirar = useCallback(async (dias: number = 7) => {
        try {
            return await ofertaService.getOfertasProximasAExpirar(dias);
        } catch (error) {
            console.error('Error al obtener ofertas próximas a expirar:', error);
            return [];
        }
    }, []);

    /**
     * Verifica si un producto está en oferta usando el servicio mejorado
     */
    const verificarProductoEnOferta = useCallback(async (productId: number) => {
        try {
            return await ofertaService.verificarProductoEnOferta(productId);
        } catch (error) {
            console.error(`Error al verificar oferta para producto ${productId}:`, error);
            return { enOferta: false };
        }
    }, []);

    // Cargar ofertas cuando se monta el componente
    useEffect(() => {
        loadOfertas();
    }, [loadOfertas]);

    // Configurar refresh automático
    useEffect(() => {
        const interval = setInterval(() => {
            if (isCacheValid()) {
                // Solo refrescar si el cache no es válido
                return;
            }
            loadOfertas();
        }, REFRESH_INTERVAL);

        return () => clearInterval(interval);
    }, [loadOfertas, isCacheValid]);

    // Memoizar el valor del contexto para evitar re-renders innecesarios
    const contextValue = useMemo<OfertasContextType>(() => ({
        // Estado
        ofertas: state.ofertas,
        productosEnOferta: state.productosEnOferta,
        ofertasActivas: state.ofertasActivas,
        ofertasExpiradas: state.ofertasExpiradas,
        loading: state.loading,
        error: state.error,
        lastUpdated: state.lastUpdated,
        cache: state.cache,

        // Métodos principales
        getOfertaById,
        getProductosPorOferta,
        isProductoEnOferta,
        getOfertaInfo,

        // Métodos de gestión
        loadOfertas,
        refreshOfertas,
        clearOfertas,

        // Métodos de utilidad
        getOfertasActivas,
        getOfertasExpiradas,
        getOfertasCount,
        getProductosEnOfertaCount,

        // Métodos de cache
        isCacheValid,
        invalidateCache,

        // Métodos de cálculo
        calculateTimeRemaining,
        isOfertaActive,

        // Nuevos métodos del servicio mejorado
        getEstadisticas,
        buscarOfertas,
        getOfertasProximasAExpirar,
        verificarProductoEnOferta
    }), [
        // SIMPLIFICACIÓN: Solo las dependencias esenciales
        state,
        getOfertaById,
        getProductosPorOferta,
        isProductoEnOferta,
        getOfertaInfo,
        loadOfertas,
        refreshOfertas,
        clearOfertas,
        getOfertasActivas,
        getOfertasExpiradas,
        getOfertasCount,
        getProductosEnOfertaCount,
        isCacheValid,
        invalidateCache,
        calculateTimeRemaining,
        isOfertaActive,
        getEstadisticas,
        buscarOfertas,
        getOfertasProximasAExpirar,
        verificarProductoEnOferta
    ]);

    return (
        <OfertasContext.Provider value={contextValue}>
            {children}
        </OfertasContext.Provider>
    );
};

export default OfertasGlobalProvider;
