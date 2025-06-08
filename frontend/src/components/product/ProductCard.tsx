import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/Product.module.css';

export interface ProductCardProps {
  id_producto: number;
  nombre: string;
  descripcion: string | null;
  imagen: string | null;
  precio_venta: string;
  stock: number;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = memo(({
  id_producto,
  nombre,
  descripcion,
  imagen,
  precio_venta,
  stock,
  className
}) => {
  const isOutOfStock = stock === 0;

  return (
    <Link 
      to={`/productos/${id_producto}`}
      className={`${styles.productLink} ${isOutOfStock ? styles.outOfStockLink : ''}`}
      aria-disabled={isOutOfStock}
      onClick={(e) => isOutOfStock && e.preventDefault()}
    >
      <article className={`${styles.productCard} ${className || ''}`}>
        <div className={styles.imageContainer}>
          <img
            src={imagen || '/placeholder.png'}
            alt={nombre}
            className={styles.productImage}
            loading="lazy"
          />
          <div className={styles.imageOverlay}>
            <span className={styles.overlayIcon}>+</span>
            <span className={styles.overlayText}>Ver más</span>
          </div>
          {isOutOfStock && <div className={styles.outOfStockBadge}>Agotado</div>}
        </div>
        
        <div className={styles.productContent}>
          <h3 className={styles.productTitle}>{nombre}</h3>
          
          <div className={styles.productMeta}>
            <p className={styles.productPrice}>
              ${Number(precio_venta).toLocaleString('es-AR')}
            </p>
            {stock > 0 && (
              <span className={styles.productTag}>{stock} disponibles</span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;