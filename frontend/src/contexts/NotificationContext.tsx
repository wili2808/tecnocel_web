import React, { createContext, useContext, useState, useCallback } from 'react';

interface Notification {
    id: string;
    message: string;
    type: 'error' | 'success' | 'warning' | 'info';
    duration?: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

interface NotificationContextType {
    notifications: Notification[];
    showNotification: (message: string, type: 'error' | 'success' | 'warning' | 'info', duration?: number, action?: { label: string; onClick: () => void }) => void;
    hideNotification: (id: string) => void;
    clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification debe ser usado dentro de un NotificationProvider');
    }
    return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const showNotification = useCallback((message: string, type: 'error' | 'success' | 'warning' | 'info', duration = 5000, action?: { label: string; onClick: () => void }) => {
        const id = Date.now().toString();
        const newNotification: Notification = { id, message, type, duration, action };

        setNotifications(prev => [...prev, newNotification]);

        // Auto-remove notification after duration
        setTimeout(() => {
            hideNotification(id);
        }, duration);
    }, []);

    const hideNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, []);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    const value: NotificationContextType = {
        notifications,
        showNotification,
        hideNotification,
        clearNotifications
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}; 