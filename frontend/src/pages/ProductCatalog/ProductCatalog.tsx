import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageMeta from '../../components/common/PageMeta/PageMeta';
import ProductFilters from '../../components/product/ProductFilters';
import ProductGrid from '../../components/product/ProductGrid';
import { useProductActions } from '../../hooks/useProductActions';
import { useOfertasGlobal } from '../../hooks/useOfertasGlobal';
import { useSearch } from '../../contexts/SearchContext';
import { useUrlFilters, filtersToQueryString } from '../../hooks/useUrlFilters';
import { filterProducts } from '../../utils/productFiltering';
import type { ProductUIFilters } from '../../types';
import styles from './ProductCatalog.module.css';

const ProductCatalog: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasInitialized, setHasInitialized] = useState(false);
  
  const {
    filters,
    updateFilters,
    products: allProducts,
    loadProducts,
    loadCategories,
    loadBrands,
    searchQuery: productSearchQuery,
  } = useProductActions();

  const { debouncedSearchQuery } = useSearch();
  const urlFilters = useUrlFilters();
  const { loadOfertas, ofertas } = useOfertasGlobal();

  // 1. Carga inicial de datos (SOLO UNA VEZ)
  useEffect(() => {
    if (!hasInitialized) {
      loadProducts();
      loadCategories();
      loadBrands();
      if (ofertas.length === 0) loadOfertas();
      setHasInitialized(true);
    }
  }, [hasInitialized, loadProducts, loadCategories, loadBrands, loadOfertas, ofertas.length]);

  // 2. Sincronización URL -> Estado (Solo al montar o cuando la URL cambia externamente)
  useEffect(() => {
    if (hasInitialized) {
      const filtersToApply: any = {
        marca: urlFilters.marca,
        categoria: urlFilters.categoria,
        order: urlFilters.order,
        solo_con_stock: urlFilters.solo_con_stock,
        busqueda: urlFilters.search
      };
      
      // Solo actualizar si son diferentes para evitar loops
      if (JSON.stringify(filtersToApply) !== JSON.stringify(filters)) {
        updateFilters(filtersToApply);
      }
    }
  }, [urlFilters, hasInitialized]); // Solo depende de urlFilters

  // 3. Sincronización Estado -> URL (Debounced)
  useEffect(() => {
    if (!hasInitialized) return;

    const queryString = filtersToQueryString({
      marca: filters.marca,
      categoria: filters.categoria,
      busqueda: debouncedSearchQuery !== undefined ? debouncedSearchQuery : (filters.busqueda || ''),
      order: filters.order,
      solo_con_stock: filters.solo_con_stock,
    });

    const newSearch = queryString ? `?${queryString}` : '';
    if (newSearch !== location.search) {
      navigate({ search: newSearch }, { replace: true });
    }
  }, [filters, debouncedSearchQuery, location.search, navigate, hasInitialized]);

  const uiFilters: ProductUIFilters = useMemo(() => ({
    search: debouncedSearchQuery || productSearchQuery || '',
    selectedDropdownCategory: filters.categoria?.toString() || '',
    selectedDropdownBrand: filters.marca?.toString() || '',
    order: filters.order || '',
    onlyStock: filters.solo_con_stock || false,
  }), [debouncedSearchQuery, productSearchQuery, filters]);

  const handleFiltersChange = useCallback((newFilters: Partial<ProductUIFilters>) => {
    const backendFilters: any = {};
    if (newFilters.selectedDropdownCategory !== undefined) backendFilters.categoria = newFilters.selectedDropdownCategory ? parseInt(newFilters.selectedDropdownCategory) : undefined;
    if (newFilters.selectedDropdownBrand !== undefined) backendFilters.marca = newFilters.selectedDropdownBrand ? parseInt(newFilters.selectedDropdownBrand) : undefined;
    if (newFilters.order !== undefined) backendFilters.order = newFilters.order;
    if (newFilters.onlyStock !== undefined) backendFilters.solo_con_stock = newFilters.onlyStock;
    updateFilters(backendFilters);
  }, [updateFilters]);

  const filteredProductsCount = useMemo(() => {
    if (allProducts.length === 0) return 0;
    return filterProducts(allProducts, uiFilters).length;
  }, [allProducts, uiFilters]);

  return (
    <div className={styles.catalogFullscreen}>
      <PageMeta title="Catálogo de productos" description="TecnoCel Store" url="/productos" />
      <div className={styles.catalogContainer}>
        <aside className={styles.filtersSidebar}>
          <ProductFilters
            filters={uiFilters}
            onFiltersChange={handleFiltersChange}
            totalProducts={allProducts.length}
            filteredProducts={filteredProductsCount}
          />
        </aside>
        <main className={styles.productsMainContent}>
          <ProductGrid filters={uiFilters} />
        </main>
      </div>
    </div>
  );
};

export default ProductCatalog;
