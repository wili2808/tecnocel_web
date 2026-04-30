import React, { useState, useEffect } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import { useAuth } from '../../../contexts/AuthContext';
import adminProductService from '../../../services/adminProductService';
import type { Marca } from '../../../types/product';
import styles from './GestionProductos.module.css';
import Input from '../../common/Input/Input';
import TextArea from '../../common/TextArea/TextArea';

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
    <div className={styles.modalOverlayPremium} onClick={onClose}>
      <div className={styles.modalPremium} style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeaderPremium}>
          <h3 className={styles.modalTitlePremium}>
            <span className="material-icons">{modoEdicion ? 'edit' : 'add_circle'}</span>
            {modoEdicion ? 'Editar Marca' : 'Nueva Marca'}
          </h3>
          <button className={styles.closeButtonPremium} onClick={onClose} disabled={guardando || eliminando}>
            <span className="material-icons">close</span>
          </button>
        </div>

        {showConfirmDelete ? (
          <div className={styles.modalBodyPremium}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <span className="material-icons" style={{ fontSize: 48, color: 'var(--color-error)', marginBottom: 16 }}>
                warning
              </span>
              <h4 style={{ margin: '0 0 8px', fontSize: 18 }}>¿Eliminar marca?</h4>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                Estás a punto de eliminar <strong>{marca?.nombre_marca}</strong>. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className={styles.modalFooterPremium}>
              <button 
                type="button"
                className={`${styles.btnPremium} ${styles.btnSecondaryPremium}`} 
                onClick={() => setShowConfirmDelete(false)} 
                disabled={eliminando}
              >
                Cancelar
              </button>
              <button 
                type="button"
                className={`${styles.btnPremium} ${styles.btnDangerSolidPremium}`} 
                onClick={handleEliminar} 
                disabled={eliminando}
              >
                {eliminando ? 'Eliminando...' : 'Sí, eliminar marca'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.modalBodyPremium}>
              <div className={styles.logoUploadContainer} style={{ marginBottom: '24px' }}>
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

              <Input
                id="nombre_marca"
                name="nombre_marca"
                label="Nombre de la Marca"
                value={form.nombre_marca}
                onChange={handleInputChange}
                placeholder="Ej: Samsung, Apple, Xiaomi"
                disabled={guardando || readonly}
                required
              />

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

            <div className={styles.modalFooterPremium}>
              {modoEdicion && puedeEliminar && (
                <button 
                  type="button" 
                  className={`${styles.btnPremium} ${styles.btnDangerPremium}`} 
                  style={{ marginRight: 'auto' }}
                  onClick={() => setShowConfirmDelete(true)} 
                  disabled={guardando}
                >
                  <span className="material-icons" style={{ fontSize: 18 }}>delete</span>
                  Eliminar
                </button>
              )}
              
              <button type="button" className={`${styles.btnPremium} ${styles.btnSecondaryPremium}`} onClick={onClose} disabled={guardando}>
                Cancelar
              </button>
              {!readonly && (
                <button type="submit" className={`${styles.btnPremium} ${styles.btnPrimaryPremium}`} disabled={guardando}>
                  <span className="material-icons" style={{ fontSize: 18 }}>
                    {guardando ? 'hourglass_empty' : 'save'}
                  </span>
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default MarcaModal;
