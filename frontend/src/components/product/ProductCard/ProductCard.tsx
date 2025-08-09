import React, { memo, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCarrito } from '../../../contexts/CarritoContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { useFavoritoProducto } from '../../../contexts/FavoritosGlobalContext';
import { useOfertasProducto } from '../../../hooks/useOfertasGlobal';
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
    // Log para verificar renders
    console.log(`🔄 ProductCard renderizado - ID: ${id_producto}, Nombre: ${nombre}`);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const isOutOfStock = stock === 0;

    const { agregarItem, estado } = useCarrito();
    const { isAuthenticated } = useAuth();
    const { showNotification } = useNotification();
    const { isFavorito, toggleFavorito, loading: favoritoLoading } = useFavoritoProducto(id_producto);
    const { isProductoEnOferta, getOfertaInfo } = useOfertasProducto(id_producto);
    const navigate = useNavigate();

    // Validar y formatear precio - Memoizado para evitar recálculos
    const formatPrice = useMemo(() => {
        return (price: string | number): string => {
            const numPrice = Number(price);
            if (isNaN(numPrice) || numPrice < 0) {
                return 'Precio no disponible';
            }
            return `$${numPrice.toLocaleString('es-AR')}`;
        };
    }, []);

    // Determinar qué precio mostrar - Memoizado para evitar recálculos
    // Usar contexto global para verificar si el producto está en oferta
    const priceInfo = useMemo(() => {
        const isInOffer = isProductoEnOferta();
        const offerInfo = getOfertaInfo();

        if (isInOffer && offerInfo) {
            // Usar el primer producto de la oferta para obtener precios
            const firstProduct = offerInfo.productos?.[0];
            return {
                current: firstProduct?.precio_oferta || Number(precio_venta),
                original: firstProduct?.precio_original || Number(precio_venta),
                hasDiscount: true,
                offerInfo
            };
        }

        // Fallback a props si no hay info en contexto
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
    }, [isProductoEnOferta, getOfertaInfo, en_oferta, precio_oferta, precio_original, precio_venta]);

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
            await toggleFavorito();
        } catch (error) {
            console.error('Error al actualizar favoritos:', error);
            showNotification('Error al actualizar favoritos. Por favor, intente nuevamente.', 'error', 5000);
        }
    };

    // Memoizar texto de stock para evitar recálculos
    const stockText = useMemo(() => {
        return stock > 0 ? `${stock} disponible${stock !== 1 ? 's' : ''}` : 'Agotado';
    }, [stock]);

    // El estado de favorito ya viene memoizado del hook optimizado
    const isProductFavorite = isFavorito;

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

    // Renderizar indicador de oferta - Usar contexto global y props
    const renderOfferIndicator = () => {
        // Usar la misma lógica que priceInfo para determinar si hay oferta
        const isInOffer = isProductoEnOferta();
        const offerInfo = getOfertaInfo();

        // Calcular descuento basado en contexto global o props
        let shouldShowOffer = false;
        let discountPercentage = 0;

        if (isInOffer && offerInfo) {
            // Usar información del contexto global
            const firstProduct = offerInfo.productos?.[0];
            if (firstProduct?.precio_oferta && firstProduct?.precio_original) {
                const original = Number(firstProduct.precio_original);
                const offer = Number(firstProduct.precio_oferta);
                discountPercentage = Math.round(((original - offer) / original) * 100);
                shouldShowOffer = discountPercentage > 0;
            }
        } else if (en_oferta && descuento_porcentaje) {
            // Fallback a props
            shouldShowOffer = true;
            discountPercentage = descuento_porcentaje;
        }

        if (!shouldShowOffer || discountPercentage <= 0) return null;

        return (
            <div className={styles.offerIndicator}>
                <span className={styles.offerPercentage}>-{discountPercentage}%</span>
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