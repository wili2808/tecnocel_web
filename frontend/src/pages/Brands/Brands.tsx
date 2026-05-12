/**
 * Página Brands - Catálogo de marcas disponibles
 * Muestra un grid de marcas con logos y descripciones
 * Permite navegar al catálogo de productos filtrado por marca seleccionada
 */
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandGrid from '../../components/brand/BrandGrid';
import PageMeta from '../../components/common/PageMeta/PageMeta';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useBrands } from '../../hooks/useBrands';
import styles from './Brands.module.css';

/**
 * Página principal de marcas
 * Muestra todas las marcas disponibles en un grid responsive
 * Permite navegar a productos filtrados por marca
 */
const Brands = () => {
  // ============================================================================
  // HOOKS
  // ============================================================================

  const navigate = useNavigate();
  const { brands, loading, error } = useBrands();

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Maneja el clic en una marca
   * Navega al catálogo de productos con filtro de marca aplicado
   */
  const handleBrandClick = useCallback(
    (brandId: number) => {
      navigate(`/productos?marca=${brandId}`);
    },
    [navigate],
  );

  // ============================================================================
  // RENDERIZADO DE ESTADOS
  // ============================================================================

  /**
   * Estado de carga
   */
  if (loading) {
    return (
      <div className={styles.brandsPage}>
        <div className={styles.loadingContainer}>
          <LoadingSpinner size="lg" text="Cargando marcas..." />
        </div>
      </div>
    );
  }

  /**
   * Estado de error
   */
  if (error) {
    return (
      <div className={styles.brandsPage}>
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className={styles.errorTitle}>Error al cargar marcas</h2>
          <p className={styles.errorMessage}>{error}</p>
          <button className={styles.retryButton} onClick={() => window.location.reload()}>
            Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDERIZADO PRINCIPAL
  // ============================================================================

  return (
    <div className={styles.brandsPage}>
      <PageMeta
        title="Marcas"
        description="Explorá todas las marcas disponibles en TecnoCel. Samsung, Apple, Xiaomi, Motorola y más."
        url="/marcas"
      />
      {/* Header de la página */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Tecnología de Primer Nivel</h1>
          <p className={styles.subtitle}>Explora productos de las mejores marcas tecnológicas del mercado</p>

        </div>
      </header>

      {/* Grid de marcas */}
      <div className={styles.brandsContainer}>
        <BrandGrid brands={brands} loading={loading} onBrandClick={handleBrandClick} />
      </div>
    </div>
  );
};

export default Brands;
