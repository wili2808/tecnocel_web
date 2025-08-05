import React, { useState } from 'react';
import type { Comentario } from '../../../services/commentService';
import commentService from '../../../services/commentService';
import styles from './CommentCard.module.css';

interface CommentCardProps {
    comentario: Comentario;
    currentUserId?: number;
    onDelete: (id: number) => void;
    onEdit: (id: number, data: { comentario?: string; calificacion?: number }) => void;
    className?: string;
}

const CommentCard: React.FC<CommentCardProps> = ({
    comentario,
    currentUserId,
    onDelete,
    onEdit,
    className = ''
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comentario.comentario);
    const [editRating, setEditRating] = useState(comentario.calificacion);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isOwner = currentUserId === comentario.id_cliente;
    const fechaFormateada = commentService.formatearFechaComentario(comentario.fyh_creacion);

    const handleEdit = async () => {
        if (editText.trim().length < 10) {
            return;
        }

        setIsSubmitting(true);
        try {
            await onEdit(comentario.id_comentario, {
                comentario: editText.trim(),
                calificacion: editRating
            });
            setIsEditing(false);
        } catch (error) {
            console.error('Error editing comment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setIsSubmitting(true);
        try {
            await onDelete(comentario.id_comentario);
        } catch (error) {
            console.error('Error deleting comment:', error);
        } finally {
            setIsSubmitting(false);
            setShowDeleteConfirm(false);
        }
    };

    const renderStars = (rating?: number) => {
        if (!rating) return null;

        return (
            <div className={styles.rating}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <span
                        key={star}
                        className={`material-icons ${styles.star} ${star <= rating ? styles.active : ''}`}
                    >
                        {star <= rating ? 'star' : 'star_border'}
                    </span>
                ))}
                <span className={styles.ratingText}>
                    {commentService.generarTextoCalificacion(rating)}
                </span>
            </div>
        );
    };

    const renderEditableStars = (rating?: number, onChange?: (rating: number) => void) => {
        return (
            <div className={styles.editableRating}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        className={`${styles.editStar} ${star <= (rating || 0) ? styles.active : ''}`}
                        onClick={() => onChange?.(star === rating ? 0 : star)}
                        disabled={isSubmitting}
                    >
                        <span className="material-icons">
                            {star <= (rating || 0) ? 'star' : 'star_border'}
                        </span>
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className={`${styles.commentCard} ${className}`}>
            {/* Header del comentario */}
            <div className={styles.commentHeader}>
                <div className={styles.userInfo}>
                    <div className={styles.avatar}>
                        <span className="material-icons">account_circle</span>
                    </div>
                    <div className={styles.userDetails}>
                        <div className={styles.userName}>
                            {comentario.cliente.nombre_cliente} {comentario.cliente.apellido_cliente}
                        </div>
                        <div className={styles.commentMeta}>
                            <span className={styles.date}>{fechaFormateada}</span>
                            {comentario.es_verificado && (
                                <span className={styles.verified}>
                                    <span className="material-icons">verified</span>
                                    Compra verificada
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Acciones del propietario */}
                {isOwner && !isEditing && (
                    <div className={styles.actions}>
                        <button
                            className={styles.actionButton}
                            onClick={() => setIsEditing(true)}
                            disabled={isSubmitting}
                            title="Editar comentario"
                        >
                            <span className="material-icons">edit</span>
                        </button>
                        <button
                            className={styles.actionButton}
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={isSubmitting}
                            title="Eliminar comentario"
                        >
                            <span className="material-icons">delete</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Calificación */}
            {!isEditing ? (
                renderStars(comentario.calificacion)
            ) : (
                <div className={styles.editRatingSection}>
                    <label className={styles.editLabel}>Calificación:</label>
                    {renderEditableStars(editRating, setEditRating)}
                </div>
            )}

            {/* Contenido del comentario */}
            <div className={styles.commentContent}>
                {!isEditing ? (
                    <p className={styles.commentText}>{comentario.comentario}</p>
                ) : (
                    <div className={styles.editSection}>
                        <textarea
                            className={styles.editTextarea}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={3}
                            disabled={isSubmitting}
                        />
                        <div className={styles.charCount}>
                            {editText.length}/2000 caracteres
                        </div>
                    </div>
                )}
            </div>

            {/* Imágenes del comentario */}
            {comentario.imagenes && comentario.imagenes.length > 0 && (
                <div className={styles.commentImages}>
                    {comentario.imagenes.map((imagen) => (
                        <div key={imagen.id_imagen} className={styles.imageContainer}>
                            <img
                                src={imagen.imagen_url}
                                alt={imagen.alt_text || `Imagen del comentario`}
                                className={styles.commentImage}
                                loading="lazy"
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Respuesta del admin */}
            {comentario.respuesta_admin && (
                <div className={styles.adminResponse}>
                    <div className={styles.adminHeader}>
                        <span className="material-icons">support_agent</span>
                        <strong>Respuesta del equipo</strong>
                        {comentario.fecha_respuesta_admin && (
                            <span className={styles.responseDate}>
                                {commentService.formatearFechaComentario(comentario.fecha_respuesta_admin)}
                            </span>
                        )}
                    </div>
                    <p className={styles.adminText}>{comentario.respuesta_admin}</p>
                </div>
            )}

            {/* Botones de edición */}
            {isEditing && (
                <div className={styles.editActions}>
                    <button
                        className={styles.cancelEdit}
                        onClick={() => {
                            setIsEditing(false);
                            setEditText(comentario.comentario);
                            setEditRating(comentario.calificacion);
                        }}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                    <button
                        className={styles.saveEdit}
                        onClick={handleEdit}
                        disabled={isSubmitting || editText.trim().length < 10}
                    >
                        {isSubmitting ? (
                            <>
                                <span className={styles.spinner}></span>
                                Guardando...
                            </>
                        ) : (
                            'Guardar cambios'
                        )}
                    </button>
                </div>
            )}

            {/* Modal de confirmación de eliminación */}
            {showDeleteConfirm && (
                <div className={styles.deleteModal}>
                    <div className={styles.modalContent}>
                        <h4>¿Eliminar comentario?</h4>
                        <p>Esta acción no se puede deshacer.</p>
                        <div className={styles.modalActions}>
                            <button
                                className={styles.modalCancel}
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </button>
                            <button
                                className={styles.modalDelete}
                                onClick={handleDelete}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommentCard;