import React, { memo } from 'react';
import ProductCard from '../ProductCard';
import styles from './FeaturedProducts.module.css';
import type { Product } from '../../../types/product';

interface FeaturedProductsProps {
    products: Product[];
    title?: string;
    className?: string;
    loading?: boolean;
    error?: string | null;
}

const FeaturedProducts: React.FC<FeaturedProductsProps> = memo(({
    products,
    title = 'Productos Destacados',
    className,
    loading = false,
    error = null
}) => {
    // Si está cargando, mostrar un placeholder
    if (loading) {
        return (
            <section className={`${styles.productsSection} ${className || ''}`}>
                <div className={styles.productsContainer}>
                    <h2 className={styles.sectionTitle}>{title}</h2>
                    <div className={styles.loadingContainer}>
                        <p>Cargando productos destacados...</p>
                    </div>
                </div>
            </section>
        );
    }

    // Si hay error, no mostrar nada (comportamiento silencioso)
    if (error) {
        return null;
    }

    // Verificar que products existe y tiene elementos
    if (!products || products.length === 0) {
        return null;
    }

    return (
        <section className={`${styles.productsSection} ${className || ''}`}>
            <div className={styles.productsContainer}>
                <h2 className={styles.sectionTitle}>{title}</h2>
                <div className={styles.productsGrid}>
                    {products.map(product => (
                        <ProductCard
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
            </div>
        </section>
    );
});

FeaturedProducts.displayName = 'FeaturedProducts';

export default FeaturedProducts; 