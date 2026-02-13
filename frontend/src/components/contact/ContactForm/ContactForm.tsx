/**
 * Componente ContactForm - Formulario de contacto con validación
 * Maneja envío de mensajes con validación completa
 * Incluye validación de campos, manejo de errores y feedback visual
 */
import { useState } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import Button from '../../common/Button';
import styles from './ContactForm.module.css';

/**
 * Props para el componente ContactForm
 */
interface ContactFormProps {
    /** Callback al enviar el formulario exitosamente */
    onSubmitSuccess?: () => void;
    /** Clases CSS adicionales */
    className?: string;
}

/**
 * ContactForm - Formulario de contacto con validación
 *
 * Formulario completo para que los usuarios envíen mensajes de contacto
 *
 * @component
 * @example
 * ```tsx
 * <ContactForm
 *   onSubmitSuccess={() => console.log('Mensaje enviado')}
 * />
 * ```
 */
export const ContactForm: React.FC<ContactFormProps> = ({
    onSubmitSuccess,
    className = ''
}) => {
    // ============================================================================
    // ESTADOS DEL FORMULARIO
    // ============================================================================
    const { showNotification } = useNotification();

    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        telefono: '',
        asunto: '',
        mensaje: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ============================================================================
    // MANEJADORES DE EVENTOS
    // ============================================================================

    /**
     * Maneja los cambios en los campos del formulario
     * Actualiza el estado local y limpia errores automáticamente
     */
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // ✅ LIMPIAR ERROR del campo cuando el usuario empiece a escribir
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // ============================================================================
    // VALIDACIÓN Y MANEJO DE FORMULARIO
    // ============================================================================

    /**
     * Valida todos los campos del formulario de contacto
     * Retorna true si el formulario es válido, false si hay errores
     */
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // ✅ VALIDAR NOMBRE con longitud mínima
        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        } else if (formData.nombre.trim().length < 3) {
            newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
        }

        // ✅ VALIDAR EMAIL con formato correcto
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = 'El email es requerido';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'El formato del email no es válido';
        }

        // ✅ VALIDAR TELÉFONO (opcional pero si se ingresa debe ser válido)
        if (formData.telefono.trim()) {
            const phoneRegex = /^[0-9\s\-\+\(\)]+$/;
            if (!phoneRegex.test(formData.telefono)) {
                newErrors.telefono = 'El formato del teléfono no es válido';
            } else if (formData.telefono.trim().length < 7) {
                newErrors.telefono = 'El teléfono debe tener al menos 7 dígitos';
            }
        }

        // ✅ VALIDAR ASUNTO
        if (!formData.asunto.trim()) {
            newErrors.asunto = 'El asunto es requerido';
        }

        // ✅ VALIDAR MENSAJE con longitud mínima
        if (!formData.mensaje.trim()) {
            newErrors.mensaje = 'El mensaje es requerido';
        } else if (formData.mensaje.trim().length < 10) {
            newErrors.mensaje = 'El mensaje debe tener al menos 10 caracteres';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    /**
     * Maneja el envío del formulario de contacto
     * Valida datos, ejecuta envío y maneja feedback automático
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // ✅ VALIDAR FORMULARIO antes de procesar
            if (!validateForm()) {
                showNotification('Por favor corrija los errores en el formulario', 'error');
                return;
            }

            // TODO: Implementar llamada a API real
            // const response = await fetch('/api/contacto', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(formData)
            // });

            // ✅ SIMULACIÓN de envío (reemplazar con API real)
            await new Promise(resolve => setTimeout(resolve, 1500));

            console.log('Datos del formulario:', formData);

            // ✅ MOSTRAR MENSAJE DE ÉXITO y limpiar formulario
            showNotification('¡Mensaje enviado exitosamente! Te responderemos pronto.', 'success');

            // ✅ LIMPIAR FORMULARIO completo después de éxito
            setFormData({
                nombre: '',
                email: '',
                telefono: '',
                asunto: '',
                mensaje: ''
            });
            setErrors({});

            // ✅ CALLBACK de éxito si existe
            if (onSubmitSuccess) {
                onSubmitSuccess();
            }

        } catch (error: any) {
            // ✅ MANEJO DE ERRORES con mensajes descriptivos
            const errorMessage = error.response?.data?.mensaje ||
                error.response?.data?.message ||
                error.message ||
                'Error al enviar el mensaje';
            showNotification(errorMessage, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ============================================================================
    // RENDERIZADO DE CAMPOS
    // ============================================================================

    /**
     * Renderiza un campo de input personalizado con validación
     * Incluye iconos en el label, estados de error y feedback visual
     */
    const renderInput = (
        id: string,
        name: string,
        type: string,
        label: string,
        value: string,
        icon: string,
        autoComplete?: string,
        error?: string,
        placeholder?: string,
        required?: boolean
    ) => {
        return (
            <div className={styles.formGroup}>
                <label htmlFor={id} className={styles.label}>
                    <span className="material-icons">{icon}</span>
                    {label} {required && '*'}
                </label>
                <input
                    id={id}
                    name={name}
                    type={type}
                    value={value}
                    onChange={handleInputChange}
                    required={required}
                    disabled={isSubmitting}
                    className={`${styles.input} ${error ? styles.inputError : ''}`}
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                />
                {error && (
                    <span className={styles.error}>
                        <span className="material-icons">error</span>
                        {error}
                    </span>
                )}
            </div>
        );
    };

    /**
     * Renderiza un campo de select personalizado con validación
     * Incluye iconos en el label, estados de error y feedback visual
     */
    const renderSelect = (
        id: string,
        name: string,
        label: string,
        value: string,
        icon: string,
        options: { value: string; label: string }[],
        error?: string,
        required?: boolean
    ) => {
        return (
            <div className={styles.formGroup}>
                <label htmlFor={id} className={styles.label}>
                    <span className="material-icons">{icon}</span>
                    {label} {required && '*'}
                </label>
                <select
                    id={id}
                    name={name}
                    value={value}
                    onChange={handleInputChange}
                    required={required}
                    disabled={isSubmitting}
                    className={`${styles.input} ${error ? styles.inputError : ''}`}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {error && (
                    <span className={styles.error}>
                        <span className="material-icons">error</span>
                        {error}
                    </span>
                )}
            </div>
        );
    };

    /**
     * Renderiza un campo de textarea personalizado con validación
     * Incluye iconos en el label, estados de error y feedback visual
     */
    const renderTextarea = (
        id: string,
        name: string,
        label: string,
        value: string,
        icon: string,
        error?: string,
        placeholder?: string,
        required?: boolean,
        rows?: number
    ) => {
        return (
            <div className={styles.formGroup}>
                <label htmlFor={id} className={styles.label}>
                    <span className="material-icons">{icon}</span>
                    {label} {required && '*'}
                </label>
                <textarea
                    id={id}
                    name={name}
                    value={value}
                    onChange={handleInputChange}
                    required={required}
                    disabled={isSubmitting}
                    className={`${styles.textarea} ${error ? styles.inputError : ''}`}
                    placeholder={placeholder}
                    rows={rows || 6}
                />
                {error && (
                    <span className={styles.error}>
                        <span className="material-icons">error</span>
                        {error}
                    </span>
                )}
            </div>
        );
    };

    // ============================================================================
    // RENDERIZADO PRINCIPAL
    // ============================================================================

    return (
        <div className={`${styles.contactCard} ${className}`}>
            {/* Encabezado integrado con título y descripción */}
            <div className={styles.formHeader}>
                <h3 className={styles.formTitle}>Envíanos un mensaje</h3>
                <p className={styles.formSubtitle}>
                    Completa el formulario y te responderemos a la brevedad
                </p>
            </div>

            {/* Formulario de contacto con validación y estados */}
            <form onSubmit={handleSubmit} className={styles.contactForm}>
                {/* Fila 1: Nombre y Email en layout horizontal */}
                <div className={styles.formRow}>
                    {renderInput(
                        'nombre',
                        'nombre',
                        'text',
                        'Nombre completo',
                        formData.nombre,
                        'person',
                        'name',
                        errors.nombre,
                        'Juan Pérez',
                        true
                    )}

                    {renderInput(
                        'email',
                        'email',
                        'email',
                        'Correo Electrónico',
                        formData.email,
                        'email',
                        'email',
                        errors.email,
                        'juan@ejemplo.com',
                        true
                    )}
                </div>

                {/* Fila 2: Teléfono y Asunto en layout horizontal */}
                <div className={styles.formRow}>
                    {renderInput(
                        'telefono',
                        'telefono',
                        'tel',
                        'Teléfono',
                        formData.telefono,
                        'phone',
                        'tel',
                        errors.telefono,
                        '+591 XXX-XXXX',
                        false
                    )}

                    {renderSelect(
                        'asunto',
                        'asunto',
                        'Asunto',
                        formData.asunto,
                        'subject',
                        [
                            { value: '', label: 'Selecciona un asunto' },
                            { value: 'consulta', label: 'Consulta general' },
                            { value: 'cotizacion', label: 'Solicitar cotización' },
                            { value: 'soporte', label: 'Soporte técnico' },
                            { value: 'garantia', label: 'Garantía' },
                            { value: 'reclamo', label: 'Reclamo' },
                            { value: 'otro', label: 'Otro' }
                        ],
                        errors.asunto,
                        true
                    )}
                </div>

                {/* Fila 3: Mensaje en ancho completo */}
                {renderTextarea(
                    'mensaje',
                    'mensaje',
                    'Mensaje',
                    formData.mensaje,
                    'message',
                    errors.mensaje,
                    'Escribe tu mensaje aquí...',
                    true,
                    6
                )}

                {/* Botón de envío principal usando componente Button personalizado */}
                <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={isSubmitting}
                    icon="send"
                    iconPosition="left"
                    className={styles.submitButton}
                >
                    {isSubmitting ? 'Enviando mensaje...' : 'Enviar Mensaje'}
                </Button>

                <p className={styles.formFooter}>
                    * Campos requeridos
                </p>
            </form>
        </div>
    );
};

export default ContactForm;
