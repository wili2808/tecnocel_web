import React from 'react';
import ProductSearch from './ProductSearch';
import CategoryFilters from './CategoryFilters';
import ProductControls from './ProductControls';
import styles from '../../styles/Product.module.css';
import type { ProductFilters } from '../../hooks/useProductFilters';

interface Category {
  id_categoria: number;
  nombre_categoria: string;
}

interface ProductFiltersBarProps {
  // Filtros actuales
  filters: ProductFilters;
  onFiltersChange: (filters: Partial<ProductFilters>) => void;
  
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
      {/* Buscador */}
      <ProductSearch
        searchValue={filters.search}
        onSearchChange={(search) => onFiltersChange({ search })}
      />
      
      {/* Filtros de categorías */}
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
      
      {/* Controles de ordenamiento y filtros adicionales */}
      <ProductControls
        sortOrder={filters.order}
        onSortOrderChange={(order) => onFiltersChange({ order })}
        onlyInStock={filters.onlyStock}
        onStockFilterChange={(onlyStock) => onFiltersChange({ onlyStock })}
        totalProducts={totalProducts}
        filteredProducts={filteredProducts}
      />
    </div>
  );
};

export default ProductFiltersBar; 