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
  /**
   * Tipos de usuario permitidos.
   * Usar 'cliente' para clientes, 'system' para cualquier usuario del sistema,
   * o nombres de rol específicos en minúsculas (ej: 'administrador', 'empleado')
   */
  allowedUserTypes: (UserType | 'system')[];
  redirectTo?: string;
}

/**
 * Componente de protección de rutas basado en tipo de usuario
 *
 * @example
 * // Solo clientes
 * <ProtectedRoute allowedUserTypes={['cliente']}>
 *   <UserPanel />
 * </ProtectedRoute>
 *
 * @example
 * // Todos los usuarios del sistema (admin, empleado, vendedor, etc.)
 * <ProtectedRoute allowedUserTypes={['system']}>
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
    const isClienteRoute = allowedUserTypes.includes('cliente');
    const loginPath = isClienteRoute ? '/login' : '/admin-login';
    return <Navigate to={redirectTo || loginPath} state={{ from: location }} replace />;
  }

  // Autenticado pero tipo incorrecto → redirect inteligente
  // 'system' permite a cualquier usuario del sistema (no cliente)
  const isAllowed = allowedUserTypes.includes('system')
    ? userType !== 'cliente'
    : allowedUserTypes.includes(userType!);

  if (userType && !isAllowed) {
    // Cliente intentando acceder a admin → a home
    // Usuario del sistema intentando acceder a panel cliente → a admin panel
    const fallback = userType === 'cliente' ? '/' : '/admin-panel';
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
