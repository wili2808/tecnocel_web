import React, { memo } from 'react';
import ProductCard from '../ProductCard';
import styles from './FeaturedProducts.module.css';
import type { Product } from '../../../types/product';

interface FeaturedProductsProps {
    products: Product[];
    title?: string;
    className?: string;
}

const FeaturedProducts: React.FC<FeaturedProductsProps> = memo(({
    products,
    title = 'Productos Destacados',
    className
}) => {
    if (products.length === 0) {
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
                        />
                    ))}
                </div>
            </div>
        </section>
    );
});

FeaturedProducts.displayName = 'FeaturedProducts';

export default FeaturedProducts; 