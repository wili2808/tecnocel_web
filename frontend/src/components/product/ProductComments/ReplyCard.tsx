import React, { useState, memo } from 'react';
import type { Respuesta } from '../../../services/commentService';
import commentService from '../../../services/commentService';
import styles from './ReplyCard.module.css';

interface ReplyCardProps {
  respuesta: Respuesta;
  currentUserId?: number;
  isSystemUser?: boolean;
  onDelete: (id: number) => Promise<void>;
  onModerate?: (id: number, estado: 'activo' | 'oculto' | 'eliminado') => Promise<void>;
}

const ReplyCard: React.FC<ReplyCardProps> = memo(({
  respuesta,
  currentUserId,
  isSystemUser = false,
  onDelete,
  onModerate
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner =
    (respuesta.tipo_autor === 'cliente' && respuesta.id_cliente === currentUserId) ||
    (respuesta.tipo_autor === 'admin' && respuesta.id_usuario === currentUserId);

  const autorNombre = respuesta.tipo_autor === 'admin'
    ? (respuesta.usuarioAutor?.nombres || 'Equipo TecnoCel')
    : respuesta.clienteAutor
      ? `${respuesta.clienteAutor.nombre_cliente} ${respuesta.clienteAutor.apellido_cliente}`
      : 'Usuario';

  const fechaFormateada = commentService.formatearFechaComentario(respuesta.fyh_creacion);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(respuesta.id_respuesta);
    } catch (error) {
      console.error('Error deleting reply:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleModerate = async (estado: 'activo' | 'oculto' | 'eliminado') => {
    if (!onModerate) return;
    try {
      await onModerate(respuesta.id_respuesta, estado);
    } catch (error) {
      console.error('Error moderating reply:', error);
    }
  };

  return (
    <div className={`${styles.replyCard} ${respuesta.tipo_autor === 'admin' ? styles.adminReply : ''}`}>
      <div className={styles.replyHeader}>
        <div className={styles.authorInfo}>
          <span className={`material-icons ${styles.avatarIcon}`}>
            {respuesta.tipo_autor === 'admin' ? 'shield' : 'account_circle'}
          </span>
          <span className={styles.authorName}>{autorNombre}</span>
          {respuesta.tipo_autor === 'admin' && (
            <span className={styles.adminBadge}>Equipo oficial</span>
          )}
        </div>
        <span className={styles.date}>{fechaFormateada}</span>
      </div>

      <p className={styles.content}>{respuesta.contenido}</p>

      <div className={styles.actions}>
        {(isOwner || isSystemUser) && !showDeleteConfirm && (
          <button
            className={styles.deleteBtn}
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
          >
            <span className="material-icons">delete_outline</span>
            Eliminar
          </button>
        )}

        {isSystemUser && !isOwner && onModerate && respuesta.estado === 'activo' && (
          <button
            className={styles.moderateBtn}
            onClick={() => handleModerate('oculto')}
          >
            <span className="material-icons">visibility_off</span>
            Ocultar
          </button>
        )}

        {isSystemUser && respuesta.estado === 'oculto' && onModerate && (
          <button
            className={styles.restoreBtn}
            onClick={() => handleModerate('activo')}
          >
            <span className="material-icons">visibility</span>
            Restaurar
          </button>
        )}

        {showDeleteConfirm && (
          <div className={styles.deleteConfirm}>
            <span>¿Eliminar respuesta?</span>
            <button
              className={styles.confirmYes}
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
            </button>
            <button
              className={styles.confirmNo}
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default ReplyCard;
