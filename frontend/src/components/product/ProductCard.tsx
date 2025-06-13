import React, { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/Product.module.css';

// Interfaz completa del producto según el modelo Almacen
export interface Product {
  id_producto: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  stock: number;
  stock_minimo: number | null;
  stock_maximo: number | null;
  precio_compra: string;
  precio_venta: string;
  fecha_ingreso: string;
  imagen: string | null;
  id_usuario: number;
  id_categoria: number;
  fyh_creacion: string;
  fyh_actualizacion: string;
  // Relaciones incluidas en las consultas
  Categoria?: {
    nombre_categoria: string;
  };
  Usuario?: {
    nombres: string;
  };
}

// Interfaz simplificada para las props del componente (usa las propiedades necesarias de Product)
export interface ProductCardProps {
  id_producto: number;
  nombre: string;
  descripcion?: string | null;
  imagen?: string | null;
  precio_venta: string;
  stock: number;
  id_categoria: number;
  className?: string;
  onClick?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = memo(({
  id_producto,
  nombre,
  descripcion,
  imagen,
  precio_venta,
  stock,
  className,
  onClick
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  const isOutOfStock = stock === 0;
  
  // Validar y formatear precio
  const formatPrice = (price: string): string => {
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return 'Precio no disponible';
    }
    return `$${numPrice.toLocaleString('es-AR')}`;
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isOutOfStock) {
      e.preventDefault();
      return;
    }
    onClick?.();
  };

  const stockText = stock > 0 ? `${stock} disponible${stock !== 1 ? 's' : ''}` : 'Agotado';
  const imageSource = imageError ? '/placeholder.png' : (imagen || '/placeholder.png');

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
          {imageLoading && !imageError && (
            <div className={styles.imageLoader}>
              <div className={styles.spinner}></div>
            </div>
          )}
          <img
            src={imageSource}
            alt={`Imagen de ${nombre}`}
            className={styles.productImage}
            loading="lazy"
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ display: imageLoading ? 'none' : 'block' }}
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