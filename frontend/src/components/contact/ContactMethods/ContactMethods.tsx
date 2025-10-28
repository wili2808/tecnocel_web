/**
 * Componente ContactMethods - Métodos alternativos de contacto
 * Muestra tarjetas con diferentes métodos de contacto con estilo consistente
 * Incluye WhatsApp, redes sociales, email directo, etc.
 */
import React from 'react';
import { FaWhatsapp, FaFacebookF, FaInstagram } from 'react-icons/fa';
import styles from './ContactMethods.module.css';

/**
 * Props para el componente ContactMethods
 */
interface ContactMethodsProps {
    /** Clases CSS adicionales */
    className?: string;
}

/**
 * Interfaz para definir los métodos de contacto
 */
interface ContactMethod {
    icon: string | React.ComponentType<any>;
    iconType: 'material' | 'react';
    title: string;
    description: string;
    value: string;
    link: string;
    color: string;
    label: string;
}

/**
 * ContactMethods - Métodos alternativos de contacto
 *
 * Muestra tarjetas con diferentes métodos de contacto: WhatsApp,
 * redes sociales, email directo, etc.
 *
 * @component
 * @example
 * ```tsx
 * <ContactMethods />
 * ```
 */
export const ContactMethods: React.FC<ContactMethodsProps> = ({
    className = ''
}) => {
    const contactMethods: ContactMethod[] = [
        {
            icon: FaWhatsapp,
            iconType: 'react',
            title: 'WhatsApp',
            description: 'Chatea con nosotros',
            value: '+591 XXX-XXXX',
            link: 'https://wa.me/591XXXXXXX',
            color: '#25D366',
            label: 'Abrir WhatsApp'
        },
        {
            icon: 'phone',
            iconType: 'material',
            title: 'Teléfono',
            description: 'Llámanos directamente',
            value: '+591 XXX-XXXX',
            link: 'tel:+591XXXXXXX',
            color: '#0EA5E9',
            label: 'Llamar ahora'
        },
        {
            icon: 'email',
            iconType: 'material',
            title: 'Email',
            description: 'Escríbenos un correo',
            value: 'info@tecnocel.com',
            link: 'mailto:info@tecnocel.com',
            color: '#EA4335',
            label: 'Enviar email'
        },
        {
            icon: FaFacebookF,
            iconType: 'react',
            title: 'Facebook',
            description: 'Síguenos en Facebook',
            value: '@TecnoCel',
            link: 'https://facebook.com/tecnocel',
            color: '#1877F2',
            label: 'Ir a Facebook'
        },
        {
            icon: FaInstagram,
            iconType: 'react',
            title: 'Instagram',
            description: 'Mira nuestras historias',
            value: '@tecnocel',
            link: 'https://instagram.com/tecnocel',
            color: '#E4405F',
            label: 'Ir a Instagram'
        }
    ];

    return (
        <div className={`${styles.methodsCard} ${className}`}>
            {/* Encabezado integrado con título y descripción */}
            <div className={styles.header}>
                <h2 className={styles.title}>Otros canales de contacto</h2>
                <p className={styles.subtitle}>
                    Elige el método que prefieras para comunicarte con nosotros
                </p>
            </div>

            {/* Grid de métodos de contacto */}
            <div className={styles.methodsGrid}>
                {contactMethods.map((method, index) => {
                    const IconComponent = method.iconType === 'react' ? method.icon as React.ComponentType<any> : null;

                    return (
                        <a
                            key={index}
                            href={method.link}
                            target={method.link.startsWith('http') ? '_blank' : undefined}
                            rel={method.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                            className={styles.methodCard}
                            aria-label={method.label}
                            style={{ '--method-color': method.color } as React.CSSProperties}
                        >
                            <div className={styles.iconWrapper}>
                                {method.iconType === 'material' ? (
                                    <span className="material-icons">{method.icon as string}</span>
                                ) : IconComponent ? (
                                    <IconComponent className={styles.reactIcon} />
                                ) : null}
                            </div>
                            <div className={styles.methodContent}>
                                <p className={styles.methodDescription}>{method.description}</p>
                                <p className={styles.methodValue}>{method.value}</p>
                            </div>
                            <span className="material-icons" style={{ color: method.color }}>
                                arrow_forward
                            </span>
                        </a>
                    );
                })}
            </div>

            {/* Footer con horario de atención */}
            <div className={styles.footer}>
                <span className="material-icons" style={{ marginRight: 'var(--spacing-sm)' }}>
                    schedule
                </span>
                <p className={styles.footerText}>
                    <strong>Horario de atención:</strong> Lunes a Viernes de 9:00 a 20:00hs | Sábados de 9:00 a 13:00hs
                </p>
            </div>
        </div>
    );
};

export default ContactMethods;
