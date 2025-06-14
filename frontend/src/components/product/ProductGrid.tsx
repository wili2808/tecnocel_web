import React from 'react';
import ProductCard from './ProductCard';
import styles from '../../styles/Product.module.css';
import type { ProductCardProps } from './ProductCard';

interface ProductGridProps {
  products: ProductCardProps[];
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
      <div className="text-center py-20">
        <span className="material-icons animate-spin text-4xl text-primary">refresh</span>
        <p className="mt-4 text-secondary">Cargando productos...</p>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="text-center py-20">
        <span className="material-icons text-4xl text-error">error_outline</span>
        <p className="mt-4 text-error">{error}</p>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
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
      <div className="text-center py-20 w-full">
        <span className="material-icons text-4xl text-secondary">search_off</span>
        <p className="mt-4 text-secondary">No se encontraron productos.</p>
      </div>
    );
  }

  // Grid de productos
  return (
    <div className={styles.productsGrid}>
      {products.map(product => (
        <ProductCard
          key={product.id_producto}
          {...product}
        />
      ))}
    </div>
  );
};

export default ProductGrid; 