/**
 * Componente NotificationBell - Botón de campana con badge de conteo
 * Muestra el número de notificaciones no leídas y abre/cierra el panel al hacer click.
 * El wrapperRef apunta al div raíz que envuelve botón + panel, permitiendo que
 * NotificationPanel detecte clicks externos sin atributos custom en el DOM.
 */
import React, { memo, useCallback, useRef } from 'react';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import NotificationPanel from './NotificationPanel';
import IconButton from '../common/IconButton';
import styles from './NotificationBell.module.css';

// ============================================================================
// COMPONENTE
// ============================================================================

const NotificationBell: React.FC = memo(() => {
  const { noLeidas, panelAbierto, abrirPanel, cerrarPanel } = useNotificaciones();

  // Ref al div raíz — cubre tanto el botón como el panel desplegado.
  // Se pasa a NotificationPanel para detectar clicks fuera del componente completo.
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(() => {
    if (panelAbierto) {
      cerrarPanel();
    } else {
      abrirPanel();
    }
  }, [panelAbierto, abrirPanel, cerrarPanel]);

  const badgeLabel = noLeidas > 99 ? '99+' : String(noLeidas);
  const icono = noLeidas > 0 ? 'notifications_active' : 'notifications';

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <IconButton
        icon={icono}
        onClick={handleToggle}
        ariaLabel={noLeidas > 0 ? `Notificaciones — ${noLeidas} sin leer` : 'Notificaciones'}
        aria-expanded={panelAbierto}
        aria-haspopup="dialog"
        variant="ghost"
        size="sm"
        underline={true}
        className={styles.bell}
      >
        {/* Badge de conteo — solo visible cuando hay no leídas */}
        {noLeidas > 0 && (
          <span className={styles.badge} aria-hidden="true">
            {badgeLabel}
          </span>
        )}
      </IconButton>

      {/* Panel de notificaciones — montado solo cuando está abierto */}
      {panelAbierto && <NotificationPanel wrapperRef={wrapperRef} onClose={cerrarPanel} />}
    </div>
  );
});

NotificationBell.displayName = 'NotificationBell';

export default NotificationBell;
