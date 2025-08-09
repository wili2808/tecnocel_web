import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UseAutoLogoutOptions {
  timeoutMinutes?: number;
  enabled?: boolean;
  onLogout?: () => void;
}

export const useAutoLogout = ({
  timeoutMinutes = 30,
  enabled = true,
  onLogout
}: UseAutoLogoutOptions = {}) => {
  const { logout, isAuthenticated } = useAuth();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());

  // Función para resetear el timer
  const resetTimer = useCallback(() => {
    if (!enabled || !isAuthenticated) return;

    lastActivityRef.current = Date.now();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      console.log('Auto-logout por inactividad');
      logout();
      onLogout?.();
    }, timeoutMinutes * 60 * 1000);
  }, [enabled, isAuthenticated, timeoutMinutes, logout, onLogout]);

  // Función para manejar actividad del usuario
  const handleUserActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!enabled || !isAuthenticated) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      return;
    }

    // Eventos que indican actividad del usuario
    const events = [
      'mousedown',
      'mousemove', 
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'focus'
    ];

    // Agregar listeners
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Iniciar timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, isAuthenticated, handleUserActivity, resetTimer]);

  // Función para obtener tiempo restante
  const getTimeRemaining = useCallback(() => {
    if (!enabled || !isAuthenticated) return 0;
    
    const elapsed = Date.now() - lastActivityRef.current;
    const remaining = (timeoutMinutes * 60 * 1000) - elapsed;
    return Math.max(0, remaining);
  }, [enabled, isAuthenticated, timeoutMinutes]);

  return {
    resetTimer,
    getTimeRemaining,
    isEnabled: enabled && isAuthenticated,
  };
};
