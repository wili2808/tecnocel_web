import React, { memo, useState, useEffect } from 'react';
import proveedorAdminService from '../../../services/proveedorAdminService';
import type { CreateProveedorData, ProveedorListItem } from '../../../types';
import Input from '../../common/Input/Input';
import TextArea from '../../common/TextArea/TextArea';
import PremiumModal from '../../common/PremiumModal/PremiumModal';
import { useFormDirty } from '../../../hooks/useFormDirty';
import styles from './CompraModals.module.css';

interface ProveedorModalProps {
  isOpen?: boolean;
  proveedor?: ProveedorListItem;
  onClose: () => void;
  onGuardado: (proveedor: ProveedorListItem) => void;
}

const ProveedorModal: React.FC<ProveedorModalProps> = memo(({ isOpen = true, proveedor, onClose, onGuardado }) => {
  const { setInitialValues, isDirty } = useFormDirty<CreateProveedorData & { id_proveedor?: number }>();

  const [formData, setFormData] = useState<CreateProveedorData & { id_proveedor?: number }>({
    nombre_proveedor: proveedor?.nombre_proveedor || '',
    empresa: proveedor?.empresa || '',
    celular: proveedor?.celular || '',
    telefono: proveedor?.telefono || '',
    email: proveedor?.email || '',
    direccion: proveedor?.direccion || '',
    id_proveedor: proveedor?.id_proveedor,
  });

  useEffect(() => {
    const vals = {
      nombre_proveedor: proveedor?.nombre_proveedor || '',
      empresa: proveedor?.empresa || '',
      celular: proveedor?.celular || '',
      telefono: proveedor?.telefono || '',
      email: proveedor?.email || '',
      direccion: proveedor?.direccion || '',
      id_proveedor: proveedor?.id_proveedor,
    };
    setFormData(vals);
    setInitialValues(vals);
  }, [proveedor]);

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

  return (
    <PremiumModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
      icon={isEditing ? 'edit' : 'add_business'}
      maxWidth="600px"
    >
      <div className={`modalBodyPremium ${styles.modalBodyContent}`}>
        {error && (
          <div className="modalAlertErrorPremium mb-4">
            <span className="material-icons">error</span>
            {error}
          </div>
        )}

        <form id="proveedor-form" onSubmit={handleGuardar}>
          
          <h4 className={styles.sectionTitle}>Razón Social</h4>
          <div className="modalFormGridPremium" style={{ gridTemplateColumns: '1fr' }}>
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

          <h4 className={`${styles.sectionTitle} mt-8`}>Información de Contacto</h4>
          <div className="modalFormGridPremium">
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

              <div className="modalFormGroupFullPremium">
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
        <button 
          type="submit" 
          form="proveedor-form" 
          className="btnPremium btnPrimaryPremium" 
          disabled={guardando || (isEditing && !isDirty(formData))}
        >
          <span className="material-icons">{guardando ? 'hourglass_empty' : 'save'}</span>
          {guardando ? 'Guardando...' : isEditing ? 'Actualizar Proveedor' : 'Crear Proveedor'}
        </button>
      </div>
    </PremiumModal>
  );
});

ProveedorModal.displayName = 'ProveedorModal';

export default ProveedorModal;
