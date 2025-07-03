import React from 'react';
import styles from '../../styles/Product.module.css';
import type { Category } from '../../types/product';
import { CUSTOM_CATEGORIES } from '../../utils/productCategorization';

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
    <div className={styles.categoryFilters}>
      {/* Dropdown de categorías del backend */}
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Categorías del Sistema</label>
        <select
          className={styles.orderSelect}
          value={selectedBackendCategory}
          onChange={(e) => onBackendCategoryChange(e.target.value)}
          aria-label="Filtrar por categoría del sistema"
        >
          <option value="">Todas las categorías</option>
          {backendCategories.map(category => (
            <option key={category.id_categoria} value={category.id_categoria}>
              {category.nombre_categoria}
            </option>
          ))}
        </select>
      </div>

      {/* Filtros de categorías personalizadas */}
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Categorías Rápidas</label>
        <div className={styles.customCategoryButtons}>
          <button
            type="button"
            className={`${styles.categoryButton} ${selectedCustomCategory === null ? styles.categoryButtonActive : ''
              }`}
            onClick={() => onCustomCategoryChange(null)}
          >
            Todas
          </button>
          {CUSTOM_CATEGORIES.map(category => {
            const count = categoryCounts[category.key] || 0;
            const isActive = selectedCustomCategory === category.key;

            return (
              <button
                key={category.key}
                type="button"
                className={`${styles.categoryButton} ${isActive ? styles.categoryButtonActive : ''
                  } ${count === 0 ? styles.categoryButtonDisabled : ''}`}
                onClick={() => onCustomCategoryChange(category.key)}
                disabled={count === 0}
                title={`${category.label} (${count} productos)`}
              >
                {category.label}
                {count > 0 && <span className={styles.categoryCount}>({count})</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryFilters; 