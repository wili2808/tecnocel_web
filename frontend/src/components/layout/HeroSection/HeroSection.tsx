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
    title = 'Tecnología que conecta con tu mundo.',
    description = 'Domina el ecosistema digital con los equipos más potentes del mercado, solo en TECNOCEL',
  }) => {
    return (
      <section className={`${styles.heroSection} ${className || ''}`}>
        <div className={styles.heroContainer}>
          <h1 className={styles.heroTitle}>{title}</h1>
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
        </div>
      </section>
    );
  },
);

HeroSection.displayName = 'HeroSection';

export default HeroSection;
