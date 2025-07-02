import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/User.module.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReactDOM from 'react-dom';
import { useEscapeKey } from '../../hooks/useEscapeKey';

// Configuración de notificaciones toast
const TOAST_CONFIG = {
  position: "top-center" as const,
  autoClose: 3000,
  hideProgressBar: false,
  newestOnTop: true,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  draggable: true,
  pauseOnHover: true,
  theme: "light" as const
};

/**
 * Props del componente AuthPanel
 * @property {Function} onLoginSuccess - Callback ejecutado cuando el login/registro es exitoso
 * @property {Function} onClose - Callback ejecutado para cerrar el modal
 */
interface AuthPanelProps {
  onLoginSuccess?: () => void;
  onClose?: () => void;
}

/**
 * Componente principal de autenticación
 * Renderiza un modal con formulario de login/registro
 */
const AuthPanel = ({ onLoginSuccess, onClose }: AuthPanelProps) => {
  // Hook para acceder a las funciones de autenticación
  const { login, register, googleLogin } = useAuth();

  // Estado para controlar si se muestra el formulario de login o registro
  const [isLogin, setIsLogin] = useState(true);

  // Estado para controlar el estado de carga durante las operaciones
  const [isLoading, setIsLoading] = useState(false);

  // Estado para manejar los datos del formulario
  const [formData, setFormData] = useState({
    email_cliente: '',
    contrasena: '',
    nombre_cliente: '',
    apellidos: '',
    celular_cliente: '',
    nit_ci_cliente: '',
  });

  // Hook personalizado para cerrar el modal con la tecla Escape
  useEscapeKey(() => onClose?.());

  /**
   * Maneja los cambios en los campos del formulario
   * @param {React.ChangeEvent<HTMLInputElement>} e - Evento del input
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Maneja el envío del formulario
   * Ejecuta login o registro según el estado actual
   * @param {React.FormEvent} e - Evento del formulario
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isLogin) {
        await login(formData.email_cliente, formData.contrasena);
      } else {
        // Validar campos requeridos
        if (!formData.nombre_cliente || !formData.apellidos || !formData.email_cliente || !formData.contrasena || !formData.celular_cliente || !formData.nit_ci_cliente) {
          toast.error('Todos los campos son obligatorios');
          setIsLoading(false);
          return;
        }
        await register({
          nombre_cliente: formData.nombre_cliente,
          apellidos: formData.apellidos,
          email_cliente: formData.email_cliente,
          contrasena: formData.contrasena,
          celular_cliente: formData.celular_cliente,
          nit_ci_cliente: formData.nit_ci_cliente
        });
      }
      setFormData({ email_cliente: '', contrasena: '', nombre_cliente: '', apellidos: '', celular_cliente: '', nit_ci_cliente: '' });
      onLoginSuccess?.();
    } catch (error: any) {
      const errorMessage = error.response?.data?.mensaje || error.response?.data?.message || error.message || 'Error en la autenticación';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Maneja el inicio de sesión con Google
   * Actualmente pendiente de implementar
   */
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await googleLogin();
      onLoginSuccess?.();
    } catch (error) {
      toast.error('Error en la autenticación con Google');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Renderiza los campos del formulario según el modo (login/registro)
   * @returns {JSX.Element} Campos del formulario
   */
  const renderFormFields = () => (
    <>
      {!isLogin && (
        <>
          <div className={styles.formGroup}>
            <label htmlFor="nombre_cliente">Nombre</label>
            <input
              type="text"
              id="nombre_cliente"
              name="nombre_cliente"
              value={formData.nombre_cliente}
              onChange={handleInputChange}
              placeholder="Ingrese su nombre"
              required
              disabled={isLoading}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="apellidos">Apellidos</label>
            <input
              type="text"
              id="apellidos"
              name="apellidos"
              value={formData.apellidos}
              onChange={handleInputChange}
              placeholder="Ingrese sus apellidos"
              required
              disabled={isLoading}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="celular_cliente">Celular</label>
            <input
              type="text"
              id="celular_cliente"
              name="celular_cliente"
              value={formData.celular_cliente}
              onChange={handleInputChange}
              placeholder="Ingrese su celular"
              required
              disabled={isLoading}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="nit_ci_cliente">NIT/CI</label>
            <input
              type="text"
              id="nit_ci_cliente"
              name="nit_ci_cliente"
              value={formData.nit_ci_cliente}
              onChange={handleInputChange}
              placeholder="Ingrese su NIT o CI"
              required
              disabled={isLoading}
            />
          </div>
        </>
      )}
      <div className={styles.formGroup}>
        <label htmlFor="email_cliente">Correo Electrónico</label>
        <input
          type="email"
          id="email_cliente"
          name="email_cliente"
          value={formData.email_cliente}
          onChange={handleInputChange}
          placeholder="ejemplo@correo.com"
          required
          disabled={isLoading}
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="contrasena">Contraseña</label>
        <input
          type="password"
          id="contrasena"
          name="contrasena"
          value={formData.contrasena}
          onChange={handleInputChange}
          placeholder="••••••••"
          required
          disabled={isLoading}
        />
      </div>
    </>
  );

  // Renderiza el modal usando un portal para asegurar que se muestre por encima de todo
  return ReactDOM.createPortal(
    <div className={styles.authModalOverlay}>
      <div className={styles.modalContent}>
        {/* Botón para cerrar el modal */}
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Cerrar modal"
          disabled={isLoading}
        >
          <span className="material-icons">close</span>
        </button>

        {/* Contenedor de notificaciones toast */}
        <ToastContainer {...TOAST_CONFIG} aria-label="Notificaciones del sistema" />

        {/* Encabezado del modal */}
        <div className={styles.modalHeader}>
          <h2>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</h2>
        </div>

        {/* Formulario principal */}
        <form onSubmit={handleSubmit}>
          {renderFormFields()}

          {/* Botón de envío del formulario */}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            <span className="material-icons">
              {isLogin ? 'login' : 'person_add'}
            </span>
            {isLoading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
          </button>

          {/* Botón de inicio de sesión con Google */}
          <button
            type="button"
            className={styles.googleButton}
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg"
              alt="Google Logo"
            />
            Continuar con Google
          </button>

          {/* Enlace para cambiar entre login y registro */}
          <p className={styles.switchMode}>
            {isLogin ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              disabled={isLoading}
            >
              {isLogin ? 'Regístrate' : 'Inicia Sesión'}
            </button>
          </p>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AuthPanel;
