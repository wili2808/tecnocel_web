import React from 'react';
import CategoryFilters from '../CategoryFilters';
import BrandFilter from '../BrandFilter';
import QuickSearch from '../QuickSearch';
import ProductSorting from '../ProductSorting';
import styles from './ProductFiltersBar.module.css';
import type { ProductUIFilters } from '../../../types/product';
import type { Category, Marca } from '../../../types/product';

interface ProductFiltersBarProps {
    // Filtros actuales
    filters: ProductUIFilters;
    onFiltersChange: (filters: Partial<ProductUIFilters>) => void;

    // Categorías del backend
    backendCategories: Category[];
    
    // Marcas del backend
    backendBrands: Marca[];

    // Contadores para estadísticas
    totalProducts: number;
    filteredProducts: number;
    quickSearchCounts?: Record<string, number>;
}

const ProductFiltersBar: React.FC<ProductFiltersBarProps> = ({
    filters,
    onFiltersChange,
    backendCategories,
    backendBrands,
    totalProducts,
    filteredProducts,
    quickSearchCounts = {}
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
                />
            </div>

            {/* Marcas */}
            <div className={styles.filterSection}>
                <h3 className={styles.filterSectionTitle}>Marcas</h3>
                <BrandFilter
                    backendBrands={backendBrands}
                    selectedBackendBrand={filters.selectedDropdownBrand || ''}
                    onBackendBrandChange={(selectedDropdownBrand) =>
                        onFiltersChange({ selectedDropdownBrand })
                    }
                />
            </div>

            {/* Búsquedas Rápidas */}
            <div className={styles.quickSearchSection}>
                <h3 className={styles.filterSectionTitle}>Búsquedas Rápidas</h3>
                <QuickSearch
                    selectedQuickSearch={filters.selectedQuickSearch}
                    onQuickSearchChange={(selectedQuickSearch) =>
                        onFiltersChange({ selectedQuickSearch })
                    }
                    quickSearchCounts={quickSearchCounts}
                />
            </div>

            {/* Ordenamiento y Filtros */}
            <div className={styles.sortingSection}>
                <h3 className={styles.filterSectionTitle}>Ordenamiento</h3>
                <ProductSorting
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