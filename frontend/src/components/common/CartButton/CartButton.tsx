import React from 'react';
import IconButton from '../IconButton';
import styles from './CartButton.module.css';

interface CartButtonProps {
    itemCount: number;
    isAuthenticated: boolean;
    onClick: () => void;
    className?: string;
}

const CartButton: React.FC<CartButtonProps> = ({
    itemCount,
    isAuthenticated,
    onClick,
    className = ''
}) => (
    <IconButton
        icon="shopping_cart"
        onClick={onClick}
        ariaLabel="Carrito de compras"
        disabled={!isAuthenticated}
        variant="ghost"
        size="medium"
        className={`${styles.cartButton} ${!isAuthenticated ? styles.cartButtonDisabled : ''} ${className}`}
    >
        <span className={styles.cartBadge}>{itemCount}</span>
    </IconButton>
);

export default CartButton;
