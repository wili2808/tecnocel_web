import styles from '../../styles/HeroSection.module.css';

const HeroSection = () => (
  <section className={styles.heroSection}>
    <div className={styles.heroContainer}>
      <h1 className={styles.heroTitle}>
        MAC WIL Creaciones e Impresiones
      </h1>
      <p className={styles.heroDescription}>
        Expertos en confección, sublimación y bordados. Creamos prendas únicas con la mejor calidad.
      </p>
    </div>
  </section>
);

export default HeroSection; 