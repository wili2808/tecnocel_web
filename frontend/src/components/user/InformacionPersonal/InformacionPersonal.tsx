/**
 * Componente InformacionPersonal - Formulario editable para datos personales del usuario
 * Permite actualizar nombre, apellido, celular y NIT/CI
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import clienteService from '../../../services/clienteService';
import LoadingSpinner from '../../common/LoadingSpinner';
import styles from './InformacionPersonal.module.css';
import type { Cliente } from '../../../types/cliente';
import Input from '../../common/Input/Input';

interface DatosPersonales {
  nombre_cliente: string;
  apellido_cliente: string;
  celular_cliente: string;
  nit_ci_cliente: string;
}

const InformacionPersonal = () => {
  const { user } = useAuth();
  const clienteUser = user as Cliente;
  const { showNotification } = useNotification();
  const [guardando, setGuardando] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState<DatosPersonales>({
    nombre_cliente: clienteUser?.nombre || '',
    apellido_cliente: clienteUser?.apellido || '',
    celular_cliente: clienteUser?.celular || '',
    nit_ci_cliente: clienteUser?.nitCi || '',
  });

  const [errors, setErrors] = useState<Partial<DatosPersonales>>({});

  // Sincronizar formData cuando el usuario se actualice en el contexto
  useEffect(() => {
    if (clienteUser) {
      setFormData({
        nombre_cliente: clienteUser.nombre || '',
        apellido_cliente: clienteUser.apellido || '',
        celular_cliente: clienteUser.celular || '',
        nit_ci_cliente: clienteUser.nitCi || '',
      });
    }
  }, [clienteUser]);

  // Detectar cambios
  useEffect(() => {
    const hasChanged =
      formData.nombre_cliente !== (clienteUser?.nombre || '') ||
      formData.apellido_cliente !== (clienteUser?.apellido || '') ||
      formData.celular_cliente !== (clienteUser?.celular || '') ||
      formData.nit_ci_cliente !== (clienteUser?.nitCi || '');

    setHasChanges(hasChanged);
  }, [formData, clienteUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: DatosPersonales) => ({ ...prev, [name]: value }));

    // Limpiar error del campo
    if (errors[name as keyof DatosPersonales]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validarFormulario = (): boolean => {
    const newErrors: Partial<DatosPersonales> = {};

    if (!formData.nombre_cliente.trim()) {
      newErrors.nombre_cliente = 'El nombre es requerido';
    } else if (formData.nombre_cliente.length < 2) {
      newErrors.nombre_cliente = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.apellido_cliente.trim()) {
      newErrors.apellido_cliente = 'El apellido es requerido';
    } else if (formData.apellido_cliente.length < 2) {
      newErrors.apellido_cliente = 'El apellido debe tener al menos 2 caracteres';
    }

    if (formData.celular_cliente && !/^\d{8,15}$/.test(formData.celular_cliente)) {
      newErrors.celular_cliente = 'Celular debe ser un número válido (8-15 dígitos)';
    }

    if (formData.nit_ci_cliente && formData.nit_ci_cliente.length < 5) {
      newErrors.nit_ci_cliente = 'NIT/CI debe tener al menos 5 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) {
      showNotification('Por favor corrige los errores en el formulario', 'error');
      return;
    }

    try {
      setGuardando(true);
      await clienteService.actualizarPerfil(formData);

      // Actualizar localStorage con los nuevos datos
      const userFromStorage = localStorage.getItem('auth_user');
      if (userFromStorage) {
        const currentUser = JSON.parse(userFromStorage);
        const updatedUser = {
          ...currentUser,
          ...formData,
        };
        localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      }

      setHasChanges(false);
      showNotification('Información actualizada correctamente', 'success');

      // Recargar la página para sincronizar con el contexto
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      showNotification(error.response?.data?.error || 'Error al actualizar información', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      nombre_cliente: clienteUser?.nombre || '',
      apellido_cliente: clienteUser?.apellido || '',
      celular_cliente: clienteUser?.celular || '',
      nit_ci_cliente: clienteUser?.nitCi || '',
    });
    setErrors({});
    setHasChanges(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Información Personal</h2>
        <p className={styles.subtitle}>Actualiza tus datos personales</p>
      </div>

      {hasChanges && (
        <div className={styles.warningBox}>
          <span className="material-icons">warning</span>
          <p>Tienes cambios sin guardar</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          {/* Nombre */}
          <Input
            id="nombre_cliente"
            name="nombre_cliente"
            label="Nombre"
            icon="person"
            value={formData.nombre_cliente}
            onChange={handleChange}
            error={errors.nombre_cliente}
            required
            disabled={guardando}
            placeholder="Ingresa tu nombre"
          />

          {/* Apellido */}
          <Input
            id="apellido_cliente"
            name="apellido_cliente"
            label="Apellido"
            icon="person_outline"
            value={formData.apellido_cliente}
            onChange={handleChange}
            error={errors.apellido_cliente}
            required
            disabled={guardando}
            placeholder="Ingresa tu apellido"
          />

          {/* Celular */}
          <Input
            id="celular_cliente"
            name="celular_cliente"
            type="tel"
            label="Celular"
            icon="phone"
            value={formData.celular_cliente}
            onChange={handleChange}
            error={errors.celular_cliente}
            disabled={guardando}
            placeholder="Ej: 70123456"
          />

          {/* NIT/CI */}
          <Input
            id="nit_ci_cliente"
            name="nit_ci_cliente"
            label="NIT/CI"
            icon="badge"
            value={formData.nit_ci_cliente}
            onChange={handleChange}
            error={errors.nit_ci_cliente}
            disabled={guardando}
            placeholder="Ingresa tu NIT o CI"
          />
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleCancel}
            className={styles.btnSecondary}
            disabled={!hasChanges || guardando}
          >
            <span className="material-icons">close</span>
            Cancelar
          </button>
          <button type="submit" className={styles.btnPrimary} disabled={!hasChanges || guardando}>
            {guardando ? (
              <>
                <LoadingSpinner />
                Guardando...
              </>
            ) : (
              <>
                <span className="material-icons">save</span>
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </form>

      <div className={styles.infoBox}>
        <span className="material-icons">info</span>
        <p>* Campos obligatorios. Tus datos están protegidos y solo se usan para gestionar tu cuenta y pedidos.</p>
      </div>
    </div>
  );
};

export default InformacionPersonal;
