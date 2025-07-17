import React, { useState } from 'react';
import { useCarrito } from '../../../contexts/CarritoContext';
import styles from './CartItem.module.css';

interface CartItemProps {
    item: {
        id: number;
        producto_id: number;
        cantidad: number;
        precio: number;
        detalles_personalizacion?: any;
        subtotal: number;
    };
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
    const { actualizarCantidad, eliminarItem } = useCarrito();
    const [isUpdating, setIsUpdating] = useState(false);

    const handleQuantityChange = async (newQuantity: number) => {
        if (newQuantity < 1) return;

        setIsUpdating(true);
        try {
            await actualizarCantidad(item.id, newQuantity);
        } catch (error) {
            console.error('Error al actualizar cantidad:', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleRemoveItem = async () => {
        setIsUpdating(true);
        try {
            await eliminarItem(item.id);
        } catch (error) {
            console.error('Error al eliminar item:', error);
            setIsUpdating(false);
        }
    };

    // Obtener información del producto (placeholder por ahora)
    const productInfo = {
        name: item.producto_id === 1 ? 'Mochila Grande Puffer Negra Negro Liso' : 'Porta Termo Puffer Con Correa Color Chocolate',
        image: item.producto_id === 1 ? '/api/placeholder/100/100' : '/api/placeholder/100/100',
        stock: item.producto_id === 1 ? 2 : 5,
        description: item.producto_id === 1 ? 'Mochila grande con diseño puffer' : 'Porta termo con correa ajustable'
    };

    return (
        <div className={`${styles.cartItem} ${isUpdating ? styles.updating : ''}`}>
            {/* Checkbox de selección */}
            <div className={styles.itemCheckbox}>
                <input
                    type="checkbox"
                    checked={true}
                    onChange={() => { }}
                    className={styles.checkbox}
                />
            </div>

            {/* Imagen del producto */}
            <div className={styles.imageContainer}>
                <img
                    src={productInfo.image}
                    alt={productInfo.name}
                    className={styles.productImage}
                />
            </div>

            {/* Información del producto */}
            <div className={styles.productInfo}>
                <div className={styles.productHeader}>
                    <h3 className={styles.productTitle}>{productInfo.name}</h3>
                    <div className={styles.priceContainer}>
                        <span className={styles.unitPrice}>
                            $ {item.precio.toLocaleString('es-ES')}
                        </span>
                    </div>
                </div>

                <p className={styles.productDescription}>{productInfo.description}</p>

                <div className={styles.productFooter}>
                    <div className={styles.stockContainer}>
                        <span className={styles.stockBadge}>
                            {productInfo.stock} disponibles
                        </span>
                    </div>

                    <button
                        onClick={handleRemoveItem}
                        className={styles.removeButton}
                        disabled={isUpdating}
                    >
                        <span className="material-icons">delete</span>
                        Eliminar
                    </button>
                </div>
            </div>

            {/* Controles y precio total */}
            <div className={styles.actionContainer}>
                <div className={styles.quantityControls}>
                    <button
                        onClick={() => handleQuantityChange(item.cantidad - 1)}
                        disabled={item.cantidad <= 1 || isUpdating}
                        className={styles.quantityButton}
                    >
                        <span className="material-icons">remove</span>
                    </button>
                    <span className={styles.quantity}>{item.cantidad}</span>
                    <button
                        onClick={() => handleQuantityChange(item.cantidad + 1)}
                        disabled={isUpdating}
                        className={styles.quantityButton}
                    >
                        <span className="material-icons">add</span>
                    </button>
                </div>

                <div className={styles.subtotalContainer}>
                    <span className={styles.subtotalLabel}>Total:</span>
                    <span className={styles.subtotal}>
                        $ {item.subtotal.toLocaleString('es-ES')}
                    </span>
                </div>
            </div>

            {isUpdating && (
                <div className={styles.loadingOverlay}>
                    <div className={styles.spinner}></div>
                </div>
            )}
        </div>
    );
};

export default CartItem; 