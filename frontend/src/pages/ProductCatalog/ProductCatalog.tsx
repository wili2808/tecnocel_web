import React from 'react';
import ProductFiltersBar from '../../components/product/ProductFiltersBar';
import ProductGrid from '../../components/product/ProductGrid';
import { useFilteredProducts } from '../../hooks';
import styles from './ProductCatalog.module.css';

const ProductCatalog: React.FC = () => {
    const {
        filteredProducts,
        loading,
        error,
        refetch,
        categories,
        filters,
        updateFilters,
        totalProducts,
        quickSearchCounts,
    } = useFilteredProducts();

    // Asegurar que los datos sean seguros
    const safeFilteredProducts = filteredProducts || [];
    const safeCategories = categories || [];
    const safeQuickSearchCounts = quickSearchCounts || {};

    return (
        <div className={styles.catalogFullscreen}>
            <div className={styles.catalogContainer}>
                {/* Sidebar con filtros fijo a la izquierda */}
                <aside className={styles.filtersSidebar}>
                    <ProductFiltersBar
                        filters={filters}
                        onFiltersChange={updateFilters}
                        backendCategories={safeCategories}
                        totalProducts={totalProducts || 0}
                        filteredProducts={safeFilteredProducts.length}
                        quickSearchCounts={safeQuickSearchCounts}
                    />
                </aside>

                {/* Contenido principal con el grid de productos */}
                <main className={styles.productsMainContent}>
                    <ProductGrid
                        products={safeFilteredProducts}
                        loading={loading}
                        error={error}
                        onRetry={refetch}
                    />
                </main>
            </div>
        </div>
    );
};

export default ProductCatalog; 