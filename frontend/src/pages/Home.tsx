import { useEffect, useCallback } from 'react';
import { FiZap, FiShield, FiRefreshCw, FiHeadphones } from 'react-icons/fi';
import HeroSection from '../components/layout/HeroSection';
import FeaturedProducts from '../components/product/FeaturedProducts';
import CTASection from '../components/common/CTASection';
import LocationSection from '../components/location/LocationSection';
import { useProductActions } from '../hooks/useProductActions';
import { useOfertasGlobal } from '../hooks/useOfertasGlobal';
import styles from './Home.module.css';

// Pilares de valor de la marca
const FEATURES = [
  { icon: FiZap,        title: 'Envío rápido',        desc: 'En 24-48 horas' },
  { icon: FiShield,     title: 'Garantía oficial',     desc: 'Productos certificados' },
  { icon: FiHeadphones, title: 'Soporte dedicado',     desc: 'Lun–Vie 9–20 hs' },
  { icon: FiRefreshCw,  title: 'Devolución fácil',     desc: '30 días sin preguntas' },
] as const;

const Home = () => {
  const { featuredProducts, productsLoading, productsError, loadFeaturedProducts } = useProductActions();
  const { loadOfertas, ofertas } = useOfertasGlobal();

  const loadProducts = useCallback(() => {
    if (!featuredProducts.length && !productsLoading) loadFeaturedProducts(8);
  }, [featuredProducts.length, productsLoading, loadFeaturedProducts]);

  const loadOfertasIfNeeded = useCallback(() => {
    if (!ofertas.length) loadOfertas();
  }, [ofertas.length, loadOfertas]);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { loadOfertasIfNeeded(); }, [loadOfertasIfNeeded]);

  return (
    <>
      {/* 1. Hero principal */}
      <HeroSection />

      {/* 2. Franja de pilares de valor */}
      <div className={styles.featuresStrip}>
        <div className={styles.featuresGrid}>
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className={styles.featureItem}>
              <div className={styles.featureIcon}>
                <Icon size={18} />
              </div>
              <div className={styles.featureText}>
                <p className={styles.featureTitle}>{title}</p>
                <p className={styles.featureDesc}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Productos destacados */}
      <FeaturedProducts
        products={featuredProducts}
        title="Destacados"
        loading={productsLoading}
        error={productsError}
      />

      {/* 4. CTA de contacto/cotización — sección oscura editorial */}
      <CTASection
        title="¿Listo para tu próximo equipo?"
        description="Cotización personalizada para empresas, profesionales y proyectos especiales."
        buttonText="Solicitar cotización"
        buttonLink="/contacto"
        variant="gradient"
        icon="arrow"
        secondaryButtonText="Ver catálogo"
        secondaryButtonLink="/productos"
      />

      {/* 5. Ubicación y contacto */}
      <LocationSection />
    </>
  );
};

export default Home;
