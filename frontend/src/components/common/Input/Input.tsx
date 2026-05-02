import React, { useState, memo } from "react";
import styles from "./Input.module.css";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: string;
  error?: string;
  id: string;
  fullWidth?: boolean;
}

/**
 * Componente Input - Atómico y reutilizable
 * Maneja estados de focus, errores, iconos y visibilidad de contraseña
 */
const Input: React.FC<InputProps> = memo(({
  label,
  icon,
  error,
  id,
  type = "text",
  required,
  disabled,
  fullWidth = true,
  className = "",
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Determinar el tipo real del input (para toggles de contraseña)
  const isPasswordField = type === "password";
  const currentType = isPasswordField ? (showPassword ? "text" : "password") : type;

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div 
      className={`${styles.formGroup} ${fullWidth ? styles.fullWidth : ""} ${className}`}
      style={style}
    >
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>

      <div
        className={`${styles.inputContainer} ${
          isFocused ? styles.focused : ""
        } ${error ? styles.error : ""} ${disabled ? styles.disabled : ""}`}
      >
        {icon && (
          <span className={styles.iconLeft}>
            <span className="material-icons">{icon}</span>
          </span>
        )}

        <input
          id={id}
          type={currentType}
          disabled={disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={styles.input}
          {...props}
        />

        {isPasswordField && (
          <button
            type="button"
            className={styles.passwordToggle}
            onClick={togglePasswordVisibility}
            disabled={disabled}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            <span className="material-icons">
              {showPassword ? "visibility_off" : "visibility"}
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
});

export default Input;
