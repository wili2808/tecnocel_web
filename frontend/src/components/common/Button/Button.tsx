/**
 * Componente Button - Botón universal para todo el proyecto
 * Proporciona múltiples variantes, tamaños y tipos para cubrir todos los casos de uso
 * Integrado completamente con el sistema de diseño de TecnoCel
 * Soporta botones de texto, enlaces, formularios y estados especiales
 */
import React, { memo, forwardRef } from 'react';
import styles from './Button.module.css';

// ============================================================================
// TIPOS Y INTERFACES
// ============================================================================

export interface ButtonProps {
  /** Contenido del botón (texto, iconos, etc.) */
  children: React.ReactNode;
  
  /** Variante visual del botón */
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'text' | 'link' | 'danger' | 'success' | 'warning';
  
  /** Tamaño del botón */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  
  /** Si el botón está deshabilitado */
  disabled?: boolean;
  
  /** Si el botón está en estado de carga */
  loading?: boolean;
  
  /** Tipo de botón HTML */
  type?: 'button' | 'submit' | 'reset';
  
  /** ID del formulario asociado */
  form?: string;
  
  /** Clases CSS adicionales */
  className?: string;
  
  /** Función que se ejecuta al hacer clic */
  onClick?: (event: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  
  /** URL para botones de enlace */
  href?: string;
  
  /** Target para enlaces externos */
  target?: '_blank' | '_self' | '_parent' | '_top';
  
  /** Rel para enlaces externos */
  rel?: string;
  
  /** Si el botón debe ocupar todo el ancho disponible */
  fullWidth?: boolean;
  
  /** Si el botón debe tener bordes redondeados */
  rounded?: boolean;
  
  /** Icono opcional (Material Design) */
  icon?: string;
  
  /** Posición del icono */
  iconPosition?: 'left' | 'right';
  
  /** Si el botón debe tener efecto de elevación */
  elevated?: boolean;
  
  /** Si el botón debe tener efecto de glassmorphism */
  glass?: boolean;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  type = 'button',
  form,
  className = '',
  onClick,
  href,
  target,
  rel,
  fullWidth = false,
  rounded = false,
  icon,
  iconPosition = 'left',
  elevated = false,
  glass = false,
  ...props
}, ref) => {
  // ============================================================================
  // VALIDACIONES Y ESTADOS
  // ============================================================================
  
  const isDisabled = disabled || loading;
  const isLink = Boolean(href);
  
  // ============================================================================
  // CLASES CSS DINÁMICAS
  // ============================================================================
  
  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    rounded && styles.rounded,
    elevated && styles.elevated,
    glass && styles.glass,
    isDisabled && styles.disabled,
    loading && styles.loading,
    className
  ].filter(Boolean).join(' ');
  
  // ============================================================================
  // RENDERIZADO DEL CONTENIDO
  // ============================================================================
  
  const renderContent = () => {
    if (loading) {
      return (
        <>
          <span className={`material-icons ${styles.loadingIcon}`}>hourglass_empty</span>
          <span className={styles.loadingText}>Cargando...</span>
        </>
      );
    }
    
    if (icon) {
      const iconElement = (
        <span className={`material-icons ${styles.icon}`}>
          {icon}
        </span>
      );
      
      return (
        <>
          {iconPosition === 'left' && iconElement}
          <span className={styles.content}>{children}</span>
          {iconPosition === 'right' && iconElement}
        </>
      );
    }
    
    return <span className={styles.content}>{children}</span>;
  };
  
  // ============================================================================
  // RENDERIZADO CONDICIONAL
  // ============================================================================
  
  if (isLink) {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        target={target}
        rel={target === '_blank' ? 'noopener noreferrer' : rel}
        onClick={onClick as React.MouseEventHandler<HTMLAnchorElement>}
        className={buttonClasses}
        aria-disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {renderContent()}
      </a>
    );
  }
  
  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={type}
      form={form}
      onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
      disabled={isDisabled}
      className={buttonClasses}
      aria-disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {renderContent()}
    </button>
  );
});

// ============================================================================
// CONFIGURACIÓN DEL COMPONENTE
// ============================================================================

Button.displayName = 'Button';

export default memo(Button);
