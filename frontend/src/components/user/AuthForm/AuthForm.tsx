/**
 * Componente AuthForm - Formulario de autenticación completo
 * Maneja login con email/contraseña y autenticación Google OAuth
 * Incluye validación, estados de carga y navegación automática
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import Button from '../../common/Button';
import styles from './AuthForm.module.css';

const AuthForm = () => {
    // ============================================================================
    // HOOKS Y CONTEXTOS
    // ============================================================================
    const { login, googleLogin } = useAuth();
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    // ============================================================================
    // ESTADOS DEL FORMULARIO
    // ============================================================================
    const [formData, setFormData] = useState({
        email_cliente: '',
        contrasena: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    // ============================================================================
    // MANEJADORES DE EVENTOS
    // ============================================================================
    
    /**
     * Maneja los cambios en los campos del formulario
     * Actualiza el estado local y mantiene la sincronización
     */
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    /**
     * Maneja el focus de los inputs para efectos visuales
     * Activa el estado de campo enfocado para estilos CSS
     */
    const handleFocus = (fieldName: string) => {
        setFocusedField(fieldName);
    };

    /**
     * Maneja el blur de los inputs para efectos visuales
     * Desactiva el estado de campo enfocado
     */
    const handleBlur = () => {
        setFocusedField(null);
    };

    /**
     * Toggle de visibilidad de contraseña
     * Permite al usuario ver/ocultar el texto de la contraseña
     */
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // ============================================================================
    // MANEJADORES DE FORMULARIO
    // ============================================================================
    
    /**
     * Maneja el envío del formulario de login
     * Valida campos, ejecuta autenticación y maneja navegación
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // ✅ VALIDAR CAMPOS REQUERIDOS antes de procesar
            if (!formData.email_cliente || !formData.contrasena) {
                showNotification('Por favor complete todos los campos', 'error');
                return;
            }

            // ✅ EJECUTAR AUTENTICACIÓN con credenciales
            await login(formData.email_cliente, formData.contrasena);
            showNotification('¡Bienvenido de vuelta!', 'success');

            // ✅ LIMPIAR FORMULARIO después de éxito
            setFormData({ email_cliente: '', contrasena: '' });

            // ✅ REDIRIGIR a la página principal
            navigate('/');

        } catch (error: any) {
            // ✅ MANEJO DE ERRORES con mensajes descriptivos
            const errorMessage = error.response?.data?.mensaje ||
                error.response?.data?.message ||
                error.message ||
                'Error al iniciar sesión';
            showNotification(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Maneja el inicio de sesión con Google OAuth
     * Procesa autenticación externa y navegación automática
     */
    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            await googleLogin();
            showNotification('¡Bienvenido!', 'success');
            navigate('/');
        } catch (error) {
            showNotification('Error al iniciar sesión con Google', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // ============================================================================
    // RENDERIZADO PRINCIPAL
    // ============================================================================
    
    return (
        <div className={styles.loginCard}>
            {/* Encabezado integrado con logo y descripción */}
            <div className={styles.authHeader}>
                <div className={styles.logoContainer}>
                    <img
                        src="/src/assets/tecnocel.svg"
                        alt="Tecnocel Logo"
                        className={styles.logo}
                    />
                </div>
                <p className={styles.subtitle}>Accede a tu cuenta para continuar</p>
            </div>

            {/* Formulario de login con validación y estados */}
            <form onSubmit={handleSubmit} className={styles.loginForm}>
                {/* Campo Email con validación y estados visuales */}
                <div className={styles.formGroup}>
                    <label htmlFor="email_cliente" className={styles.label}>
                        Correo Electrónico
                        <span className={styles.required}>*</span>
                    </label>
                    <div className={`${styles.inputContainer} ${focusedField === 'email_cliente' ? styles.focused : ''}`}>
                        <span className={styles.iconLeft}>
                            <span className="material-icons">email</span>
                        </span>
                        <input
                            id="email_cliente"
                            name="email_cliente"
                            type="email"
                            value={formData.email_cliente}
                            onChange={handleInputChange}
                            onFocus={() => handleFocus('email_cliente')}
                            onBlur={handleBlur}
                            required
                            disabled={isLoading}
                            className={styles.input}
                            autoComplete="email"
                        />
                    </div>
                </div>

                {/* Campo Contraseña con toggle de visibilidad */}
                <div className={styles.formGroup}>
                    <label htmlFor="contrasena" className={styles.label}>
                        Contraseña
                        <span className={styles.required}>*</span>
                    </label>
                    <div className={`${styles.inputContainer} ${focusedField === 'contrasena' ? styles.focused : ''}`}>
                        <span className={styles.iconLeft}>
                            <span className="material-icons">lock</span>
                        </span>
                        <input
                            id="contrasena"
                            name="contrasena"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.contrasena}
                            onChange={handleInputChange}
                            onFocus={() => handleFocus('contrasena')}
                            onBlur={handleBlur}
                            required
                            disabled={isLoading}
                            className={styles.input}
                            autoComplete="current-password"
                        />
                        <button
                            type="button"
                            className={styles.passwordToggle}
                            onClick={togglePasswordVisibility}
                            disabled={isLoading}
                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                            <span className="material-icons">
                                {showPassword ? 'visibility_off' : 'visibility'}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Botón de envío principal usando componente Button personalizado */}
                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={isLoading}
                    icon="login"
                    iconPosition="left"
                    className={styles.submitButton}
                >
                    {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>

                {/* Separador visual para opciones alternativas */}
                <div className={styles.divider}>
                    o
                </div>

                {/* Botón de Google OAuth usando componente Button personalizado */}
                <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    fullWidth
                    loading={isLoading}
                    onClick={handleGoogleLogin}
                    className={styles.googleButton}
                    disabled={isLoading}
                    aria-label="Iniciar sesión con Google"
                >
                    <div className={styles.googleIcon}>
                        <svg
                            className={styles.googleLogo}
                            viewBox="0 0 24 24"
                            width="20"
                            height="20"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                    </div>
                    <span className={styles.buttonText}>
                        {isLoading ? 'Conectando...' : 'Continuar con Google'}
                    </span>
                </Button>

                {/* Enlaces de navegación y ayuda */}
                <div className={styles.authLinks}>
                    <Link to="/forgot-password" className={styles.forgotPassword}>
                        ¿Olvidaste tu contraseña?
                    </Link>

                    <p className={styles.registerPrompt}>
                        ¿No tienes una cuenta?{' '}
                        <Link to="/register" className={styles.registerLink}>
                            Regístrate aquí
                        </Link>
                    </p>
                </div>
            </form>
        </div>
    );
};

export default AuthForm; 