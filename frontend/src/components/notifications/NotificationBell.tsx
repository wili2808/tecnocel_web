/**
 * Componente NotificationBell - Botón de campana con badge de conteo
 * Muestra el número de notificaciones no leídas y abre/cierra el panel al hacer click
 */
import React, { memo, useCallback } from 'react';
import { useNotificaciones } from '../../contexts/NotificacionesContext';
import NotificationPanel from './NotificationPanel';
import styles from './NotificationBell.module.css';

// ============================================================================
// COMPONENTE
// ============================================================================

const NotificationBell: React.FC = memo(() => {
  const { noLeidas, panelAbierto, abrirPanel, cerrarPanel } = useNotificaciones();

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
    <div className={styles.wrapper}>
      <button
        className={styles.bell}
        onClick={handleToggle}
        aria-label={
          noLeidas > 0
            ? `Notificaciones — ${noLeidas} sin leer`
            : 'Notificaciones'
        }
        aria-expanded={panelAbierto}
        aria-haspopup="dialog"
        type="button"
      >
        <span className="material-icons">{icono}</span>

        {/* Badge de conteo — solo visible cuando hay no leídas */}
        {noLeidas > 0 && (
          <span className={styles.badge} aria-hidden="true">
            {badgeLabel}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {panelAbierto && <NotificationPanel onClose={cerrarPanel} />}
    </div>
  );
});

NotificationBell.displayName = 'NotificationBell';

export default NotificationBell;
