/**
 * Componente ProductInfo - Información detallada del producto
 * Muestra título, descripción, precios, stock y badges de ofertas
 * Incluye formateo de precios argentinos y cálculo de descuentos
 */
import React from 'react';
import type { Product } from '../../../types';
import styles from './ProductInfo.module.css';
import { useTipoCambio } from '../../../contexts/TipoCambioContext';
import { formatARS } from '../../../utils/formatPrecio';

interface ProductInfoProps {
  product: Product;
}

const ProductInfo: React.FC<ProductInfoProps> = ({ product }) => {
  // ============================================================================
  // DESTRUCTURING DE PROPIEDADES
  // ============================================================================
  const {
    nombre,
    descripcion,
    precio_venta,
    Categoria,
    // Campos de ofertas
    precio_original,
    precio_oferta,
    descuento_porcentaje,
    en_oferta,
    ofertas,
  } = product;

  // ============================================================================
  // CÁLCULOS Y VALIDACIONES
  // ============================================================================

  const { tipoCambio } = useTipoCambio();

  // Calcular información de precios y descuentos
  const priceInfo = {
    original: precio_original || Number(precio_venta),
    current: precio_oferta || Number(precio_venta),
    hasDiscount: en_oferta && precio_oferta && precio_oferta < Number(precio_venta),
    discountPercentage:
      descuento_porcentaje ||
      (en_oferta && precio_oferta
        ? Math.round(((Number(precio_venta) - precio_oferta) / Number(precio_venta)) * 100)
        : 0),
  };

  // Obtener información de la oferta activa (primera oferta disponible)
  const activeOffer = ofertas && ofertas.length > 0 ? ofertas[0] : null;

  // ============================================================================
  // LOGS DE DESARROLLO
  // ============================================================================

  // Log de desarrollo para verificar datos de ofertas
  if (process.env.NODE_ENV === 'development' && en_oferta) {
    console.log('🛍️ ProductInfo - Producto en oferta:', {
      nombre,
      precio_original: priceInfo.original,
      precio_oferta: priceInfo.current,
      descuento: priceInfo.discountPercentage,
      en_oferta,
      ofertas: ofertas?.length || 0,
    });
  }

  // ============================================================================
  // RENDERIZADO
  // ============================================================================

  return (
    <div className={styles.productInfo}>
      {/* Información básica del producto */}
      <div className={styles.basicInfo}>
        {/* Encabezado con título y badges */}
        <div className={styles.header}>
          <h1 className={styles.productTitle}>{nombre}</h1>
          <div className={styles.badgesContainer}>
            {/* Badge de categoría */}
            {Categoria && <span className={styles.categoryBadge}>{Categoria.nombre_categoria}</span>}

            {/* Badge de descuento - Solo visible si hay oferta */}
            {priceInfo.hasDiscount && <span className={styles.discountBadge}>-{priceInfo.discountPercentage}%</span>}
          </div>
        </div>

        {/* Metadatos del producto */}
        <div className={styles.metadata}>
          {/* Nombre de la oferta activa */}
          {activeOffer && <span className={styles.offerName}>{activeOffer.nombre_oferta}</span>}
        </div>

        {/* Sección de precios y stock */}
        <div className={styles.priceSection}>
          <div className={styles.priceContainer}>
            {priceInfo.hasDiscount ? (
              <>
                {/* Precio original tachado cuando hay descuento */}
                <span className={styles.priceOriginal}>{formatARS(priceInfo.original, tipoCambio)}</span>

                {/* Precio actual con descuento */}
                <span className={styles.priceCurrent}>{formatARS(priceInfo.current, tipoCambio)}</span>
              </>
            ) : (
              /* Precio único cuando no hay descuento */
              <span className={styles.priceCurrent}>{formatARS(priceInfo.current, tipoCambio)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Descripción del producto - Solo visible si existe */}
      {descripcion && (
        <div className={styles.descriptionSection}>
          <h3 className={styles.sectionTitle}>Descripción</h3>
          <p className={styles.description}>{descripcion}</p>
        </div>
      )}
    </div>
  );
};

export default ProductInfo;
