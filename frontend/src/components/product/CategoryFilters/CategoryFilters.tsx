import React from 'react';
import styles from './CategoryFilters.module.css';
import type { Category } from '../../../types/product';

interface CategoryFiltersProps {
    // Categorías del backend
    backendCategories: Category[];
    selectedBackendCategory: string;
    onBackendCategoryChange: (categoryId: string) => void;
}

const CategoryFilters: React.FC<CategoryFiltersProps> = ({
    backendCategories,
    selectedBackendCategory,
    onBackendCategoryChange
}) => {
    return (
        <div className={styles.categoryFilters}>
            {/* Dropdown de categorías del backend */}
            <div className={styles.filterGroup}>
                <select
                    className={styles.filterSelect}
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
        </div>
    );
};

export default CategoryFilters; 