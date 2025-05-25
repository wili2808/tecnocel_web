/**
 * Contexto de Tema - Maneja el estado global del tema
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * Tipos de temas disponibles
 */
export type Theme = 'light' | 'dark';

/**
 * Métodos y propiedades del contexto de tema
 */
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

// Creación del contexto de tema
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

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

/**
 * Props para el componente ThemeProvider
 * @property {React.ReactNode} children - Componentes hijos
 * @property {Theme} defaultTheme - Tema por defecto (opcional)
 */
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

/**
 * Proveedor del contexto de tema que maneja el estado y las operaciones
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'light' 
}) => {
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
   */
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  /**
   * Alterna entre tema claro y oscuro
   */
  const toggleTheme = useCallback(() => {
    setThemeState(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  }, []);

  /**
   * Actualiza el tema en el DOM y localStorage
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