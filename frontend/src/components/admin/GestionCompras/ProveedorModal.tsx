import React, { memo, useState } from 'react';
import proveedorAdminService from '../../../services/proveedorAdminService';
import { createPortal } from 'react-dom';
import styles from './GestionCompras.module.css';
import type { CreateProveedorData, ProveedorListItem } from '../../../types';

interface ProveedorModalProps {
  proveedor?: ProveedorListItem;
  onClose: () => void;
  onGuardado: (proveedor: ProveedorListItem) => void;
}

const ProveedorModal: React.FC<ProveedorModalProps> = memo(({ proveedor, onClose, onGuardado }) => {
  const [formData, setFormData] = useState<CreateProveedorData & { id_proveedor?: number }>({
    nombre_proveedor: proveedor?.nombre_proveedor || '',
    empresa: proveedor?.empresa || '',
    celular: proveedor?.celular || '',
    telefono: proveedor?.telefono || '',
    email: proveedor?.email || '',
    direccion: proveedor?.direccion || '',
    id_proveedor: proveedor?.id_proveedor,
  });

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.nombre_proveedor.trim()) {
      setError('El nombre del proveedor es requerido');
      return;
    }
    if (!formData.empresa.trim()) {
      setError('El nombre de empresa es requerido');
      return;
    }
    if (!formData.celular.trim()) {
      setError('El celular es requerido');
      return;
    }
    if (!formData.direccion.trim()) {
      setError('La dirección es requerida');
      return;
    }

    setGuardando(true);

    try {
      let response;
      if (proveedor) {
        response = await proveedorAdminService.actualizarProveedor(proveedor.id_proveedor, formData);
      } else {
        response = await proveedorAdminService.crearProveedor(formData);
      }

      onGuardado(response.data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar proveedor');
    } finally {
      setGuardando(false);
    }
  };

  const isEditing = !!proveedor;

  const modalContent = (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalPremium} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        
        {/* Header Premium */}
        <div className={styles.modalHeaderPremium}>
          <h2 className={styles.modalTitlePremium}>
            <span className="material-icons">{isEditing ? 'edit' : 'add_business'}</span>
            {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          </h2>
          <button className={styles.closeButtonPremium} onClick={onClose} disabled={guardando}>
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Body Premium */}
        <div className={styles.modalBodyPremium}>
          {error && (
            <div style={{ color: 'var(--color-error)', background: 'var(--color-error-100)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', fontWeight: 500, border: '1px solid var(--color-error-200)' }}>
              <span className="material-icons" style={{ fontSize: '16px', verticalAlign: 'middle', marginRight: '8px' }}>error</span>
              {error}
            </div>
          )}

          <form id="proveedor-form" onSubmit={handleGuardar}>
            
            <span className={styles.sectionTitlePremium}>Razón Social</span>
            <div className={styles.formGroupFullPremium} style={{ marginBottom: '24px' }}>
              <label className={styles.formLabelPremium}>Nombre de Empresa / Razón Social *</label>
              <input
                type="text"
                name="empresa"
                value={formData.empresa}
                onChange={handleChange}
                placeholder="Ej: Distribuidora de Tecnología S.A."
                className={styles.formInputPremium}
                style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary)' }}
                required
                autoFocus
              />
            </div>

            <div className={styles.formDivider} style={{ margin: '24px 0' }} />

            <span className={styles.sectionTitlePremium}>Información de Contacto</span>
            
            <div className={styles.formGridPremium}>
              <div className={styles.formGroupPremium}>
                <label className={styles.formLabelPremium}>Contacto Principal *</label>
                <input
                  type="text"
                  name="nombre_proveedor"
                  value={formData.nombre_proveedor}
                  onChange={handleChange}
                  placeholder="Nombre de la persona"
                  className={styles.formInputPremium}
                  required
                />
              </div>
              
              <div className={styles.formGroupPremium}>
                <label className={styles.formLabelPremium}>Celular / WhatsApp *</label>
                <input
                  type="text"
                  name="celular"
                  value={formData.celular}
                  onChange={handleChange}
                  placeholder="Ej: 11 2233 4455"
                  className={styles.formInputPremium}
                  required
                />
              </div>

              <div className={styles.formGroupPremium}>
                <label className={styles.formLabelPremium}>Email (Opcional)</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ejemplo@proveedor.com"
                  className={styles.formInputPremium}
                />
              </div>

              <div className={styles.formGroupPremium}>
                <label className={styles.formLabelPremium}>Teléfono Fijo (Opcional)</label>
                <input
                  type="text"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="Ej: 011 4455 6677"
                  className={styles.formInputPremium}
                />
              </div>

              <div className={styles.formGroupFullPremium}>
                <label className={styles.formLabelPremium}>Dirección / Localización *</label>
                <textarea
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  placeholder="Calle, Número, Localidad, Provincia..."
                  className={styles.formInputPremium}
                  style={{ minHeight: '80px', resize: 'vertical' }}
                  required
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer Premium */}
        <div className={styles.modalFooterPremium}>
          <button className={`${styles.btnPremium} ${styles.btnSecondaryPremium}`} onClick={onClose} disabled={guardando}>
            Cancelar
          </button>
          <button 
            type="submit" 
            form="proveedor-form" 
            className={`${styles.btnPremium} ${styles.btnPrimaryPremium}`} 
            disabled={guardando}
          >
            <span className="material-icons">{guardando ? 'hourglass_empty' : 'save'}</span>
            {guardando ? 'Guardando...' : isEditing ? 'Actualizar Proveedor' : 'Crear Proveedor'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
});

export default ProveedorModal;
