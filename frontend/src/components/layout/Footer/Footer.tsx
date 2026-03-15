import { FaInstagram, FaFacebookF, FaTwitter } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

const Footer = () => {
    return (
        <footer className={`${styles.footer} theme-transition`}>
            <div className={`${styles.footerContainer} ${styles.container}`}>
                <div className={styles.footerGrid}>
                    <div className={styles.footerBrand}>
                        <h3 className={styles.footerTitle}>TECNOCEL</h3>
                        <p className={styles.footerDescription}>
                            Tu tienda de confianza para los últimos dispositivos y accesorios electrónicos.
                        </p>
                        <div className={styles.socialLinks}>
                            <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                <FaInstagram />
                            </a>
                            <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                                <FaFacebookF />
                            </a>
                            <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                                <FaTwitter />
                            </a>
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
                    &copy; {new Date().getFullYear()} TECNOCEL. Todos los derechos reservados.
                </div>
            </div>
        </footer>
    );
};

export default Footer; 