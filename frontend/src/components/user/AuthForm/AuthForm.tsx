import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-toastify';
import styles from './AuthForm.module.css';

/**
 * Componente de formulario de login
 * Contiene la tarjeta completa con cabecera, formulario y funcionalidad de autenticación
 */
const AuthForm = () => {
    const { login, googleLogin } = useAuth();
    const navigate = useNavigate();

    // Estados del formulario
    const [formData, setFormData] = useState({
        email_cliente: '',
        contrasena: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    /**
     * Maneja los cambios en los campos del formulario
     * @param {React.ChangeEvent<HTMLInputElement>} e - Evento del input
     */
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    /**
     * Maneja el focus de los inputs
     */
    const handleFocus = (fieldName: string) => {
        setFocusedField(fieldName);
    };

    /**
     * Maneja el blur de los inputs
     */
    const handleBlur = () => {
        setFocusedField(null);
    };

    /**
     * Toggle de visibilidad de contraseña
     */
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    /**
     * Maneja el envío del formulario de login
     * @param {React.FormEvent} e - Evento del formulario
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Validar campos requeridos
            if (!formData.email_cliente || !formData.contrasena) {
                toast.error('Por favor complete todos los campos');
                return;
            }

            await login(formData.email_cliente, formData.contrasena);
            toast.success('¡Bienvenido de vuelta!');

            // Limpiar formulario
            setFormData({ email_cliente: '', contrasena: '' });

            // Redirigir a la página principal
            navigate('/');

        } catch (error: any) {
            const errorMessage = error.response?.data?.mensaje ||
                error.response?.data?.message ||
                error.message ||
                'Error al iniciar sesión';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Maneja el inicio de sesión con Google
     */
    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            await googleLogin();
            toast.success('¡Bienvenido!');
            navigate('/');
        } catch (error) {
            toast.error('Error al iniciar sesión con Google');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.loginCard}>
            {/* Encabezado integrado */}
            <div className={styles.authHeader}>
                <div className={styles.logoContainer}>
                    <img
                        src="/src/assets/logo2.svg"
                        alt="Tecnocel Logo"
                        className={styles.logo}
                    />
                </div>
                <p className={styles.subtitle}>Accede a tu cuenta para continuar</p>
            </div>

            {/* Formulario de login */}
            <form onSubmit={handleSubmit} className={styles.loginForm}>
                {/* Campo Email */}
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

                {/* Campo Contraseña */}
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

                {/* Botón de envío */}
                <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isLoading}
                >
                    <span className="material-icons">login</span>
                    {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </button>

                {/* Separador */}
                <div className={styles.divider}>
                    o
                </div>

                {/* Botón de Google integrado */}
                <button
                    type="button"
                    className={styles.googleButton}
                    onClick={handleGoogleLogin}
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
                    {isLoading && (
                        <div className={styles.loadingSpinner}>
                            <div className={styles.spinner}></div>
                        </div>
                    )}
                </button>

                {/* Enlaces */}
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