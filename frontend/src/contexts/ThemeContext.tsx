import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// --- TIPOS Y CONFIGURACIÓN ---

/**
 * Tipos de temas disponibles en la aplicación
 * Define los valores válidos para el estado del tema
 */
export type Theme = 'light' | 'dark';

// --- INTERFACES ---

/**
 * Métodos y propiedades del contexto de tema
 * Define la API pública del contexto para componentes consumidores
 */
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

/**
 * Props para el componente ThemeProvider
 * @property {React.ReactNode} children - Componentes hijos
 * @property {Theme} defaultTheme - Tema por defecto (opcional)
 */
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

// --- CREACIÓN DEL CONTEXTO ---

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// --- HOOK PERSONALIZADO ---

/**
 * Hook personalizado para acceder al contexto de tema
 * @throws Error si se usa fuera de un ThemeProvider
 * @returns {ThemeContextType} Contexto de tema con sus métodos y propiedades
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de un ThemeProvider');
  }
  return context;
};

// --- PROVIDER PRINCIPAL ---

/**
 * Proveedor del contexto de tema que maneja el estado y las operaciones
 * Incluye persistencia automática y sincronización con preferencias del sistema
 * Optimizado para evitar re-renders innecesarios con useMemo
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'dark'
}) => {
  // ============================================================================
  // ESTADO Y FUNCIONES
  // ============================================================================

  // Estado para almacenar el tema actual
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      return (savedTheme as Theme) || defaultTheme;
    } catch (error) {
      console.error('Error al cargar el tema:', error);
      return defaultTheme;
    }
  });

  /**
   * Establece un tema específico
   * Actualiza el estado local y dispara efectos de sincronización
   */
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  /**
   * Alterna entre tema claro y oscuro
   * Cambia automáticamente al tema opuesto del actual
   */
  const toggleTheme = useCallback(() => {
    setThemeState(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  }, []);

  // ============================================================================
  // EFECTOS Y SINCRONIZACIÓN
  // ============================================================================

  /**
   * Actualiza el tema en el DOM y localStorage
   * Sincroniza el atributo data-theme y meta theme-color para navegadores móviles
   */
  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);

      // Actualizar meta theme-color para navegadores móviles
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute(
          'content',
          theme === 'light' ? '#ffffff' : '#1a1a1a'
        );
      }
    } catch (error) {
      console.error('Error al actualizar el tema:', error);
    }
  }, [theme]);

  /**
   * Sincroniza con las preferencias del sistema
   * Escucha cambios en las preferencias de color del sistema operativo
   * Incluye manejo de errores para navegadores que no soportan la API
   */
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setThemeState(e.matches ? 'dark' : 'light');
    };

    try {
      mediaQuery.addEventListener('change', handleChange);
    } catch (error) {
      console.error('Error al configurar el listener de preferencias del sistema:', error);
    }

    return () => {
      try {
        mediaQuery.removeEventListener('change', handleChange);
      } catch (error) {
        console.error('Error al limpiar el listener de preferencias del sistema:', error);
      }
    };
  }, []);

  /**
   * Sincronización cross-tab del tema
   * Escucha cambios en localStorage desde otras pestañas/ventanas del navegador
   * Permite que cambios de tema en Tab1 se reflejen automáticamente en Tab2
   */
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme' && e.newValue) {
        const newTheme = e.newValue as Theme;
        setThemeState(newTheme);
      }
    };

    try {
      window.addEventListener('storage', handleStorageChange);
    } catch (error) {
      console.error('Error al configurar listener de storage:', error);
    }

    return () => {
      try {
        window.removeEventListener('storage', handleStorageChange);
      } catch (error) {
        console.error('Error al limpiar listener de storage:', error);
      }
    };
  }, []);

  // ============================================================================
  // VALOR DEL CONTEXTO
  // ============================================================================

  // Memoización del valor del contexto para optimizar rendimiento
  const value = React.useMemo(() => ({
    theme,
    toggleTheme,
    setTheme
  }), [theme, toggleTheme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};