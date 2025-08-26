/**
 * Componente ProductActions - Acciones del producto en página de detalle
 * Maneja la adición al carrito, compra directa y selector de cantidad
 * Utiliza métodos del contexto del carrito para validaciones y estado
 * Botones implementados nativamente sin dependencias externas
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCarrito } from '../../../contexts/CarritoContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import IconButton from '../../../components/common/IconButton';
import styles from './ProductActions.module.css';

interface ProductActionsProps {
    productId: number;
    productName: string;
    stock: number;
    isOutOfStock: boolean;
}

const ProductActions: React.FC<ProductActionsProps> = ({
    productId,
    productName,
    stock,
    isOutOfStock
}) => {
    // ============================================================================
    // ESTADOS LOCALES
    // ============================================================================
    const [quantity, setQuantity] = useState(1);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // ============================================================================
    // CONTEXTOS Y HOOKS
    // ============================================================================
    const {
        agregarItem,
        estado,
        canAddMoreOfProduct,
        getProductQuantityInCart
    } = useCarrito();

    const { isAuthenticated } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    // ============================================================================
    // CÁLCULOS Y VALIDACIONES
    // ============================================================================

    // Usar métodos del contexto para obtener información del carrito
    const currentQuantityInCart = getProductQuantityInCart(productId);
    const canAddMore = canAddMoreOfProduct(productId, stock);
    const maxQuantityToAdd = stock - currentQuantityInCart;

    // ============================================================================
    // MANEJADORES DE EVENTOS
    // ============================================================================

    /**
     * Maneja el cambio de cantidad en el selector
     * Valida que no exceda el stock disponible
     */
    const handleQuantityChange = (newQuantity: number) => {
        const maxAllowed = Math.min(stock, maxQuantityToAdd);
        if (newQuantity >= 1 && newQuantity <= maxAllowed) {
            setQuantity(newQuantity);
        }
    };

    /**
     * Agrega el producto al carrito con validaciones completas
     * Verifica autenticación, stock disponible y cantidad máxima
     */
    const handleAddToCart = async () => {
        // Validar autenticación del usuario
        if (!isAuthenticated) {
            showNotification(
                '¡Inicia sesión para agregar productos a tu carrito!',
                'info',
                4000,
                {
                    label: 'Ir al login',
                    onClick: () => navigate('/login')
                }
            );
            return;
        }

        // Validar estado del producto y disponibilidad
        if (isOutOfStock || isAddingToCart || !canAddMore) {
            if (!canAddMore) {
                showNotification(
                    `No puedes agregar más de ${stock} unidades de este producto`,
                    'warning',
                    4000
                );
            }
            return;
        }

        // Validar que la cantidad no exceda el stock disponible
        if (quantity > maxQuantityToAdd) {
            showNotification(
                `Solo puedes agregar ${maxQuantityToAdd} unidad${maxQuantityToAdd !== 1 ? 'es' : ''} más`,
                'warning',
                4000
            );
            return;
        }

        // Procesar agregado al carrito
        setIsAddingToCart(true);
        try {
            await agregarItem(productId, quantity);

            // Mostrar confirmación visual y notificación
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);

            showNotification(
                `Se agregaron ${quantity} unidad${quantity !== 1 ? 'es' : ''} de "${productName}" al carrito`,
                'success',
                3000
            );
        } catch (error) {
            console.error('Error al agregar producto al carrito:', error);
            showNotification('Error al agregar el producto al carrito. Por favor, intente nuevamente.', 'error', 5000);
        } finally {
            setIsAddingToCart(false);
        }
    };

    /**
     * Maneja la compra directa del producto
     * Agrega al carrito si es posible, o redirige directamente al carrito
     */
    const handleBuyNow = async () => {
        // Validar autenticación del usuario
        if (!isAuthenticated) {
            showNotification(
                '¡Inicia sesión para realizar una compra!',
                'info',
                4000,
                {
                    label: 'Ir al login',
                    onClick: () => navigate('/login')
                }
            );
            return;
        }

        // Si el producto está agotado, no se puede comprar
        if (isOutOfStock) {
            showNotification('Este producto está agotado y no se puede comprar', 'error', 4000);
            return;
        }

        // Si se puede agregar más del producto, agregarlo al carrito primero
        if (canAddMore && quantity <= maxQuantityToAdd) {
            try {
                await agregarItem(productId, quantity);
                showNotification(
                    `Se agregaron ${quantity} unidad${quantity !== 1 ? 'es' : ''} de "${productName}" al carrito`,
                    'success',
                    2000
                );
            } catch (error) {
                console.error('Error al agregar producto al carrito:', error);
                showNotification('Error al agregar el producto al carrito', 'error', 4000);
                return; // No continuar si hay error
            }
        } else if (currentQuantityInCart > 0) {
            // Si no se puede agregar más pero ya hay en el carrito, mostrar mensaje informativo
            showNotification(
                `Ya tienes ${currentQuantityInCart} unidad${currentQuantityInCart !== 1 ? 'es' : ''} de "${productName}" en tu carrito`,
                'info',
                2000
            );
        } else {
            // Si no se puede agregar y no hay en el carrito, mostrar mensaje de stock
            showNotification(
                `No puedes agregar más de ${stock} unidades de este producto`,
                'warning',
                4000
            );
            return; // No continuar si no hay stock disponible
        }

        // Redirigir al carrito para continuar con la compra
        navigate('/carrito');
    };

    // ============================================================================
    // RENDERIZADO
    // ============================================================================

    return (
        <div className={styles.productActions}>
            {/* Selector de cantidad - Solo visible si hay stock */}
            {!isOutOfStock && (
                <div className={styles.quantitySection}>
                    <label className={styles.quantityLabel}>Cantidad:</label>
                    <div className={styles.quantityControls}>
                        {/* Botón para disminuir cantidad */}
                        <IconButton
                            icon="remove"
                            onClick={() => handleQuantityChange(quantity - 1)}
                            disabled={quantity <= 1}
                            type="button"
                            ariaLabel="Disminuir cantidad"
                            variant="outline"
                            size="sm"
                            className={styles.quantityButton}
                        />

                        {/* Input de cantidad con validaciones */}
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                            className={styles.quantityInput}
                            min="1"
                            max={maxQuantityToAdd}
                            aria-label="Cantidad del producto"
                        />

                        {/* Botón para aumentar cantidad */}
                        <IconButton
                            icon="add"
                            onClick={() => handleQuantityChange(quantity + 1)}
                            disabled={quantity >= maxQuantityToAdd}
                            type="button"
                            ariaLabel="Aumentar cantidad"
                            variant="outline"
                            size="sm"
                            className={styles.quantityButton}
                        />
                    </div>

                    {/* Información del stock disponible */}
                    <span className={styles.availableStock}>
                        Máximo: {stock}
                        {currentQuantityInCart > 0 && (
                            <span className={styles.cartQuantity}>
                                (En carrito: {currentQuantityInCart})
                            </span>
                        )}
                    </span>
                </div>
            )}

            {/* Botones de acción principales */}
            <div className={styles.actionButtons}>
                {!isOutOfStock ? (
                    <>
                        {/* Botón de compra directa - Siempre habilitado si hay stock */}
                        <button
                            className={`${styles.actionButton} ${styles.buyNowButton}`}
                            onClick={handleBuyNow}
                            disabled={estado.cargando || isOutOfStock}
                            type="button"
                            aria-label="Comprar ahora"
                        >
                            <span className="material-icons">shopping_cart_checkout</span>
                            <span>Comprar ahora</span>
                        </button>

                        {/* Botón de agregar al carrito */}
                        <button
                            className={`${styles.actionButton} ${styles.addToCartButton} ${
                                showSuccess ? styles.successButton : ''
                            }`}
                            onClick={handleAddToCart}
                            disabled={isAddingToCart || estado.cargando || !canAddMore}
                            type="button"
                            aria-label={
                                isAddingToCart 
                                    ? 'Agregando al carrito...' 
                                    : showSuccess 
                                        ? 'Producto agregado al carrito' 
                                        : 'Agregar al carrito'
                            }
                        >
                            <span className="material-icons">
                                {isAddingToCart ? 'hourglass_empty' : showSuccess ? 'check_circle' : 'add_shopping_cart'}
                            </span>
                            <span>
                                {isAddingToCart ? 'Agregando...' : showSuccess ? '¡Agregado!' : 'Agregar al carrito'}
                            </span>
                        </button>
                    </>
                ) : (
                    /* Botón deshabilitado para productos agotados */
                    <button
                        className={`${styles.actionButton} ${styles.disabledButton}`}
                        disabled
                        type="button"
                        aria-label="Producto agotado"
                    >
                        <span className="material-icons">remove_shopping_cart</span>
                        <span>Producto agotado</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProductActions; 