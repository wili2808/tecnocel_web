/**
 * Componente Button optimizado - Botón universal responsive para TecnoCel Web
 * Versión simplificada que mantiene todas las funcionalidades esenciales
 * Optimizado para smartphones, tablets y desktop
 */
import React, { memo, forwardRef } from 'react';
import styles from './Button.module.css';

import type { ButtonProps } from './types';

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
  mobileFullWidth = false,
  rounded = false,
  icon,
  iconPosition = 'left',
  elevated = false,
  hideOnMobile = false,
  showOnMobile = false,
  ariaLabel,
  ...props
}, ref) => {
  const isDisabled = disabled || loading;
  const isLink = Boolean(href);

  // Clases CSS dinámicas optimizadas
  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    mobileFullWidth && styles.mobileFullWidth,
    rounded && styles.rounded,
    elevated && styles.elevated,
    hideOnMobile && styles.hideOnMobile,
    showOnMobile && styles.showOnMobile,
    isDisabled && styles.disabled,
    loading && styles.loading,
    className
  ].filter(Boolean).join(' ');

  // Renderizado del contenido optimizado
  const renderContent = () => {
    if (loading) {
      return (
        <>
          <span className={`material-icons ${styles.loadingIcon}`}>hourglass_empty</span>
          <span className={styles.loadingText}>Cargando...</span>
        </>
      );
    }

    const iconElement = icon ? (
      <span className={`material-icons ${styles.icon}`}>{icon}</span>
    ) : null;

    if (iconElement && children) {
      return (
        <>
          {iconPosition === 'left' && iconElement}
          <span className={styles.content}>{children}</span>
          {iconPosition === 'right' && iconElement}
        </>
      );
    }

    if (iconElement) {
      return iconElement;
    }

    return <span className={styles.content}>{children}</span>;
  };

  // Props de accesibilidad
  const accessibilityProps = {
    'aria-label': ariaLabel || (icon && !children ? icon : undefined),
    'aria-disabled': isDisabled,
    'aria-busy': loading,
    role: isLink ? 'link' : 'button',
  };

  // Renderizado condicional optimizado
  if (isLink) {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        target={target}
        rel={target === '_blank' ? 'noopener noreferrer' : rel}
        onClick={onClick as React.MouseEventHandler<HTMLAnchorElement>}
        className={buttonClasses}
        {...accessibilityProps}
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
      {...accessibilityProps}
      {...props}
    >
      {renderContent()}
    </button>
  );
});

Button.displayName = 'Button';

export default memo(Button);