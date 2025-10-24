/**
 * Página Brands - Catálogo de marcas disponibles
 * Muestra un grid de marcas con logos y contadores de productos
 * Permite navegar al catálogo de productos filtrado por marca seleccionada
 */
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BrandGrid from '../../components/brand/BrandGrid';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useBrands } from '../../hooks/useBrands';
import styles from './Brands.module.css';

/**
 * Configuración de notificaciones toast
 */
const TOAST_CONFIG = {
  position: "top-center" as const,
  autoClose: 3000,
  hideProgressBar: false,
  newestOnTop: true,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  draggable: true,
  pauseOnHover: true,
  theme: "light" as const,
  "aria-label": "Notificaciones del sistema"
};

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
  const { brands, loading, error, productCounts } = useBrands();

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
    [navigate]
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
        <ToastContainer {...TOAST_CONFIG} />
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
        <ToastContainer {...TOAST_CONFIG} />
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className={styles.errorTitle}>Error al cargar marcas</h2>
          <p className={styles.errorMessage}>{error}</p>
          <button
            className={styles.retryButton}
            onClick={() => window.location.reload()}
          >
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
      <ToastContainer {...TOAST_CONFIG} />

      {/* Header de la página */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Nuestras Marcas</h1>
          <p className={styles.subtitle}>
            Explora productos de las mejores marcas tecnológicas del mercado
          </p>
          {brands.length > 0 && (
            <div className={styles.statsBar}>
              <span className={styles.stat}>
                <strong>{brands.length}</strong> marcas disponibles
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Grid de marcas */}
      <div className={styles.brandsContainer}>
        <BrandGrid
          brands={brands}
          loading={loading}
          onBrandClick={handleBrandClick}
          productCounts={productCounts}
        />
      </div>
    </div>
  );
};

export default Brands; 