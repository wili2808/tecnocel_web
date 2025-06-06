import React, { useState, useEffect } from 'react';
import ProductCard from '../components/product/ProductCard';
import styles from '../styles/Product.module.css';
import productService from '../services/productService';
import type { ProductCardProps } from '../components/product/ProductCard';

const ProductCatalog: React.FC = () => {
  const [products, setProducts] = useState<ProductCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await productService.getProducts();
        const mappedProducts = data.map((prod: any) => ({
          id_producto: prod.id_producto,
          nombre: prod.nombre,
          descripcion: prod.descripcion,
          imagen: prod.imagen,
          precio_venta: prod.precio_venta,
          stock: prod.stock,
        }));
        setProducts(mappedProducts);
      } catch (error: any) {
        setError(error.response?.data?.message || error.message || 'Error al cargar los productos');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className={styles.productsSection}>
        <div className={styles.productsContainer}>
          <div className="text-center py-20">
            <span className="material-icons animate-spin text-4xl text-primary">refresh</span>
            <p className="mt-4 text-secondary">Cargando productos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.productsSection}>
        <div className={styles.productsContainer}>
          <div className="text-center py-20">
            <span className="material-icons text-4xl text-error">error_outline</span>
            <p className="mt-4 text-error">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className={styles.productsSection}>
      <div className={styles.productsContainer}>
        <h1 className={styles.sectionTitle}>
          Catálogo de Productos
        </h1>
        <div className={styles.productsGrid}>
          {products.map(product => (
            <ProductCard
              key={product.id_producto}
              {...product}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductCatalog;
