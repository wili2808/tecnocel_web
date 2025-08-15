import React, { useMemo } from 'react';
import ProductCardExtensive from '../ProductCardExtensive';
import styles from './ProductGrid.module.css';
import { useProductActions } from '../../../hooks/useProductActions';
import { filterProducts } from '../../../utils/productFiltering';
import type { ProductUIFilters } from '../../../types/product';

interface ProductGridProps {
    filters?: ProductUIFilters;
}

const ProductGrid: React.FC<ProductGridProps> = ({ filters }) => {
    // Usar el contexto directamente para obtener productos y estado
    const { 
        productsLoading: loading, 
        productsError: error,
        products: allProducts,
        filteredProducts, // ✅ Agregar productos filtrados del contexto
        loadProducts 
    } = useProductActions();
    
    // ✅ Lógica inteligente: usar filteredProducts del contexto si hay búsqueda activa
    // y aplicar filtros adicionales del frontend (categoría, marca, stock, ordenamiento)
    const products = useMemo(() => {
        if (!filters) return allProducts;
        
        // Si hay búsqueda activa, usar productos ya filtrados del contexto
        let baseProducts = filters.search.trim() ? filteredProducts : allProducts;
        
        // Aplicar filtros adicionales del frontend
        return filterProducts(baseProducts, filters);
    }, [filters, allProducts, filteredProducts]);
    
    const totalProducts = allProducts.length;

    // Estado de carga
    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner} aria-label="Cargando"></div>
                <p>Cargando productos...</p>
            </div>
        );
    }

    // Estado de error
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

    // Estado vacío
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

    // Grid de productos
    return (
        <div className={styles.productsGrid}>
            {products.map((product: any) => (
                <ProductCardExtensive
                    key={product.id_producto}
                    id_producto={product.id_producto}
                    nombre={product.nombre}
                    descripcion={product.descripcion}
                    imagen_url={product.imagen_url}
                    precio_venta={String(product.precio_venta)}
                    stock={product.stock}
                    precio_oferta={product.precio_oferta}
                    en_oferta={product.en_oferta}
                    precio_original={product.precio_original}
                />
            ))}
        </div>
    );
};

export default ProductGrid; 