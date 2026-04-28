/**
 * FeaturedProductCard — Tarjeta horizontal premium para la home
 *
 * Diseño "conversion-oriented":
 * - Imagen grande alternando izquierda/derecha según índice (prop `index`)
 * - Precio como foco visual dominante (font 2xl+, color primario)
 * - Badge de oferta con animación de pulso sutil
 * - Sección de características rápidas con iconos Lucide
 * - Botón CTA con gradiente sky→cyan
 * - Compatible con ProductCardProps + todas las funcionalidades del carrito
 */
import React, { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  Zap,
  Star,
  ShoppingCart,
  Check,
  PackageCheck,
  Clock,
} from 'lucide-react';
import ProductImage from '../ProductImage';
import CartIndicator from '../../cart/CartIndicator';
import OfferIndicator from '../OfferIndicator';
import FavoriteButtonReusable from '../FavoriteButtonReusable';
import { useCarrito } from '../../../contexts/CarritoContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { useTipoCambio } from '../../../contexts/TipoCambioContext';
import { formatARS } from '../../../utils/formatPrecio';
import type { ProductCardProps } from '../../../types';

import styles from './FeaturedProductCard.module.css';

// Características rápidas por defecto — se muestran cuando el producto
// no tiene características propias en la respuesta del backend
const DEFAULT_FEATURES = [
  { icon: ShieldCheck, label: 'Garantía oficial' },
  { icon: Truck,       label: 'Envío rápido' },
  { icon: Zap,         label: 'Stock disponible' },
  { icon: Star,        label: 'Producto destacado' },
];

interface FeaturedProductCardProps extends ProductCardProps {
  /** Índice en la lista: determina si la imagen va a la izquierda (par) o derecha (impar) */
  index?: number;
  /** Características rápidas opcionales para este producto */
  quickFeatures?: { icon: React.ElementType; label: string }[];
}

