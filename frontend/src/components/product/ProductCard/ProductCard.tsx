import React, { memo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCarrito } from '../../../contexts/CarritoContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { useFavoritos } from '../../../hooks/useFavoritos';
import ProductImage from '../ProductImage';
import styles from './ProductCard.module.css';
import type { ProductCardProps } from '../../../types/product';

const ProductCard: React.FC<ProductCardProps> = memo(({
    id_producto,
    nombre,
    descripcion,
    imagen_url,
    imagenes,
    precio_venta,
    stock,
    className,
    onClick,
    precio_original,
    precio_oferta,
    descuento_porcentaje,
    en_oferta
}) => {
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const isOutOfStock = stock === 0;

    const { agregarItem, estado } = useCarrito();
    const { isAuthenticated } = useAuth();
    const { showNotification } = useNotification();
    const { isFavorito, toggleFavorito, loading: favoritoLoading } = useFavoritos();
    const navigate = useNavigate();

    // Debug: Log de props de imagen
    console.log(`ProductCard ${id_producto} - ${nombre}:`, {
        imagen_url,
        imagenes_count: imagenes?.length || 0,
        imagenes: imagenes?.map(img => ({
            url: img.url,
            es_principal: img.es_principal,
            orden: img.orden
        }))
    });

    // Validar y formatear precio
    const formatPrice = (price: string | number): string => {
        const numPrice = Number(price);
        if (isNaN(numPrice) || numPrice < 0) {
            return 'Precio no disponible';
        }
        return `$${numPrice.toLocaleString('es-AR')}`;
    };

    // Determinar qué precio mostrar
    const getDisplayPrice = () => {
        if (en_oferta && precio_oferta) {
            return {
                current: precio_oferta,
                original: precio_original || Number(precio_venta),
                hasDiscount: true
            };
        }
        return {
            current: Number(precio_venta),
            original: Number(precio_venta),
            hasDiscount: false
        };
    };

    const priceInfo = getDisplayPrice();

    const handleCardClick = (e: React.MouseEvent) => {
        if (isOutOfStock) {
            e.preventDefault();
            return;
        }
        onClick?.();
    };

    /**
     * Maneja el evento de agregar producto al carrito
     */
    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            showNotification(
                '¡Inicia sesión para agregar productos a tu carrito!',
                'info',
                4000,
                {
                    label: 'Ir al login',
                    onClick: () => navigate('/login')
                }
            );
            return;
        }

        if (isOutOfStock || isAddingToCart) {
            return;
        }

        setIsAddingToCart(true);
        try {
            await agregarItem(id_producto, 1);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        } catch (error) {
            console.error('Error al agregar producto al carrito:', error);
            showNotification('Error al agregar el producto al carrito. Por favor, intente nuevamente.', 'error', 5000);
        } finally {
            setIsAddingToCart(false);
        }
    };

    /**
     * Maneja el evento de toggle de favoritos
     */
    const handleToggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            showNotification(
                '¡Inicia sesión para agregar productos a favoritos!',
                'info',
                4000,
                {
                    label: 'Ir al login',
                    onClick: () => navigate('/login')
                }
            );
            return;
        }

        if (favoritoLoading) {
            return;
        }

        try {
            await toggleFavorito(id_producto);
        } catch (error) {
            console.error('Error al actualizar favoritos:', error);
            showNotification('Error al actualizar favoritos. Por favor, intente nuevamente.', 'error', 5000);
        }
    };

    const stockText = stock > 0 ? `${stock} disponible${stock !== 1 ? 's' : ''}` : 'Agotado';
    const isProductFavorite = isFavorito(id_producto);

    // Determinar el contenido del overlay según el estado
    const getOverlayContent = () => {
        if (isAddingToCart) {
            return (
                <>
                    <span className={`material-icons ${styles.overlayIcon} ${styles.loadingIcon}`}>hourglass_empty</span>
                    <span className={styles.overlayText}>Agregando...</span>
                </>
            );
        }

        if (showSuccess) {
            return (
                <>
                    <span className={`material-icons ${styles.overlayIcon} ${styles.successIcon}`}>check_circle</span>
                    <span className={styles.overlayText}>¡Agregado!</span>
                </>
            );
        }

        return (
            <>
                <span className={`material-icons ${styles.overlayIcon}`}>add_shopping_cart</span>
                <span className={styles.overlayText}>Agregar al carrito</span>
            </>
        );
    };

    // Renderizar indicador de oferta
    const renderOfferIndicator = () => {
        if (!en_oferta || !descuento_porcentaje) return null;

        return (
            <div className={styles.offerIndicator}>
                <span className={styles.offerPercentage}>-{descuento_porcentaje}%</span>
                <span className={styles.offerLabel}>OFERTA</span>
            </div>
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
                    />

                    {/* Indicador de oferta */}
                    {renderOfferIndicator()}

                    {/* Botón de favoritos */}
                    <button
                        className={`${styles.favoriteButton} ${isProductFavorite ? styles.favoriteActive : styles.favoriteInactive}`}
                        onClick={handleToggleFavorite}
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
                            onClick={handleAddToCart}
                            disabled={isAddingToCart || estado.cargando}
                            aria-label={`Agregar ${nombre} al carrito`}
                            type="button"
                        >
                            {getOverlayContent()}
                        </button>
                    )}
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
                        <div className={styles.priceContainer}>
                            {priceInfo.hasDiscount ? (
                                <>
                                    <p className={styles.productPrice} aria-label={`Precio con descuento: ${formatPrice(priceInfo.current)}`}>
                                        {formatPrice(priceInfo.current)}
                                    </p>
                                    <p className={styles.originalPrice} aria-label={`Precio original: ${formatPrice(priceInfo.original)}`}>
                                        {formatPrice(priceInfo.original)}
                                    </p>
                                </>
                            ) : (
                                <p className={styles.productPrice} aria-label={`Precio: ${formatPrice(priceInfo.current)}`}>
                                    {formatPrice(priceInfo.current)}
                                </p>
                            )}
                        </div>
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