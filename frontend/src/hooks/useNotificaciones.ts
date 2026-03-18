/**
 * Hook personalizado para acceder al contexto de notificaciones
 */
import { useContext } from 'react';
import { NotificacionesContext } from '../contexts/NotificacionesContext';
import type { NotificacionesContextType } from '../contexts/NotificacionesContext';

export const useNotificaciones = (): NotificacionesContextType => {
  const context = useContext(NotificacionesContext);
  if (context === undefined) {
    throw new Error('useNotificaciones debe ser usado dentro de un NotificacionesProvider');
  }
  return context;
};
