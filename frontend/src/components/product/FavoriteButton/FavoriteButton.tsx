import React from 'react';
import { useFavoritos } from '../../../hooks/useFavoritos';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './FavoriteButton.module.css';

interface FavoriteButtonProps {
    productId: number;
    className?: string;
    size?: 'small' | 'medium' | 'large';
    showText?: boolean;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
    productId,
    className = '',
    size = 'medium',
    showText = false
}) => {
    const { user } = useAuth();
    const { isFavorito, toggleFavorito, loading } = useFavoritos();

    const handleToggle = async () => {
        if (!user) {
            // Podrías mostrar un modal de login aquí
            console.log('Usuario no autenticado');
            return;
        }

        await toggleFavorito(productId);
    };

    const isActive = isFavorito(productId);

    const heartIcon = (
        <svg
            viewBox="0 0 24 24"
            className={styles.icon}
            fill={isActive ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
    );

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            className={`
        ${styles.favoriteButton}
        ${styles[size]}
        ${isActive ? styles.active : styles.inactive}
        ${loading ? styles.loading : ''}
        ${className}
      `}
            title={isActive ? "Quitar de favoritos" : "Agregar a favoritos"}
        >
            {heartIcon}
            {showText && (
                <span className={styles.text}>
                    {isActive ? "En favoritos" : "Favorito"}
                </span>
            )}
        </button>
    );
};

export default FavoriteButton;