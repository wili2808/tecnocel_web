import React from 'react';
import ProductCard from '../ProductCard';
import LoadingSpinner from '../../common/LoadingSpinner';
import type { Product } from '../../../types/product';
import styles from './OffersProductsSection.module.css';

interface OffersProductsSectionProps {
    products: Product[];
    loading: boolean;
    error: string | null;
    totalProducts: number;
    hasMore: boolean;
    onLoadMore: () => void;
    onRetry?: () => void;
}

const OffersProductsSection: React.FC<OffersProductsSectionProps> = ({
    products,
    loading,
    error,
    totalProducts,
    hasMore,
    onLoadMore,
    onRetry
}) => {
    if (loading && products.length === 0) {
        return (
            <div className={styles.loadingContainer}>
                <LoadingSpinner size="lg" />
                <p className={styles.loadingText}>Cargando productos en oferta...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <div className={styles.errorContent}>
                    <span className="material-icons">error_outline</span>
                    <h3>Error al cargar productos</h3>
                    <p>{error}</p>
                    {onRetry && (
                        <button onClick={onRetry} className={styles.retryButton}>
                            <span className="material-icons">refresh</span>
                            Reintentar
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className={styles.emptyContainer}>
                <div className={styles.emptyContent}>
                    <span className="material-icons">inventory_2</span>
                    <h3>No hay productos en oferta</h3>
                    <p>En este momento no tenemos productos con descuentos especiales.</p>
                </div>
            </div>
        );
    }

    return (
        <section className={styles.productsSection}>
            <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                    <span className="material-icons">local_offer</span>
                    Productos en Oferta
                </h2>
                <div className={styles.productCount}>
                    <span className={styles.currentCount}>{products.length}</span>
                    <span className={styles.totalCount}>de {totalProducts} productos</span>
                </div>
            </div>

            <div className={styles.productsGrid}>
                {products.map((product) => (
                    <ProductCard
                        key={product.id_producto}
                        id_producto={product.id_producto}
                        nombre={product.nombre}
                        descripcion={product.descripcion}
                        imagen_url={product.imagen_url}
                        imagenes={product.imagenes}
                        precio_venta={product.precio_venta}
                        stock={product.stock}
                        precio_original={product.precio_original}
                        precio_oferta={product.precio_oferta}
                        descuento_porcentaje={product.descuento_porcentaje}
                        en_oferta={product.en_oferta}
                        ofertas={product.ofertas}
                    />
                ))}
            </div>

            {/* Botón cargar más */}
            {hasMore && (
                <div className={styles.loadMoreContainer}>
                    <button
                        onClick={onLoadMore}
                        className={styles.loadMoreButton}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <LoadingSpinner size="sm" />
                                <span>Cargando...</span>
                            </>
                        ) : (
                            <>
                                <span className="material-icons">expand_more</span>
                                <span>Cargar más productos</span>
                            </>
                        )}
                    </button>
                </div>
            )}
        </section>
    );
};

export default OffersProductsSection;