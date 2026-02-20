/**
 * Componente AdminLogin - Página de inicio de sesión para administradores y empleados
 * Permite autenticación de usuarios del sistema (no clientes)
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import styles from './AdminLogin.module.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { loginAdmin, isSystemUser, isAuthenticated } = useAuth();
  const { showNotification } = useNotification();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  // Redirigir si ya está autenticado como usuario del sistema
  useEffect(() => {
    if (isAuthenticated && isSystemUser) {
      navigate('/admin-panel');
    }
  }, [isAuthenticated, isSystemUser, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      showNotification('Por favor completa todos los campos', 'error');
      return;
    }

    try {
      setLoading(true);
      await loginAdmin(formData.email, formData.password);
      showNotification('Inicio de sesión exitoso', 'success');
      navigate('/admin-panel');
    } catch (error: any) {
      showNotification(error.message || 'Error al iniciar sesión', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.adminLogin}>
      <div className={styles.container}>
        <div className={styles.loginCard}>
          <div className={styles.header}>
            <div className={styles.iconWrapper}>
              <span className="material-icons">admin_panel_settings</span>
            </div>
            <h1 className={styles.title}>Panel de Administración</h1>
            <p className={styles.subtitle}>Ingresa tus credenciales de administrador o gerente</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>
                <span className="material-icons">email</span>
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@tecnocel.com"
                className={styles.input}
                required
                autoComplete="email"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>
                <span className="material-icons">lock</span>
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Tu contraseña"
                className={styles.input}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? (
                <>
                  <span className="material-icons">hourglass_empty</span>
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <span className="material-icons">login</span>
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>

          <div className={styles.footer}>
            <button
              onClick={() => navigate('/')}
              className={styles.backButton}
            >
              <span className="material-icons">arrow_back</span>
              Volver al inicio
            </button>
          </div>
        </div>

        <div className={styles.info}>
          <div className={styles.infoCard}>
            <span className="material-icons">info</span>
            <p>
              Esta área es exclusiva para administradores y gerentes del sistema.
              Si eres un cliente, por favor usa el{' '}
              <button onClick={() => navigate('/login')} className={styles.linkButton}>
                login de clientes
              </button>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
