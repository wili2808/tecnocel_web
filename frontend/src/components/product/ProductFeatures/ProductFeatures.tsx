import React from 'react';
import type { Product } from '../../../types/product';
import styles from './ProductFeatures.module.css';

interface ProductFeaturesProps {
    product: Product;
}

const ProductFeatures: React.FC<ProductFeaturesProps> = ({ product }) => {
    const {
        codigo,
        stock,
        stock_minimo,
        precio_compra,
        precio_venta,
        fecha_ingreso,
        fyh_creacion,
        Categoria,
        Usuario
    } = product;

    // Formatear fecha
    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('es-AR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return 'Fecha no disponible';
        }
    };

    // Formatear precio
    const formatPrice = (price: string): string => {
        const numPrice = Number(price);
        if (isNaN(numPrice) || numPrice < 0) {
            return 'No disponible';
        }
        return `$${numPrice.toLocaleString('es-AR')}`;
    };

    const features = [
        {
            icon: 'inventory_2',
            label: 'Stock actual',
            value: `${stock} unidades`
        },
        {
            icon: 'trending_down',
            label: 'Stock mínimo',
            value: stock_minimo ? `${stock_minimo} unidades` : 'No definido'
        },
        {
            icon: 'shopping_cart',
            label: 'Precio de compra',
            value: formatPrice(precio_compra)
        },
        {
            icon: 'sell',
            label: 'Precio de venta',
            value: formatPrice(precio_venta)
        },
        {
            icon: 'event',
            label: 'Fecha de ingreso',
            value: formatDate(fecha_ingreso)
        },
        {
            icon: 'schedule',
            label: 'Fecha de creación',
            value: formatDate(fyh_creacion)
        }
    ];

    if (Categoria) {
        features.unshift({
            icon: 'category',
            label: 'Categoría',
            value: Categoria.nombre_categoria
        });
    }

    if (Usuario) {
        features.push({
            icon: 'person',
            label: 'Registrado por',
            value: Usuario.nombres
        });
    }

    return (
        <div className={styles.productFeatures}>
            <h3 className={styles.sectionTitle}>Características del producto</h3>
            <div className={styles.featuresGrid}>
                {features.map((feature, index) => (
                    <div key={index} className={styles.featureItem}>
                        <div className={styles.featureIcon}>
                            <span className="material-icons">{feature.icon}</span>
                        </div>
                        <div className={styles.featureContent}>
                            <span className={styles.featureLabel}>{feature.label}</span>
                            <span className={styles.featureValue}>{feature.value}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProductFeatures; 