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
  
  // Contadores para mostrar estadísticas
  totalProducts: number;
  filteredProducts: number;
}

const ProductControls: React.FC<ProductControlsProps> = ({
  sortOrder,
  onSortOrderChange,
  onlyInStock,
  onStockFilterChange,
  totalProducts,
  filteredProducts
}) => {
  return (
    <>
      {/* Selector de ordenamiento */}
      <div style={{ width: '100%' }}>
        <select
          className={styles.orderSelect}
          value={sortOrder}
          onChange={(e) => onSortOrderChange(e.target.value)}
          aria-label="Ordenar productos"
          style={{ width: '100%' }}
        >
          {ORDER_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Toggle de stock disponible */}
      <div style={{ width: '100%' }}>
        <label className={styles.toggleLabel} style={{ width: '100%' }}>
          <input
            type="checkbox"
            checked={onlyInStock}
            onChange={(e) => onStockFilterChange(e.target.checked)}
            className={styles.toggleCheckbox}
          />
          <span className={styles.toggleSlider}></span>
          <span className={styles.toggleText}>Solo stock disponible</span>
        </label>
      </div>

      {/* Información de productos filtrados */}
      {filteredProducts !== totalProducts && (
        <div style={{ width: '100%', fontSize: '0.9em', color: 'var(--text-secondary)' }}>
          Mostrando {filteredProducts} de {totalProducts} productos
        </div>
      )}
    </>
  );
};

export default ProductControls; 