import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from 'react-toastify';
import styles from './RegisterForm.module.css';

/**
 * Componente de formulario de registro
 * Contiene la tarjeta completa con cabecera, formulario y funcionalidad
 */
const RegisterForm = () => {
    const { register, googleLogin } = useAuth();
    const navigate = useNavigate();

    // Estados del formulario
    const [formData, setFormData] = useState({
        nombre_cliente: '',
        apellido_cliente: '',
        email_cliente: '',
        contrasena: '',
        confirmarContrasena: '',
        celular_cliente: '',
        nit_ci_cliente: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    /**
     * Maneja los cambios en los campos del formulario
     * @param {React.ChangeEvent<HTMLInputElement>} e - Evento del input
     */
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Limpiar error específico del campo al empezar a escribir
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
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
     * Toggle de visibilidad de confirmar contraseña
     */
    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    /**
     * Valida los datos del formulario
     * @returns {boolean} - True si el formulario es válido
     */
    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        // Validar nombre
        if (!formData.nombre_cliente.trim()) {
            errors.nombre_cliente = 'El nombre es requerido';
        } else if (formData.nombre_cliente.trim().length < 2) {
            errors.nombre_cliente = 'El nombre debe tener al menos 2 caracteres';
        }

        // Validar apellidos
        if (!formData.apellido_cliente.trim()) {
            errors.apellido_cliente = 'Los apellidos son requeridos';
        } else if (formData.apellido_cliente.trim().length < 2) {
            errors.apellido_cliente = 'Los apellidos deben tener al menos 2 caracteres';
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email_cliente.trim()) {
            errors.email_cliente = 'El correo electrónico es requerido';
        } else if (!emailRegex.test(formData.email_cliente)) {
            errors.email_cliente = 'El formato del correo electrónico no es válido';
        }

        // Validar contraseña
        if (!formData.contrasena) {
            errors.contrasena = 'La contraseña es requerida';
        } else if (formData.contrasena.length < 6) {
            errors.contrasena = 'La contraseña debe tener al menos 6 caracteres';
        }

        // Validar confirmación de contraseña
        if (!formData.confirmarContrasena) {
            errors.confirmarContrasena = 'Confirme su contraseña';
        } else if (formData.contrasena !== formData.confirmarContrasena) {
            errors.confirmarContrasena = 'Las contraseñas no coinciden';
        }

        // Validar celular
        if (!formData.celular_cliente.trim()) {
            errors.celular_cliente = 'El número de celular es requerido';
        } else if (formData.celular_cliente.trim().length < 7) {
            errors.celular_cliente = 'El número de celular debe tener al menos 7 dígitos';
        }

        // Validar NIT/CI
        if (!formData.nit_ci_cliente.trim()) {
            errors.nit_ci_cliente = 'El NIT o CI es requerido';
        } else if (formData.nit_ci_cliente.trim().length < 6) {
            errors.nit_ci_cliente = 'El NIT o CI debe tener al menos 6 caracteres';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    /**
     * Maneja el envío del formulario de registro
     * @param {React.FormEvent} e - Evento del formulario
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Validar formulario
            if (!validateForm()) {
                toast.error('Por favor corrija los errores en el formulario');
                return;
            }

            // Registrar usuario
            const response = await register({
                nombre_cliente: formData.nombre_cliente.trim(),
                apellido_cliente: formData.apellido_cliente.trim(),
                email_cliente: formData.email_cliente.trim(),
                contrasena: formData.contrasena,
                celular_cliente: formData.celular_cliente.trim(),
                nit_ci_cliente: formData.nit_ci_cliente.trim()
            });

            // Mostrar mensaje de éxito
            toast.success(response.mensaje || '¡Cuenta creada exitosamente! Ya estás logeado.');

            // Limpiar formulario
            setFormData({
                nombre_cliente: '',
                apellido_cliente: '',
                email_cliente: '',
                contrasena: '',
                confirmarContrasena: '',
                celular_cliente: '',
                nit_ci_cliente: ''
            });
            setFormErrors({});

            // Redirigir a la página principal ya que el usuario queda logeado automáticamente
            setTimeout(() => {
                navigate('/');
            }, 2000);

        } catch (error: any) {
            const errorMessage = error.response?.data?.mensaje ||
                error.response?.data?.message ||
                error.message ||
                'Error al crear la cuenta';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Maneja el registro con Google
     */
    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            await googleLogin();
            toast.success('¡Cuenta creada exitosamente!');
            navigate('/');
        } catch (error) {
            toast.error('Error al crear cuenta con Google');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Renderiza un campo de input personalizado
     */
    const renderInput = (
        id: string,
        name: string,
        type: string,
        label: string,
        value: string,
        placeholder: string,
        icon: string,
        autoComplete?: string,
        error?: string,
        isPassword?: boolean
    ) => {
        const isPasswordField = type === 'password';
        const showPasswordValue = isPassword ? (name === 'contrasena' ? showPassword : showConfirmPassword) : false;
        const inputType = isPasswordField ? (showPasswordValue ? 'text' : 'password') : type;

        return (
            <div className={styles.formGroup}>
                <label htmlFor={id} className={styles.label}>
                    {label}
                    <span className={styles.required}>*</span>
                </label>
                <div className={`${styles.inputContainer} ${focusedField === id ? styles.focused : ''} ${error ? styles.error : ''}`}>
                    <span className={styles.iconLeft}>
                        <span className="material-icons">{icon}</span>
                    </span>
                    <input
                        id={id}
                        name={name}
                        type={inputType}
                        value={value}
                        onChange={handleInputChange}
                        onFocus={() => handleFocus(id)}
                        onBlur={handleBlur}
                        required
                        disabled={isLoading}
                        className={styles.input}
                        autoComplete={autoComplete}
                    />
                    {isPasswordField && (
                        <button
                            type="button"
                            className={styles.passwordToggle}
                            onClick={name === 'contrasena' ? togglePasswordVisibility : toggleConfirmPasswordVisibility}
                            disabled={isLoading}
                            aria-label={showPasswordValue ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                            <span className="material-icons">
                                {showPasswordValue ? 'visibility_off' : 'visibility'}
                            </span>
                        </button>
                    )}
                </div>
                {error && (
                    <div className={styles.errorMessage}>
                        <span className="material-icons">error</span>
                        <span>{error}</span>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={styles.registerCard}>
            {/* Encabezado integrado */}
            <div className={styles.authHeader}>
                <div className={styles.logoContainer}>
                    <img
                        src="/src/assets/logo2.svg"
                        alt="Tecnocel Logo"
                        className={styles.logo}
                    />
                </div>
                <p className={styles.subtitle}>Únete a nuestra comunidad y disfruta de beneficios exclusivos</p>
            </div>

            {/* Formulario de registro */}
            <form onSubmit={handleSubmit} className={styles.registerForm}>
                {/* Fila 1: Nombre y Apellidos */}
                <div className={styles.formRow}>
                    {renderInput(
                        'nombre_cliente',
                        'nombre_cliente',
                        'text',
                        'Nombre',
                        formData.nombre_cliente,
                        'Ingrese su nombre',
                        'person',
                        'given-name',
                        formErrors.nombre_cliente
                    )}

                    {renderInput(
                        'apellido_cliente',
                        'apellido_cliente',
                        'text',
                        'Apellidos',
                        formData.apellido_cliente,
                        'Ingrese sus apellidos',
                        'person',
                        'family-name',
                        formErrors.apellido_cliente
                    )}
                </div>

                {/* Fila 2: Email */}
                {renderInput(
                    'email_cliente',
                    'email_cliente',
                    'email',
                    'Correo Electrónico',
                    formData.email_cliente,
                    'ejemplo@correo.com',
                    'email',
                    'email',
                    formErrors.email_cliente
                )}

                {/* Fila 3: Contraseñas */}
                <div className={styles.formRow}>
                    {renderInput(
                        'contrasena',
                        'contrasena',
                        'password',
                        'Contraseña',
                        formData.contrasena,
                        '••••••••',
                        'lock',
                        'new-password',
                        formErrors.contrasena,
                        true
                    )}

                    {renderInput(
                        'confirmarContrasena',
                        'confirmarContrasena',
                        'password',
                        'Confirmar Contraseña',
                        formData.confirmarContrasena,
                        '••••••••',
                        'lock',
                        'new-password',
                        formErrors.confirmarContrasena,
                        true
                    )}
                </div>

                {/* Fila 4: Celular y NIT/CI */}
                <div className={styles.formRow}>
                    {renderInput(
                        'celular_cliente',
                        'celular_cliente',
                        'tel',
                        'Celular',
                        formData.celular_cliente,
                        '70123456',
                        'phone',
                        'tel',
                        formErrors.celular_cliente
                    )}

                    {renderInput(
                        'nit_ci_cliente',
                        'nit_ci_cliente',
                        'text',
                        'NIT/CI',
                        formData.nit_ci_cliente,
                        '12345678',
                        'badge',
                        undefined,
                        formErrors.nit_ci_cliente
                    )}
                </div>

                {/* Botón de envío */}
                <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isLoading}
                >
                    <span className="material-icons">person_add</span>
                    {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
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
                    aria-label="Crear cuenta con Google"
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

                {/* Enlace a login */}
                <p className={styles.loginPrompt}>
                    ¿Ya tienes una cuenta?{' '}
                    <Link to="/login" className={styles.loginLink}>
                        Inicia sesión aquí
                    </Link>
                </p>
            </form>
        </div>
    );
};

export default RegisterForm; 