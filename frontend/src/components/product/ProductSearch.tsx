import React from 'react';
import styles from '../../styles/Product.module.css';

interface ProductSearchProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
}

const ProductSearch: React.FC<ProductSearchProps> = ({
  searchValue,
  onSearchChange,
  placeholder = "Buscar productos..."
}) => {
  return (
    <div className={styles.searchContainer}>
      <input
        type="text"
        className={styles.searchInput}
        placeholder={placeholder}
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="Buscar productos"
      />
    </div>
  );
};

export default ProductSearch; 