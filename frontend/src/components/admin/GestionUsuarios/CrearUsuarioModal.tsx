import React, { useState, useRef } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import usuarioService from '../../../services/usuarioService';
import type { RolItem } from '../../../types/usuario';
import Input from '../../common/Input/Input';
import Select from '../../common/Select/Select';
import PremiumModal from '../../common/PremiumModal/PremiumModal';
import styles from './UsuarioModals.module.css';

interface CrearUsuarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  roles: RolItem[];
}

interface CrearUsuarioFormData {
  nombres: string;
  email: string;
  password: string;
  confirmPassword: string;
  id_rol: number;
}

const INITIAL_FORM_DATA: CrearUsuarioFormData = {
  nombres: '',
  email: '',
  password: '',
  confirmPassword: '',
  id_rol: 0,
};

const CrearUsuarioModal: React.FC<CrearUsuarioModalProps> = ({ isOpen, onClose, onSuccess, roles }) => {
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState<CrearUsuarioFormData>(INITIAL_FORM_DATA);
  const [creando, setCreando] = useState(false);
  const creandoRef = useRef(false);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'id_rol' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (creandoRef.current) return;

    if (!formData.nombres || !formData.email || !formData.password || !formData.id_rol) {
      showNotification('Todos los campos son requeridos', 'error');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showNotification('Las contraseñas no coinciden', 'error');
      return;
    }

    if (formData.password.length < 6) {
      showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    try {
      creandoRef.current = true;
      setCreando(true);
      await usuarioService.crearUsuario({
        nombres: formData.nombres,
        email: formData.email,
        password: formData.password,
        id_rol: formData.id_rol,
      });

      showNotification('Usuario creado exitosamente', 'success');
      setFormData(INITIAL_FORM_DATA);
      onSuccess();
    } catch (err: any) {
      showNotification(err.message || 'Error al crear usuario', 'error');
    } finally {
      creandoRef.current = false;
      setCreando(false);
    }
  };

  const handleClose = () => {
    if (creando) return;
    setFormData(INITIAL_FORM_DATA);
    onClose();
  };

  return (
    <PremiumModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Registrar Nuevo Usuario"
      icon="person_add"
    >
      <div className="modalBodyPremium">
        <form id="crear-usuario-form" onSubmit={handleSubmit}>
          <h4 className={styles.sectionTitle}>Información de Perfil</h4>
          
          <div className="modalFormGridPremium">
            <Input
              id="nombres"
              name="nombres"
              label="Nombre Completo"
              value={formData.nombres}
              onChange={handleFormChange}
              placeholder="Ej: Juan Pérez"
              disabled={creando}
              required
              autoFocus
            />

            <Input
              id="email"
              name="email"
              type="email"
              label="Email de Acceso"
              value={formData.email}
              onChange={handleFormChange}
              placeholder="Ej: juan@tecnocel.com"
              disabled={creando}
              required
            />

            <Select
              id="id_rol"
              name="id_rol"
              label="Rol de Sistema"
              value={String(formData.id_rol)}
              onChange={handleFormChange}
              disabled={creando}
              required
              options={[
                { value: '0', label: 'Seleccionar rol...', disabled: true },
                ...roles.map(rol => ({ value: String(rol.id_rol), label: rol.rol }))
              ]}
            />

            <Input
              id="password"
              name="password"
              type="password"
              label="Contraseña"
              value={formData.password}
              onChange={handleFormChange}
              placeholder="Mínimo 6 caracteres"
              disabled={creando}
              required
              autoComplete="new-password"
            />

            <div className="modalFormGroupFullPremium">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                label="Confirmar Contraseña"
                value={formData.confirmPassword}
                onChange={handleFormChange}
                placeholder="Repite la contraseña"
                disabled={creando}
                required
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className={styles.helpText}>
            <span className="material-icons">info</span>
            <span>El usuario podrá iniciar sesión inmediatamente después de su creación.</span>
          </div>
        </form>
      </div>

      <div className="modalFooterPremium">
        <button type="submit" form="crear-usuario-form" disabled={creando} className="btnPremium btnPrimaryPremium">
          <span className="material-icons">{creando ? 'hourglass_empty' : 'person_add'}</span>
          {creando ? 'Creando...' : 'Crear Usuario'}
        </button>
      </div>
    </PremiumModal>
  );
};

export default CrearUsuarioModal;
