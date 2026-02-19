/**
 * Contexto de Autenticación - Maneja el estado global de autenticación
 * Soporta dos flujos independientes:
 * - Clientes: login, registro, Google OAuth (via clienteService)
 * - Usuarios del sistema (admin/empleado): loginAdmin (via usuarioService)
 * Incluye persistencia de sesión, verificación de tokens y manejo de errores
 */
import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { clienteService } from '../services/clienteService';
import { usuarioService } from '../services/usuarioService';

import type { ReactNode } from 'react';
import type { Cliente } from '../types/cliente';
import type { AdminUser } from '../types/usuario';
import type { RegisterData, UserType, RegisterResult, AuthState, AuthContextType } from '../types/auth';

// Constantes de localStorage
const TOKEN_KEY = 'token';
const ADMIN_TOKEN_KEY = 'admin_token';

/**
 * Deriva el UserType desde el AdminUser
 * Usa rolNombre del backend (dinámico) en minúsculas
 */
const getSystemUserType = (usuario: AdminUser): UserType => {
  return usuario.rolNombre?.toLowerCase() || 'desconocido';
};

/**
 * Verifica si un user es AdminUser (tiene idRol)
 */
const isAdminUser = (user: AdminUser | Cliente | null): user is AdminUser => {
  return !!user && 'idRol' in user;
};

// Estado inicial del contexto de autenticación
const initialState: AuthState = {
  user: null,
  userType: null,
  token: null,
  isVerifying: false,
  isInitialized: false,
  error: null,
};

// PROPIEDADES DEL PROVIDER
interface AuthProviderProps {
  children: ReactNode;
}

// Instancia del contexto de autenticación
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// PROVIDER PRINCIPAL

