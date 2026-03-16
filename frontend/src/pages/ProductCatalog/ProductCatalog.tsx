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
    // ============================================================================
    // NAVEGACIÓN Y LOCATION
    // ============================================================================
    const navigate = useNavigate();
    const location = useLocation();

    // ============================================================================
    // ESTADO LOCAL PARA CONTROLAR CARGA - MEJORADO PARA STRICT MODE
    // ============================================================================
    const [hasInitialized, setHasInitialized] = useState(false);
    const [initializationLogsShown, setInitializationLogsShown] = useState(false);
    const [urlFiltersApplied, setUrlFiltersApplied] = useState(false);

    // ============================================================================
    // CONTEXTO DE PRODUCTOS - CARGA PRINCIPAL
    // ============================================================================
    const {
        filters,
        updateFilters,
        products: allProducts,
        loadProducts,
        loadCategories,
        loadBrands,
        searchQuery: productSearchQuery // ✅ Búsqueda del contexto de productos
    } = useProductActions();

    // ============================================================================
    // CONTEXTO GLOBAL DE BÚSQUEDA - PARA SINCRONIZACIÓN CON URL
    // ============================================================================
    const {
        debouncedSearchQuery, // ✅ Búsqueda global con debounce
    } = useSearch();

    // ============================================================================
    // FILTROS DESDE URL - PARA DEEP LINKING Y NAVEGACIÓN DESDE OTRAS PÁGINAS
    // ============================================================================
    const urlFilters = useUrlFilters();

    // ============================================================================
    // CONTEXTO DE OFERTAS - CARGA PARA PRODUCTCARDS
    // ============================================================================
    const { loadOfertas, ofertas } = useOfertasGlobal();

    // ============================================================================
    // NOTA: La sincronización entre SearchContext y ProductContext
    // ahora se maneja globalmente con el componente SearchSync en App.tsx
    // ============================================================================

    // ============================================================================
    // CARGA CONTROLADA - SOLO UNA VEZ AL MONTAR - OPTIMIZADO
    // ============================================================================
    useEffect(() => {
        // Solo cargar una vez al montar el componente
        if (!hasInitialized) {
            // Solo mostrar logs de inicialización UNA VEZ
            if (!initializationLogsShown && process.env.NODE_ENV === 'development') {
                console.log('🚀 ProductCatalog: Iniciando carga inicial de datos');
                setInitializationLogsShown(true);
            }

            loadProducts();
            loadCategories();
            loadBrands();
            setHasInitialized(true);
        }
    }, [hasInitialized, loadProducts, loadCategories, loadBrands, initializationLogsShown]);

    // ============================================================================
    // CARGA DE OFERTAS - SOLO UNA VEZ Y CON VERIFICACIÓN - OPTIMIZADO
    // ============================================================================
    useEffect(() => {
        // Cargar ofertas solo si no están cargadas y no se han cargado antes
        if (ofertas.length === 0) {
            if (!initializationLogsShown && process.env.NODE_ENV === 'development') {
                console.log('🎯 ProductCatalog: Cargando ofertas (primera vez)');
            }
            loadOfertas();
        } else if (!initializationLogsShown && process.env.NODE_ENV === 'development') {
            console.log('ℹ️ ProductCatalog: Ofertas ya cargadas, usando cache');
        }
    }, [ofertas.length, loadOfertas, initializationLogsShown]);

    // ============================================================================
    // APLICAR FILTROS DESDE URL - DEEP LINKING SUPPORT
    // ============================================================================
    useEffect(() => {
        // Solo aplicar filtros de URL una vez, después de que se hayan cargado los datos
        if (hasInitialized && !urlFiltersApplied && (urlFilters.marca || urlFilters.categoria)) {
            const filtersToApply: any = {};

            // Aplicar filtro de marca si existe en URL
            if (urlFilters.marca) {
                filtersToApply.marca = urlFilters.marca;
                if (process.env.NODE_ENV === 'development') {
                    console.log('🔍 ProductCatalog: Aplicando filtro de marca desde URL:', urlFilters.marca);
                }
            }

            // Aplicar filtro de categoría si existe en URL
            if (urlFilters.categoria) {
                filtersToApply.categoria = urlFilters.categoria;
                if (process.env.NODE_ENV === 'development') {
                    console.log('🔍 ProductCatalog: Aplicando filtro de categoría desde URL:', urlFilters.categoria);
                }
            }

            // Aplicar filtro de ordenamiento si existe en URL
            if (urlFilters.order) {
                filtersToApply.order = urlFilters.order;
            }

            // Aplicar filtro de stock si existe en URL
            if (urlFilters.solo_con_stock !== undefined) {
                filtersToApply.solo_con_stock = urlFilters.solo_con_stock;
            }

            // Aplicar todos los filtros de una vez
            if (Object.keys(filtersToApply).length > 0) {
                updateFilters(filtersToApply);
                setUrlFiltersApplied(true);
            }
        }
    }, [hasInitialized, urlFiltersApplied, urlFilters, updateFilters]);

    // ============================================================================
    // SINCRONIZACIÓN BIDIRECCIONAL: FILTROS → URL
    // ============================================================================
    useEffect(() => {
        // Solo sincronizar después de que los filtros iniciales de URL hayan sido aplicados
        if (!urlFiltersApplied && !hasInitialized) {
            return; // Esperar a que se inicialice
        }

        // Construir query string desde los filtros actuales
        const queryString = filtersToQueryString({
            marca: filters.marca,
            categoria: filters.categoria,
            busqueda: debouncedSearchQuery || '',
            order: filters.order,
            solo_con_stock: filters.solo_con_stock
        });

        // Construir nueva URL
        const newSearch = queryString ? `?${queryString}` : '';

        // Solo actualizar si la URL es realmente diferente (evitar loops infinitos)
        // Normalizamos para comparación exacta
        const currentSearch = location.search || '';
        if (newSearch !== currentSearch) {
            navigate({ search: newSearch }, { replace: true });

            if (process.env.NODE_ENV === 'development') {
                console.log('🔄 ProductCatalog: Sincronizando filtros con URL:', newSearch);
            }
        }
    }, [
        filters.marca,
        filters.categoria,
        filters.order,
        filters.solo_con_stock,
        debouncedSearchQuery,
        // Removido location.search de las dependencias para evitar loop
        navigate,
        urlFiltersApplied,
        hasInitialized
    ]);

    // ============================================================================
    // MAPEO DE FILTROS PARA COMPATIBILIDAD - MEMOIZADO
    // ============================================================================
    const uiFilters: ProductUIFilters = useMemo(() => ({
        search: debouncedSearchQuery || productSearchQuery || '', // ✅ Priorizar búsqueda global
        selectedDropdownCategory: filters.categoria?.toString() || '',
        selectedDropdownBrand: filters.marca?.toString() || '',
        order: filters.order || '', // Ahora se sincroniza con el backend
        onlyStock: filters.solo_con_stock || false
    }), [debouncedSearchQuery, productSearchQuery, filters.categoria, filters.marca, filters.order, filters.solo_con_stock]);

    // ============================================================================
    // MANEJADOR DE FILTROS - MEMOIZADO
    // ============================================================================
    const handleFiltersChange = useCallback((newFilters: Partial<ProductUIFilters>) => {
        const backendFilters: any = {};

        if (newFilters.selectedDropdownCategory !== undefined) {
            backendFilters.categoria = newFilters.selectedDropdownCategory ? parseInt(newFilters.selectedDropdownCategory) : undefined;
        }

        if (newFilters.selectedDropdownBrand !== undefined) {
            backendFilters.marca = newFilters.selectedDropdownBrand ? parseInt(newFilters.selectedDropdownBrand) : undefined;
        }

        if (newFilters.order !== undefined) {
            backendFilters.order = newFilters.order;
        }

        if (newFilters.onlyStock !== undefined) {
            backendFilters.solo_con_stock = newFilters.onlyStock;
        }

        updateFilters(backendFilters);
    }, [updateFilters]);

    // ============================================================================
    // DATOS PARA FILTROS - MEMOIZADOS
    // ============================================================================
    const totalProducts = useMemo(() => {
        return allProducts.length;
    }, [allProducts.length]);

    // ============================================================================
    // PRODUCTOS FILTRADOS EN TIEMPO REAL - MEMOIZADO
    // ============================================================================
    const filteredProductsCount = useMemo(() => {
        if (allProducts.length === 0) return 0;
        const filtered = filterProducts(allProducts, uiFilters);
        return filtered.length;
    }, [allProducts, uiFilters]);

    // ============================================================================
    // RENDERIZADO OPTIMIZADO
    // ============================================================================
    const catalogTitle = debouncedSearchQuery
        ? `"${debouncedSearchQuery}" en productos`
        : filters.categoria
            ? 'Catálogo de productos'
            : 'Todos los productos';

    return (
        <div className={styles.catalogFullscreen}>
            <PageMeta
                title={catalogTitle}
                description="Explorá el catálogo completo de TecnoCel. Celulares, accesorios, auriculares y más con los mejores precios en Argentina."
                url="/productos"
            />
            <div className={styles.catalogContainer}>
                {/* Sidebar con filtros fijo a la izquierda */}
                <aside className={styles.filtersSidebar}>
                    <ProductFilters
                        filters={uiFilters}
                        onFiltersChange={handleFiltersChange}
                        totalProducts={totalProducts}
                        filteredProducts={filteredProductsCount}
                    />
                </aside>

                {/* Contenido principal con el grid de productos */}
                <main className={styles.productsMainContent}>
                    <ProductGrid filters={uiFilters} />
                </main>
            </div>
        </div>
    );
};

export default ProductCatalog; 