import React, { useState, useEffect, useRef } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import usuarioService from '../../../services/usuarioService';
import type { UsuarioListItem, RolItem, ActualizarUsuarioData } from '../../../types/usuario';
import Input from '../../common/Input/Input';
import Select from '../../common/Select/Select';
import PremiumModal from '../../common/PremiumModal/PremiumModal';
import styles from './UsuarioModals.module.css';

interface EditarUsuarioModalProps {
  usuario: UsuarioListItem | null;
  onClose: () => void;
  onSuccess: () => void;
  onDelete: (id: number, nombre: string) => void;
  roles: RolItem[];
  puedeEliminar: boolean;
}

interface EditarUsuarioFormData {
  nombres: string;
  email: string;
  id_rol: number;
  password: string;
  confirmPassword: string;
}

const INITIAL_EDIT_FORM: EditarUsuarioFormData = {
  nombres: '',
  email: '',
  id_rol: 0,
  password: '',
  confirmPassword: '',
};

const EditarUsuarioModal: React.FC<EditarUsuarioModalProps> = ({ 
  usuario, 
  onClose, 
  onSuccess, 
  onDelete,
  roles,
  puedeEliminar
}) => {
  const { showNotification } = useNotification();
  const [formData, setFormData] = useState<EditarUsuarioFormData>(INITIAL_EDIT_FORM);
  const [editando, setEditando] = useState(false);
  const editandoRef = useRef(false);

  useEffect(() => {
    if (usuario) {
      setFormData({
        nombres: usuario.nombres,
        email: usuario.email,
        id_rol: usuario.id_rol,
        password: '',
        confirmPassword: '',
      });
    }
  }, [usuario]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'id_rol' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editandoRef.current || !usuario) return;

    if (!formData.nombres || !formData.email || !formData.id_rol) {
      showNotification('Nombre, email y rol son requeridos', 'error');
      return;
    }

    if (formData.password) {
      if (formData.password.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        showNotification('Las contraseñas no coinciden', 'error');
        return;
      }
    }

    const dataToSend: ActualizarUsuarioData = {};
    if (formData.nombres !== usuario.nombres) dataToSend.nombres = formData.nombres;
    if (formData.email !== usuario.email) dataToSend.email = formData.email;
    if (formData.id_rol !== usuario.id_rol) dataToSend.id_rol = formData.id_rol;
    if (formData.password) dataToSend.password = formData.password;

    if (Object.keys(dataToSend).length === 0) {
      showNotification('No hay cambios para guardar', 'info');
      return;
    }

    try {
      editandoRef.current = true;
      setEditando(true);
      await usuarioService.actualizarUsuario(usuario.id_usuario, dataToSend);

      showNotification('Usuario actualizado exitosamente', 'success');
      onSuccess();
    } catch (err: any) {
      showNotification(err.message || 'Error al actualizar usuario', 'error');
    } finally {
      editandoRef.current = false;
      setEditando(false);
    }
  };

  const handleClose = () => {
    if (editando) return;
    onClose();
  };

  return (
    <PremiumModal
      isOpen={!!usuario}
      onClose={handleClose}
      title={usuario ? `Editar Usuario: ${usuario.nombres}` : 'Editar Usuario'}
      icon="manage_accounts"
    >
      {usuario && (
        <form id="editar-usuario-form" onSubmit={handleSubmit}>
          <div className="modalBodyPremium">
            <h4 className={styles.sectionTitle}>Información del Empleado</h4>
            
            <div className="modalFormGridPremium">
              <Input
                id="edit_nombres"
                name="nombres"
                label="Nombre Completo"
                value={formData.nombres}
                onChange={handleFormChange}
                placeholder="Ej: Juan Pérez"
                disabled={editando}
                required
              />

              <Input
                id="edit_email"
                name="email"
                type="email"
                label="Email de Acceso"
                value={formData.email}
                onChange={handleFormChange}
                placeholder="Ej: juan@tecnocel.com"
                disabled={editando}
                required
              />

              <Select
                id="edit_id_rol"
                name="id_rol"
                label="Rol Actual"
                value={String(formData.id_rol)}
                onChange={handleFormChange}
                disabled={editando}
                required
                options={[
                  { value: '0', label: 'Seleccionar rol...', disabled: true },
                  ...roles.map(rol => ({ value: String(rol.id_rol), label: rol.rol }))
                ]}
              />

              <Input
                id="edit_password"
                name="password"
                type="password"
                label="Cambiar Contraseña"
                value={formData.password}
                onChange={handleFormChange}
                placeholder="Dejar vacío para mantener"
                disabled={editando}
                autoComplete="new-password"
              />

              {formData.password && (
                <div className="modalFormGroupFullPremium">
                  <Input
                    id="edit_confirmPassword"
                    name="confirmPassword"
                    type="password"
                    label="Confirmar Nueva Contraseña"
                    value={formData.confirmPassword}
                    onChange={handleFormChange}
                    placeholder="Repite la nueva contraseña"
                    disabled={editando}
                    autoComplete="new-password"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="modalFooterPremium">
            {puedeEliminar && usuario.id_usuario !== 1 && (
              <button
                type="button"
                onClick={() => onDelete(usuario.id_usuario, usuario.nombres)}
                className="btnPremium btnDangerPremium mr-auto"
                title="Eliminar usuario"
                disabled={editando}
              >
                <span className="material-icons">delete</span>
                Eliminar
              </button>
            )}
            <button type="button" onClick={handleClose} className="btnPremium btnSecondaryPremium" disabled={editando}>
              Cancelar
            </button>
            <button type="submit" form="editar-usuario-form" disabled={editando} className="btnPremium btnPrimaryPremium">
              <span className="material-icons">{editando ? 'hourglass_empty' : 'save'}</span>
              {editando ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      )}
    </PremiumModal>
  );
};

export default EditarUsuarioModal;
