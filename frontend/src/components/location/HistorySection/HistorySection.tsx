import React from 'react';
import { FiMapPin, FiPhone, FiClock, FiMail } from 'react-icons/fi';
import { useConfig } from '../../../contexts/ConfigContext';
import styles from './HistorySection.module.css';

interface HistorySectionProps {
    title?: string;
    description?: string;
    showContactInfo?: boolean;
}

const HistorySection: React.FC<HistorySectionProps> = ({
    title,
    description,
    showContactInfo = true
}) => {
    const { getConfig } = useConfig();
    
    // Obtener valores dinámicos
    const siteTitle = getConfig('site_title', 'TecnoCel');
    const siteDescription = getConfig('site_description', 'Tu destino de confianza para productos tecnológicos.');
    const siteAddress = getConfig('site_address', 'Resistencia, Chaco, Argentina');
    const sitePhone = getConfig('site_phone', '+54 362 000-0000');
    const siteHours = getConfig('site_hours', 'Lun - Vie: 9:00 - 20:00 / Sáb: 9:00 - 13:00');
    const siteEmail = getConfig('site_email', 'info@tecnocel.com');

    const displayTitle = title || `${siteTitle} - Tu Tienda de Tecnología`;
    const displayDescription = description || siteDescription;

    return (
        <div className={styles.historySection}>
            <div className={styles.header}>
                <h2 className={styles.title}>{displayTitle}</h2>
                <p className={styles.description}>{displayDescription}</p>
            </div>

            {showContactInfo && (
                <div className={styles.contactInfo}>
                    <div className={styles.contactItem}>
                        <div className={styles.iconWrapper}>
                            <FiMapPin className={styles.icon} />
                        </div>
                        <div className={styles.contactText}>
                            <h3>Ubicación</h3>
                            <p>{siteAddress}</p>
                        </div>
                    </div>

                    <div className={styles.contactItem}>
                        <div className={styles.iconWrapper}>
                            <FiPhone className={styles.icon} />
                        </div>
                        <div className={styles.contactText}>
                            <h3>Teléfono</h3>
                            <p>{sitePhone}</p>
                        </div>
                    </div>

                    <div className={styles.contactItem}>
                        <div className={styles.iconWrapper}>
                            <FiClock className={styles.icon} />
                        </div>
                        <div className={styles.contactText}>
                            <h3>Horarios</h3>
                            <p>{siteHours}</p>
                        </div>
                    </div>

                    <div className={styles.contactItem}>
                        <div className={styles.iconWrapper}>
                            <FiMail className={styles.icon} />
                        </div>
                        <div className={styles.contactText}>
                            <h3>Email</h3>
                            <p>{siteEmail}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistorySection;
 