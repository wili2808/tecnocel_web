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
import Input from '../../common/Input/Input';
import TextArea from '../../common/TextArea/TextArea';
import Select from '../../common/Select/Select';
import mensajeService from '../../../services/mensajeService';

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
            const phoneRegex = /^[0-9\s+()-]+$/;
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

        // ✅ VALIDAR FORMULARIO antes de procesar
        if (!validateForm()) {
            showNotification('Por favor corrija los errores en el formulario', 'error');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await mensajeService.enviarMensaje(formData);
            
            showNotification(response.message || 'Mensaje enviado correctamente', 'success');

            // Limpiar formulario
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
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'No se pudo procesar el formulario de contacto';
            showNotification(errorMessage, 'error');
        } finally {
            setIsSubmitting(false);
        }
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
                    <Input
                        id="nombre"
                        name="nombre"
                        label="Nombre completo"
                        icon="person"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        error={errors.nombre}
                        required
                        disabled={isSubmitting}
                        autoComplete="name"
                        placeholder="Juan Pérez"
                    />

                    <Input
                        id="email"
                        name="email"
                        type="email"
                        label="Correo Electrónico"
                        icon="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        error={errors.email}
                        required
                        disabled={isSubmitting}
                        autoComplete="email"
                        placeholder="juan@ejemplo.com"
                    />
                </div>

                {/* Fila 2: Teléfono y Asunto en layout horizontal */}
                <div className={styles.formRow}>
                    <Input
                        id="telefono"
                        name="telefono"
                        type="tel"
                        label="Teléfono"
                        icon="phone"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        error={errors.telefono}
                        disabled={isSubmitting}
                        autoComplete="tel"
                        placeholder="+591 XXX-XXXX"
                    />

                    <Select
                        id="asunto"
                        name="asunto"
                        label="Asunto"
                        icon="subject"
                        value={formData.asunto}
                        onChange={handleInputChange}
                        error={errors.asunto}
                        required
                        disabled={isSubmitting}
                        options={[
                            { value: '', label: 'Selecciona un asunto' },
                            { value: 'consulta', label: 'Consulta general' },
                            { value: 'cotizacion', label: 'Solicitar cotización' },
                            { value: 'soporte', label: 'Soporte técnico' },
                            { value: 'garantia', label: 'Garantía' },
                            { value: 'reclamo', label: 'Reclamo' },
                            { value: 'otro', label: 'Otro' }
                        ]}
                    />
                </div>

                {/* Fila 3: Mensaje en ancho completo */}
                <TextArea
                    id="mensaje"
                    name="mensaje"
                    label="Mensaje"
                    icon="message"
                    value={formData.mensaje}
                    onChange={handleInputChange}
                    error={errors.mensaje}
                    required
                    disabled={isSubmitting}
                    placeholder="Escribe tu mensaje aquí..."
                    rows={6}
                />

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

