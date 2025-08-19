/**
 * Componente NotificationContainer - Contenedor de notificaciones del sistema
 * Renderiza lista de notificaciones activas con funcionalidad de ocultamiento
 * Incluye integración con NotificationContext para gestión centralizada
 * Utiliza componente Notification individual para cada notificación
 */
import React from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import Notification from '../Notification';
import styles from './NotificationContainer.module.css';

const NotificationContainer: React.FC = () => {
    // ============================================================================
    // HOOKS Y CONTEXTOS
    // ============================================================================

    const { notifications, hideNotification } = useNotification();

    // ============================================================================
    // RENDERIZADO
    // ============================================================================

    return (
        <div className={styles.container}>
            {/* Mapear notificaciones activas a componentes Notification */}
            {notifications.map((notification) => (
                <Notification
                    key={notification.id}
                    message={notification.message}
                    type={notification.type}
                    isVisible={true}
                    onClose={() => hideNotification(notification.id)}
                    duration={notification.duration}
                    action={notification.action}
                />
            ))}
        </div>
    );
};

NotificationContainer.displayName = 'NotificationContainer';

export default NotificationContainer; 