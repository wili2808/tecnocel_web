import React, { useState, memo } from "react";
import styles from "./Select.module.css";

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  icon?: string;
  error?: string;
  id: string;
  options: Option[];
  fullWidth?: boolean;
}

/**
 * Componente Select - Atómico y reutilizable
 * Maneja estados de focus, errores e iconos con estilo consistente
 */
const Select: React.FC<SelectProps> = memo(({
  label,
  icon,
  error,
  id,
  options,
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

  const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
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

        <select
          id={id}
          disabled={disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`${styles.select} ${className}`}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>

        <span className={styles.iconRight}>
          <span className="material-icons">expand_more</span>
        </span>
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

export default Select;
