import React, { useState } from 'react';
import styles from './GestionClientes.module.css';
import { useNotification } from '../../../contexts/NotificationContext';
import { usuarioService } from '../../../services/usuarioService';

interface Props {
  onClose: () => void;
  onCreado: () => void;
}

const INITIAL = {
  nombre_cliente: '',
  apellido_cliente: '',
  email_cliente: '',
  celular_cliente: '',
  nit_ci_cliente: '',
};

const CrearClienteModal: React.FC<Props> = ({ onClose, onCreado }) => {
  const { showNotification } = useNotification();
  const [form, setForm] = useState(INITIAL);
  const [guardando, setGuardando] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardando) return;

    if (!form.nombre_cliente.trim() || !form.apellido_cliente.trim() || !form.email_cliente.trim()) {
      showNotification('Nombre, apellido y email son obligatorios', 'error');
      return;
    }

    setGuardando(true);
    try {
      await usuarioService.crearCliente({
        nombre_cliente: form.nombre_cliente.trim(),
        apellido_cliente: form.apellido_cliente.trim(),
        email_cliente: form.email_cliente.trim(),
        celular_cliente: form.celular_cliente.trim() || undefined,
        nit_ci_cliente: form.nit_ci_cliente.trim() || undefined,
      });
      showNotification('Cliente creado. Se envió el email de activación.', 'success');
      onCreado();
      onClose();
    } catch (err: any) {
      showNotification(err.message || 'Error al crear el cliente', 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            <span className="material-icons">person_add</span>
            Crear Cliente
          </h3>
          <button className={styles.closeButton} onClick={onClose} disabled={guardando}>
            <span className="material-icons">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Nombre <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <input
                    className={styles.formInput}
                    name="nombre_cliente"
                    value={form.nombre_cliente}
                    onChange={handleChange}
                    placeholder="Juan"
                    disabled={guardando}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Apellido <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <input
                    className={styles.formInput}
                    name="apellido_cliente"
                    value={form.apellido_cliente}
                    onChange={handleChange}
                    placeholder="Pérez"
                    disabled={guardando}
                    required
                  />
                </div>
              </div>
              <div className={styles.formGroup} style={{ marginBottom: 14 }}>
                <label className={styles.formLabel}>
                  Email <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <input
                  className={styles.formInput}
                  type="email"
                  name="email_cliente"
                  value={form.email_cliente}
                  onChange={handleChange}
                  placeholder="juan@ejemplo.com"
                  disabled={guardando}
                  required
                />
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Celular</label>
                  <input
                    className={styles.formInput}
                    name="celular_cliente"
                    value={form.celular_cliente}
                    onChange={handleChange}
                    placeholder="Ej: 3512345678"
                    disabled={guardando}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>DNI / CUIT</label>
                  <input
                    className={styles.formInput}
                    name="nit_ci_cliente"
                    value={form.nit_ci_cliente}
                    onChange={handleChange}
                    placeholder="Ej: 12345678"
                    disabled={guardando}
                  />
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '12px 0 0', lineHeight: 1.5 }}>
                <span className="material-icons" style={{ fontSize: 14, verticalAlign: 'text-bottom', marginRight: 4 }}>info</span>
                El cliente recibirá un email para activar su cuenta y establecer su propia contraseña.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.cancelButton} onClick={onClose} disabled={guardando}>
                Cancelar
              </button>
              <button type="submit" className={styles.saveButton} disabled={guardando}>
                <span className="material-icons" style={{ fontSize: 16 }}>
                  {guardando ? 'hourglass_empty' : 'person_add'}
                </span>
                {guardando ? 'Creando...' : 'Crear y enviar email'}
              </button>
            </div>
          </form>
      </div>
    </div>
  );
};

export default CrearClienteModal;
