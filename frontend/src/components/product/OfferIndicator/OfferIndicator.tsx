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
    if (!descuentoPorcentaje || descuentoPorcentaje <= 0) {
        return null;
    }

    return (
        <div
            className={`
                ${styles.offerIndicator} 
                ${styles[size]} 
                ${styles[position]}
                ${className}
            `}
        >
            <span className={styles.offerPercentage}>
                -{Math.round(descuentoPorcentaje)}%
            </span>
            {showLabel && (
                <span className={styles.offerLabel}>OFERTA</span>
            )}
        </div>
    );
};

export default OfferIndicator;
