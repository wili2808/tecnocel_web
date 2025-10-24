import React from 'react';
import { FaWhatsapp, FaFacebookF, FaInstagram, FaEnvelope, FaPhone } from 'react-icons/fa';
import styles from './ContactMethods.module.css';

/**
 * Props para el componente ContactMethods
 */
interface ContactMethodsProps {
    /** Clases CSS adicionales */
    className?: string;
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
    const contactMethods = [
        {
            icon: FaWhatsapp,
            title: 'WhatsApp',
            description: 'Chatea con nosotros',
            value: '+54 362 XXX-XXXX',
            link: 'https://wa.me/54362XXXXXXX',
            color: '#25D366',
            label: 'Abrir WhatsApp'
        },
        {
            icon: FaPhone,
            title: 'Teléfono',
            description: 'Llámanos directamente',
            value: '+54 362 XXX-XXXX',
            link: 'tel:+54362XXXXXXX',
            color: '#0EA5E9',
            label: 'Llamar ahora'
        },
        {
            icon: FaEnvelope,
            title: 'Email',
            description: 'Escríbenos un correo',
            value: 'info@tecnocel.com',
            link: 'mailto:info@tecnocel.com',
            color: '#EA4335',
            label: 'Enviar email'
        },
        {
            icon: FaFacebookF,
            title: 'Facebook',
            description: 'Síguenos en Facebook',
            value: '@TecnoCel',
            link: 'https://facebook.com/tecnocel',
            color: '#1877F2',
            label: 'Ir a Facebook'
        },
        {
            icon: FaInstagram,
            title: 'Instagram',
            description: 'Mira nuestras historias',
            value: '@tecnocel',
            link: 'https://instagram.com/tecnocel',
            color: '#E4405F',
            label: 'Ir a Instagram'
        }
    ];

    return (
        <div className={`${styles.contactMethods} ${className}`}>
            <div className={styles.header}>
                <h2 className={styles.title}>Otros canales de contacto</h2>
                <p className={styles.subtitle}>
                    Elige el método que prefieras para comunicarte con nosotros
                </p>
            </div>

            <div className={styles.methodsGrid}>
                {contactMethods.map((method, index) => (
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
                            <method.icon className={styles.icon} />
                        </div>
                        <div className={styles.methodContent}>
                            <h3 className={styles.methodTitle}>{method.title}</h3>
                            <p className={styles.methodDescription}>{method.description}</p>
                            <p className={styles.methodValue}>{method.value}</p>
                        </div>
                        <div className={styles.arrow}>→</div>
                    </a>
                ))}
            </div>

            <div className={styles.footer}>
                <p className={styles.footerText}>
                    <strong>Horario de atención:</strong> Lunes a Viernes de 9:00 a 20:00hs | Sábados de 9:00 a 13:00hs
                </p>
            </div>
        </div>
    );
};

export default ContactMethods;
