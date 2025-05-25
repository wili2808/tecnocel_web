import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/Product.module.css';

export interface ProductCardProps {
  id: number;
  nombre: string;
  descripcion: string;
  imagen_url: string;
  precio: number;
  existencias: number;
  es_personalizable: boolean;
  sizes?: string[];
  colors?: string[];
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = memo(({
  id,
  nombre,
  descripcion,
  imagen_url,
  precio,
  existencias,
  es_personalizable,
  sizes,
  colors,
  className
}) => {
  const isOutOfStock = existencias === 0;
  
  return (
    <article 
      className={`${styles.productCard} ${isOutOfStock ? styles.outOfStock : ''} ${className || ''}`}
    >
      <div className={styles.imageContainer}>
        <img 
          src={imagen_url} 
          alt={nombre}
          className={styles.productImage}
          loading="lazy"
        />
      </div>
      
      <div className={styles.productContent}>
        <h3 className={styles.productTitle}>{nombre}</h3>
        <p className={styles.productDescription}>{descripcion}</p>
        
        <div className={styles.productMeta}>
          {es_personalizable && (
            <span className={styles.productTag}>Personalizable</span>
          )}
          {existencias > 0 && (
            <span className={styles.productTag}>{existencias} disponibles</span>
          )}
        </div>
        
        {(sizes || colors) && (
          <div className={styles.productMeta}>
            {sizes && sizes.length > 0 && (
              <span className={styles.productTag}>
                Tallas: {sizes.join(', ')}
              </span>
            )}
            {colors && colors.length > 0 && (
              <span className={styles.productTag}>
                Colores: {colors.join(', ')}
              </span>
            )}
          </div>
        )}

        <p className={styles.productPrice}>
          ${precio.toLocaleString('es-AR')}
        </p>

        <Link 
          to={`/productos/${id}`}
          className={styles.actionButton}
          aria-disabled={isOutOfStock}
        >
          <span className="material-icons">
            {isOutOfStock ? 'remove_shopping_cart' : 'add_shopping_cart'}
          </span>
          {isOutOfStock ? 'Sin Stock' : 'Ver Detalles'}
        </Link>
      </div>
    </article>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;