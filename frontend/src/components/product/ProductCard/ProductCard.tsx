import React from 'react';
import { Link } from 'react-router-dom';
import ProductImage from '../ProductImage';
import { useProductCardLogic } from '../../../hooks/useProductCardLogic';
import styles from './ProductCard.module.css';
import type { ProductCardProps } from '../../../types/product';

const ProductCard: React.FC<ProductCardProps> = ({
    id_producto,
    nombre,
    descripcion,
    imagen_url,
    imagenes,
    precio_venta,
    stock,
    className,
    precio_original,
    precio_oferta,
    en_oferta
}) => {
    // ============================================================================
    // HOOK COMÚN - TODA LA LÓGICA CENTRALIZADA
    // ============================================================================
    const logic = useProductCardLogic({
        id_producto,
        precio_venta,
        stock,
        precio_original,
        precio_oferta,
        en_oferta
    });

    // ============================================================================
    // DESTRUCTURING DE LA LÓGICA COMÚN
    // ============================================================================
    const {
        isAddingToCart,
        showSuccess,
        isOutOfStock,
        formatPrice,
        priceInfo,
        handleCardClick,
        handleAddToCart,
        handleToggleFavorite,
        isProductFavorite,
        favoritoLoading,
        carritoLoading,
        overlayContent,
        offerIndicator,
        stockText
    } = logic;

    const getButtonContent = () => {
        if (isAddingToCart) {
            return (
                <span className="material-icons">
                    autorenew
                </span>
            );
        }
        if (showSuccess) {
            return (
                <span className="material-icons">
                    check_circle
                </span>
            );
        }
        return (
            <span className="material-icons">
                add_shopping_cart
            </span>
        );
    };

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
                    <ProductImage
                        images={imagenes}
                        defaultImage={imagen_url}
                        alt={`Imagen de ${nombre}`}
                        className={styles.productImage}
                        onImageChange={(imageUrl) => {
                            // Usar cache de imágenes para evitar descargas repetidas
                            if (logic.loadImageWithCache) {
                                logic.loadImageWithCache(imageUrl);
                            }
                        }}
                    />

                    {/* Indicador de oferta */}
                    {offerIndicator.show ? (
                        <div className={styles.offerIndicator}>
                            <span className={styles.offerPercentage}>-{offerIndicator.discountPercentage}%</span>
                            <span className={styles.offerLabel}>OFERTA</span>
                        </div>
                    ) : null}

                    {/* Botón de favoritos - FUERA DEL LINK PARA EVITAR NAVEGACIÓN */}
                    <button
                        className={`${styles.favoriteButton} ${isProductFavorite ? styles.favoriteActive : styles.favoriteInactive}`}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleToggleFavorite();
                        }}
                        disabled={favoritoLoading}
                        aria-label={isProductFavorite ? `Quitar ${nombre} de favoritos` : `Agregar ${nombre} a favoritos`}
                        type="button"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            className={styles.favoriteIcon}
                            fill={isProductFavorite ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                    </button>

                    {!isOutOfStock && (
                        <button
                            className={`${styles.imageOverlay} ${showSuccess ? styles.successOverlay : ''}`}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAddToCart();
                            }}
                            disabled={isAddingToCart || carritoLoading}
                            aria-label={`Agregar ${nombre} al carrito`}
                            type="button"
                        >
                            <span className={`material-icons ${styles.overlayIcon} ${isAddingToCart ? styles.loadingIcon : showSuccess ? styles.successIcon : ''}`}>
                                {isAddingToCart ? 'hourglass_empty' : showSuccess ? 'check_circle' : 'add_shopping_cart'}
                            </span>
                            <span className={styles.overlayText}>
                                {isAddingToCart ? 'Agregando...' : showSuccess ? '¡Agregado!' : 'Agregar al carrito'}
                            </span>
                        </button>
                    )}
                    {isOutOfStock && (
                        <div className={styles.outOfStockBadge} role="status" aria-label="Producto agotado">
                            Agotado
                        </div>
                    )}
                    {/* Overlay para productos agotados */}
                    {overlayContent && (
                        <div className={styles.overlay}>
                            <span className="material-icons">
                                {overlayContent.icon}
                            </span>
                            <span className={styles.overlayText}>{overlayContent.text}</span>
                        </div>
                    )}
                </div>

                <div className={styles.productInfo}>
                    <div className={styles.productHeader}>
                        <h3 className={styles.productTitle}>{nombre}</h3>
                        <div className={styles.priceContainer}>
                            {priceInfo.hasDiscount ? (
                                <>
                                    <span className={styles.price}>{formatPrice(priceInfo.current)}</span>
                                    <span className={styles.originalPrice}>{formatPrice(priceInfo.original)}</span>
                                </>
                            ) : (
                                <span className={styles.price}>{formatPrice(priceInfo.current)}</span>
                            )}
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
                                <button
                                    className={`${styles.addToCartButton} ${showSuccess ? styles.successButton : ''}`}
                                    type="button"
                                    onClick={handleAddToCart}
                                    disabled={isAddingToCart || carritoLoading}
                                    aria-label={`Agregar ${nombre} al carrito`}
                                >
                                    {getButtonContent()}
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
};

ProductCard.displayName = 'ProductCard';

export default ProductCard;