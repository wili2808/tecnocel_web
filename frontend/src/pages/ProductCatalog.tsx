import React from 'react';
import ProductFiltersBar from '../components/product/ProductFiltersBar';
import ProductGrid from '../components/product/ProductGrid';
import { useFilteredProducts } from '../hooks';
import styles from '../styles/Product.module.css';

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
    categoryCounts,
  } = useFilteredProducts();

  return (
    <section className={styles.productsSection}>
      <div className={styles.productsContainer}>
        <h1 className={styles.sectionTitle}>
          Catálogo de Productos 
        </h1>
        
        {/* Barra de filtros */}
        <ProductFiltersBar
          filters={filters}
          onFiltersChange={updateFilters}
          backendCategories={categories}
          totalProducts={totalProducts}
          filteredProducts={filteredProducts.length}
          categoryCounts={categoryCounts}
        />
        
        {/* Grid de productos */}
        <ProductGrid
          products={filteredProducts}
          loading={loading}
          error={error}
          onRetry={refetch}
        />
      </div>
    </section>
  );
};

export default ProductCatalog;
