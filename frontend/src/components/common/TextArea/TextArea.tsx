import React, { useState, memo } from "react";
import styles from "./TextArea.module.css";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  icon?: string;
  error?: string;
  id: string;
  fullWidth?: boolean;
}

/**
 * Componente TextArea - Atómico y reutilizable
 * Maneja estados de focus, errores e iconos
 */
const TextArea: React.FC<TextAreaProps> = memo(({
  label,
  icon,
  error,
  id,
  required,
  disabled,
  fullWidth = true,
  className = "",
  style,
  onFocus,
  onBlur,
  rows = 4,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
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
        className={`${styles.container} ${
          isFocused ? styles.focused : ""
        } ${error ? styles.error : ""} ${disabled ? styles.disabled : ""}`}
      >
        {icon && (
          <span className={styles.iconLeft}>
            <span className="material-icons">{icon}</span>
          </span>
        )}

        <textarea
          id={id}
          disabled={disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={styles.textarea}
          rows={rows}
          {...props}
        />
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

export default TextArea;
