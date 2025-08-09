import React, { memo, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCarrito } from '../../../contexts/CarritoContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { useFavoritosGlobal } from '../../../contexts/FavoritosGlobalContext';
import ProductImage from '../ProductImage';
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
    const { isFavorito, toggleFavorito, loading: favoritoLoading } = useFavoritosGlobal();
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
    const priceInfo = useMemo(() => {
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
    }, [en_oferta, precio_oferta, precio_original, precio_venta]);

    // Memoizar estado de favorito para evitar recálculos
    const isProductFavorite = useMemo(() => {
        return isFavorito(id_producto);
    }, [isFavorito, id_producto]);

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
                        showThumbnails={true}
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

                        <div className={styles.actionContainer}>
                            {!isOutOfStock ? (
                                <button
                                    className={`${styles.addToCartButton} ${showSuccess ? styles.successButton : ''}`}
                                    type="button"
                                    onClick={handleAddToCart}
                                    disabled={isAddingToCart || estado.cargando}
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
});

ProductCardExtensive.displayName = 'ProductCardExtensive';

export default ProductCardExtensive;