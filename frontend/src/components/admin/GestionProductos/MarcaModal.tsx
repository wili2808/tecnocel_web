import React, { useState, useEffect } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';
import adminProductService from '../../../services/adminProductService';
import type { Marca } from '../../../types/product';
import styles from './GestionProductos.module.css';

interface MarcaModalProps {
  marca?: Marca | null;
  isOpen: boolean;
  onClose: () => void;
  onGuardado: () => void;
}

const MarcaModal: React.FC<MarcaModalProps> = ({ marca, isOpen, onClose, onGuardado }) => {
  const { showNotification } = useNotification();
  const { tienePermiso } = useAuth();
  
  const puedeEditar = tienePermiso('editar_marca');
  const puedeEliminar = tienePermiso('eliminar_marca');
  const puedeCrear = tienePermiso('crear_marca');

  const modoEdicion = !!marca;
  
  const [form, setForm] = useState({
    nombre_marca: '',
    descripcion_marca: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (marca) {
        setForm({
          nombre_marca: marca.nombre_marca,
          descripcion_marca: marca.descripcion_marca || '',
        });
        setLogoPreview(marca.logo_marca || null);
        setLogoFile(null);
      } else {
        setForm({ nombre_marca: '', descripcion_marca: '' });
        setLogoPreview(null);
        setLogoFile(null);
      }
      setShowConfirmDelete(false);
    }
  }, [isOpen, marca]);

  if (!isOpen) return null;

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLogoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(marca?.logo_marca || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardando) return;

    if (!form.nombre_marca.trim()) {
      showNotification('El nombre de la marca es obligatorio', 'error');
      return;
    }

    setGuardando(true);
    try {
      if (modoEdicion) {
        await adminProductService.actualizarMarca(marca!.id_marca, {
          nombre_marca: form.nombre_marca.trim(),
          descripcion_marca: form.descripcion_marca.trim() || undefined,
        });
        if (logoFile) {
          await adminProductService.uploadMarcaLogo(marca!.id_marca, logoFile);
        }
        showNotification('Marca actualizada exitosamente', 'success');
      } else {
        const nuevaMarca = await adminProductService.crearMarca({
          nombre_marca: form.nombre_marca.trim(),
          descripcion_marca: form.descripcion_marca.trim() || undefined,
        });
        if (logoFile) {
          await adminProductService.uploadMarcaLogo(nuevaMarca.id_marca, logoFile);
        }
        showNotification('Marca creada exitosamente', 'success');
      }
      onGuardado();
      onClose();
    } catch (err: any) {
      showNotification(
        err.response?.data?.error || err.response?.data?.message || err.message || 'Error al guardar la marca',
        'error'
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    if (!marca) return;
    setEliminando(true);
    try {
      await adminProductService.eliminarMarca(marca.id_marca);
      showNotification('Marca eliminada exitosamente', 'success');
      onGuardado();
      onClose();
    } catch (err: any) {
      showNotification(
        err.response?.data?.error || err.response?.data?.message || err.message || 'Error al eliminar la marca',
        'error'
      );
    } finally {
      setEliminando(false);
    }
  };

  const readonly = modoEdicion ? !puedeEditar : !puedeCrear;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            <span className="material-icons">{modoEdicion ? 'edit' : 'add_circle'}</span>
            {modoEdicion ? 'Editar Marca' : 'Nueva Marca'}
          </h3>
          <button className={styles.closeButton} onClick={onClose} disabled={guardando || eliminando}>
            <span className="material-icons">close</span>
          </button>
        </div>

        {showConfirmDelete ? (
          <div className={styles.modalBody}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <span className="material-icons" style={{ fontSize: 48, color: 'var(--color-error)', marginBottom: 16 }}>
                warning
              </span>
              <h4 style={{ margin: '0 0 8px', fontSize: 18 }}>¿Eliminar marca?</h4>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                Estás a punto de eliminar <strong>{marca?.nombre_marca}</strong>. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton} 
                onClick={() => setShowConfirmDelete(false)} 
                disabled={eliminando}
              >
                Cancelar
              </button>
              <button 
                className={styles.saveButton} 
                style={{ backgroundColor: 'var(--color-error)' }} 
                onClick={handleEliminar} 
                disabled={eliminando}
              >
                {eliminando ? 'Eliminando...' : 'Sí, eliminar marca'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.modalBody}>
              <div className={styles.logoUploadContainer}>
                <div className={styles.logoPreviewWrapper}>
                  {logoPreview ? (
                    <img 
                      src={logoPreview} 
                      alt="Logo preview" 
                      className={styles.logoImg}
                    />
                  ) : (
                    <div className={styles.logoPlaceholder}>
                      <span className="material-icons" style={{ fontSize: 40 }}>image</span>
                    </div>
                  )}
                  
                  {!readonly && (
                    <label className={styles.logoEditBtn} title="Cambiar logo">
                      <span className="material-icons" style={{ fontSize: 18 }}>edit</span>
                      <input 
                        type="file" 
                        accept="image/png,image/jpeg,image/webp" 
                        style={{ display: 'none' }} 
                        onChange={handleLogoChange}
                        disabled={guardando}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Nombre <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <input
                  className={styles.formInput}
                  value={form.nombre_marca}
                  onChange={(e) => setForm({ ...form, nombre_marca: e.target.value })}
                  placeholder="Ej: Samsung, Apple, Xiaomi"
                  disabled={guardando || readonly}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Descripción</label>
                <textarea
                  className={styles.formInput}
                  value={form.descripcion_marca}
                  onChange={(e) => setForm({ ...form, descripcion_marca: e.target.value })}
                  placeholder="Descripción opcional de la marca..."
                  disabled={guardando || readonly}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>

            <div className={styles.modalFooter} style={{ display: 'flex', justifyContent: modoEdicion && puedeEliminar ? 'space-between' : 'flex-end' }}>
              {modoEdicion && puedeEliminar && (
                <button 
                  type="button" 
                  className={styles.cancelButton} 
                  style={{ color: 'var(--color-error)', border: '1px solid var(--color-error)', backgroundColor: 'transparent' }} 
                  onClick={() => setShowConfirmDelete(true)} 
                  disabled={guardando}
                >
                  <span className="material-icons" style={{ fontSize: 18, marginRight: 4, verticalAlign: 'text-bottom' }}>delete</span>
                  Eliminar
                </button>
              )}
              
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className={styles.cancelButton} onClick={onClose} disabled={guardando}>
                  Cancelar
                </button>
                {!readonly && (
                  <button type="submit" className={styles.saveButton} disabled={guardando}>
                    <span className="material-icons" style={{ fontSize: 18, marginRight: 6, verticalAlign: 'text-bottom' }}>
                      {guardando ? 'hourglass_empty' : 'save'}
                    </span>
                    {guardando ? 'Guardando...' : 'Guardar'}
                  </button>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default MarcaModal;
