import React, { useState, memo } from 'react';
import type { Respuesta } from '../../../services/commentService';
import commentService from '../../../services/commentService';
import adminCommentService from '../../../services/adminCommentService';
import ReplyCard from './ReplyCard';
import ReplyForm from './ReplyForm';
import styles from './ReplyList.module.css';

interface ReplyListProps {
  idComentario: number;
  respuestas: Respuesta[];
  currentUserId?: number;
  isAuthenticated?: boolean;
  isSystemUser?: boolean;
  onRepliesChange: (idComentario: number, respuestas: Respuesta[]) => void;
}

const INITIAL_VISIBLE = 2;

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

  const handleDeleteReply = async (idRespuesta: number) => {
    if (isSystemUser) {
      await adminCommentService.eliminarRespuestaAdmin(idRespuesta);
    } else {
      await commentService.eliminarRespuesta(idRespuesta);
    }
    onRepliesChange(idComentario, respuestas.filter(r => r.id_respuesta !== idRespuesta));
  };

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
