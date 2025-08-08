import React, { useState, useRef } from 'react';
import type { Comentario } from '../../../services/commentService';
import commentService from '../../../services/commentService';
import uploadService from '../../../services/uploadService';
import styles from './CommentCard.module.css';

interface CommentCardProps {
    comentario: Comentario;
    currentUserId?: number;
    onDelete: (id: number) => void;
    onEdit: (id: number, data: { comentario?: string; calificacion?: number; imagenes?: any[] }) => void;
    onImageDelete?: (idComentario: number, idImagen: number) => void;
    onStartEdit?: (idComentario: number) => void;
    onCancelEdit?: () => void;
    isEditing?: boolean;
    className?: string;
}

const CommentCard: React.FC<CommentCardProps> = ({
    comentario,
    currentUserId,
    onDelete,
    onEdit,
    onImageDelete,
    onStartEdit,
    onCancelEdit,
    isEditing: externalIsEditing = false,
    className = ''
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comentario.comentario);
    const [editRating, setEditRating] = useState(comentario.calificacion);

    // Usar el estado de edición externo si está disponible, sino usar el interno
    const isCurrentlyEditing = onStartEdit ? externalIsEditing : isEditing;
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingImages, setDeletingImages] = useState<Set<number>>(new Set());
    const [isDeletingComment, setIsDeletingComment] = useState(false);
    const [newImages, setNewImages] = useState<File[]>([]);
    const [uploadingImages, setUploadingImages] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

            // Limpiar estado de edición según el tipo de manejo
            if (onStartEdit) {
                onCancelEdit?.();
            } else {
                setIsEditing(false);
            }
        } catch (error) {
            console.error('Error editing comment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setIsDeletingComment(true);
        try {
            await onDelete(comentario.id_comentario);
        } catch (error) {
            console.error('Error deleting comment:', error);
        } finally {
            setIsDeletingComment(false);
            setShowDeleteConfirm(false);
        }
    };

    const handleDeleteImage = async (idImagen: number) => {
        if (!onImageDelete) return;

        setDeletingImages(prev => new Set(prev).add(idImagen));
        try {
            await onImageDelete(comentario.id_comentario, idImagen);
            // No cerrar la edición, solo actualizar el estado local
            // El componente padre se encargará de actualizar los comentarios
            console.log('✅ Imagen eliminada, manteniendo modo de edición');
        } catch (error) {
            console.error('Error deleting image:', error);
        } finally {
            setDeletingImages(prev => {
                const newSet = new Set(prev);
                newSet.delete(idImagen);
                return newSet;
            });
        }
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        const validFiles = files.filter(file => {
            const validation = commentService.validarImagenComentario(file);
            if (!validation.valid) {
                console.warn('Archivo inválido:', validation.error);
                return false;
            }
            return true;
        });

        const currentImageCount = (comentario.imagenes?.length || 0) + newImages.length;
        const remainingSlots = 5 - currentImageCount;

        if (validFiles.length > remainingSlots) {
            alert(`Solo puedes agregar ${remainingSlots} imagen(es) más. Máximo 5 imágenes por comentario.`);
            validFiles.splice(remainingSlots);
        }

        setNewImages(prev => [...prev, ...validFiles]);

        // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeNewImage = (index: number) => {
        setNewImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSaveWithNewImages = async () => {
        if (editText.trim().length < 10) {
            return;
        }

        setIsSubmitting(true);
        setUploadingImages(true);

        try {
            // Subir nuevas imágenes si las hay
            let uploadedImages: any[] = [];
            if (newImages.length > 0) {
                try {
                    const uploadedImagesData = await uploadService.uploadCommentImages(newImages);

                    // Transformar las imágenes subidas al formato esperado por el backend
                    uploadedImages = uploadedImagesData.map((image) => ({
                        nombre_archivo: image.url_imagen,
                        ruta_imagen: image.url_imagen,
                        tipo_archivo: 'image/jpeg', // Por defecto, ya que sharp convierte a JPEG
                        tamaño_archivo: 0, // No es crítico para comentarios
                        alt_text: image.alt_text
                    }));

                    console.log('📸 Imágenes transformadas para actualización:', uploadedImages);
                } catch (uploadError) {
                    console.error('Error al subir nuevas imágenes:', uploadError);
                    alert('Error al subir las nuevas imágenes. Por favor, intenta nuevamente.');
                    return;
                }
            }

            // Actualizar comentario con nuevas imágenes
            await onEdit(comentario.id_comentario, {
                comentario: editText.trim(),
                calificacion: editRating,
                imagenes: uploadedImages
            });

            // Limpiar estado de edición según el tipo de manejo
            if (onStartEdit) {
                onCancelEdit?.();
            } else {
                setIsEditing(false);
            }
            setNewImages([]);
        } catch (error) {
            console.error('Error editing comment:', error);
        } finally {
            setIsSubmitting(false);
            setUploadingImages(false);
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
        <div className={`${styles.commentCard} ${className} ${isDeletingComment ? styles.deleting : ''}`}>
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
                {isOwner && !isCurrentlyEditing && (
                    <div className={styles.actions}>
                        <button
                            className={styles.actionButton}
                            onClick={() => {
                                if (onStartEdit) {
                                    onStartEdit(comentario.id_comentario);
                                } else {
                                    setIsEditing(true);
                                }
                            }}
                            disabled={isSubmitting}
                            title="Editar comentario"
                        >
                            <span className="material-icons">edit</span>
                        </button>
                        <button
                            className={styles.actionButton}
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={isSubmitting || isDeletingComment}
                            title="Eliminar comentario"
                        >
                            <span className="material-icons">delete</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Calificación */}
            {!isCurrentlyEditing ? (
                renderStars(comentario.calificacion)
            ) : (
                <div className={styles.editRatingSection}>
                    <label className={styles.editLabel}>Calificación:</label>
                    {renderEditableStars(editRating, setEditRating)}
                </div>
            )}

            {/* Contenido del comentario */}
            <div className={styles.commentContent}>
                {!isCurrentlyEditing ? (
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
            <div className={styles.commentImages}>
                {/* Imágenes existentes */}
                {comentario.imagenes && comentario.imagenes.length > 0 && (
                    <>
                        {comentario.imagenes.map((imagen) => (
                            <div key={imagen.id_imagen} className={styles.imageContainer}>
                                <img
                                    src={imagen.imagen_url}
                                    alt={imagen.alt_text || `Imagen del comentario`}
                                    className={styles.commentImage}
                                    loading="lazy"
                                />
                                {isOwner && onImageDelete && isCurrentlyEditing && (
                                    <button
                                        type="button"
                                        className={styles.deleteImageButton}
                                        onClick={() => handleDeleteImage(imagen.id_imagen)}
                                        disabled={isSubmitting || deletingImages.has(imagen.id_imagen)}
                                        title="Eliminar imagen"
                                    >
                                        {deletingImages.has(imagen.id_imagen) ? (
                                            <span className={styles.spinner}></span>
                                        ) : (
                                            <span className="material-icons">delete</span>
                                        )}
                                    </button>
                                )}
                            </div>
                        ))}
                    </>
                )}

                {/* Nuevas imágenes durante edición */}
                {isCurrentlyEditing && newImages.length > 0 && (
                    <>
                        {newImages.map((file, index) => (
                            <div key={`new-${index}`} className={styles.imageContainer}>
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={`Nueva imagen ${index + 1}`}
                                    className={styles.commentImage}
                                />
                                <button
                                    type="button"
                                    className={styles.deleteImageButton}
                                    onClick={() => removeNewImage(index)}
                                    disabled={isSubmitting}
                                    title="Eliminar imagen"
                                >
                                    <span className="material-icons">delete</span>
                                </button>
                            </div>
                        ))}
                    </>
                )}

                {/* Botón para agregar imágenes durante edición */}
                {isCurrentlyEditing && (
                    <div className={styles.addImageContainer}>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileSelect}
                            className={styles.fileInput}
                            disabled={isSubmitting || uploadingImages}
                        />
                        <button
                            type="button"
                            className={styles.addImageButton}
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isSubmitting || uploadingImages || (comentario.imagenes?.length || 0) + newImages.length >= 5}
                            title="Agregar imagen"
                        >
                            <span className="material-icons">add_photo_alternate</span>
                            <span className={styles.addImageText}>Agregar imagen</span>
                        </button>
                        <div className={styles.imageCount}>
                            {(comentario.imagenes?.length || 0) + newImages.length}/5 imágenes
                        </div>
                    </div>
                )}
            </div>

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
            {isCurrentlyEditing && (
                <div className={styles.editActions}>
                    <button
                        className={styles.cancelEdit}
                        onClick={() => {
                            if (onStartEdit) {
                                onCancelEdit?.();
                            } else {
                                setIsEditing(false);
                            }
                            setEditText(comentario.comentario);
                            setEditRating(comentario.calificacion);
                            setNewImages([]);
                        }}
                        disabled={isSubmitting || uploadingImages}
                    >
                        Cancelar
                    </button>
                    <button
                        className={styles.saveEdit}
                        onClick={newImages.length > 0 ? handleSaveWithNewImages : handleEdit}
                        disabled={isSubmitting || uploadingImages || editText.trim().length < 10}
                    >
                        {isSubmitting || uploadingImages ? (
                            <>
                                <span className={styles.spinner}></span>
                                {uploadingImages ? 'Subiendo imágenes...' : 'Guardando...'}
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
                                disabled={isDeletingComment}
                            >
                                Cancelar
                            </button>
                            <button
                                className={styles.modalDelete}
                                onClick={handleDelete}
                                disabled={isDeletingComment}
                            >
                                {isDeletingComment ? (
                                    <>
                                        <span className={styles.spinner}></span>
                                        Eliminando comentario e imágenes...
                                    </>
                                ) : (
                                    'Eliminar'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommentCard;