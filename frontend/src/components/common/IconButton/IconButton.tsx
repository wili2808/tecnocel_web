/**
 * Componente IconButton - Botón con icono personalizable
 * Muestra botón con icono de Material Design y múltiples variantes visuales
 * Incluye funcionalidades para estados de carga, deshabilitado y diferentes tamaños
 * Utiliza React.memo para optimización de re-renders
 */
import React, { memo } from 'react';
import styles from './IconButton.module.css';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    /** Nombre del icono de Material Design */
    icon: string;
    /** Texto descriptivo para lectores de pantalla (Requerido para accesibilidad) */
    ariaLabel: string;
    /** Variante visual del botón */
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
    /** Tamaño del botón */
    size?: 'sm' | 'md' | 'lg';
    /** Si el botón está en estado de carga */
    loading?: boolean;
    /** Si el botón usa el estilo de subrayado animado en hover (Silicon Precision) */
    underline?: boolean;
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
    type = 'button',
    underline = false,
    ...props
}) => {
    const isDisabled = disabled || loading;

    return (
        <button
            className={`${styles.iconButton} ${styles[variant]} ${styles[size]} ${underline ? styles.underline : ''} ${className}`}
            onClick={onClick}
            aria-label={loading ? `${ariaLabel} - Cargando...` : ariaLabel}
            disabled={isDisabled}
            type={type}
            {...props}
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