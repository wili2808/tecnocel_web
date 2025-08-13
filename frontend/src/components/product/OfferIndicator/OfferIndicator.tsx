/**
 * Componente OfferIndicator - Indicador visual de ofertas y descuentos
 * Muestra el porcentaje de descuento con diferentes tamaños y posiciones
 * Componente reutilizable para ProductCard, ProductCardExtensive y ProductPage
 * Incluye animaciones y estilos consistentes con el sistema de diseño
 */
import React from 'react';
import styles from './OfferIndicator.module.css';

interface OfferIndicatorProps {
    descuentoPorcentaje: number;
    className?: string;
    size?: 'small' | 'medium' | 'large';
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    showLabel?: boolean;
}

const OfferIndicator: React.FC<OfferIndicatorProps> = ({
    descuentoPorcentaje,
    className = '',
    size = 'medium',
    position = 'top-left',
    showLabel = true
}) => {
    // ============================================================================
    // VALIDACIONES
    // ============================================================================
    
    // No renderizar si no hay descuento válido
    if (!descuentoPorcentaje || descuentoPorcentaje <= 0) {
        return null;
    }

    // ============================================================================
    // RENDERIZADO
    // ============================================================================
    
    return (
        <div
            className={`
                ${styles.offerIndicator} 
                ${styles[size]} 
                ${styles[position]}
                ${className}
            `}
        >
            {/* Porcentaje de descuento principal */}
            <span className={styles.offerPercentage}>
                -{Math.round(descuentoPorcentaje)}%
            </span>
            
            {/* Label "OFERTA" - Opcional según configuración */}
            {showLabel && (
                <span className={styles.offerLabel}>OFERTA</span>
            )}
        </div>
    );
};

export default OfferIndicator;
