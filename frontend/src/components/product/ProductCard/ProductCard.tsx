/**
 * Componente ProductCard - Tarjeta de producto para vista de cuadrícula
 * Muestra información resumida del producto con imagen, precios y acciones
 * Incluye indicadores de oferta, favoritos y estado del carrito
 * Lógica integrada directamente en el componente para mayor simplicidad
 */
import React, { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProductImage from '../ProductImage';
import CartIndicator from '../../cart/CartIndicator';
import OfferIndicator from '../OfferIndicator';
import FavoriteButtonReusable from '../FavoriteButtonReusable';
import { useCarrito } from '../../../contexts/CarritoContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { useTipoCambio } from '../../../contexts/TipoCambioContext';
import { formatARS } from '../../../utils/formatPrecio';

import styles from './ProductCard.module.css';
import type { ProductCardProps } from '../../../types';

const ProductCard: React.FC<ProductCardProps> = ({
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
}) => {
  // ============================================================================
  // HOOKS DE NAVEGACIÓN
  // ============================================================================
  const navigate = useNavigate();

  // ============================================================================
  // ESTADOS LOCALES
  // ============================================================================
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isOutOfStock] = useState(stock <= 0);

  // ============================================================================
  // CONTEXTOS Y HOOKS
  // ============================================================================
  const { agregarItem, canAddMoreOfProduct, sincronizarCarrito } = useCarrito();
  const { isAuthenticated, userType } = useAuth();
  const { showNotification } = useNotification();
  const { tipoCambio } = useTipoCambio();

  /**
   * Información de precios calculada y memoizada
   * Incluye precios actuales, originales y cálculo de descuentos
   */
  const priceInfo = useMemo(() => {
    const current = precio_oferta || Number(precio_venta);
    const original = precio_original || Number(precio_venta);
    const hasDiscount = precio_oferta && precio_oferta < Number(precio_venta);

    return {
      current,
      original,
      hasDiscount,
      discountPercentage: hasDiscount
        ? Math.round(((Number(precio_venta) - precio_oferta) / Number(precio_venta)) * 100)
        : 0,
    };
  }, [precio_venta, precio_original, precio_oferta]);


  /**
   * Click en la tarjeta del producto
   * La navegación se maneja automáticamente por el Link
   * Solo registrar analytics si es necesario
   */
  const handleCardClick = useCallback(() => {
    // La navegación se maneja automáticamente por el Link
    // Solo registrar analytics si es necesario
  }, []);

  /**
   * Agregar producto al carrito con validaciones completas
   * Verifica autenticación, stock disponible y cantidad máxima
   * Incluye manejo de errores y sincronización automática
   */
  const handleAddToCart = useCallback(async () => {
    if (!isAuthenticated) {
      showNotification('Debes iniciar sesión para agregar productos al carrito', 'warning', 3000);
      return;
    }

    // Admin/empleado no puede agregar al carrito
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

    // Validar stock disponible antes de agregar
    if (!canAddMoreOfProduct(id_producto, stock)) {
      showNotification(`Ya tienes la cantidad máxima disponible (${stock}) en tu carrito`, 'warning', 3000);
      return;
    }

    setIsAddingToCart(true);
    try {
      await agregarItem(id_producto, 1);
      setShowSuccess(true);
      showNotification('Producto agregado al carrito', 'success', 2000);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error: any) {
      // El error ya se maneja en el contexto, solo mostrar notificación genérica
      if (error.message && error.message.includes('Stock insuficiente')) {
        showNotification(error.message, 'error', 4000);
        // Forzar sincronización después de error de stock
        try {
          await sincronizarCarrito();
        } catch (syncError) {
          console.error('Error al sincronizar después de error de stock:', syncError);
        }
      } else {
        showNotification('Error al agregar al carrito', 'error', 3000);
      }
    } finally {
      setIsAddingToCart(false);
    }
  }, [
    id_producto,
    isAuthenticated,
    userType,
    isOutOfStock,
    stock,
    canAddMoreOfProduct,
    agregarItem,
    showNotification,
    sincronizarCarrito,
    navigate,
  ]);

  // ============================================================================
  // CÁLCULOS Y TEXTOS
  // ============================================================================

  // Nota: stockText y overlayContent están comentados ya que no se usan actualmente
  // Se pueden reactivar cuando se implementen las funcionalidades correspondientes

  // ============================================================================
  // ESTADOS DE CARGA
  // ============================================================================
  const carritoLoading = isAddingToCart;

  // ============================================================================
  // ESTADOS ADICIONALES PARA OVERLAY DE LÍMITE DE CARRITO
  // ============================================================================

  /**
   * Verificar si ya no se pueden agregar más productos al carrito
   * Determina si mostrar overlay rojo de límite alcanzado
   */
  const cannotAddMore = !canAddMoreOfProduct(id_producto, stock);


  // ============================================================================
  // FUNCIONES ESPECÍFICAS DE PRODUCTCARD
  // ============================================================================

  // Función reservada para futuras funcionalidades

  // ============================================================================
  // RENDERIZADO
  // ============================================================================

  return (
    <Link
      to={`/productos/${id_producto}`}
      className={`${styles.productLink} ${isOutOfStock ? styles.outOfStockLink : ''}`}
      aria-disabled={isOutOfStock}
      aria-label={`Ver detalles de ${nombre}${isOutOfStock ? ' (Agotado)' : ''}`}
      onClick={handleCardClick}
      tabIndex={isOutOfStock ? -1 : 0}
    >
      <article className={`${styles.productCard} ${className || ''}`}>
        {/* Contenedor de imagen — Protagonista limpio */}
        <div className={styles.imageContainer}>
          {/* Imagen principal del producto */}
          <ProductImage
            images={imagenes}
            defaultImage={imagen_url}
            alt={`Imagen de ${nombre}`}
            className={styles.productImage}
            mode="simple"
          />

          {/* Indicador de oferta — Superior izquierda */}
          {(en_oferta || (precio_oferta && precio_oferta < Number(precio_venta))) && (
            <OfferIndicator
              descuentoPorcentaje={
                precio_oferta && precio_venta
                  ? Math.round(((Number(precio_venta) - precio_oferta) / Number(precio_venta)) * 100)
                  : 0
              }
              size="small"
              position="top-left"
              showLabel={true}
            />
          )}

          {/* Indicador de carrito — Inferior derecha */}
          <CartIndicator productId={id_producto} size="small" showQuantity={true} />

          {/* Botón de favoritos — Superior derecha, siempre visible */}
          <FavoriteButtonReusable
            productId={id_producto}
            productName={nombre}
            size="small"
            position="absolute"
            variant="minimal"
            className={styles.favoriteButton}
          />

        </div>

        {/* Información del producto — Jerarquía: Precio > Nombre > Descripción > CTA */}
        <div className={styles.productInfo}>
          {/* Encabezado con precios PRIMERO (jerarquía clara) */}
          <div className={styles.productHeader}>
            {/* Precio destacado — El elemento más importante */}
            <div className={styles.priceContainer}>
              {priceInfo.hasDiscount ? (
                <>
                  <span className={styles.price}>{formatARS(priceInfo.current, tipoCambio)}</span>
                  <span className={styles.originalPrice}>{formatARS(priceInfo.original, tipoCambio)}</span>
                </>
              ) : (
                <span className={styles.price}>{formatARS(priceInfo.current, tipoCambio)}</span>
              )}
            </div>

            {/* Nombre del producto — Secundario, después del precio */}
            <h3 className={styles.productTitle}>{nombre}</h3>
          </div>

          {/* Descripción del producto — Terciaria, informativa */}
          {descripcion && (
            <p className={styles.productDescription} title={descripcion}>
              {descripcion}
            </p>
          )}

          {/* Botón CTA — Agregar al carrito limpio y prominente */}
          {isOutOfStock ? (
            <button
              className={`${styles.ctaButton} ${styles.ctaButtonDisabled}`}
              disabled
              aria-label="Producto agotado"
            >
              <span className={`material-icons ${styles.ctaButtonIcon}`}>block</span>
              <span className={styles.ctaButtonText}>Agotado</span>
            </button>
          ) : showSuccess ? (
            <button
              className={`${styles.ctaButton} ${styles.ctaButtonSuccess}`}
              disabled
              aria-label="Producto agregado"
            >
              <span className={`material-icons ${styles.ctaButtonIcon}`}>check_circle</span>
              <span className={styles.ctaButtonText}>¡Agregado!</span>
            </button>
          ) : cannotAddMore ? (
            <button
              className={styles.ctaButton}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate('/carrito');
              }}
              aria-label="Ir al carrito"
            >
              <span className={`material-icons ${styles.ctaButtonIcon}`}>shopping_cart</span>
              <span className={styles.ctaButtonText}>Ver carrito</span>
            </button>
          ) : (
            <button
              className={`${styles.ctaButton} ${isAddingToCart ? styles.ctaButtonLoading : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddToCart();
              }}
              disabled={isAddingToCart || carritoLoading}
              aria-label={`Agregar ${nombre} al carrito`}
            >
              <span className={`material-icons ${styles.ctaButtonIcon}`}>
                {isAddingToCart ? 'hourglass_empty' : 'add_shopping_cart'}
              </span>
              <span className={styles.ctaButtonText}>
                {isAddingToCart ? 'Agregando...' : 'Agregar al carrito'}
              </span>
            </button>
          )}
        </div>
      </article>
    </Link>
  );
};

ProductCard.displayName = 'ProductCard';

export default ProductCard;
