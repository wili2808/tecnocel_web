/**
 * Componente ProtectedRoute - Protección de rutas basada en tipo de usuario
 * Redirige automáticamente según el estado de autenticación y tipo de usuario
 * Evita flash de contenido mostrando nada mientras verifica el token
 */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import type { UserType } from '../../../types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedUserTypes: UserType[];
  redirectTo?: string;
}

/**
 * Componente de protección de rutas basado en tipo de usuario
 *
 * @param children - Componente hijo a renderizar si está autorizado
 * @param allowedUserTypes - Array de tipos de usuario permitidos ('cliente', 'admin', 'empleado')
 * @param redirectTo - Ruta de redirección personalizada (opcional)
 *
 * @example
 * // Solo clientes
 * <ProtectedRoute allowedUserTypes={['cliente']}>
 *   <UserPanel />
 * </ProtectedRoute>
 *
 * @example
 * // Admin y empleados
 * <ProtectedRoute allowedUserTypes={['admin', 'empleado']}>
 *   <AdminPanel />
 * </ProtectedRoute>
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedUserTypes,
  redirectTo
}) => {
  const { isAuthenticated, userType, isVerifying } = useAuth();
  const location = useLocation();

  // Mientras verifica token, no renderizar nada (evita flash de contenido)
  if (isVerifying) {
    return null;
  }

  // No autenticado → redirect a login correspondiente
  if (!isAuthenticated) {
    const isAdminRoute = allowedUserTypes.includes('admin') || allowedUserTypes.includes('empleado');
    const loginPath = isAdminRoute ? '/admin-login' : '/login';
    return <Navigate to={redirectTo || loginPath} state={{ from: location }} replace />;
  }

  // Autenticado pero tipo incorrecto → redirect inteligente
  if (userType && !allowedUserTypes.includes(userType)) {
    // Cliente intentando acceder a admin → a home
    // Admin intentando acceder a panel cliente → a admin panel
    const fallback = userType === 'cliente' ? '/' : '/admin-panel';
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
