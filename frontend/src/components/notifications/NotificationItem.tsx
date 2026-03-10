/**
 * Componente NotificationItem - Representa una notificación individual en el panel
 * Muestra ícono por tipo, contenido (título + mensaje + tiempo relativo) y botón de eliminar
 * Permite marcar como leída al hacer click y navegar al enlace asociado
 */
import React, { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Notificacion, TipoNotificacion } from '../../types/notificacion';
import { useNotificaciones } from '../../contexts/NotificacionesContext';
import styles from './NotificationItem.module.css';

// ============================================================================
// CONSTANTES
// ============================================================================

const ICONOS: Record<TipoNotificacion, string> = {
  respuesta_admin: 'support_agent',
  respuesta_cliente: 'chat_bubble',
  comentario_moderado: 'visibility_off',
  venta_confirmada: 'check_circle',
  venta_cancelada: 'cancel',
};

// ============================================================================
// UTILIDADES
// ============================================================================

function tiempoRelativo(fechaStr: string): string {
  const diff = Date.now() - new Date(fechaStr).getTime();
  const minutos = Math.floor(diff / 60_000);
  if (minutos < 1) return 'Ahora';
  if (minutos < 60) return `Hace ${minutos}m`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas}h`;
  const dias = Math.floor(horas / 24);
  return `Hace ${dias}d`;
}

// ============================================================================
// PROPS
// ============================================================================

interface NotificationItemProps {
  notificacion: Notificacion;
}

// ============================================================================
// COMPONENTE
// ============================================================================

const NotificationItem: React.FC<NotificationItemProps> = memo(({ notificacion }) => {
  const navigate = useNavigate();
  const { marcarLeida, eliminarNotificacion, cerrarPanel } = useNotificaciones();

  const handleClick = useCallback(async () => {
    await marcarLeida(notificacion.id_notificacion);
    if (notificacion.enlace) {
      cerrarPanel();
      navigate(notificacion.enlace);
    }
  }, [marcarLeida, notificacion, cerrarPanel, navigate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  const handleEliminar = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      eliminarNotificacion(notificacion.id_notificacion);
    },
    [eliminarNotificacion, notificacion.id_notificacion]
  );

  const icono = ICONOS[notificacion.tipo] ?? 'notifications';

  return (
    <div
      className={`${styles.item} ${!notificacion.leido ? styles['item--unread'] : ''}`}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`${notificacion.titulo}${!notificacion.leido ? ' — no leída' : ''}`}
    >
      {/* Ícono representativo del tipo */}
      <div className={`${styles.icon} ${styles[`icon--${notificacion.tipo.replace(/_/g, '-')}`]}`}>
        <span className="material-icons">{icono}</span>
      </div>

      {/* Contenido principal */}
      <div className={styles.content}>
        <p className={styles.title}>{notificacion.titulo}</p>
        <p className={styles.message}>{notificacion.mensaje}</p>
        <span className={styles.time}>{tiempoRelativo(notificacion.fyh_creacion)}</span>
      </div>

      {/* Indicador de no leída */}
      {!notificacion.leido && <span className={styles['unread-dot']} aria-hidden="true" />}

      {/* Botón de eliminar (visible en hover) */}
      <button
        className={styles['delete-btn']}
        onClick={handleEliminar}
        aria-label="Eliminar notificación"
        tabIndex={-1}
        type="button"
      >
        <span className="material-icons">close</span>
      </button>
    </div>
  );
});

NotificationItem.displayName = 'NotificationItem';

export default NotificationItem;
