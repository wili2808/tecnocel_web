/**
 * Contexto de Búsqueda Global - Gestión centralizada del estado de búsqueda
 * Proporciona funcionalidad de búsqueda con debounce, sincronización de URL y navegación
 * Incluye estado de búsqueda, query debounced y funciones de navegación optimizadas
 * Maneja la sincronización entre el estado local y los parámetros de URL
 */
import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// ============================================================================
// UTILIDADES Y FUNCIONES AUXILIARES
// ============================================================================

/**
 * Función debounce para retrasar la ejecución de una función
 * Evita llamadas excesivas a la API durante la escritura del usuario
 * 
 * @param func - Función a ejecutar después del delay
 * @param wait - Tiempo de espera en milisegundos
 * @returns Función debounced que retrasa la ejecución
 */
function debounce<T extends (...args: any[]) => void>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
        const later = () => {
            timeout = null;
            func(...args);
        };

        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

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
    setSearchQuery: (query: string) => void;
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
     * Esto proporciona feedback visual preciso al usuario
     */
    const isSearching = useMemo(() => {
        return searchQuery !== debouncedSearchQuery && searchQuery.length > 0;
    }, [searchQuery, debouncedSearchQuery]);

    // ============================================================================
    // FUNCIONES DEBOUNDED Y OPTIMIZADAS
    // ============================================================================

    /**
     * Función debounced para actualizar la búsqueda
     * Retrasa la actualización del query debounced para evitar llamadas excesivas
     * Se memoiza con useCallback para evitar recreaciones innecesarias
     */
    const debouncedUpdateSearch = useCallback(
        debounce((query: string) => {
            setDebouncedSearchQuery(query);
        }, 300),
        []
    );

    // ============================================================================
    // EFECTOS Y SINCRONIZACIÓN
    // ============================================================================

    /**
     * Sincronizar con parámetros de URL cuando cambia la navegación
     * Mantiene consistencia entre el estado local y la URL del navegador
     * Solo se ejecuta cuando cambia la URL, no cuando cambia el estado local
     */
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const searchFromUrl = searchParams.get('search') || '';

        // Solo actualizar si la URL cambió y es diferente al estado actual
        if (searchFromUrl !== searchQuery) {
            setSearchQueryState(searchFromUrl);
            setDebouncedSearchQuery(searchFromUrl);
            // isSearching se calculará automáticamente en el próximo render
        }
    }, [location.search]); // Solo depende de la URL, no del estado

    /**
     * Aplicar debounce a la búsqueda cuando el usuario escribe
     * El estado isSearching se calcula automáticamente durante el delay
     */
    useEffect(() => {
        // Solo aplicar debounce si el query no está vacío
        if (searchQuery) {
            debouncedUpdateSearch(searchQuery);
        } else {
            // Si está vacío, actualizar inmediatamente
            setDebouncedSearchQuery('');
        }
    }, [searchQuery, debouncedUpdateSearch]);

    // ============================================================================
    // FUNCIONES PÚBLICAS DEL CONTEXTO
    // ============================================================================

    /**
     * Función para actualizar la consulta de búsqueda
     * Actualiza inmediatamente el estado local sin aplicar debounce
     * 
     * @param query - Nueva consulta de búsqueda
     */
    const setSearchQuery = useCallback((query: string) => {
        setSearchQueryState(query);
    }, []);

    /**
     * Función para limpiar completamente la búsqueda
     * Resetea todos los estados relacionados con la búsqueda
     * El estado isSearching se calculará automáticamente como false
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
    const navigateToProducts = useCallback((query?: string) => {
        const searchTerm = query || searchQuery;
        if (searchTerm.trim()) {
            navigate(`/productos?search=${encodeURIComponent(searchTerm.trim())}`);
        } else {
            navigate('/productos');
        }
    }, [navigate, searchQuery]);

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