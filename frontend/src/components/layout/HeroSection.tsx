import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/HeroSection.module.css';
import { FiArrowRight } from 'react-icons/fi';

interface HeroSectionProps {
  className?: string;
  title?: string;
  description?: string;
}

const HeroSection: React.FC<HeroSectionProps> = memo(({
  className,
  title = 'Tecnología de Vanguardia a tu Alcance',
  description = 'Explora nuestra selección de los mejores gadgets, componentes y accesorios del mercado.'
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
});

HeroSection.displayName = 'HeroSection';

export default HeroSection;