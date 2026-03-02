/**
 * Contexto de Búsqueda Global - Gestión centralizada del estado de búsqueda
 * Proporciona funcionalidad de búsqueda con debounce, sincronización de URL y navegación
 * Incluye estado de búsqueda, query debounced y funciones de navegación optimizadas
 * Maneja la sincronización entre el estado local y los parámetros de URL
 */
import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Interfaz del contexto de búsqueda
 * Define todas las propiedades y métodos disponibles para los consumidores
 */
interface SearchContextType {
    /** Query de búsqueda actual del usuario */
    searchQuery: string;
    /** Query de búsqueda con debounce aplicado para API calls */
    debouncedSearchQuery: string;
    /** Estado de búsqueda activa para mostrar indicadores visuales */
    isSearching: boolean;
    /** Función para actualizar el query de búsqueda */
    setSearchQuery: (query: string, options?: { immediate?: boolean }) => void;
    /** Función para limpiar completamente la búsqueda */
    clearSearch: () => void;
    /** Función para navegar a productos con query de búsqueda */
    navigateToProducts: (query?: string) => void;
}

/**
 * Props del proveedor del contexto
 * Solo requiere children para envolver la aplicación
 */
interface SearchProviderProps {
    children: ReactNode;
}

// ============================================================================
// CONTEXTO Y PROVEEDOR
// ============================================================================

/**
 * Contexto de React para el estado de búsqueda global
 * Inicializado como undefined para forzar el uso dentro del provider
 */
const SearchContext = createContext<SearchContextType | undefined>(undefined);

/**
 * Proveedor del contexto de búsqueda
 * Maneja toda la lógica de estado, debounce y sincronización con URL
 * Optimizado para evitar re-renders innecesarios con useMemo
 */
