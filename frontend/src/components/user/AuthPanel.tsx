import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/User.module.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface AuthPanelProps {
  onLoginSuccess?: () => void;
  onClose?: () => void;
}

const AuthPanel = ({ onLoginSuccess, onClose }: AuthPanelProps) => {
  const { login, register, googleLogin } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        onLoginSuccess?.();
      } else {
        await register(formData.email, formData.password, formData.firstName, formData.lastName);
        onLoginSuccess?.();
      }
      setFormData({ email: '', password: '', firstName: '', lastName: '' });
    } catch (error: any) {
      console.error('Error en autenticación:', error);
      const errorMessage =
        error.response?.data?.mensaje ||
        error.response?.data?.message ||
        error.message ||
        'Error en la autenticación. Por favor, intente nuevamente.';
      toast.error(errorMessage);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await googleLogin();
      onLoginSuccess?.();
    } catch (error) {
      console.error('Error en autenticación con Google:', error);
      toast.error('Error en la autenticación con Google. Por favor, intente nuevamente.');
    }
  };

  return (
    <div className={styles.authModalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={onClose}>
          <span className="material-icons">close</span>
        </button>
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          aria-label="Notificaciones"
        />
        <div className={styles.modalHeader}>
          <h2>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</h2>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className={styles.formGroup}>
                <label htmlFor="firstName">Nombre</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Ingrese su nombre"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="lastName">Apellidos</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Ingrese sus apellidos"
                  required
                />
              </div>
            </>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="ejemplo@correo.com"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className={styles.submitButton}>
            <span className="material-icons">
              {isLogin ? 'login' : 'person_add'}
            </span>
            {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
          </button>

          <button
            type="button"
            className={styles.googleButton}
            onClick={handleGoogleLogin}
          >
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg"
              alt="Google Logo"
            />
            Continuar con Google
          </button>

          <p className={styles.switchMode}>
            {isLogin ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Regístrate' : 'Inicia Sesión'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AuthPanel;
