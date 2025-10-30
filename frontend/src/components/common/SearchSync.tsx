/**
 * Componente SearchSync - Sincroniza SearchContext con ProductContext globalmente
 * Este componente no renderiza nada, solo ejecuta efectos para mantener sincronizados
 * los contextos de búsqueda y productos en todas las páginas de la aplicación
 */
import { useEffect } from 'react';
import { useSearch } from '../../contexts/SearchContext';
import { useProductActions } from '../../hooks/useProductActions';

/**
 * Componente de sincronización que mantiene ProductContext actualizado
 * con las búsquedas del SearchContext en tiempo real
 */
const SearchSync: React.FC = () => {
    const { debouncedSearchQuery } = useSearch();
    const { updateFilters, searchQuery: productSearchQuery } = useProductActions();

    /**
     * Sincronizar SearchContext con ProductContext
     * Solo actualiza si los valores son diferentes para evitar loops
     */
    useEffect(() => {
        // Normalizar queries para comparación
        const searchQueryNormalized = debouncedSearchQuery.trim().toLowerCase();
        const productQueryNormalized = productSearchQuery.trim().toLowerCase();

        // Solo sincronizar si son diferentes
        if (searchQueryNormalized !== productQueryNormalized) {
            updateFilters({ busqueda: debouncedSearchQuery });
        }
    }, [debouncedSearchQuery, productSearchQuery, updateFilters]);

    // Este componente no renderiza nada
    return null;
};

export default SearchSync;
