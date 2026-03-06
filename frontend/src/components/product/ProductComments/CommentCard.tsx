import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
    const [expandedImageIndex, setExpandedImageIndex] = useState<number | null>(null);
    const [expandedImageList, setExpandedImageList] = useState<Array<{ src: string; alt: string }>>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isOwner = currentUserId === comentario.id_cliente;
    const fechaFormateada = commentService.formatearFechaComentario(comentario.fyh_creacion);

    useEffect(() => {
        if (expandedImageIndex === null) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setExpandedImageIndex(null);
                setExpandedImageList([]);
            } else if (event.key === 'ArrowLeft') {
                setExpandedImageIndex((prev) => {
                    if (prev === null || expandedImageList.length <= 1) return prev;
                    return prev === 0 ? expandedImageList.length - 1 : prev - 1;
                });
            } else if (event.key === 'ArrowRight') {
                setExpandedImageIndex((prev) => {
                    if (prev === null || expandedImageList.length <= 1) return prev;
                    return prev === expandedImageList.length - 1 ? 0 : prev + 1;
                });
            }
        };

        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [expandedImageIndex, expandedImageList.length]);

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

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeNewImage = (index: number) => {
        setNewImages(prev => prev.filter((_, i) => i !== index));
    };

    const openImageModal = (images: Array<{ src: string; alt: string }>, index: number) => {
        setExpandedImageList(images);
        setExpandedImageIndex(index);
    };

    const closeImageModal = () => {
        setExpandedImageIndex(null);
        setExpandedImageList([]);
    };

    const goToPreviousImage = () => {
        setExpandedImageIndex((prev) => {
            if (prev === null || expandedImageList.length <= 1) return prev;
            return prev === 0 ? expandedImageList.length - 1 : prev - 1;
        });
    };

    const goToNextImage = () => {
        setExpandedImageIndex((prev) => {
            if (prev === null || expandedImageList.length <= 1) return prev;
            return prev === expandedImageList.length - 1 ? 0 : prev + 1;
        });
    };

    const handleSaveWithNewImages = async () => {
        if (editText.trim().length < 10) {
            return;
        }

        setIsSubmitting(true);
        setUploadingImages(true);

        try {
            let uploadedImages: any[] = [];
            if (newImages.length > 0) {
                try {
                    const uploadedImagesData = await uploadService.uploadCommentImages(newImages);

                    uploadedImages = uploadedImagesData.map((image) => ({
                        nombre_archivo: image.url_imagen,
                        ruta_imagen: image.url_imagen,
                        tipo_archivo: 'image/jpeg',
                        tamaño_archivo: 0,
                        alt_text: image.alt_text
                    }));

                    console.log('📸 Imágenes transformadas para actualización:', uploadedImages);
                } catch (uploadError) {
                    console.error('Error al subir nuevas imágenes:', uploadError);
                    alert('Error al subir las nuevas imágenes. Por favor, intenta nuevamente.');
                    return;
                }
            }

            await onEdit(comentario.id_comentario, {
                comentario: editText.trim(),
                calificacion: editRating,
                imagenes: uploadedImages
            });

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

    const existingCommentImages = (comentario.imagenes || []).map((imagen) => ({
        src: imagen.imagen_url,
        alt: imagen.alt_text || 'Imagen del comentario',
    }));

    const activeExpandedImage =
        expandedImageIndex !== null && expandedImageList[expandedImageIndex]
            ? expandedImageList[expandedImageIndex]
            : null;

    return (
        <div className={`${styles.commentCard} ${className} ${isDeletingComment ? styles.deleting : ''}`}>
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

            {!isCurrentlyEditing ? (
                renderStars(comentario.calificacion)
            ) : (
                <div className={styles.editRatingSection}>
                    <label className={styles.editLabel}>Calificación:</label>
                    {renderEditableStars(editRating, setEditRating)}
                </div>
            )}

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

            <div className={styles.commentImages}>
                {comentario.imagenes && comentario.imagenes.length > 0 && (
                    <>
                        {comentario.imagenes.map((imagen, index) => (
                            <div key={imagen.id_imagen} className={styles.imageContainer}>
                                <button
                                    type="button"
                                    className={styles.imagePreviewButton}
                                    onClick={() => openImageModal(existingCommentImages, index)}
                                    aria-label="Abrir imagen en tamaño completo"
                                >
                                    <img
                                        src={imagen.imagen_url}
                                        alt={imagen.alt_text || 'Imagen del comentario'}
                                        className={styles.commentImage}
                                        loading="lazy"
                                    />
                                </button>
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

                {isCurrentlyEditing && newImages.length > 0 && (
                    <>
                        {newImages.map((file, index) => {
                            const previewUrl = URL.createObjectURL(file);

                            return (
                                <div key={`new-${index}`} className={styles.imageContainer}>
                                    <button
                                        type="button"
                                        className={styles.imagePreviewButton}
                                        onClick={() =>
                                            openImageModal([{ src: previewUrl, alt: `Nueva imagen ${index + 1}` }], 0)
                                        }
                                        aria-label="Abrir imagen en tamaño completo"
                                    >
                                        <img
                                            src={previewUrl}
                                            alt={`Nueva imagen ${index + 1}`}
                                            className={styles.commentImage}
                                        />
                                    </button>
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
                            );
                        })}
                    </>
                )}

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

            {activeExpandedImage && createPortal(
                <div className={styles.imageModal} role="dialog" aria-modal="true" aria-label="Vista ampliada de imagen">
                    <button
                        type="button"
                        className={styles.imageModalBackdrop}
                        onClick={closeImageModal}
                        aria-label="Cerrar vista ampliada"
                    />
                    <div className={styles.imageModalContent}>
                        {expandedImageList.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    className={`${styles.imageNavButton} ${styles.imageNavPrev}`}
                                    onClick={goToPreviousImage}
                                    aria-label="Imagen anterior"
                                >
                                    <span className="material-icons">chevron_left</span>
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.imageNavButton} ${styles.imageNavNext}`}
                                    onClick={goToNextImage}
                                    aria-label="Siguiente imagen"
                                >
                                    <span className="material-icons">chevron_right</span>
                                </button>
                            </>
                        )}
                        <button
                            type="button"
                            className={styles.imageModalClose}
                            onClick={closeImageModal}
                            aria-label="Cerrar"
                        >
                            <span className="material-icons">close</span>
                        </button>
                        <img
                            src={activeExpandedImage.src}
                            alt={activeExpandedImage.alt}
                            className={styles.imageModalImage}
                        />
                    </div>
                </div>,
                document.body
            )}

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
