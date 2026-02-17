/**
 * Componente ProductoImageUploader - Gestión de imágenes de producto
 * Permite subir, previsualizar, reordenar y eliminar imágenes
 */
import { useState, useRef, useCallback } from 'react';
import type { ImagenPreview } from '../../../types/product';
import styles from './ProductoImageUploader.module.css';

const MAX_IMAGES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

interface ProductoImageUploaderProps {
  imagenes: ImagenPreview[];
  onChange: (imagenes: ImagenPreview[]) => void;
}

const ProductoImageUploader = ({ imagenes, onChange }: ProductoImageUploaderProps) => {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `"${file.name}" tiene formato no válido. Solo JPG, PNG y WebP.`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `"${file.name}" excede 10MB.`;
    }
    return null;
  };

  const addFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const remaining = MAX_IMAGES - imagenes.length;

    if (remaining <= 0) {
      setError(`Máximo ${MAX_IMAGES} imágenes por producto.`);
      return;
    }

    const filesToAdd = fileArray.slice(0, remaining);
    const errors: string[] = [];
    const validFiles: File[] = [];

    filesToAdd.forEach(file => {
      const err = validateFile(file);
      if (err) {
        errors.push(err);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setError(errors[0]);
    } else {
      setError(null);
    }

    if (validFiles.length === 0) return;

    const newImagenes: ImagenPreview[] = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      alt_text: file.name.replace(/\.[^/.]+$/, ''),
      es_existente: false,
    }));

    onChange([...imagenes, ...newImagenes]);
  }, [imagenes, onChange]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleRemove = (index: number) => {
    const img = imagenes[index];
    if (img.preview && !img.es_existente) {
      URL.revokeObjectURL(img.preview);
    }
    const updated = imagenes.filter((_, i) => i !== index);
    onChange(updated);
    setError(null);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...imagenes];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    onChange(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === imagenes.length - 1) return;
    const updated = [...imagenes];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    onChange(updated);
  };

  const handleAltTextChange = (index: number, value: string) => {
    const updated = [...imagenes];
    updated[index] = { ...updated[index], alt_text: value };
    onChange(updated);
  };

  return (
    <div className={styles.uploader}>
      <div
        className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <span className="material-icons">{dragOver ? 'file_download' : 'cloud_upload'}</span>
        <p className={styles.dropzoneText}>
          Arrastra imágenes aquí o haz clic para seleccionar
        </p>
        <p className={styles.dropzoneHint}>
          JPG, PNG, WebP - Máximo 10MB cada una - Hasta {MAX_IMAGES} imágenes
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          multiple
          onChange={handleFileSelect}
          className={styles.fileInput}
        />
      </div>

      {error && (
        <p className={styles.error}>
          <span className="material-icons">warning</span>
          {error}
        </p>
      )}

      {imagenes.length > 0 && (
        <div className={styles.previewGrid}>
          {imagenes.map((img, index) => (
            <div key={img.preview + index} className={styles.previewCard}>
              <div className={styles.previewImageWrapper}>
                <img
                  src={img.preview}
                  alt={img.alt_text}
                  className={styles.previewImage}
                />
                {index === 0 && (
                  <span className={styles.principalBadge}>Principal</span>
                )}
              </div>
              <div className={styles.previewActions}>
                <input
                  type="text"
                  value={img.alt_text}
                  onChange={(e) => handleAltTextChange(index, e.target.value)}
                  placeholder="Texto alternativo"
                  className={styles.altTextInput}
                />
                <div className={styles.previewButtons}>
                  <button
                    type="button"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className={styles.iconBtn}
                    title="Mover arriba"
                  >
                    <span className="material-icons">arrow_upward</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === imagenes.length - 1}
                    className={styles.iconBtn}
                    title="Mover abajo"
                  >
                    <span className="material-icons">arrow_downward</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                    title="Eliminar"
                  >
                    <span className="material-icons">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {imagenes.length > 0 && (
        <p className={styles.imageCount}>
          {imagenes.length} de {MAX_IMAGES} imágenes - La primera imagen será la principal
        </p>
      )}
    </div>
  );
};

export default ProductoImageUploader;
