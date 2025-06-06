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
    <article 
      className={`${styles.productCard} ${isOutOfStock ? styles.outOfStock : ''} ${className || ''}`}
    >
      <div className={styles.imageContainer}>
        <img 
          src={imagen || '/placeholder.png'}
          alt={nombre}
          className={styles.productImage}
          loading="lazy"
        />
      </div>
      
      <div className={styles.productContent}>
        <h3 className={styles.productTitle}>{nombre}</h3>
        <p className={styles.productDescription}>{descripcion}</p>
        
        <div className={styles.productMeta}>
          {stock > 0 && (
            <span className={styles.productTag}>{stock} disponibles</span>
          )}
        </div>

        <p className={styles.productPrice}>
          ${Number(precio_venta).toLocaleString('es-AR')}
        </p>

        <Link 
          to={`/productos/${id_producto}`}
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