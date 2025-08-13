/**
 * Componente ProductInfo - Información detallada del producto
 * Muestra título, descripción, precios, stock y badges de ofertas
 * Incluye formateo de precios argentinos y cálculo de descuentos
 */
import React from 'react';
import type { Product } from '../../../types/product';
import styles from './ProductInfo.module.css';

interface ProductInfoProps {
    product: Product;
}

const ProductInfo: React.FC<ProductInfoProps> = ({ product }) => {
    // ============================================================================
    // DESTRUCTURING DE PROPIEDADES
    // ============================================================================
    const {
        nombre,
        descripcion,
        precio_venta,
        stock,
        codigo,
        Categoria,
        // Campos de ofertas
        precio_original,
        precio_oferta,
        descuento_porcentaje,
        en_oferta,
        ofertas
    } = product;

    // ============================================================================
    // CÁLCULOS Y VALIDACIONES
    // ============================================================================
    
    // Verificar si el producto está agotado
    const isOutOfStock = stock === 0;

    /**
     * Formatear precio con formato argentino
     * Convierte números a formato de moneda local con símbolo ARS
     */
    const formatPrice = (price: number | string): string => {
        const numPrice = typeof price === 'string' ? Number(price) : price;
        if (isNaN(numPrice) || numPrice < 0) {
            return 'Precio no disponible';
        }
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(numPrice);
    };

    // Calcular información de precios y descuentos
    const priceInfo = {
        original: precio_original || Number(precio_venta),
        current: precio_oferta || Number(precio_venta),
        hasDiscount: en_oferta && precio_oferta && precio_oferta < Number(precio_venta),
        discountPercentage: descuento_porcentaje || (en_oferta && precio_oferta ? 
            Math.round(((Number(precio_venta) - precio_oferta) / Number(precio_venta)) * 100) : 0)
    };

    // Texto del stock con pluralización correcta
    const stockText = stock > 0 ? `${stock} disponible${stock !== 1 ? 's' : ''}` : 'Agotado';

    // Obtener información de la oferta activa (primera oferta disponible)
    const activeOffer = ofertas && ofertas.length > 0 ? ofertas[0] : null;

    // ============================================================================
    // LOGS DE DESARROLLO
    // ============================================================================
    
    // Log de desarrollo para verificar datos de ofertas
    if (process.env.NODE_ENV === 'development' && en_oferta) {
        console.log('🛍️ ProductInfo - Producto en oferta:', {
            nombre,
            precio_original: priceInfo.original,
            precio_oferta: priceInfo.current,
            descuento: priceInfo.discountPercentage,
            en_oferta,
            ofertas: ofertas?.length || 0
        });
    }

    // ============================================================================
    // RENDERIZADO
    // ============================================================================
    
    return (
        <div className={styles.productInfo}>
            {/* Información básica del producto */}
            <div className={styles.basicInfo}>
                {/* Encabezado con título y badges */}
                <div className={styles.header}>
                    <h1 className={styles.productTitle}>{nombre}</h1>
                    <div className={styles.badgesContainer}>
                        {/* Badge de categoría */}
                        {Categoria && (
                            <span className={styles.categoryBadge}>
                                {Categoria.nombre_categoria}
                            </span>
                        )}
                        
                        {/* Badge de descuento - Solo visible si hay oferta */}
                        {priceInfo.hasDiscount && (
                            <span className={styles.discountBadge}>
                                -{priceInfo.discountPercentage}%
                            </span>
                        )}
                    </div>
                </div>

                {/* Metadatos del producto */}
                <div className={styles.metadata}>
                    <span className={styles.productCode}>Código: {codigo}</span>
                    
                    {/* Nombre de la oferta activa */}
                    {activeOffer && (
                        <span className={styles.offerName}>
                            {activeOffer.nombre_oferta}
                        </span>
                    )}
                </div>

                {/* Sección de precios y stock */}
                <div className={styles.priceSection}>
                    <div className={styles.priceContainer}>
                        {priceInfo.hasDiscount ? (
                            <>
                                {/* Precio original tachado cuando hay descuento */}
                                <span className={styles.priceOriginal}>
                                    {formatPrice(priceInfo.original)}
                                </span>
                                
                                {/* Precio actual con descuento */}
                                <span className={styles.priceCurrent}>
                                    {formatPrice(priceInfo.current)}
                                </span>
                            </>
                        ) : (
                            /* Precio único cuando no hay descuento */
                            <span className={styles.priceCurrent}>
                                {formatPrice(priceInfo.current)}
                            </span>
                        )}
                    </div>
                    
                    {/* Badge de stock con icono y estado */}
                    <span className={`${styles.stockBadge} ${isOutOfStock ? styles.outOfStock : styles.inStock}`}>
                        <span className="material-icons">{isOutOfStock ? 'inventory_2' : 'inventory'}</span>
                        {stockText}
                    </span>
                </div>
            </div>

            {/* Descripción del producto - Solo visible si existe */}
            {descripcion && (
                <div className={styles.descriptionSection}>
                    <h3 className={styles.sectionTitle}>Descripción</h3>
                    <p className={styles.description}>{descripcion}</p>
                </div>
            )}
        </div>
    );
};

export default ProductInfo; 