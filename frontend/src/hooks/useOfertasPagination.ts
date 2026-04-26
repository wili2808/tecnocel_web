import { useState, useCallback, useMemo } from 'react';
import { useOfertasGlobal } from './useOfertasGlobal';
import ofertaService from '../services/ofertaService';

interface UseOfertasPaginationOptions {
    itemsPerPage?: number;
    initialPage?: number;
}

interface UseOfertasPaginationReturn {
    // Datos del contexto global
    ofertas: any[];
    productosEnOferta: any[];
    loading: boolean;
    error: string | null;
    
    // Datos de paginación
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    
    // Métodos de paginación
    nextPage: () => void;
    previousPage: () => void;
    goToPage: (page: number) => void;
    loadMore: () => Promise<void>;
    
    // Métodos del contexto global
    refreshOfertas: () => Promise<void>;
    getOfertasCount: () => number;
    getProductosEnOfertaCount: () => number;
}

export const useOfertasPagination = (options: UseOfertasPaginationOptions = {}): UseOfertasPaginationReturn => {
    const { itemsPerPage = 20, initialPage = 1 } = options;
    
    // Estado de paginación
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [totalItems, setTotalItems] = useState(0);
    const [paginationLoading, setPaginationLoading] = useState(false);
    
    // Contexto global de ofertas
    const {
        ofertas,
        productosEnOferta,
        loading: contextLoading,
        error: contextError,
        refreshOfertas,
        getOfertasCount,
        getProductosEnOfertaCount
    } = useOfertasGlobal();

    // Calcular total de páginas
    const totalPages = useMemo(() => {
        return Math.ceil(totalItems / itemsPerPage);
    }, [totalItems, itemsPerPage]);

    // Verificar si hay páginas siguientes/anteriores
    const hasNextPage = useMemo(() => {
        return currentPage < totalPages;
    }, [currentPage, totalPages]);

    const hasPreviousPage = useMemo(() => {
        return currentPage > 1;
    }, [currentPage]);

    // Cargar más productos (paginación)
    const loadMore = useCallback(async () => {
        if (!hasNextPage || paginationLoading) return;

        try {
            setPaginationLoading(true);
            const offset = (currentPage - 1) * itemsPerPage;
            
            const response = await ofertaService.getProductosEnOferta(itemsPerPage, offset);
            
            // Actualizar total de items si es la primera carga
            if (currentPage === 1) {
                setTotalItems(response.pagination.total);
            }
            
            // Incrementar página
            setCurrentPage(prev => prev + 1);
            
        } catch (error) {
            console.error('Error al cargar más productos:', error);
        } finally {
            setPaginationLoading(false);
        }
    }, [currentPage, itemsPerPage, hasNextPage, paginationLoading]);

    // Navegación de páginas
    const nextPage = useCallback(() => {
        if (hasNextPage) {
            setCurrentPage(prev => prev + 1);
        }
    }, [hasNextPage]);

    const previousPage = useCallback(() => {
        if (hasPreviousPage) {
            setCurrentPage(prev => prev - 1);
        }
    }, [hasPreviousPage]);

    const goToPage = useCallback((page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    }, [totalPages]);

    // Combinar loading states
    const loading = contextLoading || paginationLoading;

    return {
        // Datos del contexto global
        ofertas,
        productosEnOferta,
        loading,
        error: contextError,
        
        // Datos de paginación
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage,
        hasNextPage,
        hasPreviousPage,
        
        // Métodos de paginación
        nextPage,
        previousPage,
        goToPage,
        loadMore,
        
        // Métodos del contexto global
        refreshOfertas,
        getOfertasCount,
        getProductosEnOfertaCount
    };
};

export default useOfertasPagination;
