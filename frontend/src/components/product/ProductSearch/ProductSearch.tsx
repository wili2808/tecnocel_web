import React from 'react';
import styles from './ProductSearch.module.css';

interface ProductSearchProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    placeholder?: string;
}

const ProductSearch: React.FC<ProductSearchProps> = ({
    searchQuery,
    onSearchChange,
    placeholder = "Buscar productos..."
}) => {
    return (
        <div className={styles.searchContainer}>
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={placeholder}
                className={styles.searchInput}
                aria-label="Buscar productos"
            />
        </div>
    );
};

export default ProductSearch; 