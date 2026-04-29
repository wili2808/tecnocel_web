import React, { useState, useEffect } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';
import adminProductService from '../../../services/adminProductService';
import type { Category } from '../../../types/product';
import styles from './GestionProductos.module.css';

interface CategoriaModalProps {
  categoria?: Category | null;
  isOpen: boolean;
  onClose: () => void;
  onGuardado: () => void;
}

const CategoriaModal: React.FC<CategoriaModalProps> = ({ categoria, isOpen, onClose, onGuardado }) => {
  const { showNotification } = useNotification();
  const { tienePermiso } = useAuth();
  
  const puedeEditar = tienePermiso('editar_categoria');
  const puedeEliminar = tienePermiso('eliminar_categoria');
  const puedeCrear = tienePermiso('crear_categoria');

  const modoEdicion = !!categoria;
  
  const [form, setForm] = useState({
    nombre_categoria: '',
  });
  
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (categoria) {
        setForm({
          nombre_categoria: categoria.nombre_categoria,
        });
      } else {
        setForm({ nombre_categoria: '' });
      }
      setShowConfirmDelete(false);
    }
  }, [isOpen, categoria]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardando) return;

    if (!form.nombre_categoria.trim()) {
      showNotification('El nombre de la categoría es obligatorio', 'error');
      return;
    }

    setGuardando(true);
    try {
      if (modoEdicion) {
        await adminProductService.actualizarCategoria(categoria!.id_categoria, {
          nombre_categoria: form.nombre_categoria.trim(),
        });
        showNotification('Categoría actualizada exitosamente', 'success');
      } else {
        await adminProductService.crearCategoria({
          nombre_categoria: form.nombre_categoria.trim(),
        });
        showNotification('Categoría creada exitosamente', 'success');
      }
      onGuardado();
      onClose();
    } catch (err: any) {
      showNotification(
        err.response?.data?.error || err.response?.data?.message || err.message || 'Error al guardar la categoría',
        'error'
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    if (!categoria) return;
    setEliminando(true);
    try {
      await adminProductService.eliminarCategoria(categoria.id_categoria);
      showNotification('Categoría eliminada exitosamente', 'success');
      onGuardado();
      onClose();
    } catch (err: any) {
      showNotification(
        err.response?.data?.error || err.response?.data?.message || err.message || 'Error al eliminar la categoría',
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
            {modoEdicion ? 'Editar Categoría' : 'Nueva Categoría'}
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
              <h4 style={{ margin: '0 0 8px', fontSize: 18 }}>¿Eliminar categoría?</h4>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                Estás a punto de eliminar la categoría <strong>{categoria?.nombre_categoria}</strong>. Esta acción no se puede deshacer.
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
                {eliminando ? 'Eliminando...' : 'Sí, eliminar categoría'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  Nombre <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <input
                  className={styles.formInput}
                  value={form.nombre_categoria}
                  onChange={(e) => setForm({ nombre_categoria: e.target.value })}
                  placeholder="Ej: Smartphones, Tablets, Accesorios..."
                  disabled={guardando || readonly}
                  required
                  autoFocus
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

export default CategoriaModal;
