import React, { type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useEscapeKey } from '../../../hooks/useEscapeKey';
// import styles from './PremiumModal.module.css';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  icon?: string;
  maxWidth?: string;
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
const PremiumModal: React.FC<PremiumModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  icon,
  maxWidth = '600px',
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
    <div className="modalOverlayPremium" onClick={handleOverlayClick}>
      <div 
        className={`modalPremium ${className}`} 
        style={{ maxWidth }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Opcional si se provee título) */}
        {(title || showCloseButton || headerChildren) && (
          <div className="modalHeaderPremium">
            {title && (
              <h2 className="modalTitlePremium" style={titleStyle}>
                {icon && <span className="material-icons">{icon}</span>}
                {title}
              </h2>
            )}
            {headerChildren}
            {showCloseButton && (
              <button className="closeButtonPremium" onClick={onClose} aria-label="Cerrar modal">
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
};

export default PremiumModal;
