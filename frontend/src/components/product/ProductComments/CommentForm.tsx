import React, { useState } from 'react';
import styles from './CommentForm.module.css';

interface CommentFormProps {
    productName: string;
    onSubmit: (data: {
        comentario: string;
        calificacion?: number;
        imagenes?: File[];
    }) => void;
    onCancel: () => void;
    isSubmitting: boolean;
    className?: string;
}

const CommentForm: React.FC<CommentFormProps> = ({
    productName,
    onSubmit,
    onCancel,
    isSubmitting,
    className = ''
}) => {
    const [comentario, setComentario] = useState('');
    const [calificacion, setCalificacion] = useState<number | undefined>(undefined);
    const [imagenes, setImagenes] = useState<File[]>([]);
    const [errors, setErrors] = useState<string[]>([]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validaciones
        const newErrors: string[] = [];

        if (comentario.trim().length < 10) {
            newErrors.push('El comentario debe tener al menos 10 caracteres');
        }

        if (comentario.length > 2000) {
            newErrors.push('El comentario no puede tener más de 2000 caracteres');
        }

        if (calificacion && (calificacion < 1 || calificacion > 5)) {
            newErrors.push('La calificación debe estar entre 1 y 5');
        }

        if (imagenes.length > 5) {
            newErrors.push('Máximo 5 imágenes por comentario');
        }

        // Validar cada imagen
        imagenes.forEach((file, index) => {
            const maxSize = 10 * 1024 * 1024; // 10MB
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

            if (!allowedTypes.includes(file.type)) {
                newErrors.push(`Imagen ${index + 1}: Tipo no válido. Solo JPG, PNG, WEBP, GIF`);
            }

            if (file.size > maxSize) {
                newErrors.push(`Imagen ${index + 1}: Tamaño máximo 10MB`);
            }
        });

        setErrors(newErrors);

        if (newErrors.length === 0) {
            onSubmit({
                comentario: comentario.trim(),
                calificacion,
                imagenes: imagenes.length > 0 ? imagenes : undefined
            });
        }
    };

    const handleImagenesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + imagenes.length > 5) {
            setErrors(['Máximo 5 imágenes por comentario']);
            return;
        }
        setImagenes([...imagenes, ...files]);
        setErrors([]);
    };

    const removeImage = (index: number) => {
        setImagenes(imagenes.filter((_, i) => i !== index));
    };

    const handleRatingClick = (rating: number) => {
        setCalificacion(calificacion === rating ? undefined : rating);
    };

    return (
        <form className={`${styles.commentForm} ${className}`} onSubmit={handleSubmit}>
            <div className={styles.formHeader}>
                <h4>Escribe tu comentario sobre {productName}</h4>
            </div>

            {/* Calificación */}
            <div className={styles.ratingSection}>
                <label className={styles.label}>Calificación (opcional)</label>
                <div className={styles.starRating}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            className={`${styles.star} ${star <= (calificacion || 0) ? styles.active : ''}`}
                            onClick={() => handleRatingClick(star)}
                            disabled={isSubmitting}
                        >
                            <span className="material-icons">
                                {star <= (calificacion || 0) ? 'star' : 'star_border'}
                            </span>
                        </button>
                    ))}
                    {calificacion && (
                        <span className={styles.ratingText}>
                            {calificacion} estrella{calificacion !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </div>

            {/* Comentario */}
            <div className={styles.commentSection}>
                <label htmlFor="comentario" className={styles.label}>
                    Comentario *
                </label>
                <textarea
                    id="comentario"
                    className={styles.textarea}
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    placeholder={`Comparte tu experiencia con ${productName}...`}
                    rows={4}
                    disabled={isSubmitting}
                    required
                />
                <div className={styles.charCount}>
                    {comentario.length}/2000 caracteres
                </div>
            </div>

            {/* Imágenes */}
            <div className={styles.imagesSection}>
                <label className={styles.label}>
                    Imágenes (opcional, máximo 5)
                </label>

                <div className={styles.imageUpload}>
                    <input
                        type="file"
                        id="imagenes"
                        multiple
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        onChange={handleImagenesChange}
                        disabled={isSubmitting || imagenes.length >= 5}
                        className={styles.fileInput}
                    />
                    <label htmlFor="imagenes" className={styles.uploadButton}>
                        <span className="material-icons">add_photo_alternate</span>
                        Agregar imágenes
                    </label>
                </div>

                {/* Preview de imágenes */}
                {imagenes.length > 0 && (
                    <div className={styles.imagePreview}>
                        {imagenes.map((file, index) => (
                            <div key={index} className={styles.imageItem}>
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={`Preview ${index + 1}`}
                                    className={styles.previewImage}
                                />
                                <button
                                    type="button"
                                    className={styles.removeImage}
                                    onClick={() => removeImage(index)}
                                    disabled={isSubmitting}
                                >
                                    <span className="material-icons">close</span>
                                </button>
                                <div className={styles.imageName}>
                                    {file.name}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Errores */}
            {errors.length > 0 && (
                <div className={styles.errors}>
                    {errors.map((error, index) => (
                        <div key={index} className={styles.error}>
                            <span className="material-icons">error</span>
                            {error}
                        </div>
                    ))}
                </div>
            )}

            {/* Botones */}
            <div className={styles.formActions}>
                <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isSubmitting || comentario.trim().length < 10}
                >
                    {isSubmitting ? (
                        <>
                            <span className={styles.spinner}></span>
                            Enviando...
                        </>
                    ) : (
                        <>
                            <span className="material-icons">send</span>
                            Enviar comentario
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

export default CommentForm;