/**
 * Componente ProductSearch - Campo de búsqueda de productos reutilizable
 * Proporciona funcionalidad de búsqueda con indicadores visuales y navegación
 * Incluye botón de limpiar, indicador de búsqueda activa y manejo de teclas
 * Se integra con el SearchContext global para estado centralizado de búsqueda
 */
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSearch } from '../../../contexts/SearchContext';
import styles from './ProductSearch.module.css';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

/**
 * Props del componente ProductSearch
 * Define la configuración personalizable del campo de búsqueda
 */
interface ProductSearchProps {
    /** Texto placeholder del campo de búsqueda */
    placeholder?: string;
    /** Si se debe mostrar el botón de limpiar búsqueda */
    showClearButton?: boolean;
    /** Clases CSS adicionales para personalización */
    className?: string;
    /** Callback ejecutado cuando se realiza una búsqueda */
    onSearch?: () => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Componente de búsqueda de productos con funcionalidad completa
 * Maneja la entrada del usuario, navegación y limpieza de búsqueda
 * Se integra con el SearchContext global para estado centralizado
 */
const ProductSearch: React.FC<ProductSearchProps> = ({
    placeholder = "Buscar productos, marcas y mas ...",
    showClearButton = true,
    className = '',
    onSearch
}) => {
    // ============================================================================
    // HOOKS Y CONTEXTOS
    // ============================================================================

    /**
     * Hook del contexto global de búsqueda
     * Proporciona estado de búsqueda, funciones de actualización y navegación
     */
    const {
        searchQuery,
        setSearchQuery,
        clearSearch,
        isSearching,
        navigateToProducts
    } = useSearch();

    /**
     * Hook de React Router para obtener la ubicación actual
     * Se usa para determinar si estamos en la página de productos
     */
    const location = useLocation();

    /**
     * Hook de React Router para navegación programática
     * Permite redirigir al usuario a diferentes páginas
     */
    const navigate = useNavigate();

    // ============================================================================
    // MANEJADORES DE EVENTOS
    // ============================================================================

    /**
     * Manejar la limpieza de la búsqueda
     * Limpia el estado global y actualiza la URL si es necesario
     */
    const handleClear = () => {
        // Limpiar la búsqueda en el contexto global
        clearSearch();

        // Si estamos en la página de productos, actualizar la URL
        if (location.pathname === '/productos') {
            navigate('/productos', { replace: true });
        }
    };

    /**
     * Manejar eventos de teclado en el campo de búsqueda
     * Permite limpiar con Escape y navegar con Enter
     * 
     * @param e - Evento de teclado del input
     */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Permitir limpiar con Escape
        if (e.key === 'Escape' && searchQuery) {
            handleClear();
        }

        // Redireccionar con Enter
        if (e.key === 'Enter' && searchQuery) {
            // Usar la función del contexto global para navegación
            navigateToProducts();
            // Llamar al callback onSearch si existe
            onSearch?.();
        }
    };

    // ============================================================================
    // RENDERIZADO PRINCIPAL
    // ============================================================================

    return (
        <div className={`${styles.searchContainer} ${className}`}>
            <div className={styles.searchInputGroup}>
                {/* Campo de entrada principal */}
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className={`${styles.searchInput} ${isSearching ? styles.searching : ''}`}
                    aria-label="Buscar productos, marcas y mas ..."
                />

                {/* Indicador de búsqueda activa */}
                {isSearching && (
                    <div className={styles.searchIndicator}>
                        <span className={`material-icons ${styles.searchIcon}`}>
                            hourglass_empty
                        </span>
                    </div>
                )}

                {/* Botón de limpiar búsqueda */}
                {showClearButton && searchQuery && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className={styles.clearButton}
                        aria-label="Limpiar búsqueda"
                        title="Limpiar búsqueda (Esc)"
                    >
                        <span className="material-icons">clear</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProductSearch; 