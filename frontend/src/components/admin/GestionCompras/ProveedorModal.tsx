import React, { memo, useState } from 'react';
import proveedorAdminService from '../../../services/proveedorAdminService';
import { createPortal } from 'react-dom';
import styles from './GestionCompras.module.css';
import type { CreateProveedorData, ProveedorListItem } from '../../../types';
import Input from '../../common/Input/Input';
import TextArea from '../../common/TextArea/TextArea';

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
    <div className="modalOverlayPremium" onClick={onClose}>
      <div className="modalPremium" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        
        <div className="modalHeaderPremium">
          <h2 className="modalTitlePremium">
            <span className="material-icons">{isEditing ? 'edit' : 'add_business'}</span>
            {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          </h2>
          <button className="closeButtonPremium" onClick={onClose} disabled={guardando}>
            <span className="material-icons">close</span>
          </button>
        </div>

        <div className="modalBodyPremium">
          {error && (
            <div style={{ color: 'var(--color-error)', background: 'rgba(var(--color-error-rgb), 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', fontWeight: 500, border: '1px solid rgba(var(--color-error-rgb), 0.2)' }}>
              <span className="material-icons" style={{ fontSize: '16px', verticalAlign: 'middle', marginRight: '8px' }}>error</span>
              {error}
            </div>
          )}

          <form id="proveedor-form" onSubmit={handleGuardar}>
            
            <span className={styles.sectionTitlePremium}>Razón Social</span>
            <div className={styles.formGroupFullPremium} style={{ marginBottom: '24px' }}>
              <Input
                id="empresa"
                name="empresa"
                label="Nombre de Empresa / Razón Social"
                value={formData.empresa}
                onChange={handleChange}
                placeholder="Ej: Distribuidora de Tecnología S.A."
                required
                autoFocus
                disabled={guardando}
              />
            </div>

            <div className={styles.formDivider} style={{ margin: '24px 0' }} />

            <span className={styles.sectionTitlePremium}>Información de Contacto</span>
            
            <div className={styles.formGridPremium}>
              <Input
                id="nombre_proveedor"
                name="nombre_proveedor"
                label="Contacto Principal"
                value={formData.nombre_proveedor}
                onChange={handleChange}
                placeholder="Nombre de la persona"
                required
                disabled={guardando}
              />
              
              <Input
                id="celular"
                name="celular"
                label="Celular / WhatsApp"
                value={formData.celular}
                onChange={handleChange}
                placeholder="Ej: 11 2233 4455"
                required
                disabled={guardando}
              />

              <Input
                id="email"
                name="email"
                type="email"
                label="Email (Opcional)"
                value={formData.email}
                onChange={handleChange}
                placeholder="ejemplo@proveedor.com"
                disabled={guardando}
              />

              <Input
                id="telefono"
                name="telefono"
                label="Teléfono Fijo (Opcional)"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="Ej: 011 4455 6677"
                disabled={guardando}
              />

              <div className={styles.formGroupFullPremium}>
                <TextArea
                  id="direccion"
                  name="direccion"
                  label="Dirección / Localización"
                  value={formData.direccion}
                  onChange={handleChange}
                  placeholder="Calle, Número, Localidad, Provincia..."
                  required
                  disabled={guardando}
                  rows={3}
                />
              </div>
            </div>
          </form>
        </div>

        <div className="modalFooterPremium">
          <button className="btnPremium btnSecondaryPremium" onClick={onClose} disabled={guardando}>
            Cancelar
          </button>
          <button 
            type="submit" 
            form="proveedor-form" 
            className="btnPremium btnPrimaryPremium" 
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
