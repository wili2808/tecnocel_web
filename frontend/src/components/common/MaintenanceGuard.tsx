import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useConfig } from '../../contexts/ConfigContext';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner/LoadingSpinner';

interface MaintenanceGuardProps {
  children: React.ReactNode;
}

const MaintenanceGuard: React.FC<MaintenanceGuardProps> = ({ children }) => {
  const { getConfig, loading } = useConfig();
  const { isAdmin, isGerente, isVendedor } = useAuth();
  const location = useLocation();
  
  const maintenanceValue = getConfig('maintenance_mode', '0');
  const isMaintenanceMode = maintenanceValue === '1' || maintenanceValue.toLowerCase() === 'true';
  
  const isSystemUser = isAdmin || isGerente || isVendedor;
  
  if (location.pathname === '/mantenimiento') {
    return <>{children}</>;
  }

  if (loading) {
    return <LoadingSpinner size="lg" text="Verificando configuración..." />;
  }

  if (isMaintenanceMode && !isSystemUser) {
    return <Navigate to="/mantenimiento" replace />;
  }

  return <>{children}</>;
};

export default MaintenanceGuard;
