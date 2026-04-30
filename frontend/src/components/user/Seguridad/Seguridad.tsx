/**
 * Componente Seguridad - Gestión de seguridad de la cuenta (cambio de contraseña)
 * Permite cambiar contraseña y muestra recomendaciones de seguridad
 */
import { useState, useEffect } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import clienteService from '../../../services/clienteService';
import LoadingSpinner from '../../common/LoadingSpinner';
import styles from './Seguridad.module.css';

import Input from '../../common/Input/Input';

const Seguridad = () => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isGoogleAccount, setIsGoogleAccount] = useState(false);

  const [formData, setFormData] = useState({
    contrasenaActual: '',
    contrasenaNueva: '',
    contrasenaConfirm: '',
  });

  const [errors, setErrors] = useState<{
    contrasenaActual?: string;
    contrasenaNueva?: string;
    contrasenaConfirm?: string;
  }>({});

  // Cargar perfil completo para verificar tipo de cuenta
  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        setLoadingProfile(true);
        const perfil = await clienteService.obtenerPerfil();
        setIsGoogleAccount(perfil.isGoogleAccount || false);
      } catch (error) {
        console.error('Error al cargar perfil:', error);
      } finally {
        setLoadingProfile(false);
      }
    };
    cargarPerfil();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Limpiar error del campo
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validarContrasena = (password: string): string | null => {
    if (password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Debe contener al menos una letra mayúscula';
    }
    if (!/[a-z]/.test(password)) {
      return 'Debe contener al menos una letra minúscula';
    }
    if (!/[0-9]/.test(password)) {
      return 'Debe contener al menos un número';
    }
    return null;
  };

  const validarFormulario = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.contrasenaActual) {
      newErrors.contrasenaActual = 'Ingresa tu contraseña actual';
    }

    if (!formData.contrasenaNueva) {
      newErrors.contrasenaNueva = 'Ingresa una nueva contraseña';
    } else {
      const errorValidacion = validarContrasena(formData.contrasenaNueva);
      if (errorValidacion) {
        newErrors.contrasenaNueva = errorValidacion;
      }
    }

    if (!formData.contrasenaConfirm) {
      newErrors.contrasenaConfirm = 'Confirma tu nueva contraseña';
    } else if (formData.contrasenaNueva !== formData.contrasenaConfirm) {
      newErrors.contrasenaConfirm = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    try {
      setLoading(true);
      await clienteService.cambiarContrasena(formData.contrasenaActual, formData.contrasenaNueva);

      // Limpiar formulario
      setFormData({
        contrasenaActual: '',
        contrasenaNueva: '',
        contrasenaConfirm: '',
      });

      showNotification('Contraseña actualizada correctamente', 'success');
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Error al cambiar contraseña';
      showNotification(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (isGoogleAccount) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Seguridad</h2>
          <p className={styles.subtitle}>Gestión de seguridad de tu cuenta</p>
        </div>

        <div className={styles.disabledBox}>
          <span className="material-icons">lock</span>
          <h3>Cuenta de Google</h3>
          <p>
            Tu cuenta está vinculada con Google. La gestión de contraseña se realiza a través de tu cuenta de Google.
          </p>
          <a
            href="https://myaccount.google.com/security"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.btnGoogle}
          >
            <span className="material-icons">open_in_new</span>
            Gestionar en Google
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Seguridad</h2>
        <p className={styles.subtitle}>Cambia tu contraseña</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Contraseña actual */}
        <Input
          id="contrasenaActual"
          name="contrasenaActual"
          type="password"
          label="Contraseña Actual"
          icon="lock"
          value={formData.contrasenaActual}
          onChange={handleChange}
          error={errors.contrasenaActual}
          required
          disabled={loading}
          placeholder="Ingresa tu contraseña actual"
        />

        {/* Nueva contraseña */}
        <Input
          id="contrasenaNueva"
          name="contrasenaNueva"
          type="password"
          label="Nueva Contraseña"
          icon="lock_open"
          value={formData.contrasenaNueva}
          onChange={handleChange}
          error={errors.contrasenaNueva}
          required
          disabled={loading}
          placeholder="Ingresa tu nueva contraseña"
        />

        {/* Confirmar contraseña */}
        <Input
          id="contrasenaConfirm"
          name="contrasenaConfirm"
          type="password"
          label="Confirmar Nueva Contraseña"
          icon="lock_outline"
          value={formData.contrasenaConfirm}
          onChange={handleChange}
          error={errors.contrasenaConfirm}
          required
          disabled={loading}
          placeholder="Confirma tu nueva contraseña"
        />

        <div className={styles.actions}>
          <button type="submit" className={styles.btnPrimary} disabled={loading}>
            {loading ? (
              <>
                <LoadingSpinner />
                Cambiando...
              </>
            ) : (
              <>
                <span className="material-icons">shield</span>
                Cambiar Contraseña
              </>
            )}
          </button>
        </div>
      </form>


      {/* Recomendaciones de seguridad */}
      <div className={styles.securityTips}>
        <h3>
          <span className="material-icons">tips_and_updates</span>
          Recomendaciones de Seguridad
        </h3>
        <ul>
          <li>
            <span className="material-icons">check</span>
            Usa al menos 8 caracteres
          </li>
          <li>
            <span className="material-icons">check</span>
            Combina mayúsculas y minúsculas
          </li>
          <li>
            <span className="material-icons">check</span>
            Incluye números y caracteres especiales
          </li>
          <li>
            <span className="material-icons">check</span>
            No uses contraseñas obvias o información personal
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Seguridad;
