/**
 * Componente Notification - Notificación individual del sistema
 * Muestra mensajes de diferentes tipos con iconos, acciones y barra de progreso
 * Incluye funcionalidades para auto-cierre, animaciones y botones de acción
 * Utiliza Material Icons para representación visual de tipos de notificación
 */
import React, { useEffect, useState } from 'react';
import styles from './Notification.module.css';

interface NotificationProps {
    message: string;
    type: 'error' | 'success' | 'warning' | 'info';
    isVisible: boolean;
    onClose: () => void;
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

const Notification: React.FC<NotificationProps> = ({
    message,
    type,
    isVisible,
    onClose,
    duration = 5000,
    action
}) => {
    // ============================================================================
    // ESTADO LOCAL
    // ============================================================================

    const [isAnimating, setIsAnimating] = useState(false);

    // ============================================================================
    // EFECTOS Y TIMERS
    // ============================================================================

    /**
     * Manejar auto-cierre de la notificación con animación
     * Configura timer para ocultar notificación después de la duración especificada
     * Incluye delay para permitir que termine la animación de salida
     */
    useEffect(() => {
        if (isVisible) {
            setIsAnimating(true);
            const timer = setTimeout(() => {
                setIsAnimating(false);
                setTimeout(onClose, 300); // Esperar a que termine la animación
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [isVisible, duration, onClose]);

    // ============================================================================
    // FUNCIONES AUXILIARES
    // ============================================================================

    /**
     * Obtener icono correspondiente al tipo de notificación
     * Mapea tipos de notificación a iconos de Material Design
     */
    const getIcon = () => {
        switch (type) {
            case 'error':
                return 'error_outline';
            case 'success':
                return 'check_circle_outline';
            case 'warning':
                return 'warning_amber';
            case 'info':
                return 'info_outline';
            default:
                return 'info_outline';
        }
    };

    // ============================================================================
    // RENDERIZADO CONDICIONAL
    // ============================================================================

    if (!isVisible) return null;

    // ============================================================================
    // RENDERIZADO
    // ============================================================================

    return (
        <div className={`${styles.notification} ${styles[type]} ${isAnimating ? styles.show : styles.hide}`}>
            {/* Contenido principal de la notificación */}
            <div className={styles.notificationContent}>
                {/* Icono del tipo de notificación */}
                <span className={`material-icons ${styles.icon}`}>
                    {getIcon()}
                </span>

                {/* Contenedor de mensaje y botón de acción */}
                <div className={styles.messageContainer}>
                    <span className={styles.message}>{message}</span>
                    {action && (
                        <button
                            className={styles.actionButton}
                            onClick={() => {
                                action.onClick();
                                setIsAnimating(false);
                                setTimeout(onClose, 300);
                            }}
                        >
                            {action.label}
                        </button>
                    )}
                </div>

                {/* Botón de cierre manual */}
                <button
                    className={styles.closeButton}
                    onClick={() => {
                        setIsAnimating(false);
                        setTimeout(onClose, 300);
                    }}
                    aria-label="Cerrar notificación"
                >
                    <span className="material-icons">close</span>
                </button>
            </div>

            {/* Barra de progreso con color según tipo de notificación */}
            <div className={`${styles.progressBar} ${styles[type]}`} />
        </div>
    );
};

Notification.displayName = 'Notification';

export default Notification; 