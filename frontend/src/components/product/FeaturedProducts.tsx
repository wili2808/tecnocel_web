import React, { memo } from 'react';
import ProductCard from './ProductCard';
import styles from '../../styles/Product.module.css';
import products from '../../data/products.json';

interface FeaturedProductsProps {
  className?: string;
}

const FeaturedProducts: React.FC<FeaturedProductsProps> = memo(({ className }) => {
  // Tomamos solo los primeros 6 productos como destacados
  const featuredProducts = products.slice(0, 6);

  return (
    <section className={`${styles.productsSection} ${className || ''}`}>
      <div className={styles.productsContainer}>
        <h2 className={styles.sectionTitle}>
          Productos Destacados
        </h2>
        <div className={styles.productsGrid}>
          {featuredProducts.map((product) => (
            <ProductCard
              key={product.id}
              {...product}
            />
          ))}
        </div>
      </div>
    </section>
  );
});

FeaturedProducts.displayName = 'FeaturedProducts';

export default FeaturedProducts;
