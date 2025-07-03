import React from 'react';
import ProductSearch from './ProductSearch';
import CategoryFilters from './CategoryFilters';
import ProductControls from './ProductControls';
import styles from '../../styles/Product.module.css';
import type { ProductUIFilters } from '../../hooks/useProductFilters';
import type { Category } from '../../types/product';

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
      {/* Contador de resultados compacto */}
      <div className={styles.resultsCounter}>
        <span>{filteredProducts} de {totalProducts}</span>
      </div>

      {/* Búsqueda - Sin título para ahorrar espacio */}
      <div className={styles.filterSection}>
        <ProductSearch
          searchValue={filters.search}
          onSearchChange={(search) => onFiltersChange({ search })}
        />
      </div>

      {/* Categorías - Título más compacto */}
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

      {/* Controles - Título más compacto */}
      <div className={styles.filterSection}>
        <h3 className={styles.filterSectionTitle}>Filtros</h3>
        <ProductControls
          sortOrder={filters.order}
          onSortOrderChange={(order) => onFiltersChange({ order })}
          onlyInStock={filters.onlyStock}
          onStockFilterChange={(onlyStock) => onFiltersChange({ onlyStock })}
        />
      </div>
    </div>
  );
};

export default ProductFiltersBar; 