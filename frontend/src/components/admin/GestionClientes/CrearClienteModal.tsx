import React, { useState, memo } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import usuarioService from '../../../services/usuarioService';
import Input from '../../common/Input/Input';
import PremiumModal from '../../common/PremiumModal/PremiumModal';
import styles from './ClienteModals.module.css';

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

const CrearClienteModal: React.FC<Props> = memo(({ onClose, onCreado }) => {
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
    <PremiumModal
      isOpen={true}
      onClose={onClose}
      title="Registrar Nuevo Cliente"
      icon="person_add_alt"
      maxWidth="600px"
    >
      <div className="modalBodyPremium">
        <form id="create-cliente-form" onSubmit={handleSubmit}>
          <h4 className="sectionTitleWithDividerPremium">Información de Contacto</h4>
          
          <div className="modalFormGridPremium">
            <Input
              id="nombre_cliente"
              name="nombre_cliente"
              label="Nombre"
              value={form.nombre_cliente}
              onChange={handleChange}
              placeholder="Ej: Juan"
              disabled={guardando}
              required
              autoFocus
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

            <div className="modalFormGroupFullPremium">
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

          <div className={styles.infoBox}>
            <span className={`material-icons ${styles.icon}`}>info</span>
            <p className={styles.text}>
              El cliente recibirá automáticamente un **correo electrónico de activación** para establecer su contraseña y habilitar su acceso a la plataforma web.
            </p>
          </div>
        </form>
      </div>

      <div className="modalFooterPremium">
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
    </PremiumModal>
  );
});

CrearClienteModal.displayName = 'CrearClienteModal';

export default CrearClienteModal;
