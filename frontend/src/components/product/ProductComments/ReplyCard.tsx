import React, { useState, memo } from 'react';
import type { Respuesta } from '../../../services/commentService';
import commentService from '../../../services/commentService';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './ReplyCard.module.css';

/**
 * Props del componente ReplyCard
 */
interface ReplyCardProps {
  /** Objeto de respuesta con datos del autor, contenido y estado */
  respuesta: Respuesta;
  /** ID del cliente autenticado (para comparar con id_cliente de respuestas de cliente) */
  currentUserId?: number;
  /** ID del usuario del sistema autenticado (para comparar con id_usuario de respuestas admin) */
  currentSystemUserId?: number;
  /** Si el usuario actual es un administrador o empleado del sistema */
  isSystemUser?: boolean;
  /** Callback para eliminar la respuesta (recibe ID y si es owner) */
  onDelete: (id: number, isOwner?: boolean) => Promise<void>;
  /** Callback para moderar el estado de la respuesta (solo admins) */
  onModerate?: (id: number, estado: 'activo' | 'oculto' | 'eliminado') => Promise<void>;
}

/**
 * Tarjeta individual de respuesta a un comentario de producto
 *
 * Renderiza una respuesta con información del autor, fecha y controles de acción.
 * Las respuestas de administradores se distinguen visualmente con borde y badge de color primario.
 * Un cliente puede eliminar solo sus propias respuestas; un administrador puede
 * eliminar y moderar (ocultar/restaurar) cualquier respuesta.
 *
 * @param props - Ver ReplyCardProps
 * @returns Elemento de respuesta con controles de moderación según el rol
 */
const ReplyCard: React.FC<ReplyCardProps> = memo(({
  respuesta,
  currentUserId,
  currentSystemUserId,
  isSystemUser = false,
  onDelete,
  onModerate
}) => {
  const { tienePermiso } = useAuth();
  const puedeModerar = isSystemUser ? tienePermiso('moderar_comentarios') : false;
  const puedeEliminarCualquiera = isSystemUser ? tienePermiso('eliminar_comentarios') : false;
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Owner: cliente puede eliminar su propia respuesta; system user puede eliminar la suya si coincide id_usuario
  const isOwner = respuesta.tipo_autor === 'cliente'
    ? respuesta.id_cliente === currentUserId
    : respuesta.tipo_autor === 'admin' && respuesta.id_usuario === currentSystemUserId;

  const autorNombre = respuesta.tipo_autor === 'admin'
    ? (respuesta.usuarioAutor?.nombres || 'Equipo TecnoCel')
    : respuesta.clienteAutor
      ? `${respuesta.clienteAutor.nombre_cliente} ${respuesta.clienteAutor.apellido_cliente}`
      : 'Usuario';

  const fechaFormateada = commentService.formatearFechaComentario(respuesta.fyh_creacion);

  /** Ejecuta la eliminación de la respuesta con confirmación visual de carga */
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(respuesta.id_respuesta, isOwner);
    } catch (error) {
      console.error('Error deleting reply:', error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  /** Cambia el estado de moderación de la respuesta (solo admins) */
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
        {(isOwner || puedeEliminarCualquiera) && !showDeleteConfirm && (
          <button
            className={styles.deleteBtn}
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
          >
            <span className="material-icons">delete_outline</span>
            Eliminar
          </button>
        )}

        {isSystemUser && puedeModerar && !isOwner && onModerate && respuesta.estado === 'activo' && (
          <button
            className={styles.moderateBtn}
            onClick={() => handleModerate('oculto')}
          >
            <span className="material-icons">visibility_off</span>
            Ocultar
          </button>
        )}

        {isSystemUser && puedeModerar && respuesta.estado === 'oculto' && onModerate && (
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
