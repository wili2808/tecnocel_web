import React from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import Notification from '../Notification';
import styles from './NotificationContainer.module.css';

const NotificationContainer: React.FC = () => {
    const { notifications, hideNotification } = useNotification();

    return (
        <div className={styles.container}>
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

export default NotificationContainer; 