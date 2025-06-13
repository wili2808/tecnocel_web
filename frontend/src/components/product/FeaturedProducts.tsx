import React, { memo, useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import productService, { type Product } from '../../services/productService';
import styles from '../../styles/Product.module.css';

interface FeaturedProductsProps {
  className?: string;
}

const FeaturedProducts: React.FC<FeaturedProductsProps> = memo(({ className }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeatured = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getFeaturedProducts();
      setProducts(data);
    } catch (err) {
      setError('Error al cargar los productos destacados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatured();
  }, []);

  if (loading) {
    return (
      <section className={`${styles.productsSection} ${className || ''}`}>
        <div className={styles.productsContainer}>
          <h2 className={styles.sectionTitle}>
            Productos Destacados
          </h2>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Cargando productos destacados...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={`${styles.productsSection} ${className || ''}`}>
        <div className={styles.productsContainer}>
          <h2 className={styles.sectionTitle}>
            Productos Destacados
          </h2>
          <div className={styles.errorContainer}>
            <p className={styles.errorMessage}>{error}</p>
            <button 
              onClick={fetchFeatured}
              className={styles.retryButton}
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section className={`${styles.productsSection} ${className || ''}`}>
        <div className={styles.productsContainer}>
          <h2 className={styles.sectionTitle}>
            Productos Destacados
          </h2>
          <div className={styles.emptyContainer}>
            <p>No hay productos destacados disponibles en este momento.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`${styles.productsSection} ${className || ''}`}>
      <div className={styles.productsContainer}>
        <h2 className={styles.sectionTitle}>
          Productos Destacados
        </h2>
        <div className={styles.productsGrid}>
          {products.map((product) => (
            <ProductCard
              key={product.id_producto}
              id_producto={product.id_producto}
              nombre={product.nombre}
              descripcion={product.descripcion}
              imagen={product.imagen}
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