/**
 * Proveedor del contexto de autenticación
 * Maneja el estado global de autenticación y la persistencia de sesión
 * Restaura sesiones de clientes y usuarios del sistema al cargar
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  // Estado unificado del contexto - restaura sesión desde localStorage
  const [state, setState] = useState<AuthState>(() => {
    // Intentar restaurar sesión de cliente
    const clientAuth = clienteService.getAuthData();
    if (clientAuth?.cliente && clientAuth?.token) {
      return {
        ...initialState,
        user: clientAuth.cliente,
        userType: 'cliente' as UserType,
        token: clientAuth.token,
        isInitialized: true,
      };
    }

    // Intentar restaurar sesión de admin/empleado/vendedor
    const adminAuth = usuarioService.getAuthData();
    if (adminAuth?.usuario && adminAuth?.token) {
      return {
        ...initialState,
        user: adminAuth.usuario,
        userType: getSystemUserType(adminAuth.usuario),
        token: adminAuth.token,
        isInitialized: true,
      };
    }

    return { ...initialState, isInitialized: true };
  });

  // Ref para evitar verificación duplicada de token
  const verificationRef = useRef(false);

  // ============================================================================
  // FUNCIONES AUXILIARES
  // ============================================================================

  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Guarda datos de autenticación de CLIENTE en localStorage
  const saveClienteData = useCallback((cliente: Cliente, token: string) => {
    clienteService.saveAuthData({ token, cliente });
  }, []);

  // Limpia datos de autenticación de CLIENTE
  const clearClienteData = useCallback(() => {
    clienteService.clearAuthToken();
  }, []);

  // ============================================================================
  // VERIFICACIÓN DE TOKEN
  // ============================================================================

  /**
   * Verificación de token al iniciar la app
   * Intenta verificar token de cliente primero, luego de admin
   * Se ejecuta solo una vez gracias a verificationRef
   */
  const verifyToken = useCallback(async () => {
    if (verificationRef.current) return;
    verificationRef.current = true;

    updateState({ isVerifying: true, error: null });

    const storedClientToken = localStorage.getItem(TOKEN_KEY);
    const storedAdminToken = localStorage.getItem(ADMIN_TOKEN_KEY);

    // Verificar token de cliente
    if (storedClientToken) {
      try {
        const cliente = await clienteService.verifyToken();
        updateState({
          user: cliente,
          userType: 'cliente',
          token: storedClientToken,
          isVerifying: false,
          isInitialized: true,
          error: null,
        });
        return;
      } catch {
        clearClienteData();
      }
    }

    // Verificar token de usuario del sistema (admin/empleado/vendedor)
    if (storedAdminToken) {
      try {
        const userData = await usuarioService.verifyAdminToken();
        const adminUser: AdminUser = { ...userData };
        updateState({
          user: adminUser,
          userType: getSystemUserType(adminUser),
          token: storedAdminToken,
          isVerifying: false,
          isInitialized: true,
          error: null,
        });
        return;
      } catch {
        usuarioService.clearAuthToken();
      }
    }

    // Sin sesión válida
    updateState({
      user: null,
      userType: null,
      token: null,
      isVerifying: false,
      isInitialized: true,
    });
  }, [updateState, clearClienteData]);

  // ============================================================================
  // EFECTOS
  // ============================================================================

  useEffect(() => {
    verifyToken();
  }, [verifyToken]);

  // ============================================================================
  // FUNCIONES DE AUTENTICACIÓN
  // ============================================================================

  /**
   * Login de cliente con email y contraseña
   */
  const login = useCallback(
    async (email: string, contrasena: string) => {
      try {
        updateState({ error: null });

        const authData = await clienteService.login(email, contrasena);

        if (!authData.cliente) {
          throw new Error('Respuesta inválida del servidor');
        }

        saveClienteData(authData.cliente, authData.token);
        updateState({
          user: authData.cliente,
          userType: 'cliente',
          token: authData.token,
          error: null,
        });
      } catch (error: any) {
        clearClienteData();
        updateState({
          user: null,
          userType: null,
          token: null,
          error: error.message || 'Error al iniciar sesión',
        });
        throw error;
      }
    },
    [updateState, saveClienteData, clearClienteData],
  );

  /**
   * Registro de nuevo cliente
   * Crea cuenta y establece sesión automáticamente
   */
  const register = useCallback(
    async (data: RegisterData): Promise<RegisterResult> => {
      try {
        updateState({ error: null });

        const authData = await clienteService.register(data);

        if (!authData.cliente) {
          throw new Error('Respuesta inválida del servidor');
        }

        saveClienteData(authData.cliente, authData.token);
        updateState({
          user: authData.cliente,
          userType: 'cliente',
          token: authData.token,
          error: null,
        });

        return {
          token: authData.token,
          cliente: authData.cliente,
          mensaje: authData.mensaje,
        };
      } catch (error: any) {
        const errorMessage = error.message || 'Error al registrar usuario';
        updateState({ error: errorMessage });
        throw new Error(errorMessage);
      }
    },
    [updateState, saveClienteData],
  );

  /**
   * Logout - limpia sesión de cliente y admin
   */
  const logout = useCallback(() => {
    clearClienteData();
    usuarioService.clearAuthToken();
    updateState({
      user: null,
      userType: null,
      token: null,
      error: null,
    });
  }, [clearClienteData, updateState]);

  /**
   * Google login con OAuth 2.0
   */
  const googleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        updateState({ error: null });

        const authData = await clienteService.googleLogin(response.access_token);

        if (!authData.cliente) {
          throw new Error('Respuesta inválida del servidor');
        }

        saveClienteData(authData.cliente, authData.token);
        updateState({
          user: authData.cliente,
          userType: 'cliente',
          token: authData.token,
          error: null,
        });
      } catch (error: any) {
        clearClienteData();
        updateState({
          user: null,
          userType: null,
          token: null,
          error: error.message || 'Error al autenticarse con Google',
        });
      }
    },
    onError: (error) => {
      console.error('Error en Google OAuth:', error);
      updateState({ error: 'Error al autenticarse con Google' });
    },
    scope: 'email profile',
    flow: 'implicit',
  });

  /**
   * Login de administrador o empleado
   * Autentica usuarios del sistema (no clientes)
   */
  const loginAdmin = useCallback(
    async (email: string, contrasena: string) => {
      try {
        updateState({ error: null });

        // Limpiar cualquier sesión de cliente previa para evitar conflictos al recargar
        clearClienteData();

        const { token, usuario } = await usuarioService.loginAdmin(email, contrasena);

        updateState({
          user: usuario,
          userType: getSystemUserType(usuario),
          token,
          error: null,
        });
      } catch (error: any) {
        usuarioService.clearAuthToken();
        updateState({
          user: null,
          userType: null,
          token: null,
          error: error.message || 'Error al iniciar sesión como administrador',
        });
        throw error;
      }
    },
    [updateState, clearClienteData],
  );

  /**
   * Limpiar error del contexto
   */
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // ============================================================================
  // VALOR DEL CONTEXTO
  // ============================================================================

  const contextValue = useMemo(
    () => ({
      user: state.user,
      userType: state.userType,
      token: state.token,
      isAuthenticated: !!state.user,
      isAdmin: isAdminUser(state.user) && state.user.idRol === 1,
      isEmpleado: isAdminUser(state.user) && state.user.idRol === 2,
      isVendedor: isAdminUser(state.user) && state.user.idRol === 3,
      isCliente: state.userType === 'cliente',
      isSystemUser: !!state.user && state.userType !== 'cliente' && state.userType !== null,
      isVerifying: state.isVerifying,
      isInitialized: state.isInitialized,
      error: state.error,
      login,
      loginAdmin,
      register,
      logout,
      googleLogin,
      clearError,
    }),
    [
      state.user,
      state.userType,
      state.token,
      state.isVerifying,
      state.isInitialized,
      state.error,
      login,
      loginAdmin,
      register,
      logout,
      googleLogin,
      clearError,
    ],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};
