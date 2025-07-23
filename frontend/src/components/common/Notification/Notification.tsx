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
    const [isAnimating, setIsAnimating] = useState(false);

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

    if (!isVisible) return null;

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

    return (
        <div className={`${styles.notification} ${styles[type]} ${isAnimating ? styles.show : styles.hide}`}>
            <div className={styles.notificationContent}>
                <span className={`material-icons ${styles.icon}`}>
                    {getIcon()}
                </span>
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
            <div className={`${styles.progressBar} ${styles[type]}`} />
        </div>
    );
};

export default Notification; 