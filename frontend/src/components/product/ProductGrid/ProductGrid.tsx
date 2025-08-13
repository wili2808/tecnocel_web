import React from 'react';
import ProductCardExtensive from '../ProductCardExtensive';
import styles from './ProductGrid.module.css';
import type { Product } from '../../../types/product';

interface ProductGridProps {
    products: Product[];
    loading: boolean;
    error: string | null;
    onRetry?: () => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({
    products,
    loading,
    error,
    onRetry
}) => {
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
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className={styles.retryButton}
                    >
                        Reintentar
                    </button>
                )}
            </div>
        );
    }

    // Estado vacío
    if (products.length === 0) {
        return (
            <div className={styles.emptyContainer}>
                <span className={`material-icons ${styles.emptyIcon}`}>search_off</span>
                <p>No se encontraron productos.</p>
            </div>
        );
    }

    // Grid de productos
    return (
        <div className={styles.productsGrid}>
            {products.map(product => (
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