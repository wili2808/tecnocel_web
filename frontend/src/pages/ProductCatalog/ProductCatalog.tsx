import React, { useEffect, useCallback, useState, useMemo } from 'react';
import ProductFilters from '../../components/product/ProductFilters';
import ProductGrid from '../../components/product/ProductGrid';
import { useProductActions } from '../../hooks/useProductActions';
import { useOfertasGlobal } from '../../hooks/useOfertasGlobal';
import { filterProducts } from '../../utils/productFiltering';
import type { ProductUIFilters } from '../../types/product';
import styles from './ProductCatalog.module.css';

const ProductCatalog: React.FC = () => {
    // ============================================================================
    // ESTADO LOCAL PARA CONTROLAR CARGA - MEJORADO PARA STRICT MODE
    // ============================================================================
    const [hasInitialized, setHasInitialized] = useState(false);
    const [initializationLogsShown, setInitializationLogsShown] = useState(false);

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
        searchQuery // ✅ Agregar búsqueda del contexto
    } = useProductActions();

    // ============================================================================
    // CONTEXTO DE OFERTAS - CARGA PARA PRODUCTCARDS
    // ============================================================================
    const { loadOfertas, ofertas } = useOfertasGlobal();

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
    // MAPEO DE FILTROS PARA COMPATIBILIDAD - MEMOIZADO
    // ============================================================================
    const uiFilters: ProductUIFilters = useMemo(() => ({
        search: searchQuery || '', // ✅ Sincronizar con la búsqueda del contexto
        selectedDropdownCategory: filters.categoria?.toString() || '',
        selectedDropdownBrand: filters.marca?.toString() || '',
        order: filters.order || '', // Ahora se sincroniza con el backend
        onlyStock: filters.solo_con_stock || false
    }), [searchQuery, filters.categoria, filters.marca, filters.order, filters.solo_con_stock]);

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
    return (
        <div className={styles.catalogFullscreen}>
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