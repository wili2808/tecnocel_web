import React, { memo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCarrito } from '../../../contexts/CarritoContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
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
    const navigate = useNavigate();

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