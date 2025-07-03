import React from 'react';
import styles from '../../styles/Product.module.css';
import { ORDER_OPTIONS } from '../../utils/productFiltering';

interface ProductControlsProps {
  // Ordenamiento
  sortOrder: string;
  onSortOrderChange: (order: string) => void;

  // Filtro de stock
  onlyInStock: boolean;
  onStockFilterChange: (onlyInStock: boolean) => void;
}

const ProductControls: React.FC<ProductControlsProps> = ({
  sortOrder,
  onSortOrderChange,
  onlyInStock,
  onStockFilterChange
}) => {
  return (
    <div className={styles.controlsContainer}>
      {/* Selector de ordenamiento */}
      <div className={styles.controlGroup}>
        <label htmlFor="sort-select" className={styles.controlLabel}>
          Ordenar por
        </label>
        <select
          id="sort-select"
          className={styles.filterSelect}
          value={sortOrder}
          onChange={(e) => onSortOrderChange(e.target.value)}
          aria-label="Ordenar productos"
        >
          {ORDER_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Toggle de stock disponible */}
      <div className={styles.controlGroup}>
        <label className={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={onlyInStock}
            onChange={(e) => onStockFilterChange(e.target.checked)}
            className={styles.toggleCheckbox}
          />
          <span className={styles.toggleSlider}></span>
          <span className={styles.toggleText}>Solo con stock disponible</span>
        </label>
      </div>
    </div>
  );
};

export default ProductControls; 