import React from 'react';
import styles from '../../styles/Product.module.css';
import { CUSTOM_CATEGORIES } from '../../utils/productCategorization';

interface Category {
  id_categoria: number;
  nombre_categoria: string;
}

interface CategoryFiltersProps {
  // Categorías del backend
  backendCategories: Category[];
  selectedBackendCategory: string;
  onBackendCategoryChange: (categoryId: string) => void;

  // Categorías personalizadas
  selectedCustomCategory: string | null;
  onCustomCategoryChange: (categoryKey: string | null) => void;

  // Contadores de productos por categoría (opcional)
  categoryCounts?: Record<string, number>;
}

const CategoryFilters: React.FC<CategoryFiltersProps> = ({
  backendCategories,
  selectedBackendCategory,
  onBackendCategoryChange,
  selectedCustomCategory,
  onCustomCategoryChange,
  categoryCounts = {}
}) => {
  return (
    <>
      {/* Dropdown de categorías del backend */}
      <div style={{ width: '100%' }}>
        <select
          className={styles.orderSelect}
          value={selectedBackendCategory}
          onChange={(e) => onBackendCategoryChange(e.target.value)}
          aria-label="Filtrar por categoría"
          style={{ width: '100%' }}
        >
          <option value="">Todas las categorías</option>
          {backendCategories.map(category => (
            <option key={category.id_categoria} value={category.id_categoria}>
              {category.nombre_categoria}
            </option>
          ))}
        </select>
      </div>


    </>
  );
};

export default CategoryFilters; 