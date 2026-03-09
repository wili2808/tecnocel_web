import React, { useState, memo } from 'react';
import type { Respuesta } from '../../../services/commentService';
import commentService from '../../../services/commentService';
import adminCommentService from '../../../services/adminCommentService';
import ReplyCard from './ReplyCard';
import ReplyForm from './ReplyForm';
import styles from './ReplyList.module.css';

/**
 * Props del componente ReplyList
 */
interface ReplyListProps {
  /** ID del comentario padre al que pertenecen las respuestas */
  idComentario: number;
  /** Lista de respuestas del comentario (incluyendo ocultas si el usuario es admin) */
  respuestas: Respuesta[];
  /** ID del usuario autenticado actualmente */
  currentUserId?: number;
  /** Si el usuario está autenticado (muestra botón de responder) */
  isAuthenticated?: boolean;
  /** Si el usuario actual es administrador o empleado del sistema */
  isSystemUser?: boolean;
  /** Callback para actualizar el array de respuestas en el componente padre */
  onRepliesChange: (idComentario: number, respuestas: Respuesta[]) => void;
}

/** Número de respuestas visibles antes de mostrar el toggle "Ver más" */
const INITIAL_VISIBLE = 2;

/**
 * Componente orquestador de respuestas a un comentario
 *
 * Gestiona la lista completa de respuestas de un comentario con:
 * - Paginación simple (muestra INITIAL_VISIBLE, con toggle para ver todas)
 * - Visibilidad diferenciada: los admins ven todas las respuestas (incluyendo ocultas),
 *   los clientes solo ven las activas
 * - Creación de respuestas: usa `adminCommentService` si el usuario es admin,
 *   `commentService` si es cliente
 * - Delegación de eliminación y moderación a los handlers correspondientes
 *
 * @param props - Ver ReplyListProps
 * @returns Lista de respuestas con controles de paginación y formulario de nueva respuesta
 */
const ReplyList: React.FC<ReplyListProps> = memo(({
  idComentario,
  respuestas,
  currentUserId,
  isAuthenticated = false,
  isSystemUser = false,
  onRepliesChange
}) => {
  const [showForm, setShowForm] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const activeReplies = isSystemUser
    ? respuestas
    : respuestas.filter(r => r.estado === 'activo');

  const visibleReplies = showAll ? activeReplies : activeReplies.slice(0, INITIAL_VISIBLE);
  const hiddenCount = activeReplies.length - INITIAL_VISIBLE;

  /** Crea una nueva respuesta usando el servicio correcto según el rol del usuario */
  const handleCreateReply = async (contenido: string) => {
    let nuevaRespuesta: Respuesta;
    if (isSystemUser) {
      nuevaRespuesta = await adminCommentService.crearRespuestaAdmin(idComentario, contenido);
    } else {
      nuevaRespuesta = await commentService.crearRespuestaCliente(idComentario, contenido);
    }
    onRepliesChange(idComentario, [...respuestas, nuevaRespuesta]);
    setShowForm(false);
    setShowAll(true);
  };

  /** Elimina (soft delete) una respuesta usando el servicio correcto según el rol */
  const handleDeleteReply = async (idRespuesta: number) => {
    if (isSystemUser) {
      await adminCommentService.eliminarRespuestaAdmin(idRespuesta);
    } else {
      await commentService.eliminarRespuesta(idRespuesta);
    }
    onRepliesChange(idComentario, respuestas.filter(r => r.id_respuesta !== idRespuesta));
  };

  /** Cambia el estado de moderación de una respuesta (solo admins del sistema) */
  const handleModerateReply = async (idRespuesta: number, estado: 'activo' | 'oculto' | 'eliminado') => {
    await adminCommentService.moderarRespuesta(idRespuesta, estado);
    onRepliesChange(
      idComentario,
      respuestas.map(r => r.id_respuesta === idRespuesta ? { ...r, estado } : r)
    );
  };

  return (
    <div className={styles.replyList}>
      {activeReplies.length > 0 && (
        <div className={styles.replies}>
          {visibleReplies.map(respuesta => (
            <ReplyCard
              key={respuesta.id_respuesta}
              respuesta={respuesta}
              currentUserId={currentUserId}
              isSystemUser={isSystemUser}
              onDelete={handleDeleteReply}
              onModerate={isSystemUser ? handleModerateReply : undefined}
            />
          ))}

          {hiddenCount > 0 && !showAll && (
            <button
              className={styles.toggleBtn}
              onClick={() => setShowAll(true)}
            >
              Ver {hiddenCount} respuesta{hiddenCount > 1 ? 's' : ''} más
            </button>
          )}

          {showAll && activeReplies.length > INITIAL_VISIBLE && (
            <button
              className={styles.toggleBtn}
              onClick={() => setShowAll(false)}
            >
              Ocultar respuestas
            </button>
          )}
        </div>
      )}

      {isAuthenticated && !showForm && (
        <button
          className={styles.replyBtn}
          onClick={() => setShowForm(true)}
        >
          <span className="material-icons">reply</span>
          Responder
        </button>
      )}

      {showForm && (
        <ReplyForm
          onSubmit={handleCreateReply}
          onCancel={() => setShowForm(false)}
          isAdmin={isSystemUser}
        />
      )}
    </div>
  );
});

export default ReplyList;
