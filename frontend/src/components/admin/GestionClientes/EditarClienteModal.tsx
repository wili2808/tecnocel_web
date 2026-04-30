import React, { useState, useEffect } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import usuarioService from '../../../services/usuarioService';
import styles from './GestionClientes.module.css';
import type { ClienteListItem } from '../../../types/usuario';

interface Props {
  cliente: ClienteListItem;
  onClose: () => void;
  /** Llamado tras guardar exitosamente para que el padre refresque la lista */
  onGuardado: () => void;
}

const EditarClienteModal: React.FC<Props> = ({ cliente, onClose, onGuardado }) => {
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

  // Cerrar con Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !guardando) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, guardando]);

  const setField = (field: string, value: string | boolean) => setForm((prev) => ({ ...prev, [field]: value }));

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
    <div
      className={styles.modalOverlay}
      onClick={(e) => {
        if (e.target === e.currentTarget && !guardando) onClose();
      }}
    >
      <div className={styles.modalPremium}>
        
        {/* Header Premium */}
        <div className={styles.modalHeaderPremium}>
          <h2 className={styles.modalTitlePremium}>
            <span className="material-icons">manage_accounts</span>
            Editar Perfil de Cliente
          </h2>
          <button className={styles.closeButtonPremium} onClick={onClose} disabled={guardando} title="Cerrar">
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Body Premium */}
        <div className={styles.modalBodyPremium}>
          <form id="edit-cliente-form" onSubmit={handleGuardar}>
            
            <span className={styles.sectionTitlePremium}>Datos Identificativos</span>
            
            <div className={styles.formGridPremium}>
              <div className={styles.formGroupPremium}>
                <label className={styles.formLabelPremium}>Nombre *</label>
                <input
                  className={styles.formInputPremium}
                  type="text"
                  value={form.nombre_cliente}
                  onChange={(e) => setField('nombre_cliente', e.target.value)}
                  disabled={guardando}
                  maxLength={100}
                  required
                />
              </div>
              <div className={styles.formGroupPremium}>
                <label className={styles.formLabelPremium}>Apellido *</label>
                <input
                  className={styles.formInputPremium}
                  type="text"
                  value={form.apellido_cliente}
                  onChange={(e) => setField('apellido_cliente', e.target.value)}
                  disabled={guardando}
                  maxLength={100}
                  required
                />
              </div>

              <div className={styles.formGroupPremium}>
                <label className={styles.formLabelPremium}>Celular / WhatsApp</label>
                <input
                  className={styles.formInputPremium}
                  type="text"
                  value={form.celular_cliente}
                  onChange={(e) => setField('celular_cliente', e.target.value)}
                  disabled={guardando}
                  maxLength={20}
                  placeholder="Ej: 11 1234-5678"
                />
              </div>
              <div className={styles.formGroupPremium}>
                <label className={styles.formLabelPremium}>NIT / CI</label>
                <input
                  className={styles.formInputPremium}
                  type="text"
                  value={form.nit_ci_cliente}
                  onChange={(e) => setField('nit_ci_cliente', e.target.value)}
                  disabled={guardando}
                  maxLength={50}
                  placeholder="Ej: 12345678"
                />
              </div>
            </div>

            <div className={styles.formDivider} style={{ margin: '24px 0' }} />

            <span className={styles.sectionTitlePremium}>Configuración de Cuenta</span>

            <div className={styles.toggleGroup}>
              <div className={styles.toggleRow} style={{ padding: '8px 0' }}>
                <div style={{ flex: 1 }}>
                  <p className={styles.toggleLabel} style={{ fontSize: '13.5px', fontWeight: 600, margin: 0 }}>Acceso Web Habilitado</p>
                  <p className={styles.toggleDesc} style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>Permitir inicio de sesión en la tienda</p>
                </div>
                <button
                  type="button"
                  className={`${styles.toggle} ${form.is_web_enabled ? styles.toggleOn : styles.toggleOff}`}
                  onClick={() => setField('is_web_enabled', !form.is_web_enabled)}
                  disabled={guardando}
                >
                  <span className={styles.toggleKnob} />
                </button>
              </div>

              <div className={styles.toggleRow} style={{ padding: '8px 0' }}>
                <div style={{ flex: 1 }}>
                  <p className={styles.toggleLabel} style={{ fontSize: '13.5px', fontWeight: 600, margin: 0 }}>Correo Verificado</p>
                  <p className={styles.toggleDesc} style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>Validación manual de identidad por email</p>
                </div>
                <button
                  type="button"
                  className={`${styles.toggle} ${form.email_verified ? styles.toggleOn : styles.toggleOff}`}
                  onClick={() => setField('email_verified', !form.email_verified)}
                  disabled={guardando}
                >
                  <span className={styles.toggleKnob} />
                </button>
              </div>
            </div>

            <div style={{ 
              marginTop: '20px', 
              padding: '12px', 
              background: 'var(--background-secondary)', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: '1px solid var(--border-color)'
            }}>
              <span className="material-icons" style={{ color: 'var(--text-muted)', fontSize: '18px' }}>lock</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Identificador de acceso: <strong>{cliente.email_cliente}</strong>
              </span>
            </div>
          </form>
        </div>

        {/* Footer Premium */}
        <div className={styles.modalFooterPremium}>
          <button className={styles.cancelButtonPremium} onClick={onClose} disabled={guardando}>
            Cancelar
          </button>
          <button 
            type="submit" 
            form="edit-cliente-form"
            className={styles.saveButtonPremium} 
            disabled={guardando}
          >
            <span className="material-icons">{guardando ? 'hourglass_empty' : 'save'}</span>
            {guardando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditarClienteModal;
