import React, { useState, useEffect, memo } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';
import adminProductService from '../../../services/adminProductService';
import type { Marca } from '../../../types/product';
import Input from '../../common/Input/Input';
import TextArea from '../../common/TextArea/TextArea';
import PremiumModal from '../../common/PremiumModal/PremiumModal';
import { useFormDirty } from '../../../hooks/useFormDirty';
import styles from './ProductoModals.module.css';

interface MarcaModalProps {
  marca?: Marca | null;
  isOpen: boolean;
  onClose: () => void;
  onGuardado: () => void;
}

const MarcaModal: React.FC<MarcaModalProps> = memo(({ marca, isOpen, onClose, onGuardado }) => {
  const { showNotification } = useNotification();
  const { tienePermiso } = useAuth();
  
  const puedeEditar = tienePermiso('editar_marca');
  const puedeEliminar = tienePermiso('eliminar_marca');
  const puedeCrear = tienePermiso('crear_marca');

  const modoEdicion = !!marca;
  
  const [form, setForm] = useState({
    nombre_marca: '',
    descripcion_marca: '',
    activo: true,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  const { setInitialValues, isDirty } = useFormDirty<{ nombre_marca: string; descripcion_marca: string; activo: boolean }>();

  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (marca) {
        const vals = {
          nombre_marca: marca.nombre_marca,
          descripcion_marca: marca.descripcion_marca || '',
          activo: marca.activo,
        };
        setForm(vals);
        setInitialValues(vals);
        setLogoPreview(marca.logo_marca || null);
        setLogoFile(null);
      } else {
        setForm({ nombre_marca: '', descripcion_marca: '', activo: true });
        setLogoPreview(null);
        setLogoFile(null);
      }
      setShowConfirmDelete(false);
    }
  }, [isOpen, marca, setInitialValues]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

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
          activo: form.activo,
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
      if (marca.activo) {
        await adminProductService.eliminarMarca(marca.id_marca);
        showNotification('Marca desactivada exitosamente', 'success');
      } else {
        await adminProductService.actualizarMarca(marca.id_marca, { ...form, activo: true });
        showNotification('Marca reactivada exitosamente', 'success');
      }
      setShowConfirmDelete(false);
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
    <>
      <PremiumModal
        isOpen={isOpen}
        onClose={onClose}
        title={modoEdicion ? 'Editar Marca' : 'Nueva Marca'}
        icon={modoEdicion ? 'edit' : 'add_circle'}
        maxWidth="500px"
      >
        <div className="modalBodyPremium">
          <form id="marca-form" onSubmit={handleSubmit}>
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

            <div className="modalFormGroupFullPremium">
              <Input
                id="nombre_marca"
                name="nombre_marca"
                label="Nombre de la Marca"
                value={form.nombre_marca}
                onChange={handleInputChange}
                placeholder="Ej: Samsung, Apple, Xiaomi"
                disabled={guardando || readonly}
                required
                autoFocus
              />
            </div>

            <div className="modalFormGroupFullPremium">
              <TextArea
                id="descripcion_marca"
                name="descripcion_marca"
                label="Descripción"
                value={form.descripcion_marca}
                onChange={handleInputChange}
                placeholder="Descripción opcional de la marca..."
                disabled={guardando || readonly}
                rows={3}
              />
            </div>
          </form>
        </div>

        <div className="modalFooterPremium">
          {modoEdicion && puedeEliminar && (
            <button 
              type="button" 
              className={`btnPremium ${marca?.activo ? 'btnDangerPremium' : 'btnSuccessPremium'} mr-auto`} 
              onClick={() => setShowConfirmDelete(true)} 
              disabled={guardando}
            >
              <span className="material-icons">{marca?.activo ? 'visibility_off' : 'visibility'}</span>
              {marca?.activo ? 'Desactivar' : 'Reactivar'}
            </button>
          )}
          
          {!readonly && (
            <button type="submit" form="marca-form" className="btnPremium btnPrimaryPremium" disabled={guardando || (modoEdicion && !isDirty(form))}>
              <span className="material-icons">
                {guardando ? 'hourglass_empty' : 'save'}
              </span>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          )}
        </div>
      </PremiumModal>

      {/* Sub-modal Confirmar Eliminación */}
      <PremiumModal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title={marca?.activo ? '¿Desactivar marca?' : '¿Reactivar marca?'}
        icon={marca?.activo ? 'visibility_off' : 'visibility'}
        maxWidth="400px"
        titleStyle={{ color: marca?.activo ? 'var(--color-error)' : 'var(--color-success)' }}
      >
        <div className="modalBodyPremium">
          <p className={styles.deleteMessage}>
            {marca?.activo 
              ? `Estás a punto de desactivar la marca ${marca?.nombre_marca}. Los productos asociados dejarán de ser visibles.`
              : `Estás a punto de reactivar la marca ${marca?.nombre_marca}.`
            }
          </p>
        </div>
        <div className="modalFooterPremium">
          <button 
            type="button"
            className={`btnPremium ${marca?.activo ? 'btnDangerPremium' : 'btnSuccessPremium'}`} 
            onClick={handleEliminar} 
            disabled={eliminando}
          >
            <span className="material-icons">{eliminando ? 'sync' : (marca?.activo ? 'visibility_off' : 'visibility')}</span>
            {eliminando ? 'Procesando...' : (marca?.activo ? 'Sí, desactivar' : 'Sí, reactivar')}
          </button>
        </div>
      </PremiumModal>
    </>
  );
});

MarcaModal.displayName = 'MarcaModal';

export default MarcaModal;
