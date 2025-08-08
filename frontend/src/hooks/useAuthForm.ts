import { useState, useCallback } from 'react';

/**
 * Configuración para la validación de campos
 */
interface FieldValidationConfig {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: string) => string | null;
}

/**
 * Configuración de validación para el formulario
 */
interface ValidationConfig {
    [key: string]: FieldValidationConfig;
}

/**
 * Hook personalizado para manejar formularios de autenticación
 * Proporciona validación, estado de carga y manejo de errores
 */
export const useAuthForm = <T extends Record<string, string>>(
    initialValues: T,
    validationConfig?: ValidationConfig
) => {
    // Estados
    const [formData, setFormData] = useState<T>(initialValues);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    /**
     * Maneja los cambios en los campos del formulario
     */
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        
        // Actualizar el valor del campo
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Marcar el campo como tocado
        setTouched(prev => ({ ...prev, [name]: true }));
        
        // Limpiar error específico del campo si existe
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    }, [errors]);

    /**
     * Valida un campo específico
     */
    const validateField = useCallback((fieldName: string, value: string): string => {
        const config = validationConfig?.[fieldName];
        if (!config) return '';

        // Validación de campo requerido
        if (config.required && !value.trim()) {
            return `${fieldName.replace('_', ' ')} es requerido`;
        }

        // Validación de longitud mínima
        if (config.minLength && value.length < config.minLength) {
            return `${fieldName.replace('_', ' ')} debe tener al menos ${config.minLength} caracteres`;
        }

        // Validación de longitud máxima
        if (config.maxLength && value.length > config.maxLength) {
            return `${fieldName.replace('_', ' ')} no puede tener más de ${config.maxLength} caracteres`;
        }

        // Validación con patrón
        if (config.pattern && !config.pattern.test(value)) {
            return `${fieldName.replace('_', ' ')} no tiene un formato válido`;
        }

        // Validación personalizada
        if (config.custom) {
            return config.custom(value) || '';
        }

        return '';
    }, [validationConfig]);

    /**
     * Valida todo el formulario
     */
    const validateForm = useCallback((): boolean => {
        const newErrors: Record<string, string> = {};

        Object.keys(formData).forEach(fieldName => {
            const error = validateField(fieldName, formData[fieldName]);
            if (error) {
                newErrors[fieldName] = error;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData, validateField]);

    /**
     * Valida un campo específico cuando se pierde el foco
     */
    const handleFieldBlur = useCallback((fieldName: string) => {
        const error = validateField(fieldName, formData[fieldName]);
        setErrors(prev => ({ ...prev, [fieldName]: error }));
        setTouched(prev => ({ ...prev, [fieldName]: true }));
    }, [formData, validateField]);

    /**
     * Resetea el formulario a los valores iniciales
     */
    const resetForm = useCallback(() => {
        setFormData(initialValues);
        setErrors({});
        setTouched({});
        setIsLoading(false);
    }, [initialValues]);

    /**
     * Establece errores manualmente (útil para errores del servidor)
     */
    const setFieldErrors = useCallback((fieldErrors: Record<string, string>) => {
        setErrors(prev => ({ ...prev, ...fieldErrors }));
    }, []);

    /**
     * Obtiene el error de un campo específico si ha sido tocado
     */
    const getFieldError = useCallback((fieldName: string): string => {
        return touched[fieldName] ? errors[fieldName] || '' : '';
    }, [errors, touched]);

    /**
     * Verifica si un campo tiene error
     */
    const hasFieldError = useCallback((fieldName: string): boolean => {
        return touched[fieldName] && !!errors[fieldName];
    }, [errors, touched]);

    /**
     * Verifica si el formulario es válido
     */
    const isValid = Object.keys(errors).length === 0 && Object.keys(touched).length > 0;

    /**
     * Verifica si el formulario está limpio (sin cambios)
     */
    const isPristine = JSON.stringify(formData) === JSON.stringify(initialValues);

    return {
        // Estado del formulario
        formData,
        errors,
        isLoading,
        touched,
        isValid,
        isPristine,
        
        // Métodos para manejar el formulario
        handleInputChange,
        handleFieldBlur,
        validateForm,
        resetForm,
        setIsLoading,
        setFieldErrors,
        getFieldError,
        hasFieldError,
        
        // Método para establecer valores del formulario
        setFormData
    };
};

/**
 * Configuraciones de validación comunes para formularios de autenticación
 */
export const authValidationConfigs = {
    login: {
        email_cliente: {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        },
        contrasena: {
            required: true,
            minLength: 6
        }
    },
    register: {
        nombre_cliente: {
            required: true,
            minLength: 2,
            maxLength: 50
        },
        apellidos: {
            required: true,
            minLength: 2,
            maxLength: 50
        },
        email_cliente: {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        },
        contrasena: {
            required: true,
            minLength: 6,
            maxLength: 128
        },
        confirmarContrasena: {
            required: true,
            custom: () => {
              return true; // Validación personalizada siempre pasa
            }
        },
        celular_cliente: {
            required: true,
            minLength: 7,
            maxLength: 15,
            pattern: /^[0-9+\-\s()]+$/
        },
        nit_ci_cliente: {
            required: true,
            minLength: 6,
            maxLength: 20
        }
    }
}; 