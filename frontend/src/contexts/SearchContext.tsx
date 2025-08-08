import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Función debounce para retrasar la ejecución de una función
 * @param func - Función a ejecutar
 * @param wait - Tiempo de espera en milisegundos
 * @returns Función debounced
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

interface SearchContextType {
    searchQuery: string;
    debouncedSearchQuery: string;
    isSearching: boolean;
    setSearchQuery: (query: string) => void;
    clearSearch: () => void;
    navigateToProducts: (query?: string) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

interface SearchProviderProps {
    children: ReactNode;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();

    // Estado principal de búsqueda
    const [searchQuery, setSearchQueryState] = useState<string>(() => {
        // Inicializar con el valor de la URL si existe
        const searchParams = new URLSearchParams(location.search);
        return searchParams.get('search') || '';
    });
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>(() => {
        // Inicializar con el valor de la URL si existe
        const searchParams = new URLSearchParams(location.search);
        return searchParams.get('search') || '';
    });
    const [isSearching, setIsSearching] = useState<boolean>(false);

    // Función debounced para actualizar la búsqueda
    const debouncedUpdateSearch = useCallback(
        debounce((query: string) => {
            setDebouncedSearchQuery(query);
            setIsSearching(false);
        }, 300),
        []
    );

    // Sincronizar con parámetros de URL solo cuando cambia la URL
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const searchFromUrl = searchParams.get('search') || '';

        // Solo actualizar si la URL cambió y es diferente al estado actual
        if (searchFromUrl !== searchQuery) {
            setSearchQueryState(searchFromUrl);
            setDebouncedSearchQuery(searchFromUrl);
            setIsSearching(false);
        }
    }, [location.search]); // Solo depende de la URL, no del estado

    // Actualizar búsqueda debounced cuando el usuario escribe
    useEffect(() => {
        // Solo aplicar debounce si el query no está vacío
        if (searchQuery) {
            setIsSearching(true);
            debouncedUpdateSearch(searchQuery);
        } else {
            // Si está vacío, actualizar inmediatamente
            setDebouncedSearchQuery('');
            setIsSearching(false);
        }
    }, [searchQuery, debouncedUpdateSearch]);

    // Función para actualizar la consulta de búsqueda
    const setSearchQuery = useCallback((query: string) => {
        setSearchQueryState(query);
    }, []);

    // Función para limpiar la búsqueda
    const clearSearch = useCallback(() => {
        setSearchQueryState('');
        setDebouncedSearchQuery('');
        setIsSearching(false);
    }, []);

    // Función para navegar a productos con búsqueda
    const navigateToProducts = useCallback((query?: string) => {
        const searchTerm = query || searchQuery;
        if (searchTerm.trim()) {
            navigate(`/productos?search=${encodeURIComponent(searchTerm.trim())}`);
        } else {
            navigate('/productos');
        }
    }, [navigate, searchQuery]);

    const value: SearchContextType = {
        searchQuery,
        debouncedSearchQuery,
        isSearching,
        setSearchQuery,
        clearSearch,
        navigateToProducts,
    };

    return (
        <SearchContext.Provider value={value}>
            {children}
        </SearchContext.Provider>
    );
};

export const useSearch = (): SearchContextType => {
    const context = useContext(SearchContext);
    if (context === undefined) {
        throw new Error('useSearch must be used within a SearchProvider');
    }
    return context;
}; 