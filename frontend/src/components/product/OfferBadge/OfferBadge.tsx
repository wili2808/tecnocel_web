import React from 'react';
import type { Product } from '../../../types/product';
import styles from './OfferBadge.module.css';

interface OfferBadgeProps {
    producto: Product;
    className?: string;
    size?: 'small' | 'medium' | 'large';
}

const OfferBadge: React.FC<OfferBadgeProps> = ({
    producto,
    className = '',
    size = 'medium'
}) => {
    // Verificar si el producto tiene ofertas activas
    const tieneOferta = producto.ofertas && producto.ofertas.length > 0;

    if (!tieneOferta || !producto.ofertas) return null;

    const oferta = producto.ofertas[0];
    const precioOriginal = parseFloat(producto.precio_venta);
    let descuentoPorcentaje = 0;

    // Calcular el descuento
    if (producto.descuento_porcentaje !== undefined) {
        descuentoPorcentaje = producto.descuento_porcentaje;
    } else if (oferta.tipo_descuento === 'porcentaje') {
        descuentoPorcentaje = oferta.valor_descuento;
    } else {
        // Calcular porcentaje de descuento de monto fijo
        descuentoPorcentaje = (oferta.valor_descuento / precioOriginal) * 100;
    }

    return (
        <div className={`${styles.offerBadge} ${styles[size]} ${className}`}>
            <span className={styles.percentage}>
                -{Math.round(descuentoPorcentaje)}%
            </span>
            <span className={styles.label}>OFERTA</span>
        </div>
    );
};

export default OfferBadge;