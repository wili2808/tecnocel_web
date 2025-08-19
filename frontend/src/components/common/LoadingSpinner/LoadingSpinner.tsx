/**
 * Componente LoadingSpinner - Indicador de carga del sistema
 * Muestra spinner animado con diferentes tamaños y texto opcional
 * Incluye funcionalidades para personalización de tamaño y mensaje
 * Utiliza CSS puro para animaciones de rotación
 */
import React from 'react';
import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
    className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 'md',
    text,
    className = ''
}) => {
    // ============================================================================
    // RENDERIZADO
    // ============================================================================

    return (
        <div className={`${styles.loadingContainer} ${className}`}>
            {/* Spinner animado con tamaño configurable */}
            <div className={`${styles.spinner} ${styles[size]}`}></div>
            {/* Texto opcional de carga */}
            {text && <span className={styles.loadingText}>{text}</span>}
        </div>
    );
};

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;