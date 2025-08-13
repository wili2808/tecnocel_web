import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useProductActions } from '../../../hooks/useProductActions';
import styles from './ProductSearch.module.css';

interface ProductSearchProps {
    placeholder?: string;
    showClearButton?: boolean;
    className?: string;
    onSearch?: () => void;
}

const ProductSearch: React.FC<ProductSearchProps> = ({
    placeholder = "Buscar productos, marcas y mas ...",
    showClearButton = true,
    className = '',
    onSearch
}) => {
    const { 
        searchQuery, 
        updateSearch, 
        clearSearch, 
        productsLoading: isSearching 
    } = useProductActions();
    const location = useLocation();
    const navigate = useNavigate();

    const handleClear = () => {
        // Limpiar la búsqueda
        clearSearch();

        // Si estamos en la página de productos, actualizar la URL
        if (location.pathname === '/productos') {
            navigate('/productos', { replace: true });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Permitir limpiar con Escape
        if (e.key === 'Escape' && searchQuery) {
            handleClear();
        }
        // Redireccionar con Enter
        if (e.key === 'Enter' && searchQuery) {
            if (location.pathname !== '/productos') {
                navigate('/productos');
            }
            // Llamar al callback onSearch si existe
            onSearch?.();
        }
    };

    return (
        <div className={`${styles.searchContainer} ${className}`}>
            <div className={styles.searchInputGroup}>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => updateSearch(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className={`${styles.searchInput} ${isSearching ? styles.searching : ''}`}
                    aria-label="Buscar productos, marcas y mas ..."
                />

                {/* Indicador de búsqueda */}
                {isSearching && (
                    <div className={styles.searchIndicator}>
                        <span className={`material-icons ${styles.searchIcon}`}>
                            hourglass_empty
                        </span>
                    </div>
                )}

                {/* Botón de limpiar */}
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