import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Maintenance.module.css';
import { useConfig } from '../../contexts/ConfigContext';
import { configuracionService } from '../../services/configuracionService';
import { FaFacebookF, FaInstagram, FaWhatsapp } from 'react-icons/fa';

const Maintenance: React.FC = () => {
  const { getConfig } = useConfig();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const data = await configuracionService.getPublic();
        const entry = data.find(c => c.clave === 'maintenance_mode');
        if (!cancelled && entry?.valor === '0') {
          navigate('/', { replace: true });
        }
      } catch {
        // Silently retry
      }
    };

    check();

    const interval = setInterval(check, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [navigate]);
  
  const siteName = getConfig('site_title', 'TecnoCel');
  const facebook = getConfig('facebook_url', '');
  const instagram = getConfig('instagram_url', '');
  const whatsapp = getConfig('whatsapp_number', '');

  return (
    <div className={styles.container}>
      <div className={styles.grid}></div>
      
      <main className={styles.content}>
        <div className={styles.logoContainer}>
          <h1 className={styles.logo} data-text={siteName}>{siteName}</h1>
          <div className={styles.pulse}></div>
        </div>
        
        <div className={styles.textBlock}>
          <h2 className={styles.title}>Mantenimiento en curso</h2>
          <p className={styles.subtitle}>
            Estamos actualizando nuestra plataforma para brindarte una mejor experiencia tecnológica.
          </p>
        </div>

        <div className={styles.statusCard}>
          <div className={styles.indicator}>
            <span className={styles.dot}></span>
            <span className={styles.statusText}>Optimizando servicios</span>
          </div>
          <p className={styles.estimatedTime}>Volveremos muy pronto.</p>
        </div>

        <footer className={styles.footer}>
          <p>Síguenos para novedades:</p>
          <div className={styles.socials}>
            {facebook && (
              <a href={facebook} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                <FaFacebookF />
              </a>
            )}
            {instagram && (
              <a href={instagram} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                <FaInstagram />
              </a>
            )}
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
                <FaWhatsapp />
              </a>
            )}
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Maintenance;
