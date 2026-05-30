import React, { type ReactNode, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { useEscapeKey } from '../../../hooks/useEscapeKey';
import styles from './PremiumModal.module.css';
import './PremiumModal.css';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  icon?: string;
  maxWidth?: string;
  height?: string;
  className?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  headerChildren?: ReactNode;
  titleStyle?: React.CSSProperties;
}

/**
 * PremiumModal - Componente envolvente centralizado para todos los modales del sistema.
 * Gestiona automáticamente:
 * - Renderizado vía Portal (document.body)
 * - Cierre con tecla Escape
 * - Cierre al hacer clic en el overlay
 * - Estructura visual Premium consistente
 */
const PremiumModal: React.FC<PremiumModalProps> = memo(({
  isOpen,
  onClose,
  children,
  title,
  icon,
  maxWidth = '600px',
  height,
  className = '',
  showCloseButton = true,
  closeOnOverlayClick = true,
  headerChildren,
  titleStyle,
}) => {
  // Registrar el cierre con la tecla Escape
  useEscapeKey(onClose);

  // Bloquear el scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = () => {
    if (closeOnOverlayClick) {
      onClose();
    }
  };

  return createPortal(
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div 
        className={`${styles.modal} ${className}`} 
        style={{ maxWidth, ...(height ? { height } : {}) }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Opcional si se provee título) */}
        {(title || showCloseButton || headerChildren) && (
          <div className={styles.header}>
            {title && (
              <h2 className={styles.title} style={titleStyle}>
                {icon && <span className={`material-icons ${styles.materialIcons}`}>{icon}</span>}
                {title}
              </h2>
            )}
            {headerChildren}
            {showCloseButton && (
              <button className={styles.closeButton} onClick={onClose} aria-label="Cerrar modal">
                <span className="material-icons">close</span>
              </button>
            )}
          </div>
        )}

        {/* El contenido se renderiza directamente o dentro de modalBodyPremium según se necesite */}
        {children}
      </div>
    </div>,
    document.body
  );
});

PremiumModal.displayName = 'PremiumModal';

export default PremiumModal;
