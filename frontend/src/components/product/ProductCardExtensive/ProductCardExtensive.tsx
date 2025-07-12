import React, { memo, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './ProductCardExtensive.module.css';
import type { ProductCardProps } from '../../../types/product';

const ProductCardExtensive: React.FC<ProductCardProps> = memo(({
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

    // Formatear precio
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
                {/* Imagen del producto */}
                <div className={styles.imageContainer}>
                    <img
                        src={imageSource}
                        alt={`Imagen de ${nombre}`}
                        className={styles.productImage}
                        loading="lazy"
                        onError={handleImageError}
                    />
                    {isOutOfStock && (
                        <div className={styles.outOfStockOverlay}>
                            <span className={styles.outOfStockText}>Agotado</span>
                        </div>
                    )}
                </div>

                {/* Información del producto */}
                <div className={styles.productInfo}>
                    <div className={styles.productHeader}>
                        <h3 className={styles.productTitle}>{nombre}</h3>
                        <div className={styles.priceContainer}>
                            <span className={styles.price}>{formatPrice(precio_venta)}</span>
                        </div>
                    </div>

                    {descripcion && (
                        <p className={styles.productDescription} title={descripcion}>
                            {descripcion}
                        </p>
                    )}

                    <div className={styles.productFooter}>
                        <div className={styles.stockContainer}>
                            <span className={`${styles.stockBadge} ${isOutOfStock ? styles.outOfStock : styles.inStock}`}>
                                {stockText}
                            </span>
                        </div>

                        <div className={styles.actionContainer}>
                            {!isOutOfStock ? (
                                <button className={styles.addToCartButton} type="button">
                                    <span className="material-icons">add_shopping_cart</span>
                                    Agregar al carrito
                                </button>
                            ) : (
                                <button className={styles.disabledButton} type="button" disabled>
                                    <span className="material-icons">remove_shopping_cart</span>
                                    No disponible
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </article>
        </Link>
    );
});

ProductCardExtensive.displayName = 'ProductCardExtensive';

export default ProductCardExtensive; 