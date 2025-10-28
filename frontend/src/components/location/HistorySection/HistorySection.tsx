import React from 'react';
import { FiMapPin, FiPhone, FiClock, FiMail } from 'react-icons/fi';
import styles from './HistorySection.module.css';

/**
 * Props para el componente HistorySection
 */
interface HistorySectionProps {
    /** Título de la sección (opcional) */
    title?: string;
    /** Descripción o historia (opcional) */
    description?: string;
    /** Información de contacto (opcional) */
    showContactInfo?: boolean;
}

/**
 * HistorySection - Componente de historia y ubicación de la empresa
 *
 * Muestra la historia de la empresa y opcionalmente información de contacto
 *
 * @component
 * @example
 * ```tsx
 * <HistorySection
 *   title="Nuestra Historia"
 *   description="TecnoCel en Resistencia..."
 *   showContactInfo={true}
 * />
 * ```
 */
const HistorySection: React.FC<HistorySectionProps> = ({
    title = "TecnoCel - Tu Tienda de Tecnología",
    description = "TecnoCel es tu destino de confianza para productos tecnológicos en Resistencia, Chaco. Ofrecemos una amplia gama de dispositivos, accesorios y soluciones tecnológicas para satisfacer todas tus necesidades. Con años de experiencia en el mercado, nos enorgullecemos de brindar productos de calidad y un servicio excepcional a nuestra comunidad.",
    showContactInfo = true
}) => {
    return (
        <div className={styles.historySection}>
            <div className={styles.header}>
                <h2 className={styles.title}>{title}</h2>
                <p className={styles.description}>{description}</p>
            </div>

            {showContactInfo && (
                <div className={styles.contactInfo}>
                    <div className={styles.contactItem}>
                        <div className={styles.iconWrapper}>
                            <FiMapPin className={styles.icon} />
                        </div>
                        <div className={styles.contactText}>
                            <h3>Ubicación</h3>
                            <p>Resistencia, Chaco, Argentina</p>
                        </div>
                    </div>

                    <div className={styles.contactItem}>
                        <div className={styles.iconWrapper}>
                            <FiPhone className={styles.icon} />
                        </div>
                        <div className={styles.contactText}>
                            <h3>Teléfono</h3>
                            <p>+54 362 XXX-XXXX</p>
                        </div>
                    </div>

                    <div className={styles.contactItem}>
                        <div className={styles.iconWrapper}>
                            <FiClock className={styles.icon} />
                        </div>
                        <div className={styles.contactText}>
                            <h3>Horarios</h3>
                            <p>Lun - Vie: 9:00 - 20:00 / Sáb: 9:00 - 13:00</p>
                        </div>
                    </div>

                    <div className={styles.contactItem}>
                        <div className={styles.iconWrapper}>
                            <FiMail className={styles.icon} />
                        </div>
                        <div className={styles.contactText}>
                            <h3>Email</h3>
                            <p>info@tecnocel.com</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistorySection; 