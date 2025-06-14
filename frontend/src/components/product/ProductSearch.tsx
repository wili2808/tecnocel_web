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
    <div style={{ width: '100%' }}>
      <input
        type="text"
        className={styles.searchInput}
        placeholder={placeholder}
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="Buscar productos"
        style={{ width: '100%' }}
      />
    </div>
  );
};

export default ProductSearch; 