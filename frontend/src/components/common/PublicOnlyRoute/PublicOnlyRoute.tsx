/**
 * Componente PublicOnlyRoute - Ruta solo para usuarios no autenticados
 * Redirige a usuarios ya logueados a su destino correspondiente
 * Útil para páginas de login y registro
 */
import { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';

interface PublicOnlyRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Ruta solo para usuarios no autenticados
 * Redirige automáticamente a usuarios logueados a su destino correspondiente.
 * Muestra notificación de bienvenida cuando el login ocurre mientras se está
 * en esta ruta (caso Google OAuth, donde el auth es completamente asíncrono).
 *
 * @param children - Componente hijo a renderizar si no está autenticado
 * @param redirectTo - Ruta de redirección personalizada (opcional)
 *
 * @example
 * // Login de cliente - redirige a / si ya está logueado
 * <PublicOnlyRoute>
 *   <Login />
 * </PublicOnlyRoute>
 *
 * @example
 * // Login de admin - redirige a /admin-panel si ya está logueado
 * <PublicOnlyRoute redirectTo="/admin-panel">
 *   <AdminLogin />
 * </PublicOnlyRoute>
 */
export const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({
  children,
  redirectTo
}) => {
  const { isAuthenticated, userType, isVerifying } = useAuth();
  const { showNotification } = useNotification();

  // Guarda el valor anterior de isAuthenticated para detectar transición false→true
  const wasAuthenticated = useRef(isAuthenticated);

  // Cuando isAuthenticated cambia de false a true mientras estamos en esta ruta
  // significa que el usuario acaba de autenticarse (caso típico: Google OAuth).
  // El email/password login no llega aquí porque navega antes del re-render.
  useEffect(() => {
    const prevAuth = wasAuthenticated.current;
    wasAuthenticated.current = isAuthenticated;

    if (!prevAuth && isAuthenticated && !isVerifying && userType === 'cliente') {
      showNotification('¡Bienvenido!', 'success');
    }
  }, [isAuthenticated, isVerifying, userType, showNotification]);

  // Mientras verifica token, no renderizar nada (evita flash)
  if (isVerifying) {
    return null;
  }

  // Si está autenticado, redirigir al destino correspondiente
  if (isAuthenticated) {
    const defaultRedirect = userType === 'cliente' ? '/' : '/admin-panel';
    return <Navigate to={redirectTo || defaultRedirect} replace />;
  }

  return <>{children}</>;
};

export default PublicOnlyRoute;
