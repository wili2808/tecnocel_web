import React from 'react';
import ProductSearch from '../ProductSearch';
import CategoryFilters from '../CategoryFilters';
import ProductControls from '../ProductControls';
import styles from './ProductFiltersBar.module.css';
import type { ProductUIFilters } from '../../../hooks/useProductFilters';
import type { Category } from '../../../types/product';

interface ProductFiltersBarProps {
    // Filtros actuales
    filters: ProductUIFilters;
    onFiltersChange: (filters: Partial<ProductUIFilters>) => void;

    // Categorías del backend
    backendCategories: Category[];

    // Contadores para estadísticas
    totalProducts: number;
    filteredProducts: number;
    categoryCounts?: Record<string, number>;
}

const ProductFiltersBar: React.FC<ProductFiltersBarProps> = ({
    filters,
    onFiltersChange,
    backendCategories,
    totalProducts,
    filteredProducts,
    categoryCounts = {}
}) => {
    return (
        <div className={styles.filtersBar}>
            {/* Categorías */}
            <div className={styles.filterSection}>
                <h3 className={styles.filterSectionTitle}>Categorías</h3>
                <CategoryFilters
                    backendCategories={backendCategories}
                    selectedBackendCategory={filters.selectedDropdownCategory}
                    onBackendCategoryChange={(selectedDropdownCategory) =>
                        onFiltersChange({ selectedDropdownCategory })
                    }
                    selectedCustomCategory={filters.selectedCategory}
                    onCustomCategoryChange={(selectedCategory) =>
                        onFiltersChange({ selectedCategory })
                    }
                    categoryCounts={categoryCounts}
                />
            </div>

            {/* Controles */}
            <div className={styles.filterSection}>
                <h3 className={styles.filterSectionTitle}>Filtros y Ordenamiento</h3>
                <ProductControls
                    sortOrder={filters.order}
                    onSortOrderChange={(order) => onFiltersChange({ order })}
                    onlyInStock={filters.onlyStock}
                    onStockFilterChange={(onlyStock) => onFiltersChange({ onlyStock })}
                />
            </div>

            {/* Contador de resultados */}
            <div className={styles.resultsCounter}>
                <div className={styles.resultsCounterContent}>
                    <span className={styles.resultsNumber}>{filteredProducts}</span>
                    <span className={styles.resultsText}>de {totalProducts} productos</span>
                </div>
            </div>
        </div>
    );
};

export default ProductFiltersBar; 