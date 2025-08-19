/**
 * Componente IconButton - Botón con icono personalizable
 * Muestra botón con icono de Material Design y múltiples variantes visuales
 * Incluye funcionalidades para estados de carga, deshabilitado y diferentes tamaños
 * Utiliza React.memo para optimización de re-renders
 */
import React, { memo } from 'react';
import styles from './IconButton.module.css';

interface IconButtonProps {
    /** Nombre del icono de Material Design */
    icon: string;
    /** Función que se ejecuta al hacer clic */
    onClick?: (event?: React.MouseEvent<HTMLButtonElement>) => void;
    /** Texto descriptivo para lectores de pantalla */
    ariaLabel: string;
    /** Clases CSS adicionales */
    className?: string;
    /** Si el botón está deshabilitado */
    disabled?: boolean;
    /** Variante visual del botón */
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
    /** Tamaño del botón */
    size?: 'sm' | 'md' | 'lg';
    /** Contenido adicional */
    children?: React.ReactNode;
    /** Si el botón está en estado de carga */
    loading?: boolean;
    /** Tipo de botón HTML */
    type?: 'button' | 'submit' | 'reset';
}

const IconButton: React.FC<IconButtonProps> = memo(({
    icon,
    onClick,
    ariaLabel,
    className = '',
    disabled = false,
    variant = 'ghost',
    size = 'md',
    children,
    loading = false,
    type = 'button'
}) => {
    // ============================================================================
    // CÁLCULOS DE ESTADO
    // ============================================================================

    const isDisabled = disabled || loading;

    // ============================================================================
    // RENDERIZADO
    // ============================================================================

    return (
        <button
            className={`${styles.iconButton} ${styles[variant]} ${styles[size]} ${className}`}
            onClick={onClick}
            aria-label={loading ? `${ariaLabel} - Cargando...` : ariaLabel}
            disabled={isDisabled}
            type={type}
        >
            {/* Mostrar icono de carga o icono normal según estado */}
            {loading ? (
                <span className={`material-icons ${styles.loadingIcon}`}>hourglass_empty</span>
            ) : (
                <span className="material-icons">{icon}</span>
            )}
            {/* Contenido adicional del botón */}
            {children}
        </button>
    );
});

IconButton.displayName = 'IconButton';

export default IconButton; 