/**
 * Componente BrandCard - Tarjeta de marca para vista de cuadrícula
 * Muestra logo, nombre y descripción de la marca
 * Navegación al catálogo filtrado por marca
 */
import React, { useState } from 'react';
import styles from './BrandCard.module.css';
import type { Marca } from '../../../types';

interface BrandCardProps {
  brand: Marca;
  onClick?: (brandId: number) => void;
}

/**
 * Componente que renderiza una tarjeta individual de marca
 * @param brand - Datos de la marca a mostrar
 * @param onClick - Callback al hacer clic en la tarjeta
 */
const BrandCard: React.FC<BrandCardProps> = ({
  brand,
  onClick
}) => {
  // ============================================================================
  // ESTADOS LOCALES
  // ============================================================================
  const [imageError, setImageError] = useState(false);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Maneja el clic en la tarjeta
   * Ejecuta el callback si existe
   */
  const handleClick = () => {
    if (onClick) {
      onClick(brand.id_marca);
    }
  };

  /**
   * Maneja errores de carga de imagen
   * Muestra placeholder cuando la imagen no se puede cargar
   */
  const handleImageError = () => {
    setImageError(true);
  };

  /**
   * Retorna la URL del logo de la marca
   * logo_marca ya llega como URL completa desde la API
   * Retorna placeholder si no hay logo o si hubo error
   */
  const getLogoUrl = () => {
    if (imageError || !brand.logo_marca) {
      return '/placeholder.svg';
    }
    return brand.logo_marca;
  };

  /**
   * Trunca la descripción si es muy larga
   * Máximo 120 caracteres
   */
  const getTruncatedDescription = () => {
    if (!brand.descripcion_marca) return '';

    const maxLength = 120;
    if (brand.descripcion_marca.length <= maxLength) {
      return brand.descripcion_marca;
    }

    return brand.descripcion_marca.substring(0, maxLength) + '...';
  };

  // ============================================================================
  // RENDERIZADO
  // ============================================================================

  return (
    <div
      className={styles.brandCard}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
      aria-label={`Ver productos de ${brand.nombre_marca}`}
    >
      {/* Logo de la marca */}
      <div className={styles.logoContainer}>
        <img
          src={getLogoUrl()}
          alt={`Logo de ${brand.nombre_marca}`}
          className={styles.logo}
          onError={handleImageError}
          loading="lazy"
        />
      </div>

      {/* Información de la marca */}
      <div className={styles.content}>
        <h3 className={styles.brandName}>{brand.nombre_marca}</h3>

        {brand.descripcion_marca && (
          <p className={styles.description}>
            {getTruncatedDescription()}
          </p>
        )}
      </div>

      {/* Overlay de hover mejorado */}
      <div className={styles.hoverOverlay}>
        <div className={styles.overlayContent}>
          <span className="material-icons" style={{ fontSize: '48px', color: 'white' }}>
            storefront
          </span>
          <span className={styles.viewText}>Ver Productos</span>
          <div className={styles.viewButton}>
            <span>Explorar</span>
            <span className="material-icons">arrow_forward</span>
          </div>
        </div>
      </div>
    </div>
  );
};

BrandCard.displayName = 'BrandCard';

export default BrandCard;
