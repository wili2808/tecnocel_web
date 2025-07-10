import React from 'react';
import styles from './CategoryFilters.module.css';
import type { Category } from '../../../types/product';
import { QUICK_SEARCHES } from '../../../utils/quickSearches';

interface CategoryFiltersProps {
    // Categorías del backend
    backendCategories: Category[];
    selectedBackendCategory: string;
    onBackendCategoryChange: (categoryId: string) => void;

    // Búsquedas rápidas
    selectedQuickSearch: string | null;
    onQuickSearchChange: (searchKey: string | null) => void;

    // Contadores de productos por búsqueda rápida (opcional)
    quickSearchCounts?: Record<string, number>;
}

const CategoryFilters: React.FC<CategoryFiltersProps> = ({
    backendCategories,
    selectedBackendCategory,
    onBackendCategoryChange,
    selectedQuickSearch,
    onQuickSearchChange,
    quickSearchCounts = {}
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

            {/* Búsquedas rápidas */}
            <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Búsquedas Rápidas</label>
                <div className={styles.quickSearchButtons}>
                    <button
                        type="button"
                        className={`${styles.searchButton} ${selectedQuickSearch === null ? styles.searchButtonActive : ''}`}
                        onClick={() => onQuickSearchChange(null)}
                    >
                        <span className={styles.searchButtonText}>Todas</span>
                    </button>
                    {QUICK_SEARCHES.map(quickSearch => {
                        const count = quickSearchCounts[quickSearch.key] || 0;
                        const isActive = selectedQuickSearch === quickSearch.key;

                        return (
                            <button
                                key={quickSearch.key}
                                type="button"
                                className={`${styles.searchButton} ${isActive ? styles.searchButtonActive : ''} ${count === 0 ? styles.searchButtonDisabled : ''}`}
                                onClick={() => onQuickSearchChange(quickSearch.key)}
                                disabled={count === 0}
                                title={`Buscar: ${quickSearch.label} (${count} productos)`}
                            >
                                <span className={styles.searchButtonText}>{quickSearch.label}</span>
                                {count > 0 && <span className={styles.searchCount}>({count})</span>}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CategoryFilters; 