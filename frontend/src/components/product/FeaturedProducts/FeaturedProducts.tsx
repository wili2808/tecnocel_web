import React, { memo } from 'react';
import ProductCard from '../ProductCard';
import styles from './FeaturedProducts.module.css';
import type { Product } from '../../../types';

interface FeaturedProductsProps {
  products: Product[];
  title?: string;
  className?: string;
  loading?: boolean;
  error?: string | null;
}

// Skeleton de carga para el grid de productos
const SkeletonGrid = () => (
  <div className={styles.skeletonGrid}>
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className={styles.skeletonCard}>
        <div className={styles.skeletonImage} />
        <div className={styles.skeletonInfo}>
          <div className={styles.skeletonLine} />
          <div className={styles.skeletonLine} />
        </div>
      </div>
    ))}
  </div>
);

const FeaturedProducts: React.FC<FeaturedProductsProps> = memo(
  ({ products, title = 'Destacados', className, loading = false, error = null }) => {
    if (error) return null;

    return (
      <section className={`${styles.productsSection} ${className || ''}`}>
        <div className={styles.productsContainer}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionEyebrow}>Selección</span>
            {title && <h2 className={styles.sectionTitle}>{title}</h2>}
          </div>

          {loading ? (
            <SkeletonGrid />
          ) : products?.length > 0 ? (
            <div className={styles.productsGrid}>
              {products.map((product) => (
                <ProductCard
                  key={product.id_producto}
                  id_producto={product.id_producto}
                  nombre={product.nombre}
                  descripcion={product.descripcion}
                  imagen_url={product.imagen_url}
                  imagenes={product.imagenes}
                  precio_venta={String(product.precio_venta)}
                  stock={product.stock}
                  precio_oferta={product.precio_oferta}
                  en_oferta={product.en_oferta}
                  precio_original={product.precio_original}
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>
    );
  },
);

FeaturedProducts.displayName = 'FeaturedProducts';

export default FeaturedProducts;
