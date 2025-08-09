/**
 * Contexto de Autenticación Optimizado - Maneja el estado global de autenticación
 */
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { authService } from '../services/authService';

// Constantes
const TOKEN_KEY = 'token';
const AUTH_TIMESTAMP_KEY = 'auth_timestamp';
const AUTH_USER_KEY = 'auth_user';

/**
 * Estructura de un cliente en el sistema
 */
export interface ClienteUser {
  id_cliente: number;
  nombre_cliente: string;
  apellido_cliente: string;
  email_cliente: string;
  celular_cliente?: string;
  nit_ci_cliente?: string;
}

interface AuthState {
  user: ClienteUser | null;
  token: string | null;
  isVerifying: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface RegisterData {
  nombre_cliente: string;
  apellido_cliente: string;
  email_cliente: string;
  contrasena: string;
  celular_cliente: string;
  nit_ci_cliente: string;
}

/**
 * Métodos y propiedades del contexto de autenticación
 */
interface AuthContextType {
  user: ClienteUser | null;
  isAuthenticated: boolean;
  token: string | null;
  isVerifying: boolean;
  isInitialized: boolean;
  error: string | null;
  login: (email_cliente: string, contrasena: string) => Promise<void>;
  register: (data: RegisterData) => Promise<any>;
  logout: () => void;
  googleLogin: (overrideConfig?: any) => void;
  clearError: () => void;
}

// Estado inicial
const initialState: AuthState = {
  user: null,
  token: null,
  isVerifying: false,
  isInitialized: false,
  error: null,
};

// Creación del contexto de autenticación
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hook personalizado para usar el contexto de autenticación
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Proveedor del contexto de autenticación optimizado
 * Maneja el estado global de autenticación y la persistencia de sesión
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  // Estado unificado
  const [state, setState] = useState<AuthState>(() => {
    // Inicialización lazy para evitar cálculos en cada render
    const token = localStorage.getItem(TOKEN_KEY);
    const user = localStorage.getItem(AUTH_USER_KEY);
    const timestamp = localStorage.getItem(AUTH_TIMESTAMP_KEY);

    // Verificar si los datos han expirado (24 horas)
    if (token && user && timestamp) {
      const isExpired = Date.now() - parseInt(timestamp) > 24 * 60 * 60 * 1000;
      if (!isExpired) {
        return {
          ...initialState,
          token,
          user: JSON.parse(user),
        };
      }
    }

    return initialState;
  });

  // Refs para evitar re-renders innecesarios
  const verificationRef = useRef(false);
  const isInitializedRef = useRef(false);

  // Función para actualizar estado de forma inmutable
  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Función para guardar datos de autenticación
  const saveAuthData = useCallback((user: ClienteUser, token: string) => {
    authService.saveAuthData({ user, token });
  }, []);

  // Función para limpiar datos de autenticación
  const clearAuthData = useCallback(() => {
    authService.clearAuthToken();
  }, []);

  // Verificación de token optimizada
  const verifyToken = useCallback(async () => {
    if (verificationRef.current || isInitializedRef.current) {
      return;
    }

    verificationRef.current = true;
    updateState({ isVerifying: true, error: null });

    const storedToken = localStorage.getItem(TOKEN_KEY);

    if (!storedToken) {
      updateState({
        user: null,
        token: null,
        isVerifying: false,
        isInitialized: true
      });
      return;
    }

    try {
      const cliente = await authService.verifyToken();
      updateState({
        user: cliente,
        token: storedToken,
        isVerifying: false,
        isInitialized: true,
        error: null,
      });
    } catch (error) {
      console.error('Error al verificar token:', error);
      clearAuthData();
      updateState({
        user: null,
        token: null,
        isVerifying: false,
        isInitialized: true,
        error: 'Sesión expirada',
      });
    }
  }, [updateState, clearAuthData]);

  // Efecto para verificar token solo una vez
  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  // Login optimizado
  const login = useCallback(async (email_cliente: string, contrasena: string) => {
    try {
      updateState({ error: null });

      const authData = await authService.login(email_cliente, contrasena);
      saveAuthData(authData.user, authData.token);
      updateState({
        user: authData.user,
        token: authData.token,
        error: null,
      });
    } catch (error: any) {
      clearAuthData();
      updateState({
        user: null,
        token: null,
        error: error.message || 'Error al iniciar sesión',
      });
      throw error;
    }
  }, [updateState, saveAuthData, clearAuthData]);

  // Register optimizado
  const register = useCallback(async (data: RegisterData) => {
    try {
      updateState({ error: null });

      const authData = await authService.register(data);
      saveAuthData(authData.user, authData.token);
      updateState({
        user: authData.user,
        token: authData.token,
        error: null,
      });

      return { success: true, data: authData };
    } catch (error: any) {
      const errorMessage = error.message || 'Error al registrar usuario';
      updateState({ error: errorMessage });
      throw new Error(errorMessage);
    }
  }, [updateState, saveAuthData]);

  // Logout optimizado
  const logout = useCallback(() => {
    clearAuthData();
    updateState({
      user: null,
      token: null,
      error: null,
    });
  }, [clearAuthData, updateState]);

  // Google login optimizado
  const googleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        updateState({ error: null });

        const authData = await authService.googleLogin(response.access_token);
        saveAuthData(authData.user, authData.token);
        updateState({
          user: authData.user,
          token: authData.token,
          error: null,
        });
      } catch (error: any) {
        clearAuthData();
        updateState({
          user: null,
          token: null,
          error: error.message || 'Error al autenticarse con Google',
        });
        throw error;
      }
    },
    onError: (error) => {
      console.error('Error en Google OAuth:', error);
      updateState({ error: 'Error al autenticarse con Google' });
      throw new Error('Error al autenticarse con Google');
    },
    scope: 'email profile',
    flow: 'implicit'
  });

  // Limpiar error
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Valor del contexto memoizado
  const contextValue = useMemo(() => ({
    user: state.user,
    token: state.token,
    isAuthenticated: !!state.user,
    isVerifying: state.isVerifying,
    isInitialized: state.isInitialized,
    error: state.error,
    login,
    register,
    logout,
    googleLogin,
    clearError,
  }), [
    state.user,
    state.token,
    state.isVerifying,
    state.isInitialized,
    state.error,
    login,
    register,
    logout,
    googleLogin,
    clearError,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