export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
    // ============================================================================
    // HOOKS Y NAVEGACIÓN
    // ============================================================================

    const location = useLocation();
    const navigate = useNavigate();

    // ============================================================================
    // ESTADO PRINCIPAL
    // ============================================================================

    /**
     * Estado principal de búsqueda - sincronizado con URL
     * Se inicializa con el valor de la URL si existe para mantener consistencia
     */
    const [searchQuery, setSearchQueryState] = useState<string>(() => {
        const searchParams = new URLSearchParams(location.search);
        return searchParams.get('search') || '';
    });

    /**
     * Estado de búsqueda con debounce - para llamadas a API
     * Se inicializa con el valor de la URL para consistencia inicial
     */
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>(() => {
        const searchParams = new URLSearchParams(location.search);
        return searchParams.get('search') || '';
    });

    /**
     * Estado de búsqueda activa - calculado dinámicamente
     * Se considera activa cuando hay diferencia entre query actual y debounced
     */
    const isSearching = useMemo(() => {
        return searchQuery !== debouncedSearchQuery && searchQuery.length > 0;
    }, [searchQuery, debouncedSearchQuery]);

    // ============================================================================
    // REFS
    // ============================================================================

    /**
     * Ref para el timer del debounce - evita problemas de closure y React 18 Strict Mode
     * Al usar useRef el timer persiste entre renders sin crear nuevas instancias
     */
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    /**
     * Ref para acceder al searchQuery actual sin closure stale en el efecto de URL
     * Se actualiza en cada render para garantizar que siempre refleja el valor actual
     */
    const searchQueryRef = useRef(searchQuery);
    useEffect(() => { searchQueryRef.current = searchQuery; });

    // ============================================================================
    // FUNCIONES DEBOUNCED Y OPTIMIZADAS
    // ============================================================================

    /**
     * Función debounced estable que usa el ref del timer
     * A diferencia de useCallback(debounce(), []), esta no crea una nueva instancia
     * de debounce en cada render — el timer está almacenado en el ref
     */
    const debouncedSetQuery = useCallback((query: string) => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            setDebouncedSearchQuery(query);
        }, 300);
    }, []);

    // ============================================================================
    // EFECTOS Y SINCRONIZACIÓN
    // ============================================================================

    /**
     * Sincronizar con parámetros de URL cuando cambia la navegación
     * Usa searchQueryRef para evitar closure stale — sin el ref, el efecto capturaría
     * el valor de searchQuery de cuando location.search cambió por última vez,
     * lo que podría resetear el texto que el usuario está escribiendo
     */
    useEffect(() => {
        const searchFromUrl = new URLSearchParams(location.search).get('search') || '';
        if (searchFromUrl !== searchQueryRef.current) {
            setSearchQueryState(searchFromUrl);
            setDebouncedSearchQuery(searchFromUrl);
        }
    }, [location.search]);

    // ============================================================================
    // FUNCIONES PÚBLICAS DEL CONTEXTO
    // ============================================================================

    /**
     * Función para actualizar la consulta de búsqueda
     * Actualiza inmediatamente el estado local e integra el debounce directamente
     * Si el query está vacío, cancela cualquier timer pendiente y limpia de inmediato
     *
     * @param query - Nueva consulta de búsqueda
     */
    /**
     * Cuando immediate=true, cancela el timer pendiente y actualiza debouncedSearchQuery
     * en el mismo tick. Usar al seleccionar sugerencias/historial para evitar la race
     * condition donde ProductCatalog ve el debouncedSearchQuery viejo y navega de vuelta.
     */
    const setSearchQuery = useCallback((query: string, options?: { immediate?: boolean }) => {
        setSearchQueryState(query);
        if (!query) {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            setDebouncedSearchQuery('');
        } else if (options?.immediate) {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            setDebouncedSearchQuery(query);
        } else {
            debouncedSetQuery(query);
        }
    }, [debouncedSetQuery]);

    /**
     * Función para limpiar completamente la búsqueda
     * Resetea todos los estados relacionados con la búsqueda
     */
    const clearSearch = useCallback(() => {
        setSearchQueryState('');
        setDebouncedSearchQuery('');
    }, []);

    /**
     * Función para navegar a productos con búsqueda
     * Construye la URL con parámetros de búsqueda y navega
     *
     * @param query - Query opcional, usa el estado actual si no se proporciona
     */
    /**
     * Usa replace:true cuando ya estamos en /productos para evitar agregar una entrada
     * duplicada al historial del navegador (el efecto de la URL "yendo de un lado a otro").
     */
    const navigateToProducts = useCallback((query?: string) => {
        const searchTerm = query || searchQuery;
        const replace = location.pathname === '/productos';
        if (searchTerm.trim()) {
            navigate(`/productos?search=${encodeURIComponent(searchTerm)}`, { replace });
        } else {
            navigate('/productos', { replace });
        }
    }, [navigate, searchQuery, location.pathname]);

    // ============================================================================
    // OPTIMIZACIÓN Y MEMOIZACIÓN
    // ============================================================================

    /**
     * Valor del contexto memoizado para evitar re-renders innecesarios
     * Solo se recrea cuando cambian las dependencias reales
     */
    const value = useMemo<SearchContextType>(() => ({
        searchQuery,
        debouncedSearchQuery,
        isSearching,
        setSearchQuery,
        clearSearch,
        navigateToProducts,
    }), [
        searchQuery,
        debouncedSearchQuery,
        isSearching,
        setSearchQuery,
        clearSearch,
        navigateToProducts,
    ]);

    // ============================================================================
    // RENDERIZADO DEL PROVIDER
    // ============================================================================

    return (
        <SearchContext.Provider value={value}>
            {children}
        </SearchContext.Provider>
    );
};

// ============================================================================
// HOOK PERSONALIZADO
// ============================================================================

/**
 * Hook personalizado para usar el contexto de búsqueda
 * Proporciona acceso seguro al contexto con validación de uso
 *
 * @returns Objeto con todas las propiedades y métodos del contexto
 * @throws Error si se usa fuera del SearchProvider
 */
export const useSearch = (): SearchContextType => {
    const context = useContext(SearchContext);
    if (context === undefined) {
        throw new Error('useSearch must be used within a SearchProvider');
    }
    return context;
};
