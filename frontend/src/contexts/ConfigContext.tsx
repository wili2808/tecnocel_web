import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { configuracionService, type Configuracion } from '../services/configuracionService';

interface ConfigContextType {
  configs: Record<string, string>;
  loading: boolean;
  refreshConfigs: () => Promise<void>;
  getConfig: (clave: string, defaultValue?: string) => string;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const refreshConfigs = useCallback(async () => {
    try {
      // Intentar primero obtener las configuraciones públicas
      let data = await configuracionService.getPublic();
      
      // Si tenemos token de admin, intentar obtener todas las configuraciones para tener la data completa
      const isAdminSession = !!localStorage.getItem('admin_token');
      if (isAdminSession) {
        try {
          const allData = await configuracionService.getAll();
          data = allData;
        } catch (e) {
          console.warn('No se pudieron cargar todas las configuraciones admin, usando las públicas.');
        }
      }

      const configMap: Record<string, string> = {};
      data.forEach((c: Configuracion) => {
        configMap[c.clave] = c.valor;
      });
      setConfigs(configMap);
    } catch (error) {
      console.error('Error al cargar configuraciones globales:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshConfigs();
  }, [refreshConfigs]);

  const getConfig = (clave: string, defaultValue: string = ''): string => {
    return configs[clave] || defaultValue;
  };

  const value = {
    configs,
    loading,
    refreshConfigs,
    getConfig
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig debe usarse dentro de un ConfigProvider');
  }
  return context;
};
