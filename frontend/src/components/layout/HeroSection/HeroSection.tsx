import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import styles from './HeroSection.module.css';
import { FiArrowRight } from 'react-icons/fi';

interface HeroSectionProps {
  className?: string;
  title?: string;
  description?: string;
}

const HeroSection: React.FC<HeroSectionProps> = memo(
  ({
    className,
    title,
    description = 'Domina el ecosistema digital con los equipos más potentes del mercado, solo en TECNOCEL',
  }) => {
    return (
      <section className={`${styles.heroSection} ${className || ''}`}>
        <div className={styles.heroContainer}>
          <p className={styles.heroEyebrow}>Tecnología de vanguardia</p>

          {title ? (
            <h1 className={styles.heroTitle}>{title}</h1>
          ) : (
            <h1 className={styles.heroTitle}>
              Tecnología que{' '}
              <span className={styles.accent}>conecta</span>
              {' '}con tu mundo.
            </h1>
          )}

          <p className={styles.heroDescription}>{description}</p>

          <div className={styles.ctaContainer}>
            <Link to="/productos" className={styles.primaryCta}>
              <span>Explorar Productos</span>
              <FiArrowRight />
            </Link>
            <Link to="/ofertas" className={styles.secondaryCta}>
              Ver Ofertas
            </Link>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.statItem}>
              <span className={styles.statNumber}>500+</span>
              <span className={styles.statLabel}>Productos</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statNumber}>10k+</span>
              <span className={styles.statLabel}>Clientes</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.statItem}>
              <span className={styles.statNumber}>5★</span>
              <span className={styles.statLabel}>Valoración</span>
            </div>
          </div>
        </div>
      </section>
    );
  },
);

HeroSection.displayName = 'HeroSection';

export default HeroSection;
