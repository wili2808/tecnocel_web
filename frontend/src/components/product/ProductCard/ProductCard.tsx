import React, { memo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCarrito } from '../../../contexts/CarritoContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import styles from './ProductCard.module.css';
import type { ProductCardProps } from '../../../types/product';

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
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const isOutOfStock = stock === 0;

    const { agregarItem, estado } = useCarrito();
    const { isAuthenticated } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

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

    /**
     * Maneja el evento de agregar producto al carrito
     */
    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevenir navegación del Link
        e.stopPropagation(); // Prevenir propagación del evento

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
            await agregarItem(id_producto, 1); // Agregar 1 unidad por defecto

            // Mostrar confirmación visual
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
    const imageSource = imageError ? '/placeholder.svg' : (imagen_url || '/placeholder.svg');

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