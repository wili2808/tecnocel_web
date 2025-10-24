import React, { useState } from 'react';
import { FiSend, FiUser, FiMail, FiMessageSquare, FiPhone } from 'react-icons/fi';
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
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        telefono: '',
        asunto: '',
        mensaje: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Validación de campos
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Nombre
        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        } else if (formData.nombre.trim().length < 3) {
            newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
        }

        // Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            newErrors.email = 'El email es requerido';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }

        // Teléfono (opcional pero si se ingresa debe ser válido)
        if (formData.telefono.trim()) {
            const phoneRegex = /^[0-9\s\-\+\(\)]+$/;
            if (!phoneRegex.test(formData.telefono)) {
                newErrors.telefono = 'Teléfono inválido';
            }
        }

        // Asunto
        if (!formData.asunto.trim()) {
            newErrors.asunto = 'El asunto es requerido';
        }

        // Mensaje
        if (!formData.mensaje.trim()) {
            newErrors.mensaje = 'El mensaje es requerido';
        } else if (formData.mensaje.trim().length < 10) {
            newErrors.mensaje = 'El mensaje debe tener al menos 10 caracteres';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Manejo de cambios en inputs
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Limpiar error del campo cuando el usuario empieza a escribir
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }

        // Resetear status de envío si hay cambios
        if (submitStatus !== 'idle') {
            setSubmitStatus('idle');
        }
    };

    // Manejo del envío del formulario
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus('idle');

        try {
            // TODO: Implementar llamada a API real
            // const response = await fetch('/api/contacto', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(formData)
            // });

            // Simulación de envío (reemplazar con API real)
            await new Promise(resolve => setTimeout(resolve, 1500));

            console.log('Datos del formulario:', formData);

            setSubmitStatus('success');
            setFormData({
                nombre: '',
                email: '',
                telefono: '',
                asunto: '',
                mensaje: ''
            });

            if (onSubmitSuccess) {
                onSubmitSuccess();
            }

            // Resetear mensaje de éxito después de 5 segundos
            setTimeout(() => {
                setSubmitStatus('idle');
            }, 5000);

        } catch (error) {
            console.error('Error al enviar formulario:', error);
            setSubmitStatus('error');

            // Resetear mensaje de error después de 5 segundos
            setTimeout(() => {
                setSubmitStatus('idle');
            }, 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className={`${styles.contactForm} ${className}`}
            noValidate
        >
            <div className={styles.formHeader}>
                <h3 className={styles.formTitle}>Envíanos un mensaje</h3>
                <p className={styles.formSubtitle}>
                    Completa el formulario y te responderemos a la brevedad
                </p>
            </div>

            <div className={styles.formGrid}>
                {/* Nombre */}
                <div className={styles.formGroup}>
                    <label htmlFor="nombre" className={styles.label}>
                        <FiUser className={styles.labelIcon} />
                        Nombre completo *
                    </label>
                    <input
                        type="text"
                        id="nombre"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        className={`${styles.input} ${errors.nombre ? styles.inputError : ''}`}
                        placeholder="Juan Pérez"
                        disabled={isSubmitting}
                    />
                    {errors.nombre && (
                        <span className={styles.errorMessage}>{errors.nombre}</span>
                    )}
                </div>

                {/* Email */}
                <div className={styles.formGroup}>
                    <label htmlFor="email" className={styles.label}>
                        <FiMail className={styles.labelIcon} />
                        Email *
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                        placeholder="juan@ejemplo.com"
                        disabled={isSubmitting}
                    />
                    {errors.email && (
                        <span className={styles.errorMessage}>{errors.email}</span>
                    )}
                </div>

                {/* Teléfono */}
                <div className={styles.formGroup}>
                    <label htmlFor="telefono" className={styles.label}>
                        <FiPhone className={styles.labelIcon} />
                        Teléfono (opcional)
                    </label>
                    <input
                        type="tel"
                        id="telefono"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleChange}
                        className={`${styles.input} ${errors.telefono ? styles.inputError : ''}`}
                        placeholder="+54 362 XXX-XXXX"
                        disabled={isSubmitting}
                    />
                    {errors.telefono && (
                        <span className={styles.errorMessage}>{errors.telefono}</span>
                    )}
                </div>

                {/* Asunto */}
                <div className={styles.formGroup}>
                    <label htmlFor="asunto" className={styles.label}>
                        <FiMessageSquare className={styles.labelIcon} />
                        Asunto *
                    </label>
                    <select
                        id="asunto"
                        name="asunto"
                        value={formData.asunto}
                        onChange={handleChange}
                        className={`${styles.select} ${errors.asunto ? styles.inputError : ''}`}
                        disabled={isSubmitting}
                    >
                        <option value="">Selecciona un asunto</option>
                        <option value="consulta">Consulta general</option>
                        <option value="cotizacion">Solicitar cotización</option>
                        <option value="soporte">Soporte técnico</option>
                        <option value="garantia">Garantía</option>
                        <option value="reclamo">Reclamo</option>
                        <option value="otro">Otro</option>
                    </select>
                    {errors.asunto && (
                        <span className={styles.errorMessage}>{errors.asunto}</span>
                    )}
                </div>
            </div>

            {/* Mensaje */}
            <div className={styles.formGroup}>
                <label htmlFor="mensaje" className={styles.label}>
                    <FiMessageSquare className={styles.labelIcon} />
                    Mensaje *
                </label>
                <textarea
                    id="mensaje"
                    name="mensaje"
                    value={formData.mensaje}
                    onChange={handleChange}
                    className={`${styles.textarea} ${errors.mensaje ? styles.inputError : ''}`}
                    placeholder="Escribe tu mensaje aquí..."
                    rows={6}
                    disabled={isSubmitting}
                />
                {errors.mensaje && (
                    <span className={styles.errorMessage}>{errors.mensaje}</span>
                )}
            </div>

            {/* Mensajes de estado */}
            {submitStatus === 'success' && (
                <div className={styles.successMessage}>
                    ✅ ¡Mensaje enviado exitosamente! Te responderemos pronto.
                </div>
            )}

            {submitStatus === 'error' && (
                <div className={styles.errorMessageBox}>
                    ❌ Hubo un error al enviar el mensaje. Por favor, intenta nuevamente.
                </div>
            )}

            {/* Botón de envío */}
            <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <>
                        <span className={styles.spinner} />
                        Enviando...
                    </>
                ) : (
                    <>
                        <FiSend className={styles.buttonIcon} />
                        Enviar mensaje
                    </>
                )}
            </button>

            <p className={styles.formFooter}>
                * Campos requeridos
            </p>
        </form>
    );
};

export default ContactForm;
