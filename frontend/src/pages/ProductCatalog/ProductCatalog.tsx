import React, { useEffect, useCallback, useState, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PageMeta from '../../components/common/PageMeta/PageMeta';
import ProductFiltersSidebar from '../../components/product/ProductFilters';
import ProductGrid from '../../components/product/ProductGrid';
import { useProductActions } from '../../hooks/useProductActions';
import { useSearch } from '../../contexts/SearchContext';
import { useUrlFilters, filtersToQueryString } from '../../hooks/useUrlFilters';
import { filterProducts } from '../../utils/productFiltering';
import type { ProductUIFilters, ProductFilters } from '../../types';
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

  // ============================================================================
  // REFS para funciones inestables — evita loops en useEffect
  // Las funciones del contexto cambian de referencia en cada render porque
  // dependen de ofertasContext (inestable). Almacenarlas en refs permite
  // llamarlas sin agregarlas como dependencias del effect.
  // ============================================================================
  const loadProductsRef = useRef(loadProducts);
  const loadCategoriesRef = useRef(loadCategories);
  const loadBrandsRef = useRef(loadBrands);
  const updateFiltersRef = useRef(updateFilters);
  const filtersRef = useRef(filters);

  // Flag para evitar que Effect 3 (State→URL) reescriba la URL cuando
  // Effect 2 (URL→State) acaba de leer de la URL y disparó updateFilters.
  // Sin esto, Effect 3 ve los filtros VIEJOS del render actual y navega
  // para borrar los query params, creando un ping-pong infinito.
  const isUrlSyncRef = useRef(false);

  // Mantener refs siempre actualizados al último valor
  useEffect(() => {
    loadProductsRef.current = loadProducts;
    loadCategoriesRef.current = loadCategories;
    loadBrandsRef.current = loadBrands;
    updateFiltersRef.current = updateFilters;
    filtersRef.current = filters;
  });

  // 1. Carga inicial de datos — se ejecuta UNA SOLA VEZ
  //    Sin dependencias de funciones inestables gracias a los refs
  useEffect(() => {
    if (hasInitialized) return;

    loadProductsRef.current();
    loadCategoriesRef.current();
    loadBrandsRef.current();
    setHasInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInitialized]);

  // 2. Sincronización URL -> Estado
  //    Solo reacciona a cambios en urlFilters (que viene de useSearchParams)
  useEffect(() => {
    if (!hasInitialized) return;

    const currentFilters = filtersRef.current;

    const filtersToApply: Partial<ProductFilters> = {
      marca: urlFilters.marca,
      categoria: urlFilters.categoria,
      order: urlFilters.order,
      solo_con_stock: urlFilters.solo_con_stock,
      solo_ofertas: urlFilters.solo_ofertas,
      busqueda: urlFilters.search
    };
    
    const hasChanges = 
      filtersToApply.marca !== currentFilters.marca ||
      filtersToApply.categoria !== currentFilters.categoria ||
      filtersToApply.order !== currentFilters.order ||
      filtersToApply.solo_con_stock !== currentFilters.solo_con_stock ||
      filtersToApply.solo_ofertas !== currentFilters.solo_ofertas ||
      (filtersToApply.busqueda || '') !== (currentFilters.busqueda || '');

    if (hasChanges) {
      // Marcar que estamos sincronizando DESDE la URL para que Effect 3
      // no intente reescribir la URL con filtros aún no actualizados
      isUrlSyncRef.current = true;
      updateFiltersRef.current(filtersToApply);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlFilters, hasInitialized]);

  // 3. Sincronización Estado -> URL
  //    Si el cambio de filtros vino de la URL (Effect 2), se salta este ciclo
  useEffect(() => {
    if (!hasInitialized) return;

    // Si Effect 2 acaba de sincronizar desde la URL, consumir el flag y salir.
    // En el próximo render (cuando filters ya tenga el valor correcto),
    // este efecto correrá normalmente y la URL ya coincidirá.
    if (isUrlSyncRef.current) {
      isUrlSyncRef.current = false;
      return;
    }

    const currentSearch = (debouncedSearchQuery !== undefined ? debouncedSearchQuery : (filters.busqueda || '')).trim();

    const queryString = filtersToQueryString({
      marca: filters.marca,
      categoria: filters.categoria,
      busqueda: currentSearch,
      order: filters.order,
      solo_con_stock: filters.solo_con_stock,
      solo_ofertas: filters.solo_ofertas,
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
    onlyOffers: filters.solo_ofertas || false,
  }), [debouncedSearchQuery, productSearchQuery, filters]);

  const handleFiltersChange = useCallback((newFilters: Partial<ProductUIFilters>) => {
    const backendFilters: any = {};
    if (newFilters.selectedDropdownCategory !== undefined) backendFilters.categoria = newFilters.selectedDropdownCategory ? parseInt(newFilters.selectedDropdownCategory) : undefined;
    if (newFilters.selectedDropdownBrand !== undefined) backendFilters.marca = newFilters.selectedDropdownBrand ? parseInt(newFilters.selectedDropdownBrand) : undefined;
    if (newFilters.order !== undefined) backendFilters.order = newFilters.order;
    if (newFilters.onlyStock !== undefined) backendFilters.solo_con_stock = newFilters.onlyStock;
    if (newFilters.onlyOffers !== undefined) backendFilters.solo_ofertas = newFilters.onlyOffers;
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
          <ProductFiltersSidebar
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
