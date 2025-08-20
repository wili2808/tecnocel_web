/**
 * Componente ProductFilters - Filtros y controles de búsqueda de productos
 * Muestra filtros por categoría, marca, ordenamiento y disponibilidad de stock
 * Incluye funcionalidades para filtrado dinámico y contadores de resultados
 * Utiliza useProductActions para obtener categorías y marcas del sistema
 * Layout responsive: columnas en desktop, fila horizontal en móvil
 */
import React from 'react';
import styles from './ProductFilters.module.css';
import type { ProductUIFilters } from '../../../types/product';
import { useProductActions } from '../../../hooks/useProductActions';
import { ORDER_OPTIONS } from '../../../utils/productFiltering';

interface ProductFiltersProps {
    // Filtros actuales
    filters: ProductUIFilters;
    onFiltersChange: (filters: Partial<ProductUIFilters>) => void;

    // Contadores para estadísticas
    totalProducts: number;
    filteredProducts: number;
}

const ProductFilters: React.FC<ProductFiltersProps> = ({
    filters,
    onFiltersChange,
    totalProducts,
    filteredProducts
}) => {
    // ============================================================================
    // HOOKS Y CONTEXTOS
    // ============================================================================

    // Usar el contexto directamente para obtener categorías y marcas
    const { categories, brands } = useProductActions();

    // ============================================================================
    // PREPARACIÓN DE DATOS
    // ============================================================================

    // Datos seguros con fallbacks
    const safeCategories = categories || [];
    const safeBrands = brands || [];

    // ============================================================================
    // RENDERIZADO
    // ============================================================================

    return (
        <div className={styles.filtersContainer}>
            {/* Filtros principales - Layout responsive */}
            <div className={styles.filtersRow}>
                {/* Filtro de Categorías del sistema */}
                <div className={styles.filterSection}>
                    <h3 className={styles.filterSectionTitle}>Categorías</h3>
                    <div className={styles.filterGroup}>
                        <select
                            className={styles.filterSelect}
                            value={filters.selectedDropdownCategory}
                            onChange={(e) => onFiltersChange({ selectedDropdownCategory: e.target.value })}
                            aria-label="Filtrar por categoría del sistema"
                        >
                            <option value="">Todas las categorías</option>
                            {safeCategories.map(category => (
                                <option key={category.id_categoria} value={category.id_categoria}>
                                    {category.nombre_categoria}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Filtro de Marcas del sistema */}
                <div className={styles.filterSection}>
                    <h3 className={styles.filterSectionTitle}>Marcas</h3>
                    <div className={styles.filterGroup}>
                        <select
                            className={styles.filterSelect}
                            value={filters.selectedDropdownBrand || ''}
                            onChange={(e) => onFiltersChange({ selectedDropdownBrand: e.target.value })}
                            aria-label="Filtrar por marca del sistema"
                        >
                            <option value="">Todas las marcas</option>
                            {safeBrands.map(brand => (
                                <option key={brand.id_marca} value={brand.id_marca.toString()}>
                                    {brand.nombre_marca}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Selector de ordenamiento de productos */}
                <div className={styles.filterSection}>
                    <h3 className={styles.filterSectionTitle}>Ordenar</h3>
                    <div className={styles.filterGroup}>
                        <select
                            id="sort-select"
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

                {/* Filtro de disponibilidad de stock */}
                <div className={styles.filterSection}>
                    <h3 className={styles.filterSectionTitle}>Disponibles</h3>
                    <div className={styles.filterGroup}>
                        <label className={styles.toggleLabel}>
                            <input
                                type="checkbox"
                                checked={filters.onlyStock}
                                onChange={(e) => onFiltersChange({ onlyStock: e.target.checked })}
                                className={styles.toggleCheckbox}
                            />
                            <span className={styles.toggleSlider}></span>
                            <span className={styles.toggleText}>
                                <span className={styles.toggleTextFull}>Solo con stock disponible</span>
                                <span className={styles.toggleTextShort}>Stock</span>
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Contador de resultados filtrados - Oculto en móvil */}
            <div className={`${styles.resultsCounter} ${styles.resultsCounterDesktop}`}>
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
