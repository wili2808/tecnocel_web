import React, { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/Product.module.css';
import type { ProductCardProps } from '../../types/product';

const ProductCard: React.FC<ProductCardProps> = memo(({
  id_producto,
  nombre,
  descripcion,
  imagen_url,
  precio_venta,
  stock,
  className,
  onClick
}) => {
  const [imageError, setImageError] = useState(false);
  const isOutOfStock = stock === 0;

  // Usar eager loading para los primeros 8 productos (generalmente los visibles)
  const shouldUseEagerLoading = id_producto <= 8;

  // Validar y formatear precio
  const formatPrice = (price: string): string => {
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return 'Precio no disponible';
    }
    return `$${numPrice.toLocaleString('es-AR')}`;
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isOutOfStock) {
      e.preventDefault();
      return;
    }
    onClick?.();
  };

  const stockText = stock > 0 ? `${stock} disponible${stock !== 1 ? 's' : ''}` : 'Agotado';
  const imageSource = imageError ? '/placeholder.svg' : (imagen_url || '/placeholder.svg');

  return (
    <Link
      to={`/productos/${id_producto}`}
      className={`${styles.productLink} ${isOutOfStock ? styles.outOfStockLink : ''}`}
      aria-disabled={isOutOfStock}
      aria-label={`Ver detalles de ${nombre}${isOutOfStock ? ' (Agotado)' : ''}`}
      onClick={handleCardClick}
      tabIndex={isOutOfStock ? -1 : 0}
    >
      <article className={`${styles.productCard} ${className || ''}`}>
        <div className={styles.imageContainer}>
          <img
            src={imageSource}
            alt={`Imagen de ${nombre}`}
            className={styles.productImage}
            loading={shouldUseEagerLoading ? "eager" : "lazy"}
            onError={handleImageError}
          />
          <div className={styles.imageOverlay}>
            <span className={styles.overlayIcon} aria-hidden="true">+</span>
            <span className={styles.overlayText}>Ver más</span>
          </div>
          {isOutOfStock && (
            <div className={styles.outOfStockBadge} role="status" aria-label="Producto agotado">
              Agotado
            </div>
          )}
        </div>

        <div className={styles.productContent}>
          <h3 className={styles.productTitle}>{nombre}</h3>
          {descripcion && (
            <p className={styles.productDescription} title={descripcion}>
              {descripcion.length > 80 ? `${descripcion.substring(0, 80)}...` : descripcion}
            </p>
          )}

          <div className={styles.productMeta}>
            <p className={styles.productPrice} aria-label={`Precio: ${formatPrice(precio_venta)}`}>
              {formatPrice(precio_venta)}
            </p>
            <span
              className={`${styles.productTag} ${isOutOfStock ? styles.outOfStockTag : ''}`}
              aria-label={`Stock: ${stockText}`}
            >
              {stockText}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;