/**
 * Componente NotificationPanel - Panel dropdown de notificaciones
 * Muestra la lista de notificaciones con acciones de marcar leídas y eliminar.
 * Se cierra al hacer click fuera del wrapper de NotificationBell o al presionar Escape.
 */
import React, { memo, useEffect, useCallback } from 'react';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import NotificationItem from './NotificationItem';
import styles from './NotificationPanel.module.css';

// ============================================================================
// PROPS
// ============================================================================

interface NotificationPanelProps {
  /** Ref al div raíz de NotificationBell — cubre botón + panel para detectar clicks externos */
  wrapperRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
}

// ============================================================================
// COMPONENTE
// ============================================================================

const NotificationPanel: React.FC<NotificationPanelProps> = memo(({ wrapperRef, onClose }) => {
  const { notificaciones, noLeidas, cargando, marcarTodasLeidas, eliminarTodas } = useNotificaciones();

  // Cerrar al hacer click fuera del wrapper (que incluye botón + panel)
  const handleOutsideClick = useCallback(
    (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        onClose();
      }
    },
    [wrapperRef, onClose]
  );

  // Cerrar al presionar Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
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

  const handleEliminarTodas = useCallback(() => {
    eliminarTodas();
  }, [eliminarTodas]);

  // ============================================================================
  // RENDERIZADO
  // ============================================================================

  return (
    <div
      className={styles.panel}
      role="dialog"
      aria-label="Panel de notificaciones"
      aria-modal="false"
    >
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles['header-title']}>Notificaciones</h3>
        <div className={styles['header-actions']}>
          {noLeidas > 0 && (
            <button
              className={styles['mark-all-btn']}
              onClick={handleMarcarTodas}
              type="button"
              aria-label="Marcar todas como leídas"
            >
              <span className="material-icons">done_all</span>
            </button>
          )}
          {notificaciones.length > 0 && (
            <button
              className={styles['clear-all-btn']}
              onClick={handleEliminarTodas}
              type="button"
              aria-label="Eliminar todas las notificaciones"
            >
              <span className="material-icons">delete_sweep</span>
            </button>
          )}
        </div>
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
