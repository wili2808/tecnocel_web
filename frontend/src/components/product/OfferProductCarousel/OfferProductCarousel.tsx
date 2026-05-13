/**
 * OfferProductCarousel — Carrusel horizontal premium para la página de Ofertas
 *
 * Framer Motion v12:
 * - AnimatePresence con variants direccionales (entra desde la dirección correcta)
 * - drag="x" nativo para swipe en desktop y mobile (sin touch handlers manuales)
 * - Dots + flechas sincronizados
 * - 1 producto a la vez, card completo (imagen 50% / contenido 50%)
 */
import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Check,
  PackageCheck,
  Clock,
  ShieldCheck,
  Truck,
  Zap,
  Star,
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
import type { Product } from '../../../types';

import styles from './OfferProductCarousel.module.css';

// ── Características por defecto ────────────────────────────────────────────
const DEFAULT_FEATURES = [
  { icon: ShieldCheck, label: 'Garantía oficial' },
  { icon: Truck,       label: 'Envío rápido'     },
  { icon: Zap,         label: 'Stock disponible'  },
  { icon: Star,        label: 'Producto destacado'},
];

// ── Variants de Framer Motion ─────────────────────────────────────────────
// `custom` = dirección: 1 → viene de la derecha | -1 → viene de la izquierda
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      x:       { type: 'spring' as const, stiffness: 300, damping: 30 },
      opacity: { duration: 0.2 },
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0,
    transition: {
      x:       { type: 'spring' as const, stiffness: 300, damping: 30 },
      opacity: { duration: 0.15 },
    },
  }),
};

// ── Tipos ──────────────────────────────────────────────────────────────────
interface OfferProductCarouselProps {
  productos: Product[];
  /** Fecha de fin de la oferta — opcional para mostrar urgencia */
  fechaFin?: string;
}

// ── Sub-componente: Card individual de producto ───────────────────────────
interface ProductSlideProps {
  product: Product;
}

