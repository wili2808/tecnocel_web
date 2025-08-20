/**
 * Componente ProductCardExtensive - Tarjeta de producto para vista horizontal
 * Muestra información del producto en layout horizontal con imagen a la izquierda
 * Incluye indicadores de oferta, favoritos y botón de carrito externo
 * Utiliza hook común useProductCardLogic para toda la funcionalidad
 * Botón de carrito personalizado integrado con estilos responsive
 * Indicador de carrito integrado para mayor eficiencia
 */
import React, { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import ProductImage from '../ProductImage';
import OfferIndicator from '../OfferIndicator';
import FavoriteButtonReusable from '../FavoriteButtonReusable';
import { useProductCardLogic } from '../../../hooks/useProductCardLogic';
import { useCarrito } from '../../../contexts/CarritoContext';
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
    // HOOKS Y CONTEXTOS
    // ============================================================================
    const { estado } = useCarrito();
    
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
    } = logic;

    // ============================================================================
    // INDICADOR DE CARRITO INTEGRADO
    // ============================================================================
    const cartItem = useMemo(() => {
        return estado.items.find(item => item.id_producto === id_producto);
    }, [estado.items, id_producto]);

    const isInCart = cartItem && cartItem.cantidad > 0;

    // ============================================================================
    // MANEJADOR DEL BOTÓN DE CARRITO PERSONALIZADO
    // ============================================================================
    const handleCartButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        if (isOutOfStock) {
            // No hacer nada - botón deshabilitado
            return;
        }
        
        if (!logic.canAddMoreOfProduct(id_producto, stock)) {
            // Navegar al carrito
            window.location.href = '/carrito';
            return;
        }
        
        // Agregar al carrito normalmente
        handleAddToCart();
    };

    // ============================================================================
    // RENDERIZADO
    // ============================================================================

    return (
        <div className={styles.productCardContainer}>
            {/* Link principal para navegar al detalle del producto */}
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
                            showThumbnails={true}
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

                        {/* Overlay de producto agotado - Solo visible si no hay stock */}
                        {/* {isOutOfStock && (
                            <div className={styles.outOfStockOverlay}>
                                <span className={styles.outOfStockText}>Agotado</span>
                            </div>
                        )} */}
                    </div>

                    {/* Información del producto a la derecha de la imagen */}
                    <div className={styles.productInfo}>
                        {/* Encabezado con título y precios */}
                        <div className={styles.productHeader}>
                            <h3 className={styles.productTitle}>{nombre}</h3>
                            <div className={styles.priceContainer}>
                                {priceInfo.hasDiscount ? (
                                    <>
                                        {/* Precio con descuento */}
                                        <span className={styles.price}>{formatPrice(priceInfo.current)}</span>
                                        {/* Precio original tachado */}
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
                    </div>

                    {/* LADO DERECHO: Columna de acciones organizada */}
                    <div className={styles.actionSection}>
                        {/* Botón de carrito - CENTRO - ANCHO COMPLETO */}
                        <button
                            type="button"
                            onClick={handleCartButtonClick}
                            disabled={isOutOfStock || isAddingToCart || carritoLoading}
                            className={`
                                ${styles.cartButton}
                                ${isOutOfStock ? styles.cartButtonDisabled : ''}
                                ${isAddingToCart || carritoLoading ? styles.cartButtonLoading : ''}
                                ${showSuccess ? styles.cartButtonSuccess : ''}
                            `}
                            aria-label={
                                isOutOfStock
                                    ? "Producto agotado"
                                    : (!logic.canAddMoreOfProduct(id_producto, stock)
                                        ? "Ir al carrito"
                                        : "Agregar al carrito")
                            }
                        >
                            {/* Icono del carrito */}
                            <span className={styles.cartButtonIcon}>
                                {isAddingToCart || carritoLoading ? 'hourglass_empty' : 'shopping_cart'}
                            </span>
                            
                            {/* Texto del botón */}
                            <span className={styles.cartButtonText}>
                                {isOutOfStock
                                    ? "Agotado"
                                    : (!logic.canAddMoreOfProduct(id_producto, stock)
                                        ? "Ver carrito"
                                        : (!isAddingToCart && !showSuccess
                                            ? "Agregar"
                                            : "¡Agregado!"))
                                }
                            </span>
                        </button>

                        {/* Indicador de carrito integrado - ESQUINA INFERIOR DERECHA */}
                        {isInCart && (
                            <div className={styles.cartIndicator}>
                                <span className={styles.cartIndicatorQuantity}>{cartItem.cantidad}</span>
                                <span className={styles.cartIndicatorLabel}>En carrito</span>
                            </div>
                        )}
                    </div>

                    {/* Botón de favoritos - POSICIONADO ABSOLUTAMENTE EN ESQUINA SUPERIOR DERECHA */}
                    <FavoriteButtonReusable
                        productId={id_producto}
                        productName={nombre}
                        size="small"
                        position="absolute"
                        variant="minimal"
                        className={styles.favoriteButton}
                    />
                </article>
            </Link>
        </div>
    );
});

ProductCardExtensive.displayName = 'ProductCardExtensive';

export default ProductCardExtensive;