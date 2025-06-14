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

      {/* Chips de categorías personalizadas */}
      <div className={`${styles.chipsContainer} ${styles.hideOnMobile}`} style={{ width: '100%' }}>
        {CUSTOM_CATEGORIES.map(category => {
          const count = categoryCounts[category.key] || 0;
          const isActive = selectedCustomCategory === category.key;
          
          return (
            <button
              key={category.key}
              className={`${styles.chip} ${isActive ? styles.chipActive : ''}`}
              onClick={() => {
                const newSelection = isActive ? null : category.key;
                onCustomCategoryChange(newSelection);
              }}
              aria-pressed={isActive}
              style={{ minWidth: '110px', marginBottom: '0.3em' }}
            >
              {category.label}
              {count > 0 && (
                <span style={{ marginLeft: '0.5em', opacity: 0.7 }}>
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
};

export default CategoryFilters; 