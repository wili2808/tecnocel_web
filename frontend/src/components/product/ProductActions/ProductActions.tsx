import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCarrito } from '../../../contexts/CarritoContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
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
    const [quantity, setQuantity] = useState(1);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const { agregarItem, estado } = useCarrito();
    const { isAuthenticated } = useAuth();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const handleQuantityChange = (newQuantity: number) => {
        if (newQuantity >= 1 && newQuantity <= stock) {
            setQuantity(newQuantity);
        }
    };

    const handleAddToCart = async () => {
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

        if (isOutOfStock || isAddingToCart) {
            return;
        }

        setIsAddingToCart(true);
        try {
            await agregarItem(productId, quantity);

            // Mostrar confirmación visual
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

    const handleBuyNow = async () => {
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

        if (isOutOfStock) {
            return;
        }

        // Agregar al carrito y luego redirigir
        try {
            await agregarItem(productId, quantity);
            navigate('/carrito');
        } catch (error) {
            console.error('Error al agregar producto al carrito:', error);
            showNotification('Error al procesar la compra. Por favor, intente nuevamente.', 'error', 5000);
        }
    };

    return (
        <div className={styles.productActions}>
            {/* Selector de cantidad */}
            {!isOutOfStock && (
                <div className={styles.quantitySection}>
                    <label className={styles.quantityLabel}>Cantidad:</label>
                    <div className={styles.quantityControls}>
                        <button
                            className={styles.quantityButton}
                            onClick={() => handleQuantityChange(quantity - 1)}
                            disabled={quantity <= 1}
                            type="button"
                            aria-label="Disminuir cantidad"
                        >
                            <span className="material-icons">remove</span>
                        </button>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                            className={styles.quantityInput}
                            min="1"
                            max={stock}
                            aria-label="Cantidad del producto"
                        />
                        <button
                            className={styles.quantityButton}
                            onClick={() => handleQuantityChange(quantity + 1)}
                            disabled={quantity >= stock}
                            type="button"
                            aria-label="Aumentar cantidad"
                        >
                            <span className="material-icons">add</span>
                        </button>
                    </div>
                    <span className={styles.availableStock}>Máximo: {stock}</span>
                </div>
            )}

            {/* Botones de acción */}
            <div className={styles.actionButtons}>
                {!isOutOfStock ? (
                    <>
                        <button
                            className={`${styles.actionButton} ${styles.buyNowButton}`}
                            onClick={handleBuyNow}
                            disabled={estado.cargando}
                            type="button"
                        >
                            <span className="material-icons">shopping_cart_checkout</span>
                            Comprar ahora
                        </button>
                        <button
                            className={`${styles.actionButton} ${styles.addToCartButton} ${showSuccess ? styles.successButton : ''}`}
                            onClick={handleAddToCart}
                            disabled={isAddingToCart || estado.cargando}
                            type="button"
                        >
                            {isAddingToCart ? (
                                <>
                                    <span className="material-icons">hourglass_empty</span>
                                    Agregando...
                                </>
                            ) : showSuccess ? (
                                <>
                                    <span className="material-icons">check_circle</span>
                                    ¡Agregado!
                                </>
                            ) : (
                                <>
                                    <span className="material-icons">add_shopping_cart</span>
                                    Agregar al carrito
                                </>
                            )}
                        </button>
                    </>
                ) : (
                    <button className={styles.disabledButton} disabled>
                        <span className="material-icons">remove_shopping_cart</span>
                        Producto agotado
                    </button>
                )}
            </div>
        </div>
    );
};

export default ProductActions; 