import React from 'react';
import type { Product } from '../../../types/product';
import styles from './ProductInfo.module.css';

interface ProductInfoProps {
    product: Product;
}

const ProductInfo: React.FC<ProductInfoProps> = ({ product }) => {
    const {
        nombre,
        descripcion,
        precio_venta,
        stock,
        codigo,
        Categoria
    } = product;

    const isOutOfStock = stock === 0;

    // Formatear precio
    const formatPrice = (price: string): string => {
        const numPrice = Number(price);
        if (isNaN(numPrice) || numPrice < 0) {
            return 'Precio no disponible';
        }
        return `$${numPrice.toLocaleString('es-AR')}`;
    };

    const stockText = stock > 0 ? `${stock} disponible${stock !== 1 ? 's' : ''}` : 'Agotado';

    return (
        <div className={styles.productInfo}>
            {/* Información básica */}
            <div className={styles.basicInfo}>
                <div className={styles.header}>
                    <h1 className={styles.productTitle}>{nombre}</h1>
                    {Categoria && (
                        <span className={styles.categoryBadge}>
                            {Categoria.nombre_categoria}
                        </span>
                    )}
                </div>

                <div className={styles.metadata}>
                    <span className={styles.productCode}>Código: {codigo}</span>
                </div>

                <div className={styles.priceSection}>
                    <span className={styles.price}>{formatPrice(precio_venta)}</span>
                    <span className={`${styles.stockBadge} ${isOutOfStock ? styles.outOfStock : styles.inStock}`}>
                        <span className="material-icons">{isOutOfStock ? 'inventory_2' : 'inventory'}</span>
                        {stockText}
                    </span>
                </div>
            </div>

            {/* Descripción */}
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