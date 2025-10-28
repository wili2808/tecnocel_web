import HeroSection from '../components/layout/HeroSection';
import FeaturedProducts from '../components/product/FeaturedProducts';
import CTASection from '../components/common/CTASection';
import LocationSection from '../components/location/LocationSection';
import { useProductActions } from '../hooks/useProductActions';
import { useOfertasGlobal } from '../hooks/useOfertasGlobal';
import { useEffect, useCallback } from 'react';

const Home = () => {
  // ============================================================================
  // CONTEXTO DE PRODUCTOS - CARGA PRINCIPAL
  // ============================================================================
  const {
    featuredProducts,
    productsLoading: loading,
    productsError: error,
    loadFeaturedProducts
  } = useProductActions();

  // ============================================================================
  // CONTEXTO DE OFERTAS - CARGA PARA PRODUCTCARDS
  // ============================================================================
  const { loadOfertas, ofertas } = useOfertasGlobal();

  // ============================================================================
  // FUNCIONES ESTABLES PARA EVITAR BUCLE INFINITO
  // ============================================================================

  // Función estable para cargar productos destacados
  const handleLoadFeaturedProducts = useCallback(() => {
    if (featuredProducts.length === 0 && !loading) {
      loadFeaturedProducts(8);
    }
  }, [featuredProducts.length, loading, loadFeaturedProducts]);

  // Función estable para cargar ofertas
  const handleLoadOfertas = useCallback(() => {
    if (ofertas.length === 0) {
      loadOfertas();
    }
  }, [ofertas.length, loadOfertas]);

  // ============================================================================
  // CARGA INTELLIGENTE DE DATOS - ORQUESTACIÓN CENTRALIZADA
  // ============================================================================

  // Cargar productos destacados solo si no están cargados
  useEffect(() => {
    handleLoadFeaturedProducts();
  }, [handleLoadFeaturedProducts]);

  // Cargar ofertas para que ProductCard pueda mostrar precios actualizados
  useEffect(() => {
    handleLoadOfertas();
  }, [handleLoadOfertas]);

  return (
    <>
      <HeroSection />
      <FeaturedProducts
        products={featuredProducts}
        title=""
        loading={loading}
        error={error}
      />
      <CTASection
        title="¿Listo para personalizar tu pedido?"
        description="Contáctanos para obtener una cotización personalizada para tu proyecto."
        buttonText="Solicitar Cotización"
        buttonLink="/contacto"
        variant="gradient"
        icon="mail"
        secondaryButtonText="Ver Catálogo"
        secondaryButtonLink="/productos"
      />
      <LocationSection />
    </>
  );
};

export default Home;
