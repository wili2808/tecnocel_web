/**
 * Componente CartIndicator - Indicador de producto en carrito
 * Muestra indicador visual cuando un producto está agregado al carrito
 * Incluye funcionalidades para mostrar cantidad y estado del item
 * Utiliza CarritoContext para obtener información del carrito
 */
import React, { useMemo } from 'react';
import { useCarrito } from '../../../contexts/CarritoContext';
import styles from './CartIndicator.module.css';

interface CartIndicatorProps {
    productId: number;
    className?: string;
    size?: 'small' | 'medium' | 'large'; // Tamaño del indicador
    showQuantity?: boolean; // Mostrar badge de cantidad
}

const CartIndicator: React.FC<CartIndicatorProps> = ({
    productId,
    className,
    size = 'medium',
    showQuantity = true
}) => {
    // ============================================================================
    // HOOKS Y CONTEXTOS
    // ============================================================================

    const { estado } = useCarrito();

    // ============================================================================
    // PROCESAMIENTO DE DATOS
    // ============================================================================

    // Memoizar la búsqueda del item para evitar re-renders innecesarios
    const cartItem = useMemo(() => {
        return estado.items.find(item => item.id_producto === productId);
    }, [estado.items, productId]);

    // ============================================================================
    // RENDERIZADO CONDICIONAL
    // ============================================================================

    // Si no hay item en el carrito o la cantidad es 0, no mostrar nada
    if (!cartItem || cartItem.cantidad === 0) {
        return null;
    }

    // ============================================================================
    // CLASES CSS DINÁMICAS
    // ============================================================================

    const sizeClass = styles[size];
    const quantityClass = showQuantity ? styles.quantity : styles.quantityHidden;

    // ============================================================================
    // RENDERIZADO
    // ============================================================================

    return (
        <div className={`${styles.cartIndicator} ${sizeClass} ${className || ''}`}>
            {/* Cantidad del producto en el carrito */}
            {showQuantity && (
                <span className={quantityClass}>{cartItem.cantidad}</span>
            )}
            {/* Etiqueta descriptiva del estado */}
            <span className={styles.label}>En carrito</span>
        </div>
    );
};

CartIndicator.displayName = 'CartIndicator';

export default CartIndicator;
