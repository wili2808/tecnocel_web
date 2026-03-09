import React, { useState, memo } from 'react';
import styles from './ReplyForm.module.css';

interface ReplyFormProps {
  onSubmit: (contenido: string) => Promise<void>;
  onCancel: () => void;
  isAdmin?: boolean;
}

const ReplyForm: React.FC<ReplyFormProps> = memo(({ onSubmit, onCancel, isAdmin = false }) => {
  const [contenido, setContenido] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxChars = 1000;
  const isValid = contenido.trim().length >= 1 && contenido.trim().length <= maxChars;

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
