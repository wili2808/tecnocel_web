import React, { useState, memo } from 'react';
import styles from './ReplyForm.module.css';

/**
 * Props del componente ReplyForm
 */
interface ReplyFormProps {
  /** Callback invocado al enviar el formulario con el texto de la respuesta */
  onSubmit: (contenido: string) => Promise<void>;
  /** Callback invocado al cancelar la redacción */
  onCancel: () => void;
  /** Si es true, muestra indicador de respuesta oficial del equipo TecnoCel */
  isAdmin?: boolean;
}

/**
 * Formulario inline para redactar una respuesta a un comentario
 *
 * Presenta un textarea con contador de caracteres (máx. 1000), validación
 * básica y dos variantes visuales: cliente estándar y administrador (con
 * indicador de "Equipo oficial"). Gestiona su propio estado de envío
 * y muestra errores en caso de fallo en el servidor.
 *
 * @param props - Ver ReplyFormProps
 * @returns Formulario de respuesta con controles de envío y cancelación
 */
const ReplyForm: React.FC<ReplyFormProps> = memo(({ onSubmit, onCancel, isAdmin = false }) => {
  const [contenido, setContenido] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxChars = 1000;
  const isValid = contenido.trim().length >= 1 && contenido.trim().length <= maxChars;

  /** Valida y envía el contenido al padre; limpia el campo si tiene éxito */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(contenido.trim());
      setContenido('');
    } catch {
      setError('Error al publicar la respuesta. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles.replyForm} onSubmit={handleSubmit}>
      {isAdmin && (
        <div className={styles.adminIndicator}>
          <span className="material-icons">shield</span>
          Respondiendo como equipo oficial
        </div>
      )}
      <div className={styles.inputWrapper}>
        <textarea
          className={styles.textarea}
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          placeholder="Escribe tu respuesta..."
          maxLength={maxChars}
          rows={3}
          disabled={isSubmitting}
          autoFocus
        />
        <span className={`${styles.charCount} ${contenido.length > maxChars * 0.9 ? styles.charCountWarn : ''}`}>
          {contenido.length}/{maxChars}
        </span>
      </div>
      {error && <p className={styles.errorMsg}>{error}</p>}
      <div className={styles.formActions}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? 'Publicando...' : 'Publicar respuesta'}
        </button>
      </div>
    </form>
  );
});

export default ReplyForm;
