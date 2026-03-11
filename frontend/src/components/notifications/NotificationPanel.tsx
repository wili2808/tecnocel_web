/**
 * Componente NotificationPanel - Panel dropdown de notificaciones
 * Muestra la lista de notificaciones con acciones de marcar leídas y eliminar
 * Se cierra al hacer click fuera o presionar Escape
 *
 * NOTA: El Navbar renderiza ControlButtons dos veces (desktop + mobile), lo que
 * genera dos instancias de NotificationBell y dos NotificationPanel simultáneos.
 * El check de "click externo" usa data-notification-panel para detectar si el
 * click fue dentro de CUALQUIER panel, no solo este, evitando que el panel
 * oculto cierre el panel visible.
 */
import React, { memo, useEffect, useCallback } from 'react';
import { useNotificaciones } from '../../contexts/NotificacionesContext';
import NotificationItem from './NotificationItem';
import styles from './NotificationPanel.module.css';

// Atributo usado para identificar todos los paneles de notificación en el DOM
const PANEL_ATTR = 'data-notification-panel';

// ============================================================================
// PROPS
// ============================================================================

interface NotificationPanelProps {
  onClose: () => void;
}

// ============================================================================
// COMPONENTE
// ============================================================================

const NotificationPanel: React.FC<NotificationPanelProps> = memo(({ onClose }) => {
  const { notificaciones, noLeidas, cargando, marcarTodasLeidas } = useNotificaciones();

  // Cerrar al hacer click fuera de CUALQUIER panel de notificaciones
  // (Navbar renderiza dos NotificationPanel simultáneos: desktop + mobile)
  const handleOutsideClick = useCallback(
    (e: MouseEvent) => {
      const panels = document.querySelectorAll(`[${PANEL_ATTR}]`);
      const isInsideAnyPanel = Array.from(panels).some((panel) =>
        panel.contains(e.target as Node)
      );
      if (!isInsideAnyPanel) {
        onClose();
      }
    },
    [onClose]
  );

  // Cerrar al presionar Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleOutsideClick, handleKeyDown]);

  const handleMarcarTodas = useCallback(() => {
    marcarTodasLeidas();
  }, [marcarTodasLeidas]);

  // ============================================================================
  // RENDERIZADO
  // ============================================================================

  return (
    <div
      {...{ [PANEL_ATTR]: true }}
      className={styles.panel}
      role="dialog"
      aria-label="Panel de notificaciones"
      aria-modal="false"
    >
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles['header-title']}>Notificaciones</h3>
        {noLeidas > 0 && (
          <button
            className={styles['mark-all-btn']}
            onClick={handleMarcarTodas}
            type="button"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Contenido */}
      <div className={styles.body}>
        {cargando ? (
          /* Estado cargando */
          <div className={styles['loading-state']} aria-label="Cargando notificaciones">
            <span className={styles.spinner} aria-hidden="true" />
            <span className={styles['loading-text']}>Cargando...</span>
          </div>
        ) : notificaciones.length === 0 ? (
          /* Estado vacío */
          <div className={styles['empty-state']}>
            <span className={`material-icons ${styles['empty-icon']}`}>notifications_none</span>
            <p className={styles['empty-text']}>Sin notificaciones</p>
          </div>
        ) : (
          /* Lista de notificaciones */
          <ul className={styles.list} role="list">
            {notificaciones.map((notificacion) => (
              <li key={notificacion.id_notificacion} className={styles['list-item']}>
                <NotificationItem notificacion={notificacion} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
});

NotificationPanel.displayName = 'NotificationPanel';

export default NotificationPanel;
