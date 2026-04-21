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

  const handleGuardar = async () => {
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
      <div className={styles.modal}>
        {/* Encabezado */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <span className="material-icons">edit</span>
            Editar cliente #{cliente.id_cliente}
          </h2>
          <button className={styles.closeButton} onClick={onClose} disabled={guardando} title="Cerrar">
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Cuerpo */}
        <div className={styles.modalBody}>
          {/* Datos personales */}
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Nombre</label>
              <input
                className={styles.formInput}
                type="text"
                value={form.nombre_cliente}
                onChange={(e) => setField('nombre_cliente', e.target.value)}
                disabled={guardando}
                maxLength={100}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Apellido</label>
              <input
                className={styles.formInput}
                type="text"
                value={form.apellido_cliente}
                onChange={(e) => setField('apellido_cliente', e.target.value)}
                disabled={guardando}
                maxLength={100}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Celular <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>(opcional)</span>
              </label>
              <input
                className={styles.formInput}
                type="text"
                value={form.celular_cliente}
                onChange={(e) => setField('celular_cliente', e.target.value)}
                disabled={guardando}
                maxLength={20}
                placeholder="Ej: 11 1234-5678"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                NIT/CI <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>(opcional)</span>
              </label>
              <input
                className={styles.formInput}
                type="text"
                value={form.nit_ci_cliente}
                onChange={(e) => setField('nit_ci_cliente', e.target.value)}
                disabled={guardando}
                maxLength={50}
                placeholder="Ej: 12345678"
              />
            </div>
          </div>

          <div className={styles.formDivider} />

          {/* Toggles de estado */}
          <div className={styles.toggleGroup}>
            <div className={styles.toggleRow}>
              <div>
                <p className={styles.toggleLabel}>Cuenta habilitada</p>
                <p className={styles.toggleDesc}>Permite al cliente iniciar sesión en la plataforma web</p>
              </div>
              <button
                type="button"
                className={`${styles.toggle} ${form.is_web_enabled ? styles.toggleOn : styles.toggleOff}`}
                onClick={() => setField('is_web_enabled', !form.is_web_enabled)}
                disabled={guardando}
                aria-label="Alternar cuenta habilitada"
              >
                <span className={styles.toggleKnob} />
              </button>
            </div>
            <div className={styles.toggleRow}>
              <div>
                <p className={styles.toggleLabel}>Email verificado</p>
                <p className={styles.toggleDesc}>Marca el email como verificado de forma manual</p>
              </div>
              <button
                type="button"
                className={`${styles.toggle} ${form.email_verified ? styles.toggleOn : styles.toggleOff}`}
                onClick={() => setField('email_verified', !form.email_verified)}
                disabled={guardando}
                aria-label="Alternar email verificado"
              >
                <span className={styles.toggleKnob} />
              </button>
            </div>
          </div>

          {/* Info: email no editable */}
          <p className={styles.emailReadonly}>
            <span className="material-icons">lock</span>
            El email no puede modificarse desde aquí: {cliente.email_cliente}
          </p>
        </div>

        {/* Pie */}
        <div className={styles.modalFooter}>
          <button className={styles.saveButton} onClick={handleGuardar} disabled={guardando}>
            <span className="material-icons">save</span>
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <button className={styles.cancelButton} onClick={onClose} disabled={guardando}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditarClienteModal;
