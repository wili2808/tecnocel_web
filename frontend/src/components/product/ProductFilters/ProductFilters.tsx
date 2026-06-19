import React from 'react';
import styles from './ProductFilters.module.css';
import type { ProductUIFilters } from '../../../types';
import { useProductActions } from '../../../hooks/useProductActions';
import { ORDER_OPTIONS } from '../../../utils/productFiltering';

interface ProductFiltersProps {
    filters: ProductUIFilters;
    onFiltersChange: (filters: Partial<ProductUIFilters>) => void;
    totalProducts: number;
    filteredProducts: number;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
    filters,
    onFiltersChange,
    totalProducts,
    filteredProducts
}) => {
    const { categories, brands } = useProductActions();

    const safeCategories = categories || [];
    const safeBrands = brands || [];

    return (
        <div className={styles.filtersContainer}>
            <div className={styles.filtersHeader}>
                <span className={`material-icons ${styles.filtersHeaderIcon}`}>filter_list</span>
                <span className={styles.filtersHeaderText}>Filtros</span>
            </div>

            <div className={styles.filtersRow}>
                <div className={styles.filterSection}>
                    <h3 className={styles.filterSectionTitle}>Categoría</h3>
                    <div className={styles.filterGroup}>
                        <select
                            className={styles.filterSelect}
                            value={filters.selectedDropdownCategory}
                            onChange={(e) => onFiltersChange({ selectedDropdownCategory: e.target.value })}
                            aria-label="Filtrar por categoría"
                        >
                            <option value="">Todas</option>
                            {safeCategories.map(category => (
                                <option key={category.id_categoria} value={category.id_categoria}>
                                    {category.nombre_categoria}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.filterSection}>
                    <h3 className={styles.filterSectionTitle}>Marca</h3>
                    <div className={styles.filterGroup}>
                        <select
                            className={styles.filterSelect}
                            value={filters.selectedDropdownBrand || ''}
                            onChange={(e) => onFiltersChange({ selectedDropdownBrand: e.target.value })}
                            aria-label="Filtrar por marca"
                        >
                            <option value="">Todas</option>
                            {safeBrands.map(brand => (
                                <option key={brand.id_marca} value={brand.id_marca.toString()}>
                                    {brand.nombre_marca}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.filterSection}>
                    <h3 className={styles.filterSectionTitle}>Ordenar</h3>
                    <div className={styles.filterGroup}>
                        <select
                            className={styles.filterSelect}
                            value={filters.order}
                            onChange={(e) => onFiltersChange({ order: e.target.value })}
                            aria-label="Ordenar productos"
                        >
                            {ORDER_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className={styles.filterSection}>
                    <h3 className={styles.filterSectionTitle}>Disponibilidad</h3>
                    <div className={styles.filterGroup}>
                        <label className={styles.toggleLabel}>
                            <input
                                type="checkbox"
                                checked={filters.onlyStock}
                                onChange={(e) => onFiltersChange({ onlyStock: e.target.checked })}
                                className={styles.toggleCheckbox}
                            />
                            <span className={styles.toggleSlider}></span>
                            <span className={styles.toggleText}>Solo con stock</span>
                        </label>
                    </div>
                </div>

                <div className={styles.filterSection}>
                    <h3 className={styles.filterSectionTitle}>Ofertas</h3>
                    <div className={styles.filterGroup}>
                        <label className={styles.toggleLabel}>
                            <input
                                type="checkbox"
                                checked={filters.onlyOffers || false}
                                onChange={(e) => onFiltersChange({ onlyOffers: e.target.checked })}
                                className={styles.toggleCheckbox}
                            />
                            <span className={styles.toggleSlider}></span>
                            <span className={styles.toggleText}>Solo en oferta</span>
                        </label>
                    </div>
                </div>
            </div>

            <div className={styles.resultsCounter}>
                <div className={styles.resultsCounterContent}>
                    <span className={styles.resultsNumber}>{filteredProducts}</span>
                    <span className={styles.resultsText}>de {totalProducts} productos</span>
                </div>
            </div>
        </div>
    );
};

ProductFilters.displayName = 'ProductFilters';

export default ProductFilters;
