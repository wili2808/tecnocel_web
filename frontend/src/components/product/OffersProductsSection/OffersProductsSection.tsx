import React, { useMemo } from 'react';
import ProductCard from '../ProductCard';
import LoadingSpinner from '../../common/LoadingSpinner';
import { useOfertasGlobal } from '../../../hooks/useOfertasGlobal';
import type { Product } from '../../../types/product';
import styles from './OffersProductsSection.module.css';

interface OffersProductsSectionProps {
    products?: Product[]; // Ahora opcional, usa contexto global si no se proporciona
    loading?: boolean; // Opcional, usa contexto global si no se proporciona
    error?: string | null; // Opcional, usa contexto global si no se proporciona
    totalProducts?: number; // Opcional, usa contexto global si no se proporciona
    hasMore?: boolean;
    onLoadMore?: () => void;
    onRetry?: () => void;
    useGlobalContext?: boolean; // Nueva prop para controlar si usar contexto global
}

const OffersProductsSection: React.FC<OffersProductsSectionProps> = ({
    products: propsProducts,
    loading: propsLoading,
    error: propsError,
    totalProducts: propsTotalProducts,
    hasMore = false,
    onLoadMore,
    onRetry,
    useGlobalContext = true // Por defecto usar contexto global
}) => {
    // Usar contexto global si está habilitado
    const {
        productosEnOferta: contextProducts,
        loading: contextLoading,
        error: contextError,
        getProductosEnOfertaCount,
        refreshOfertas
    } = useOfertasGlobal();

    // Determinar qué datos usar
    const products = useGlobalContext ? contextProducts : (propsProducts || []);
    const loading = useGlobalContext ? contextLoading : (propsLoading ?? false);
    const error = useGlobalContext ? contextError : propsError;
    const totalProducts = useGlobalContext ? getProductosEnOfertaCount() : (propsTotalProducts || 0);
    const handleRetry = useGlobalContext ? refreshOfertas : onRetry;

    // Memoizar productos para evitar re-renders innecesarios
    const memoizedProducts = useMemo(() => {
        return products.map(product => ({
            ...product,
            // Asegurar que las propiedades de oferta estén presentes
            en_oferta: product.en_oferta || false,
            precio_original: product.precio_original || Number(product.precio_venta),
            precio_oferta: product.precio_oferta || Number(product.precio_venta),
            descuento_porcentaje: product.descuento_porcentaje || 0
        }));
    }, [products]);

    if (loading && products.length === 0) {
        return (
            <section className={styles.productsSection}>
                <div className={styles.loadingContainer}>
                    <LoadingSpinner size="lg" />
                    <p className={styles.loadingText}>Cargando productos en oferta...</p>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className={styles.productsSection}>
                <div className={styles.errorContainer}>
                    <div className={styles.errorContent}>
                        <span className="material-icons">error_outline</span>
                        <h3>Error al cargar productos</h3>
                        <p>{error}</p>
                        {handleRetry && (
                            <button onClick={handleRetry} className={styles.retryButton}>
                                <span className="material-icons">refresh</span>
                                Reintentar
                            </button>
                        )}
                    </div>
                </div>
            </section>
        );
    }

    if (products.length === 0) {
        return (
            <section className={styles.productsSection}>
                <div className={styles.emptyContainer}>
                    <div className={styles.emptyContent}>
                        <span className="material-icons">shopping_bag</span>
                        <h3>No hay productos en oferta</h3>
                        <p>En este momento no tenemos productos con ofertas especiales. ¡Vuelve pronto!</p>
                    </div>
                </div>
            </section>
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
                {memoizedProducts.map((product) => (
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
            {hasMore && onLoadMore && (
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

            {/* Debug info - Solo en desarrollo */}
            {process.env.NODE_ENV === 'development' && useGlobalContext && (
                <div className={styles.debugInfo}>
                    <h4>🧪 Debug Info (OffersProductsSection)</h4>
                    <p>Usando Contexto Global: {useGlobalContext ? '✅ Sí' : '❌ No'}</p>
                    <p>Productos Cargados: {products.length}</p>
                    <p>Total Productos: {totalProducts}</p>
                    <p>Productos con Oferta: {products.filter(p => p.en_oferta).length}</p>
                </div>
            )}
        </section>
    );
};

export default OffersProductsSection;