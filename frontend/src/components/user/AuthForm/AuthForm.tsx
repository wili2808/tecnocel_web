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
                <h1 className={styles.title}>Iniciar Sesión</h1>
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
                        <img
                            src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg"
                            alt="Google Logo"
                            className={styles.googleLogo}
                        />
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