import React, { useMemo } from 'react';
import { useCarrito } from '../../../contexts/CarritoContext';
import styles from './CartIndicator.module.css';

interface CartIndicatorProps {
    productId: number;
    className?: string;
}

const CartIndicator: React.FC<CartIndicatorProps> = ({ productId, className }) => {
    const { estado } = useCarrito();

    // Memoizar la búsqueda del item para evitar re-renders innecesarios
    const cartItem = useMemo(() => {
        return estado.items.find(item => item.id_producto === productId);
    }, [estado.items, productId]);

    // Si no hay item en el carrito o la cantidad es 0, no mostrar nada
    if (!cartItem || cartItem.cantidad === 0) {
        return null;
    }

    return (
        <div className={`${styles.cartIndicator} ${className || ''}`}>
            <span className={styles.quantity}>{cartItem.cantidad}</span>
            <span className={styles.label}>En carrito</span>
        </div>
    );
};

export default CartIndicator;
