import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useConfig } from '../../contexts/ConfigContext';
import { useAuth } from '../../contexts/AuthContext';

interface MaintenanceGuardProps {
  children: React.ReactNode;
}

const MaintenanceGuard: React.FC<MaintenanceGuardProps> = ({ children }) => {
  const { getConfig, loading } = useConfig();
  const { isAdmin, isGerente, isVendedor } = useAuth();
  const location = useLocation();
  
  const maintenanceValue = getConfig('maintenance_mode', '0');
  const isMaintenanceMode = maintenanceValue === '1' || maintenanceValue.toLowerCase() === 'true';
  
  // Si el modo mantenimiento está activo y el usuario no es personal del sistema
  const isSystemUser = isAdmin || isGerente || isVendedor;
  
  // No aplicar el guard a la propia página de mantenimiento
  if (location.pathname === '/mantenimiento') {
    return <>{children}</>;
  }

  // Mientras carga la configuración, mostramos un estado de carga para evitar flash de contenido
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (isMaintenanceMode && !isSystemUser) {
    return <Navigate to="/mantenimiento" replace />;
  }

  return <>{children}</>;
};

export default MaintenanceGuard;
