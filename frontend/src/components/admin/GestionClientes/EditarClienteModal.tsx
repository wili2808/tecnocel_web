import React, { useState, memo } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import usuarioService from '../../../services/usuarioService';
import type { ClienteListItem } from '../../../types/usuario';
import Input from '../../common/Input/Input';
import PremiumModal from '../../common/PremiumModal/PremiumModal';
import styles from './ClienteModals.module.css';

interface Props {
  cliente: ClienteListItem;
  onClose: () => void;
  /** Llamado tras guardar exitosamente para que el padre refresque la lista */
  onGuardado: () => void;
}

const EditarClienteModal: React.FC<Props> = memo(({ cliente, onClose, onGuardado }) => {
  const { showNotification } = useNotification();
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    nombre_cliente: cliente.nombre_cliente,
    apellido_cliente: cliente.apellido_cliente,
    celular_cliente: cliente.celular_cliente || '',
    nit_ci_cliente: cliente.nit_ci_cliente || '',
    is_web_enabled: cliente.is_web_enabled,
    email_verified: cliente.email_verified,
  });

  const setField = (field: string, value: string | boolean) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setField(name, value);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardando) return;
    if (!form.nombre_cliente.trim() || !form.apellido_cliente.trim()) {
      showNotification('El nombre y apellido son obligatorios', 'error');
      return;
    }
    setGuardando(true);
    try {
      await usuarioService.actualizarCliente(cliente.id_cliente, {
        nombre_cliente: form.nombre_cliente.trim(),
        apellido_cliente: form.apellido_cliente.trim(),
        celular_cliente: form.celular_cliente.trim() || undefined,
        nit_ci_cliente: form.nit_ci_cliente.trim() || undefined,
        is_web_enabled: form.is_web_enabled,
        email_verified: form.email_verified,
      });
      showNotification('Cliente actualizado exitosamente', 'success');
      onGuardado();
      onClose();
    } catch (err: any) {
      showNotification(err.message || 'Error al actualizar el cliente', 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <PremiumModal
      isOpen={true}
      onClose={onClose}
      title="Editar Perfil de Cliente"
      icon="manage_accounts"
    >
      <div className="modalBodyPremium">
        <form id="edit-cliente-form" onSubmit={handleGuardar}>
          
          <h4 className="sectionTitleWithDividerPremium">Datos Identificativos</h4>
          
          <div className="modalFormGridPremium">
            <Input
              id="nombre_cliente"
              name="nombre_cliente"
              label="Nombre"
              value={form.nombre_cliente}
              onChange={handleInputChange}
              disabled={guardando}
              maxLength={100}
              required
              autoFocus
            />
            <Input
              id="apellido_cliente"
              name="apellido_cliente"
              label="Apellido"
              value={form.apellido_cliente}
              onChange={handleInputChange}
              disabled={guardando}
              maxLength={100}
              required
            />

            <Input
              id="celular_cliente"
              name="celular_cliente"
              label="Celular / WhatsApp"
              value={form.celular_cliente}
              onChange={handleInputChange}
              disabled={guardando}
              maxLength={20}
              placeholder="Ej: 11 1234-5678"
            />
            <Input
              id="nit_ci_cliente"
              name="nit_ci_cliente"
              label="DNI / CUIT"
              value={form.nit_ci_cliente}
              onChange={handleInputChange}
              disabled={guardando}
              maxLength={50}
              placeholder="Ej: 12345678"
            />
          </div>

          <h4 className="sectionTitleWithDividerPremium mt-8">Configuración de Cuenta</h4>

          <div className={styles.toggleGroup}>
            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleLabel}>Acceso Web Habilitado</span>
                <span className={styles.toggleDesc}>Permitir inicio de sesión en la tienda</span>
              </div>
              <button
                type="button"
                className={`${styles.toggle} ${form.is_web_enabled ? styles.toggleOn : ''}`}
                onClick={() => setField('is_web_enabled', !form.is_web_enabled)}
                disabled={guardando}
              >
                <span className={styles.toggleKnob} />
              </button>
            </div>

            <div className={styles.toggleRow}>
              <div className={styles.toggleInfo}>
                <span className={styles.toggleLabel}>Correo Verificado</span>
                <span className={styles.toggleDesc}>Validación manual de identidad por email</span>
              </div>
              <button
                type="button"
                className={`${styles.toggle} ${form.email_verified ? styles.toggleOn : ''}`}
                onClick={() => setField('email_verified', !form.email_verified)}
                disabled={guardando}
              >
                <span className={styles.toggleKnob} />
              </button>
            </div>
          </div>

          <div className={styles.infoBox}>
            <span className={`material-icons ${styles.icon}`}>lock</span>
            <p className={styles.text}>
              Identificador de acceso: <strong>{cliente.email_cliente}</strong>
            </p>
          </div>
        </form>
      </div>

      <div className="modalFooterPremium">
        <button className="btnPremium btnSecondaryPremium" onClick={onClose} disabled={guardando}>
          Cancelar
        </button>
        <button 
          type="submit" 
          form="edit-cliente-form"
          className="btnPremium btnPrimaryPremium" 
          disabled={guardando}
        >
          <span className="material-icons">{guardando ? 'hourglass_empty' : 'save'}</span>
          {guardando ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </PremiumModal>
  );
});

EditarClienteModal.displayName = 'EditarClienteModal';

export default EditarClienteModal;