const ProductSlide: React.FC<ProductSlideProps> = ({ product }) => {
  const navigate = useNavigate();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { agregarItem, canAddMoreOfProduct, sincronizarCarrito } = useCarrito();
  const { isAuthenticated, userType } = useAuth();
  const { showNotification } = useNotification();
  const { tipoCambio } = useTipoCambio();

  const isOutOfStock  = product.stock <= 0;
  const cannotAddMore = !canAddMoreOfProduct(product.id_producto, product.stock);

  const priceCurrent  = product.precio_oferta ?? Number(product.precio_venta);
  const priceOriginal = product.precio_original ?? Number(product.precio_venta);
  const hasDiscount   = !!(product.precio_oferta && product.precio_oferta < Number(product.precio_venta));
  const discountPct   = hasDiscount
    ? Math.round(((Number(product.precio_venta) - product.precio_oferta!) / Number(product.precio_venta)) * 100)
    : 0;

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
    if (!canAddMoreOfProduct(product.id_producto, product.stock)) {
      showNotification(
        `Ya tienes la cantidad máxima disponible (${product.stock}) en tu carrito`,
        'warning', 3000,
      );
      return;
    }

    setIsAddingToCart(true);
    try {
      await agregarItem(product.id_producto, 1);
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
    product.id_producto, product.stock, isAuthenticated, userType,
    isOutOfStock, canAddMoreOfProduct, agregarItem,
    showNotification, sincronizarCarrito, navigate,
  ]);

  const handleGoToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/carrito');
  }, [navigate]);

  return (
    <article
      className={`${styles.slide} ${isOutOfStock ? styles.outOfStock : ''}`}
    >
      <Link
        to={`/productos/${product.id_producto}`}
        className={styles.slideLink}
        aria-label={`Ver ${product.nombre}${isOutOfStock ? ' (Agotado)' : ''}`}
        draggable={false}
      >
        {/* ── Panel de imagen ─────────────────────────────────────── */}
        <div className={styles.imagePanel}>
          <ProductImage
            images={product.imagenes}
            defaultImage={product.imagen_url}
            alt={`Imagen de ${product.nombre}`}
            className={styles.productImage}
            mode="simple"
          />

          {(product.en_oferta || hasDiscount) && (
            <div className={styles.offerBadge} aria-label="Oferta limitada">
              <Clock size={11} strokeWidth={2.5} />
              <span>Oferta Limitada</span>
            </div>
          )}

          {hasDiscount && (
            <OfferIndicator
              descuentoPorcentaje={discountPct}
              size="large"
              position="top-left"
              showLabel={true}
            />
          )}

          <CartIndicator productId={product.id_producto} size="small" showQuantity={true} />

          <FavoriteButtonReusable
            productId={product.id_producto}
            productName={product.nombre}
            size="small"
            position="absolute"
            variant="minimal"
            className={styles.favoriteButton}
          />
        </div>

        {/* ── Panel de contenido ──────────────────────────────────── */}
        <div className={styles.contentPanel}>

          <div className={styles.priceBlock}>
            <span className={styles.priceMain}>
              {formatARS(priceCurrent, tipoCambio)}
            </span>
            {hasDiscount && (
              <>
                <span className={styles.priceOriginal}>
                  {formatARS(priceOriginal, tipoCambio)}
                </span>
                <span className={styles.discountChip}>
                  -{discountPct}%
                </span>
              </>
            )}
          </div>

          <h3 className={styles.productName}>{product.nombre}</h3>

          {product.descripcion && (
            <p className={styles.productDescription}>{product.descripcion}</p>
          )}

          <ul className={styles.featuresList} aria-label="Características rápidas">
            {DEFAULT_FEATURES.map(({ icon: Icon, label }) => (
              <li key={label} className={styles.featureItem}>
                <Icon size={13} strokeWidth={2} className={styles.featureIcon} />
                <span>{label}</span>
              </li>
            ))}
          </ul>

          <div className={styles.ctaRow}>
            {isOutOfStock ? (
              <button className={`${styles.ctaButton} ${styles.ctaDisabled}`} disabled>
                <PackageCheck size={16} />
                Agotado
              </button>
            ) : showSuccess ? (
              <button className={`${styles.ctaButton} ${styles.ctaSuccess}`} disabled>
                <Check size={16} />
                ¡Agregado!
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
                aria-label={`Agregar ${product.nombre} al carrito`}
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

            <span className={styles.detailLink}>Ver detalles →</span>
          </div>
        </div>
      </Link>
    </article>
  );
};

// ── Componente principal: Carousel con Framer Motion ─────────────────────
const OfferProductCarousel: React.FC<OfferProductCarouselProps> = ({
  productos,
  fechaFin,
}) => {
  // direction: 1 = hacia adelante (slide entra desde derecha) | -1 = hacia atrás
  const [[currentIndex, direction], setPage] = useState([0, 0]);

  const total = productos.length;

  const isUrgent = fechaFin
    ? (new Date(fechaFin).getTime() - Date.now()) < 3 * 24 * 60 * 60 * 1000
    : false;

  const goTo = useCallback((nextIndex: number, dir: number) => {
    setPage([nextIndex, dir]);
  }, []);

  const goPrev = useCallback(() => {
    const nextIndex = currentIndex > 0 ? currentIndex - 1 : total - 1;
    goTo(nextIndex, -1);
  }, [currentIndex, total, goTo]);

  const goNext = useCallback(() => {
    const nextIndex = currentIndex < total - 1 ? currentIndex + 1 : 0;
    goTo(nextIndex, 1);
  }, [currentIndex, total, goTo]);

  // Soporte teclado
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft')  goPrev();
    if (e.key === 'ArrowRight') goNext();
  }, [goPrev, goNext]);

  // Drag de Framer Motion — swipe en desktop y mobile
  const handleDragEnd = useCallback((_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 60;
    if (info.offset.x < -swipeThreshold) goNext();
    else if (info.offset.x > swipeThreshold) goPrev();
  }, [goNext, goPrev]);

  // 1 solo producto → sin carousel
  if (total === 1) {
    return (
      <div className={styles.singleWrapper}>
        <ProductSlide product={productos[0]} />
      </div>
    );
  }

  return (
    <div
      className={`${styles.carouselRoot} ${isUrgent ? styles.urgent : ''}`}
      role="region"
      aria-label="Productos en oferta"
      aria-roledescription="carrusel"
    >
      {/* ── Ventana del carousel ─────────────────────────────────── */}
      <div
        className={styles.trackWrapper}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        aria-label="Usa las flechas del teclado para navegar"
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className={styles.track}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            onDragEnd={handleDragEnd}
            aria-live="polite"
            aria-atomic="true"
          >
            <ProductSlide product={productos[currentIndex]} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Controles ────────────────────────────────────────────── */}
      <div className={styles.controls}>
        <button
          className={`${styles.arrowBtn} ${styles.arrowLeft}`}
          onClick={goPrev}
          aria-label="Producto anterior"
        >
          <ChevronLeft size={22} strokeWidth={2} />
        </button>

        <div className={styles.dots} role="tablist" aria-label="Seleccionar producto">
          {productos.map((_, idx) => (
            <button
              key={idx}
              role="tab"
              aria-selected={idx === currentIndex}
              aria-label={`Ir al producto ${idx + 1} de ${total}`}
              className={`${styles.dot} ${idx === currentIndex ? styles.dotActive : ''}`}
              onClick={() => goTo(idx, idx > currentIndex ? 1 : -1)}
            />
          ))}
        </div>

        <button
          className={`${styles.arrowBtn} ${styles.arrowRight}`}
          onClick={goNext}
          aria-label="Siguiente producto"
        >
          <ChevronRight size={22} strokeWidth={2} />
        </button>
      </div>

      <p className={styles.counter} aria-live="polite">
        {currentIndex + 1} / {total}
      </p>
    </div>
  );
};

OfferProductCarousel.displayName = 'OfferProductCarousel';
export default OfferProductCarousel;
