/**
 * Componente ProductGrid - Grid de productos con filtrado inteligente
 * Muestra productos en grid responsive con soporte para filtros, búsqueda y estados de carga
 * Incluye funcionalidades para filtrado inteligente combinando contexto y filtros locales
 * Utiliza useProductActions para gestión de productos y lógica de filtrado optimizada
 * Grid responsive que se adapta automáticamente a diferentes tamaños de pantalla
 */
import React, { useMemo } from 'react';
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import ProductCard from '../ProductCard';
import styles from './ProductGrid.module.css';
import { useProductActions } from '../../../hooks/useProductActions';
import { filterProducts } from '../../../utils/productFiltering';
import type { Product, ProductUIFilters } from '../../../types';

interface ProductGridProps {
    filters?: ProductUIFilters;
}

const MAX_STAGGERED_PRODUCTS = 16;

const gridItemVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 18,
        scale: 0.97,
    },
    visible: (index: number) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.34,
            ease: 'easeOut',
            delay: Math.min(index, MAX_STAGGERED_PRODUCTS) * 0.035,
        },
    }),
    exit: {
        opacity: 0,
        y: -10,
        scale: 0.97,
        transition: {
            duration: 0.22,
            ease: 'easeIn',
        },
    },
};

const ProductGrid: React.FC<ProductGridProps> = ({ filters }) => {
    // ============================================================================
    // HOOKS Y CONTEXTOS
    // ============================================================================
    const shouldReduceMotion = useReducedMotion();

    // Usar el contexto directamente para obtener productos y estado
    const {
        productsLoading: loading,
        productsError: error,
        products: allProducts,
        filteredProducts, // ✅ Agregar productos filtrados del contexto
        loadProducts
    } = useProductActions();

    // ============================================================================
    // PROCESAMIENTO Y FILTRADO DE PRODUCTOS
    // ============================================================================

    // ✅ Lógica inteligente: usar filteredProducts del contexto si hay búsqueda activa
    // y aplicar filtros adicionales del frontend (categoría, marca, stock, ordenamiento)
    const products = useMemo<Product[]>(() => {
        if (!filters) return allProducts;

        // Si hay búsqueda activa, usar productos ya filtrados del contexto
        // Fallback a array vacío para evitar errores si filteredProducts es undefined
        const baseProducts = filters.search.trim() ? (filteredProducts || []) : allProducts;

        // Aplicar filtros adicionales del frontend
        return filterProducts(baseProducts, filters);
    }, [filters, allProducts, filteredProducts]);

    const totalProducts = allProducts.length;

    // ============================================================================
    // ESTADOS DE CARGA Y ERROR
    // ============================================================================

    // Estado de carga inicial
    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner} aria-label="Cargando"></div>
                <p>Cargando productos...</p>
            </div>
        );
    }

    // Estado de error con opción de reintento
    if (error) {
        return (
            <div className={styles.errorContainer}>
                <span className={`material-icons ${styles.errorIcon}`}>error_outline</span>
                <p className={styles.errorMessage}>{error}</p>
                <button
                    onClick={() => loadProducts()}
                    className={styles.retryButton}
                >
                    Reintentar
                </button>
            </div>
        );
    }

    // Estado vacío con sugerencias de filtros
    if (products.length === 0) {
        return (
            <div className={styles.emptyContainer}>
                <span className={`material-icons ${styles.emptyIcon}`}>search_off</span>
                <p>No se encontraron productos.</p>
                {totalProducts > 0 && (
                    <p className={styles.emptySubtext}>
                        Intenta ajustar los filtros de búsqueda.
                    </p>
                )}
            </div>
        );
    }

    // ============================================================================
    // RENDERIZADO
    // ============================================================================

    // Grid responsive de productos con ProductCard
    return (
        <div className={styles.productsGrid} aria-live="polite">
            <LazyMotion features={domAnimation}>
                <AnimatePresence mode="popLayout">
                    {products.map((product, index) => (
                        <m.div
                            key={product.id_producto}
                            className={styles.productMotionItem}
                            layout={!shouldReduceMotion}
                            variants={shouldReduceMotion ? undefined : gridItemVariants}
                            initial={shouldReduceMotion ? false : 'hidden'}
                            animate={shouldReduceMotion ? undefined : 'visible'}
                            exit={shouldReduceMotion ? undefined : 'exit'}
                            custom={index}
                        >
                            <ProductCard
                                id_producto={product.id_producto}
                                nombre={product.nombre}
                                descripcion={product.descripcion}
                                imagen_url={product.imagen_url}
                                imagenes={product.imagenes || []}
                                precio_venta={String(product.precio_venta)}
                                stock={product.stock}
                                precio_oferta={product.precio_oferta}
                                descuento_porcentaje={product.descuento_porcentaje}
                                en_oferta={product.en_oferta}
                                precio_original={product.precio_original}
                            />
                        </m.div>
                    ))}
                </AnimatePresence>
            </LazyMotion>
        </div>
    );
};

ProductGrid.displayName = 'ProductGrid';

export default ProductGrid; 
