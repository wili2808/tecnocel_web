/**
 * Componente ProductCard - Tarjeta de producto para vista de cuadrícula
 * Muestra información resumida del producto con imagen, precios y acciones
 * Incluye indicadores de oferta, favoritos y estado del carrito
 * Utiliza hook común useProductCardLogic para toda la funcionalidad
 */
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProductImage from '../ProductImage';
import CartIndicator from '../../cart/CartIndicator';
import OfferIndicator from '../OfferIndicator';
import FavoriteButtonReusable from '../FavoriteButtonReusable';
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
    // HOOKS DE NAVEGACIÓN
    // ============================================================================
    const navigate = useNavigate();

    // ============================================================================
    // HOOK COMÚN - TODA LA LÓGICA CENTRALIZADA
    // ============================================================================
    const logic = useProductCardLogic({
        id_producto,
        precio_venta,
        stock,
        precio_original,
        precio_oferta
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
        carritoLoading,
        stockText
    } = logic;

    // ============================================================================
    // ESTADOS ADICIONALES PARA OVERLAY DE LÍMITE DE CARRITO
    // ============================================================================
    
    /**
     * Verificar si ya no se pueden agregar más productos al carrito
     * Determina si mostrar overlay rojo de límite alcanzado
     */
    const cannotAddMore = !logic.canAddMoreOfProduct(id_producto, stock);
    
    /**
     * Determinar el tipo de overlay a mostrar
     * Prioriza: éxito > límite alcanzado > agregar al carrito > agotado
     */
    const getOverlayType = () => {
        if (isOutOfStock) return 'outOfStock';
        if (showSuccess) return 'success';
        if (cannotAddMore) return 'limitReached';
        return 'addToCart';
    };

    /**
     * Obtener la cantidad actual en el carrito para mostrar en el overlay
     */
    const currentQuantity = logic.getProductQuantityInCart(id_producto);

    // ============================================================================
    // FUNCIONES ESPECÍFICAS DE PRODUCTCARD
    // ============================================================================
    
    // Función reservada para futuras funcionalidades

    // ============================================================================
    // RENDERIZADO
    // ============================================================================
    
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
                {/* Contenedor de imagen con indicadores superpuestos */}
                <div className={styles.imageContainer}>
                    {/* Imagen principal del producto con galería */}
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

                    {/* Indicador de oferta reutilizable - Solo visible si hay descuento */}
                    {(en_oferta || 
                      (precio_oferta && precio_oferta < Number(precio_venta))) && (
                        <OfferIndicator
                            descuentoPorcentaje={
                                (precio_oferta && precio_venta ? 
                                    Math.round(((Number(precio_venta) - precio_oferta) / Number(precio_venta)) * 100) : 0)
                            }
                            size="small"
                            position="top-left"
                            showLabel={true}
                        />
                    )}

                    {/* Indicador de carrito - POSICIONADO EN ESQUINA INFERIOR DERECHA */}
                    <CartIndicator productId={id_producto} />

                    {/* Botón de favoritos - FUERA DEL LINK PARA EVITAR NAVEGACIÓN */}
                    <FavoriteButtonReusable
                        productId={id_producto}
                        productName={nombre}
                        size="small"
                        position="absolute"
                        variant="minimal"
                        className={styles.favoriteButton}
                    />

                    {/* OVERLAY DINÁMICO SEGÚN EL ESTADO DEL PRODUCTO */}
                    {(() => {
                        const overlayType = getOverlayType();
                        
                        switch (overlayType) {
                            case 'success':
                                // ✅ OVERLAY DE ÉXITO - Verde con check, previene navegación
                                return (
                                    <button
                                        className={`${styles.imageOverlay} ${styles.successOverlay}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            // No hacer nada, solo mostrar el mensaje
                                        }}
                                        disabled={false}
                                        aria-label="Producto agregado exitosamente"
                                        type="button"
                                    >
                                        <span className={`material-icons ${styles.overlayIcon} ${styles.successIcon}`}>
                                            check_circle
                                        </span>
                                        <span className={styles.overlayText}>¡Agregado!</span>
                                    </button>
                                );
                            
                            case 'limitReached':
                                // 🚫 OVERLAY DE LÍMITE ALCANZADO - Rojo con navegación al carrito
                                return (
                                    <button
                                        className={`${styles.imageOverlay} ${styles.limitReachedOverlay}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            // Navegar directamente al carrito
                                            navigate('/carrito');
                                        }}
                                        disabled={false}
                                        aria-label="Ir al carrito - Máximo de productos alcanzado"
                                        type="button"
                                    >
                                        <span className={`material-icons ${styles.overlayIcon} ${styles.limitIcon}`}>
                                            remove_shopping_cart
                                        </span>
                                        <span className={styles.overlayText}>
                                            Máximo alcanzado
                                        </span>
                                        <span className={styles.overlaySubtext}>
                                            Ya tienes {currentQuantity} de {stock}
                                        </span>
                                        <span className={styles.overlayAction}>
                                            Click para ir al carrito
                                        </span>
                                    </button>
                                );
                            
                            case 'addToCart':
                                // 🛒 OVERLAY DE AGREGAR AL CARRITO - Azul con botón
                                return (
                                    <button
                                        className={`${styles.imageOverlay} ${styles.addToCartOverlay}`}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleAddToCart();
                                        }}
                                        disabled={isAddingToCart || carritoLoading}
                                        aria-label={`Agregar ${nombre} al carrito`}
                                        type="button"
                                    >
                                        <span className={`material-icons ${styles.overlayIcon} ${isAddingToCart ? styles.loadingIcon : ''}`}>
                                            {isAddingToCart ? 'hourglass_empty' : 'add_shopping_cart'}
                                        </span>
                                        <span className={styles.overlayText}>
                                            {isAddingToCart ? 'Agregando...' : 'Agregar al carrito'}
                                        </span>
                                    </button>
                                );
                            
                            case 'outOfStock':
                            default:
                                // ❌ OVERLAY DE PRODUCTO AGOTADO - Gris con información
                                return (
                                    <div className={`${styles.imageOverlay} ${styles.outOfStockOverlay}`}>
                                        <span className={`material-icons ${styles.overlayIcon} ${styles.outOfStockIcon}`}>
                                            remove_shopping_cart
                                        </span>
                                        <span className={styles.overlayText}>Agotado</span>
                                    </div>
                                );
                        }
                    })()}
                    
                    {/* Badge de producto agotado - Solo visible si no hay stock */}
                    {isOutOfStock && (
                        <div className={styles.outOfStockBadge} role="status" aria-label="Producto agotado">
                            Agotado
                        </div>
                    )}
                </div>

                {/* Información del producto debajo de la imagen */}
                <div className={styles.productInfo}>
                    {/* Encabezado con título y precios */}
                    <div className={styles.productHeader}>
                        <h3 className={styles.productTitle}>{nombre}</h3>
                        <div className={styles.priceContainer}>
                            {priceInfo.hasDiscount ? (
                                <>
                                    {/* Precio con descuento y original en la misma línea */}
                                    <span className={styles.price}>{formatPrice(priceInfo.current)}</span>
                                    <span className={styles.originalPrice}>{formatPrice(priceInfo.original)}</span>
                                </>
                            ) : (
                                /* Precio único sin descuento */
                                <span className={styles.price}>{formatPrice(priceInfo.current)}</span>
                            )}
                        </div>
                    </div>

                    {/* Descripción del producto - Solo visible si existe */}
                    {descripcion && (
                        <p className={styles.productDescription} title={descripcion}>
                            {descripcion}
                        </p>
                    )}

                    {/* Pie de tarjeta con stock y contenedor de acciones futuras */}
                    <div className={styles.productFooter}>
                        {/* Contenedor de información de stock */}
                        <div className={styles.stockContainer}>
                            <span className={`${styles.stockBadge} ${isOutOfStock ? styles.outOfStock : styles.inStock}`}>
                                {stockText}
                            </span>
                        </div>

                        {/* Contenedor de botones de acción - RESERVADO PARA FUNCIONES FUTURAS */}
                        <div className={styles.actionContainer}>
                            {/* Aquí se pueden agregar botones de funciones adicionales en el futuro */}
                            {/* Por ejemplo: Comparar, Compartir, Ver especificaciones, etc. */}
                        </div>
                    </div>
                </div>
            </article>
        </Link>
    );
};

ProductCard.displayName = 'ProductCard';

export default ProductCard;