import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import ProductImage from '../ProductImage';
import CartIndicator from '../../cart/CartIndicator';
import { useProductCardLogic } from '../../../hooks/useProductCardLogic';
import styles from './ProductCardExtensive.module.css';
import type { ProductCardProps } from '../../../types/product';

const ProductCardExtensive: React.FC<ProductCardProps> = memo(({
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
        offerIndicator,
        stockText
    } = logic;

    // ============================================================================
    // FUNCIONES ESPECÍFICAS DE PRODUCTCARDEXTENSIVE
    // ============================================================================

    // Determinar el texto y estado del botón
    const getButtonContent = () => {
        if (isAddingToCart) {
            return (
                <>
                    <span className="material-icons">hourglass_empty</span>
                    Agregando...
                </>
            );
        }

        if (showSuccess) {
            return (
                <>
                    <span className="material-icons">check_circle</span>
                    ¡Agregado!
                </>
            );
        }

        return (
            <>
                <span className="material-icons">add_shopping_cart</span>
                Agregar al carrito
            </>
        );
    };

    return (
        <div className={styles.productCardContainer}>
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
                            showThumbnails={true}
                        />

                        {/* Indicador de oferta */}
                        {offerIndicator.show && (
                            <div className={styles.offerIndicator}>
                                <span className={styles.offerPercentage}>-{offerIndicator.discountPercentage}%</span>
                                <span className={styles.offerLabel}>OFERTA</span>
                            </div>
                        )}

                        {/* Indicador de carrito - POSICIONADO EN ESQUINA INFERIOR DERECHA */}
                        <CartIndicator productId={id_producto} />

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

                        {isOutOfStock && (
                            <div className={styles.outOfStockOverlay}>
                                <span className={styles.outOfStockText}>Agotado</span>
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
                        </div>
                    </div>
                </article>
            </Link>

            {/* Botón de agregar al carrito - FUERA DEL LINK PERO POSICIONADO VISUALMENTE DENTRO */}
            <div className={styles.externalActionContainer}>
                {!isOutOfStock ? (
                    <button
                        className={`${styles.addToCartButton} ${showSuccess ? styles.successButton : ''}`}
                        type="button"
                        onClick={handleAddToCart}
                        disabled={isAddingToCart || carritoLoading || !logic.canAddMoreOfProduct(id_producto, stock)}
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
    );
});

ProductCardExtensive.displayName = 'ProductCardExtensive';

export default ProductCardExtensive;