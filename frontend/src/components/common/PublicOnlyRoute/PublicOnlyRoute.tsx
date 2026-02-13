/**
 * Componente PublicOnlyRoute - Ruta solo para usuarios no autenticados
 * Redirige a usuarios ya logueados a su panel correspondiente
 * Útil para páginas de login y registro
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

interface PublicOnlyRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Ruta solo para usuarios no autenticados
 * Redirige automáticamente a usuarios logueados a su panel correspondiente
 *
 * @param children - Componente hijo a renderizar si no está autenticado
 * @param redirectTo - Ruta de redirección personalizada (opcional)
 *
 * @example
 * // Login de cliente - redirige a /panel si ya está logueado
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

  // Mientras verifica token, no renderizar nada (evita flash)
  if (isVerifying) {
    return null;
  }

  // Si está autenticado, redirigir a su panel correspondiente
  if (isAuthenticated) {
    const defaultRedirect = userType === 'cliente' ? '/panel' : '/admin-panel';
    return <Navigate to={redirectTo || defaultRedirect} replace />;
  }

  return <>{children}</>;
};

export default PublicOnlyRoute;
