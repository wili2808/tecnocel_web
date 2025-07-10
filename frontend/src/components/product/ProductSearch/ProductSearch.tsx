import React from 'react';
import { useSearch } from '../../../contexts/SearchContext';
import styles from './ProductSearch.module.css';

interface ProductSearchProps {
    placeholder?: string;
    showClearButton?: boolean;
    className?: string;
}

const ProductSearch: React.FC<ProductSearchProps> = ({
    placeholder = "Buscar productos...",
    showClearButton = true,
    className = ''
}) => {
    const { searchQuery, setSearchQuery, clearSearch, isSearching } = useSearch();

    const handleClear = () => {
        clearSearch();
    };

    return (
        <div className={`${styles.searchContainer} ${className}`}>
            <div className={styles.searchInputGroup}>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={placeholder}
                    className={`${styles.searchInput} ${isSearching ? styles.searching : ''}`}
                    aria-label="Buscar productos"
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
                    >
                        <span className="material-icons">clear</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProductSearch; 