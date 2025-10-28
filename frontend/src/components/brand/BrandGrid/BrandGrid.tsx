/**
 * Componente BrandGrid - Grid responsive de tarjetas de marcas
 * Muestra una cuadrícula adaptativa de marcas con estados de carga y vacío
 * Maneja la interacción con las marcas y navegación al catálogo
 */
import React from 'react';
import BrandCard from '../BrandCard';
import styles from './BrandGrid.module.css';
import type { Marca } from '../../../types';

interface BrandGridProps {
  brands: Marca[];
  loading?: boolean;
  onBrandClick?: (brandId: number) => void;
}

/**
 * Componente que renderiza un grid responsivo de marcas
 * @param brands - Array de marcas a mostrar
 * @param loading - Indica si se están cargando las marcas
 * @param onBrandClick - Callback al hacer clic en una marca
 */
const BrandGrid: React.FC<BrandGridProps> = ({
  brands,
  loading = false,
  onBrandClick
}) => {
  // ============================================================================
  // RENDERIZADO DE ESTADOS
  // ============================================================================

  /**
   * Estado de carga - Skeleton loaders
   */
  if (loading) {
    return (
      <div className={styles.gridContainer}>
        {[...Array(6)].map((_, index) => (
          <div key={index} className={styles.skeletonCard}>
            <div className={styles.skeletonLogo}></div>
            <div className={styles.skeletonTitle}></div>
            <div className={styles.skeletonDescription}></div>
          </div>
        ))}
      </div>
    );
  }

  /**
   * Estado vacío - Sin marcas disponibles
   */
  if (!brands || brands.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>
          <svg
            width="120"
            height="120"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M20 7h-9" />
            <path d="M14 17H5" />
            <circle cx="17" cy="17" r="3" />
            <circle cx="7" cy="7" r="3" />
          </svg>
        </div>
        <h3 className={styles.emptyTitle}>No hay marcas disponibles</h3>
        <p className={styles.emptyDescription}>
          Por el momento no tenemos marcas para mostrar. Vuelve pronto para ver
          nuestras marcas disponibles.
        </p>
      </div>
    );
  }

  // ============================================================================
  // RENDERIZADO PRINCIPAL
  // ============================================================================

  return (
    <div className={styles.gridContainer}>
      {brands.map((brand) => (
        <BrandCard
          key={brand.id_marca}
          brand={brand}
          onClick={onBrandClick}
        />
      ))}
    </div>
  );
};

BrandGrid.displayName = 'BrandGrid';

export default BrandGrid;
