import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';

// --- INTERFACES Y TIPOS ---

/**
 * Estructura de una notificación individual
 * Define los campos necesarios para mostrar notificaciones en la interfaz
 */
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

/**
 * Métodos y propiedades del contexto de notificaciones
 * Define la API pública del contexto para componentes consumidores
 */
interface NotificationContextType {
  notifications: Notification[];
  showNotification: (
    message: string,
    type: 'error' | 'success' | 'warning' | 'info',
    duration?: number,
    action?: { label: string; onClick: () => void },
  ) => void;
  hideNotification: (id: string) => void;
  clearNotifications: () => void;
}

// --- CREACIÓN DEL CONTEXTO ---

// Creación del contexto de notificaciones

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/**
 * Hook personalizado para usar el contexto de notificaciones
 * Proporciona acceso seguro al contexto con validación de uso
 */
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification debe ser usado dentro de un NotificationProvider');
  }
  return context;
};

// --- PROPIEDADES DEL PROVIDER ---

interface NotificationProviderProps {
  children: React.ReactNode;
}

// --- PROVIDER PRINCIPAL ---

/**
 * Proveedor del contexto de notificaciones
 * Maneja el estado global de notificaciones con optimizaciones de performance
 * Incluye sistema de auto-cierre y gestión eficiente de memoria
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  // ============================================================================
  // ESTADO Y REFS
  // ============================================================================

  // Estado principal de notificaciones activas
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Usar useRef para evitar dependencias circulares en useCallback
  const hideNotificationRef = useRef<(id: string) => void>();

  // ============================================================================
  // FUNCIONES PRINCIPALES
  // ============================================================================

  /**
   * Ocultar notificación específica por ID
   * Filtra la notificación del array de notificaciones activas
   */
  const hideNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  // OPTIMIZACIÓN: Usar useEffect para actualizar la referencia solo cuando hideNotification cambie
  useEffect(() => {
    hideNotificationRef.current = hideNotification;
  }, [hideNotification]);

  /**
   * Mostrar nueva notificación en el sistema
   * Crea notificación con ID único y configura auto-cierre automático
   * Incluye soporte para acciones personalizables y duración configurable
   */
  const showNotification = useCallback(
    (
      message: string,
      type: 'error' | 'success' | 'warning' | 'info',
      duration = 5000,
      action?: { label: string; onClick: () => void },
    ) => {
      const id = Date.now().toString();
      const newNotification: Notification = { id, message, type, duration, action };

      setNotifications((prev) => [...prev, newNotification]);

      // Auto-remove notification after duration
      setTimeout(() => {
        if (hideNotificationRef.current) {
          hideNotificationRef.current(id);
        }
      }, duration);
    },
    [],
  );

  /**
   * Limpiar todas las notificaciones activas
   * Resetea el estado de notificaciones a array vacío
   */
  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // ============================================================================
  // VALOR DEL CONTEXTO
  // ============================================================================

  // OPTIMIZACIÓN: Memoizar el valor del contexto para evitar re-renders innecesarios
  // CORRECCIÓN: Incluir notifications en las dependencias para que se actualice la UI
  const value = useMemo<NotificationContextType>(
    () => ({
      notifications,
      showNotification,
      hideNotification,
      clearNotifications,
    }),
    [notifications, showNotification, hideNotification, clearNotifications],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
