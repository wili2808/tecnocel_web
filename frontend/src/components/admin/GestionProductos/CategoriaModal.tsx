import React, { useState, useEffect, memo } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';
import adminProductService from '../../../services/adminProductService';
import type { Category } from '../../../types/product';
import Input from '../../common/Input/Input';
import PremiumModal from '../../common/PremiumModal/PremiumModal';
import styles from './CategoriaModal.module.css';

interface CategoriaModalProps {
  categoria?: Category | null;
  isOpen: boolean;
  onClose: () => void;
  onGuardado: () => void;
}

const CategoriaModal: React.FC<CategoriaModalProps> = memo(({ categoria, isOpen, onClose, onGuardado }) => {
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
    <>
      <PremiumModal
        isOpen={isOpen}
        onClose={onClose}
        title={modoEdicion ? 'Editar Categoría' : 'Nueva Categoría'}
        icon={modoEdicion ? 'edit' : 'add_circle'}
        maxWidth="450px"
      >
        <form id="categoria-form" onSubmit={handleSubmit}>
          <div className="modalBodyPremium">
            <Input
              id="nombre_categoria"
              name="nombre_categoria"
              label="Nombre de la Categoría"
              value={form.nombre_categoria}
              onChange={(e) => setForm({ nombre_categoria: e.target.value })}
              placeholder="Ej: Smartphones, Tablets, Accesorios..."
              disabled={guardando || readonly}
              required
              autoFocus
            />
          </div>

          <div className="modalFooterPremium">
            {modoEdicion && puedeEliminar && (
              <button 
                type="button" 
                className="btnPremium btnDangerPremium mr-auto" 
                onClick={() => setShowConfirmDelete(true)} 
                disabled={guardando}
              >
                <span className="material-icons">delete</span>
                Eliminar
              </button>
            )}
            
            <button type="button" className="btnPremium btnSecondaryPremium" onClick={onClose} disabled={guardando}>
              Cancelar
            </button>
            {!readonly && (
              <button type="submit" form="categoria-form" className="btnPremium btnPrimaryPremium" disabled={guardando}>
                <span className="material-icons">
                  {guardando ? 'hourglass_empty' : 'save'}
                </span>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            )}
          </div>
        </form>
      </PremiumModal>

      {/* Sub-modal Confirmar Eliminación */}
      <PremiumModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title="¿Eliminar categoría?"
        icon="warning"
        maxWidth="400px"
        titleStyle={{ color: 'var(--color-error)' }}
      >
        <div className="modalBodyPremium">
          <p className={styles.deleteMessage}>
            Estás a punto de eliminar la categoría <strong>{categoria?.nombre_categoria}</strong>. Esta acción no se puede deshacer.
          </p>
        </div>
        <div className="modalFooterPremium">
          <button 
            type="button"
            className="btnPremium btnSecondaryPremium" 
            onClick={() => setShowConfirmDelete(false)} 
            disabled={eliminando}
          >
            Cancelar
          </button>
          <button 
            type="button"
            className="btnPremium btnDangerPremium" 
            onClick={handleEliminar} 
            disabled={eliminando}
          >
            <span className="material-icons">{eliminando ? 'sync' : 'delete_forever'}</span>
            {eliminando ? 'Eliminando...' : 'Sí, eliminar categoría'}
          </button>
        </div>
      </PremiumModal>
    </>
  );
});

CategoriaModal.displayName = 'CategoriaModal';

export default CategoriaModal;
