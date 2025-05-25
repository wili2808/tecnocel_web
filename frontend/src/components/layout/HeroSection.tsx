import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/HeroSection.module.css';

interface HeroSectionProps {
  className?: string;
  title?: string;
  description?: string;
}

const HeroSection: React.FC<HeroSectionProps> = memo(({
  className,
  title = 'MAC WIL Creaciones e Impresiones',
  description = 'Expertos en confección, sublimación y bordados. Creamos prendas únicas con la mejor calidad.'
}) => {
  return (
    <section className={`${styles.heroSection} ${className || ''}`}>
      <div className={styles.heroContainer}>
        <h1 className={styles.heroTitle}>
          {title}
        </h1>
        <p className={styles.heroDescription}>
          {description}
        </p>
        <div className={styles.ctaContainer}>
          <Link to="/productos" className={styles.primaryCta}>
            Ver Catálogo
          </Link>
          <Link to="/contacto" className={styles.secondaryCta}>
            Contáctanos
          </Link>
        </div>
      </div>
    </section>
  );
});

HeroSection.displayName = 'HeroSection';

export default HeroSection;