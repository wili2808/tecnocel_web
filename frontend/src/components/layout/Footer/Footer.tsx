import { FaInstagram, FaFacebookF, FaWhatsapp, FaEnvelope, FaPhoneAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useConfig } from '../../../contexts/ConfigContext';
import styles from './Footer.module.css';

const Footer = () => {
    const { getConfig } = useConfig();
    
    const siteTitle = getConfig('site_title', 'TECNOCEL');
    const siteDescription = getConfig('site_description', 'Tu tienda de confianza para tecnología de vanguardia.');
    const whatsappNumber = getConfig('whatsapp_number', '');
    const instagramUrl = getConfig('instagram_url', '#');
    const facebookUrl = getConfig('facebook_url', '#');
    const siteEmail = getConfig('site_email', 'contacto@tecnocel.com');
    const sitePhone = getConfig('site_phone', '');

    return (
        <footer className={`${styles.footer} theme-transition`}>
            <div className={styles.footerContainer}>
                <div className={styles.footerMain}>
                    {/* Brand & Contact Section */}
                    <div className={styles.brandSection}>
                        <h3 className={styles.footerTitle}>{siteTitle.toUpperCase()}</h3>
                        <p className={styles.footerDescription}>{siteDescription}</p>
                        
                        <div className={styles.quickContact}>
                            <div className={styles.contactItem}>
                                <FaEnvelope className={styles.contactIcon} />
                                <span>{siteEmail}</span>
                            </div>
                            {sitePhone && (
                                <div className={styles.contactItem}>
                                    <FaPhoneAlt className={styles.contactIcon} />
                                    <span>{sitePhone}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Social Media Section - Tugo Style */}
                    <div className={styles.socialSection}>
                        <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                            <FaInstagram /> <span>Instagram</span>
                        </a>
                        <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                            <FaFacebookF /> <span>Facebook</span>
                        </a>
                        <a href={`https://wa.me/${whatsappNumber || '5491100000000'}`} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                            <FaWhatsapp /> <span>WhatsApp</span>
                        </a>
                    </div>
                </div>

                <div className={styles.footerBottom}>
                    <div className={styles.copyright}>
                        &copy; {new Date().getFullYear()} {siteTitle.toUpperCase()} &bull; FINANCIADO POR LA COMUNIDAD
                    </div>
                    <div className={styles.legalLinks}>
                        <Link to="/politica-de-privacidad">POLÍTICA DE PRIVACIDAD</Link>
                        <Link to="/terminos-y-condiciones">TÉRMINOS</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
 