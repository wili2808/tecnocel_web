import { FaInstagram, FaFacebookF, FaWhatsapp } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useConfig } from '../../../contexts/ConfigContext';
import styles from './Footer.module.css';

const Footer = () => {
    const { getConfig } = useConfig();
    
    const siteTitle = getConfig('site_title', 'TECNOCEL');
    const siteDescription = getConfig('site_description', 'Tu tienda de confianza para los últimos dispositivos y accesorios electrónicos.');
    const whatsappNumber = getConfig('whatsapp_number', '');
    const instagramUrl = getConfig('instagram_url', '#');
    const facebookUrl = getConfig('facebook_url', '#');

    return (
        <footer className={`${styles.footer} theme-transition`}>
            <div className={`${styles.footerContainer} ${styles.container}`}>
                <div className={styles.footerGrid}>
                    <div className={styles.footerBrand}>
                        <h3 className={styles.footerTitle}>{siteTitle.toUpperCase()}</h3>
                        <p className={styles.footerDescription}>{siteDescription}</p>
                        <div className={styles.socialLinks}>
                            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                <FaInstagram />
                            </a>
                            <a href={facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                                <FaFacebookF />
                            </a>
                            {whatsappNumber && (
                                <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                                    <FaWhatsapp />
                                </a>
                            )}
                        </div>
                    </div>

                    <div className={styles.footerLinks}>
                        <h4 className={styles.linksTitle}>Categorías</h4>
                        <Link to="/productos?categoria=1">Smartphones</Link>
                        <Link to="/productos?categoria=2">Laptops</Link>
                        <Link to="/productos?categoria=3">Tablets</Link>
                        <Link to="/productos?categoria=7">Consolas</Link>
                    </div>

                    <div className={styles.footerLinks}>
                        <h4 className={styles.linksTitle}>Información</h4>
                        <Link to="/nosotros">Sobre Nosotros</Link>
                        <Link to="/contacto">Contacto</Link>
                        <Link to="/politica-de-privacidad">Política de Privacidad</Link>
                        <Link to="/terminos-y-condiciones">Términos y Condiciones</Link>
                    </div>
                </div>

                <div className={styles.footerCopyright}>
                    &copy; {new Date().getFullYear()} {siteTitle.toUpperCase()}. Todos los derechos reservados.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
 