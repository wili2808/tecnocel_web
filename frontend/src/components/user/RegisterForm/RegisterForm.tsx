/**
 * Componente RegisterForm - Formulario de registro completo
 * Maneja creación de cuentas con validación completa y autenticación Google OAuth
 * Incluye validación de campos, manejo de errores y navegación automática
 */
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../../assets/tecnocel.svg";
import Button from "../../common/Button";
import { useAuth } from "../../../contexts/AuthContext";
import { useNotification } from "../../../contexts/NotificationContext";
import Input from "../../common/Input/Input";
import styles from "./RegisterForm.module.css";
import type { RegisterData } from "../../../types/auth";

const RegisterForm = () => {
  // -----> HOOKS Y CONTEXTOS ---------------------------------------------------
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { register, googleLogin, error: authError } = useAuth();

  // -----> ESTADOS DEL FORMULARIO ----------------------------------------------
  const [formData, setFormData] = useState<RegisterData>({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    confirmPassword: "",
    celular: "",
    nitCi: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Resetea el spinner si Google OAuth falla o el usuario cierra el popup
  useEffect(() => {
    if (authError) {
      setIsLoading(false);
    }
  }, [authError]);

  // -----> MANEJADORES DE EVENTOS --------------------------------------------
  /**
   * Maneja los cambios en los campos del formulario
   * Actualiza el estado local y limpia errores automáticamente
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: RegisterData) => ({ ...prev, [name]: value }));

    // ✅ LIMPIAR ERROR del campo cuando el usuario empiece a escribir
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // -----> VALIDACIÓN Y MANEJO DE FORMULARIO ---------------------------------------
  /**
   * Valida todos los campos del formulario de registro
   * Retorna true si el formulario es válido, false si hay errores
   */
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // ✅ VALIDAR NOMBRE con longitud mínima
    if (!formData.nombre.trim()) {
      errors.nombre = "El nombre es requerido";
    } else if (formData.nombre.trim().length < 2) {
      errors.nombre = "El nombre debe tener al menos 2 caracteres";
    }

    // ✅ VALIDAR APELLIDOS con longitud mínima
    if (!formData.apellido.trim()) {
      errors.apellido = "Los apellidos son requeridos";
    } else if (formData.apellido.trim().length < 2) {
      errors.apellido = "Los apellidos deben tener al menos 2 caracteres";
    }

    // ✅ VALIDAR EMAIL con formato correcto
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errors.email = "El correo electrónico es requerido";
    } else if (!emailRegex.test(formData.email)) {
      errors.email = "El formato del correo electrónico no es válido";
    }

    // ✅ VALIDAR CONTRASEÑA con longitud mínima
    if (!formData.password.trim()) {
      errors.password = "La contraseña es requerida";
    } else if (formData.password.length < 6) {
      errors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    // ✅ VALIDAR CONFIRMACIÓN de contraseña
    if (!formData.confirmPassword.trim()) {
      errors.confirmPassword = "Confirme su contraseña";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Las contraseñas no coinciden";
    }

    // ✅ VALIDAR CELULAR con longitud mínima
    if (formData.celular?.trim() && formData.celular.trim().length < 7) {
      errors.celular = "El número de celular debe tener al menos 7 dígitos";
    }

    // ✅ VALIDAR NIT/CI con longitud mínima
    if (formData.nitCi?.trim() && formData.nitCi.trim().length < 6) {
      errors.nitCi = "El NIT o CI debe tener al menos 6 caracteres";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Maneja el envío del formulario de registro
   * Valida datos, ejecuta registro y maneja navegación automática
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // ✅ VALIDAR FORMULARIO antes de procesar
      if (!validateForm()) {
        showNotification("Por favor corrija los errores en el formulario", "error");
        return;
      }

      // ✅ EJECUTAR REGISTRO con datos validados
      const resultado = await register(formData);

      // ✅ REDIRIGIR: a verificar email si está pendiente, o al inicio si la sesión inició sola
      navigate(resultado.requiereVerificacion ? "/verificar-email" : "/");
    } catch (error: any) {
      // ✅ MANEJO DE ERRORES con mensajes descriptivos
      const errorMessage =
        error.response?.data?.mensaje ||
        error.response?.data?.message ||
        error.message ||
        "Error al crear la cuenta";
      showNotification(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Maneja el registro con Google OAuth
   * Abre el popup de Google; la notificación y navegación son gestionadas
   * por PublicOnlyRoute al detectar el cambio de estado de autenticación.
   */
  const handleGoogleLogin = () => {
    setIsLoading(true);
    googleLogin();
  };

  // -----> RENDERIZADO PRINCIPAL ------------------------------------------------
  return (
    <div className={styles.registerCard}>
      {/* Encabezado integrado con logo y descripción */}
      <div className={styles.authHeader}>
        <div className={styles.logoContainer}>
          <img
            src={logo}
            alt="Tecnocel Logo"
            className={styles.logo}
          />
        </div>
        <p className={styles.subtitle}>
          Únete a nuestra comunidad y disfruta de beneficios exclusivos
        </p>
      </div>

      {/* Formulario de registro con validación y estados */}
      <form onSubmit={handleSubmit} className={styles.registerForm}>
        {/* Fila 1: Nombre y Apellidos en layout horizontal */}
        <div className={styles.formRow}>
          <Input
            id="nombre"
            name="nombre"
            label="Nombre"
            icon="person"
            value={formData.nombre}
            onChange={handleInputChange}
            error={formErrors.nombre}
            required
            disabled={isLoading}
            autoComplete="given-name"
          />

          <Input
            id="apellido"
            name="apellido"
            label="Apellidos"
            icon="person"
            value={formData.apellido}
            onChange={handleInputChange}
            error={formErrors.apellido}
            required
            disabled={isLoading}
            autoComplete="family-name"
          />
        </div>

        {/* Fila 2: Email en ancho completo */}
        <Input
          id="email"
          name="email"
          type="email"
          label="Correo Electrónico"
          icon="email"
          value={formData.email}
          onChange={handleInputChange}
          error={formErrors.email}
          required
          disabled={isLoading}
          autoComplete="email"
        />

        {/* Fila 3: Contraseñas en layout horizontal */}
        <div className={styles.formRow}>
          <Input
            id="password"
            name="password"
            type="password"
            label="Contraseña"
            icon="lock"
            value={formData.password}
            onChange={handleInputChange}
            error={formErrors.password}
            required
            disabled={isLoading}
            autoComplete="new-password"
          />

          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label="Confirmar Contraseña"
            icon="lock"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            error={formErrors.confirmPassword}
            required
            disabled={isLoading}
            autoComplete="new-password"
          />
        </div>

        {/* Fila 4: Celular y NIT/CI en layout horizontal */}
        <div className={styles.formRow}>
          <Input
            id="celular"
            name="celular"
            type="tel"
            label="Celular"
            icon="phone"
            value={formData.celular ?? ''}
            onChange={handleInputChange}
            error={formErrors.celular}
            required
            disabled={isLoading}
            autoComplete="tel"
          />

          <Input
            id="nitCi"
            name="nitCi"
            label="NIT/CI"
            icon="badge"
            value={formData.nitCi ?? ''}
            onChange={handleInputChange}
            error={formErrors.nitCi}
            required
            disabled={isLoading}
          />
        </div>

        {/* Botón de envío principal usando componente Button personalizado */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          icon="person_add"
          iconPosition="left"
          className={styles.submitButton}
        >
          {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
        </Button>

        {/* Separador visual para opciones alternativas */}
        <div className={styles.divider}>o</div>

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
          aria-label="Crear cuenta con Google"
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
            {isLoading ? "Conectando..." : "Registrarse con Google"}
          </span>
        </Button>

        {/* Enlace de navegación a login */}
        <p className={styles.loginPrompt}>
          ¿Ya tienes una cuenta?{" "}
          <Link to="/login" className={styles.loginLink}>
            Inicia sesión aquí
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterForm;
