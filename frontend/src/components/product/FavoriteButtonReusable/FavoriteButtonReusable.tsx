/**
 * Componente FavoriteButtonReusable - Botón de favoritos reutilizable
 * Muestra botón de corazón para agregar/quitar productos de favoritos
 * Incluye funcionalidades para autenticación, navegación y notificaciones
 * Utiliza FavoritosGlobalContext para gestión centralizada de favoritos
 */
import React, { useMemo } from 'react';
import { useFavoritosGlobal } from '../../../contexts/FavoritosGlobalContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import styles from './FavoriteButtonReusable.module.css';

interface FavoriteButtonReusableProps {
    productId: number;
    productName?: string;
    className?: string;
    size?: 'small' | 'medium' | 'large';
    showText?: boolean;
    position?: 'absolute' | 'relative' | 'static';
    variant?: 'default' | 'minimal' | 'outlined';
    disabled?: boolean;
}

const FavoriteButtonReusable: React.FC<FavoriteButtonReusableProps> = ({
    productId,
    productName = 'producto',
    className = '',
    size = 'medium',
    showText = false,
    position = 'static',
    variant = 'default',
    disabled = false
}) => {
    // ============================================================================
    // HOOKS Y CONTEXTOS
    // ============================================================================

    const { isAuthenticated } = useAuth();
    const { showNotification } = useNotification();
    const { isFavorito, toggleFavorito, loading } = useFavoritosGlobal();
    const navigate = useNavigate();

    // ============================================================================
    // MANEJO DE EVENTOS
    // ============================================================================

    /**
     * Manejar toggle del estado de favorito del producto
     * Previene propagación del evento y valida autenticación del usuario
     * Muestra notificaciones informativas y maneja errores de operación
     */
    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (disabled || loading) {
            return;
        }

        if (!isAuthenticated) {
            showNotification(
                '¡Inicia sesión para agregar productos a favoritos!',
                'info',
                4000,
                {
                    label: 'Ir al login',
                    onClick: () => navigate('/login')
                }
            );
            return;
        }

        try {
            await toggleFavorito(productId);
        } catch (error) {
            console.error('Error al actualizar favoritos:', error);
            showNotification('Error al actualizar favoritos. Por favor, intente nuevamente.', 'error', 5000);
        }
    };

    // ============================================================================
    // CÁLCULOS Y ESTADOS
    // ============================================================================

    // Memoizar estado de favorito para evitar recálculos
    const isActive = useMemo(() => {
        return isFavorito(productId);
    }, [isFavorito, productId]);

    // ============================================================================
    // RENDERIZADO
    // ============================================================================

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
            disabled={disabled || loading}
            className={`
                ${styles.favoriteButton}
                ${styles[size]}
                ${styles[position]}
                ${styles[variant]}
                ${isActive ? styles.active : styles.inactive}
                ${loading ? styles.loading : ''}
                ${className}
            `}
            title={isActive ? `Quitar ${productName} de favoritos` : `Agregar ${productName} a favoritos`}
            type="button"
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

FavoriteButtonReusable.displayName = 'FavoriteButtonReusable';

export default FavoriteButtonReusable;
