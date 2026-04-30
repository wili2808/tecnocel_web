import React, { useState } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import usuarioService from '../../../services/usuarioService';
import styles from './GestionClientes.module.css';
import Input from '../../common/Input/Input';

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
    setForm((prev) => ({ ...prev, [name]: value }));
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
    <div className="modalOverlayPremium" onClick={onClose}>
      <div className="modalPremium" onClick={(e) => e.stopPropagation()}>
        
        {/* Header Premium */}
        <div className="modalHeaderPremium">
          <h2 className="modalTitlePremium">
            <span className="material-icons">person_add_alt</span>
            Registrar Nuevo Cliente
          </h2>
          <button className="closeButtonPremium" onClick={onClose} disabled={guardando}>
            <span className="material-icons">close</span>
          </button>
        </div>

        <form id="create-cliente-form" onSubmit={handleSubmit}>
          <div className="modalBodyPremium">
            
            <span className={styles.sectionTitlePremium}>Información de Contacto</span>
            
            <div className={styles.formGridPremium}>
              <Input
                id="nombre_cliente"
                name="nombre_cliente"
                label="Nombre"
                value={form.nombre_cliente}
                onChange={handleChange}
                placeholder="Ej: Juan"
                disabled={guardando}
                required
              />
              <Input
                id="apellido_cliente"
                name="apellido_cliente"
                label="Apellido"
                value={form.apellido_cliente}
                onChange={handleChange}
                placeholder="Ej: Pérez"
                disabled={guardando}
                required
              />

              <div className={styles.formGroupFullPremium}>
                <Input
                  id="email_cliente"
                  name="email_cliente"
                  label="Correo Electrónico"
                  type="email"
                  value={form.email_cliente}
                  onChange={handleChange}
                  placeholder="juan@ejemplo.com"
                  disabled={guardando}
                  required
                />
              </div>

              <Input
                id="celular_cliente"
                name="celular_cliente"
                label="Celular"
                value={form.celular_cliente}
                onChange={handleChange}
                placeholder="Ej: 3512345678"
                disabled={guardando}
              />
              <Input
                id="nit_ci_cliente"
                name="nit_ci_cliente"
                label="DNI / CUIT"
                value={form.nit_ci_cliente}
                onChange={handleChange}
                placeholder="Ej: 12345678"
                disabled={guardando}
              />
            </div>

            <div style={{ 
              marginTop: '24px', 
              padding: '16px', 
              background: 'var(--color-primary-50)', 
              borderRadius: '12px',
              display: 'flex',
              gap: '12px',
              border: '1px solid var(--color-primary-100)'
            }}>
              <span className="material-icons" style={{ color: 'var(--color-primary)', fontSize: '22px' }}>info</span>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                El cliente recibirá automáticamente un **correo electrónico de activación** para establecer su contraseña y habilitar su acceso a la plataforma web.
              </p>
            </div>
          </div>
        </form>

        {/* Footer Premium */}
        <div className="modalFooterPremium">
          <button type="button" className="btnPremium btnSecondaryPremium" onClick={onClose} disabled={guardando}>
            Cancelar
          </button>
          <button 
            type="submit" 
            form="create-cliente-form"
            className="btnPremium btnPrimaryPremium" 
            disabled={guardando}
          >
            <span className="material-icons">
              {guardando ? 'hourglass_empty' : 'send'}
            </span>
            {guardando ? 'Creando...' : 'Crear y Enviar Invitación'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CrearClienteModal;