const FeaturedProductCard: React.FC<FeaturedProductCardProps> = ({
  id_producto,
  nombre,
  descripcion,
  imagen_url,
  imagenes,
  precio_venta,
  stock,
  className,
  precio_original,
  precio_oferta,
  en_oferta,
  index = 0,
  quickFeatures,
}) => {
  // ============================================================================
  // HOOKS
  // ============================================================================
  const navigate = useNavigate();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isOutOfStock] = useState(stock <= 0);

  const { agregarItem, canAddMoreOfProduct, sincronizarCarrito } = useCarrito();
  const { isAuthenticated, userType } = useAuth();
  const { showNotification } = useNotification();
  const { tipoCambio } = useTipoCambio();

  // ============================================================================
  // CÁLCULOS MEMOIZADOS
  // ============================================================================
  const priceInfo = useMemo(() => {
    const current  = precio_oferta || Number(precio_venta);
    const original = precio_original || Number(precio_venta);
    const hasDiscount = !!(precio_oferta && precio_oferta < Number(precio_venta));

    return {
      current,
      original,
      hasDiscount,
      discountPercentage: hasDiscount
        ? Math.round(((Number(precio_venta) - precio_oferta!) / Number(precio_venta)) * 100)
        : 0,
    };
  }, [precio_venta, precio_original, precio_oferta]);

  const features = quickFeatures ?? DEFAULT_FEATURES;
  const isImageLeft = index % 2 === 0;
  const cannotAddMore = !canAddMoreOfProduct(id_producto, stock);
  const isOffer = en_oferta || priceInfo.hasDiscount;

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleAddToCart = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      showNotification('Debes iniciar sesión para agregar productos al carrito', 'warning', 3000);
      return;
    }

    if (userType !== 'cliente') {
      showNotification('Inicia sesión como cliente para realizar compras', 'info', 4000, {
        label: 'Ir a login',
        onClick: () => navigate('/login'),
      });
      return;
    }

    if (isOutOfStock) {
      showNotification('Este producto está agotado', 'error', 3000);
      return;
    }

    if (!canAddMoreOfProduct(id_producto, stock)) {
      showNotification(
        `Ya tienes la cantidad máxima disponible (${stock}) en tu carrito`,
        'warning',
        3000,
      );
      return;
    }

    setIsAddingToCart(true);
    try {
      await agregarItem(id_producto, 1);
      setShowSuccess(true);
      showNotification('Producto agregado al carrito', 'success', 2000);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error: any) {
      if (error.message?.includes('Stock insuficiente')) {
        showNotification(error.message, 'error', 4000);
        try { await sincronizarCarrito(); } catch (_) { /* silencioso */ }
      } else {
        showNotification('Error al agregar al carrito', 'error', 3000);
      }
    } finally {
      setIsAddingToCart(false);
    }
  }, [
    id_producto, isAuthenticated, userType, isOutOfStock, stock,
    canAddMoreOfProduct, agregarItem, showNotification, sincronizarCarrito, navigate,
  ]);

  const handleGoToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/carrito');
  }, [navigate]);

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <Link
      to={`/productos/${id_producto}`}
      className={`${styles.cardLink} ${isOutOfStock ? styles.outOfStock : ''} ${className ?? ''}`}
      aria-disabled={isOutOfStock}
      aria-label={`Ver detalles de ${nombre}${isOutOfStock ? ' (Agotado)' : ''}`}
      tabIndex={isOutOfStock ? -1 : 0}
    >
      <article
        className={`${styles.card} ${isImageLeft ? styles.imageLeft : styles.imageRight}`}
        data-out-of-stock={isOutOfStock}
      >
        {/* ── IMAGEN ────────────────────────────────────────────────── */}
        <div className={styles.imagePanel}>
          <ProductImage
            images={imagenes}
            defaultImage={imagen_url}
            alt={`Imagen de ${nombre}`}
            className={styles.productImage}
            mode="simple"
          />

          {/* Badge de oferta — pulso animado */}
          {isOffer && (
            <div className={styles.offerBadge} aria-label="Oferta limitada">
              <Clock size={12} strokeWidth={2.5} />
              <span>Oferta Limitada</span>
            </div>
          )}

          {/* Indicador de descuento porcentual */}
          {priceInfo.hasDiscount && (
            <OfferIndicator
              descuentoPorcentaje={priceInfo.discountPercentage}
              size="large"
              position="top-left"
              showLabel={true}
            />
          )}

          {/* Indicador de carrito */}
          <CartIndicator productId={id_producto} size="small" showQuantity={true} />

          {/* Favorito */}
          <FavoriteButtonReusable
            productId={id_producto}
            productName={nombre}
            size="small"
            position="absolute"
            variant="minimal"
            className={styles.favoriteButton}
          />
        </div>

        {/* ── CONTENIDO ─────────────────────────────────────────────── */}
        <div className={styles.contentPanel}>

          {/* Precio — foco visual dominante */}
          <div className={styles.priceBlock}>
            <span className={styles.priceMain}>
              {formatARS(priceInfo.current, tipoCambio)}
            </span>
            {priceInfo.hasDiscount && (
              <span className={styles.priceOriginal}>
                {formatARS(priceInfo.original, tipoCambio)}
              </span>
            )}
            {priceInfo.hasDiscount && (
              <span className={styles.discountChip}>
                -{priceInfo.discountPercentage}%
              </span>
            )}
          </div>

          {/* Nombre del producto */}
          <h3 className={styles.productName}>{nombre}</h3>

          {/* Descripción */}
          {descripcion && (
            <p className={styles.productDescription}>{descripcion}</p>
          )}

          {/* Características rápidas */}
          <ul className={styles.featuresList} aria-label="Características rápidas">
            {features.slice(0, 4).map(({ icon: Icon, label }) => (
              <li key={label} className={styles.featureItem}>
                <Icon size={14} strokeWidth={2} className={styles.featureIcon} />
                <span>{label}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className={styles.ctaRow}>
            {isOutOfStock ? (
              <button className={`${styles.ctaButton} ${styles.ctaDisabled}`} disabled>
                <PackageCheck size={16} />
                Agotado
              </button>
            ) : showSuccess ? (
              <button className={`${styles.ctaButton} ${styles.ctaSuccess}`} disabled>
                <Check size={16} />
                ¡Agregado al carrito!
              </button>
            ) : cannotAddMore ? (
              <button
                className={`${styles.ctaButton} ${styles.ctaSecondary}`}
                onClick={handleGoToCart}
              >
                <ShoppingCart size={16} />
                Ver carrito
              </button>
            ) : (
              <button
                className={`${styles.ctaButton} ${styles.ctaPrimary}`}
                disabled={isAddingToCart}
                onClick={handleAddToCart}
                aria-label={`Agregar ${nombre} al carrito`}
              >
                {isAddingToCart ? (
                  <>
                    <span className={styles.spinnerIcon} aria-hidden="true" />
                    Agregando...
                  </>
                ) : (
                  <>
                    <ShoppingCart size={16} />
                    Agregar al carrito
                  </>
                )}
              </button>
            )}

            <Link
              to={`/productos/${id_producto}`}
              className={styles.detailLink}
              tabIndex={-1}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Ver detalles de ${nombre}`}
            >
              Ver detalles
            </Link>
          </div>
        </div>
      </article>
    </Link>
  );
};

FeaturedProductCard.displayName = 'FeaturedProductCard';
export default FeaturedProductCard;
