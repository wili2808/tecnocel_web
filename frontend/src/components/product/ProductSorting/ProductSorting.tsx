import React from 'react';
import styles from './ProductSorting.module.css';
import { ORDER_OPTIONS } from '../../../utils/productFiltering';

interface ProductSortingProps {
    // Ordenamiento
    sortOrder: string;
    onSortOrderChange: (order: string) => void;

    // Filtro de stock
    onlyInStock: boolean;
    onStockFilterChange: (onlyInStock: boolean) => void;
}

const ProductSorting: React.FC<ProductSortingProps> = ({
    sortOrder,
    onSortOrderChange,
    onlyInStock,
    onStockFilterChange
}) => {
    return (
        <div className={styles.sortingContainer}>
            {/* Selector de ordenamiento */}
            <div className={styles.sortingGroup}>
                <select
                    id="sort-select"
                    className={styles.sortingSelect}
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
            <div className={styles.sortingGroup}>
                <label className={styles.toggleLabel}>
                    <input
                        type="checkbox"
                        checked={onlyInStock}
                        onChange={(e) => onStockFilterChange(e.target.checked)}
                        className={styles.toggleCheckbox}
                    />
                    <span className={styles.toggleSlider}></span>
                    <span className={styles.toggleText}>
                        <span className={styles.toggleTextFull}>Solo con stock disponible</span>
                        <span className={styles.toggleTextShort}>Stock</span>
                    </span>
                </label>
            </div>
        </div>
    );
};

export default ProductSorting; 