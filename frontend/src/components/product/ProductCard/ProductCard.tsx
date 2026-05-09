/**
 * Componente ProductCard - Tarjeta de producto para vista de cuadrícula
 * Muestra información resumida del producto con imagen, precios y acciones
 * Incluye indicadores de oferta, favoritos y estado del carrito
 * Lógica integrada directamente en el componente para mayor simplicidad
 */
import React, { useState, useMemo, useCallback, memo } from 'react';
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
import Button from '../../common/Button';

import styles from './ProductCard.module.css';
import type { ProductCardProps } from '../../../types';

const ProductCard: React.FC<ProductCardProps> = memo(({
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
            <Button ariaLabel="Producto agotado" disabled variant="outline" size="xs">
              Agotado
            </Button>
          ) : showSuccess ? (
            <Button ariaLabel="Producto agregado" disabled variant="success" size="xs" icon="check_circle">
              ¡Agregado!
            </Button>
          ) : cannotAddMore ? (
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate('/carrito');
              }}
              ariaLabel="Ir al carrito"
              size="xs"
              icon="shopping_cart"
            >
              Ver carrito
            </Button>
          ) : (
            <Button
              className={styles.addButton}
              ariaLabel={`Agregar ${nombre} al carrito`}
              size="xs"
              disabled={isAddingToCart || carritoLoading}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddToCart();
              }}
              icon={isAddingToCart ? 'hourglass_empty' : 'add_shopping_cart'}
            >
              {isAddingToCart ? 'Agregando...' : 'Agregar al carrito'}
            </Button>
          )}
        </div>
      </article>
    </Link>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;
