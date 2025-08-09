import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  nombre_cliente: string;
  apellido_cliente: string;
  email_cliente: string;
  contrasena: string;
  celular_cliente: string;
  nit_ci_cliente: string;
}

interface AuthActionResult {
  success: boolean;
  error?: string;
  data?: any;
}

export const useAuthActions = () => {
  const { login, register, logout, googleLogin, clearError } = useAuth();

  // Login con manejo de errores mejorado
  const handleLogin = useCallback(async (credentials: LoginCredentials): Promise<AuthActionResult> => {
    try {
      clearError();
      await login(credentials.email, credentials.password);
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Error al iniciar sesión' 
      };
    }
  }, [login, clearError]);

  // Registro con manejo de errores mejorado
  const handleRegister = useCallback(async (data: RegisterData): Promise<AuthActionResult> => {
    try {
      clearError();
      const result = await register(data);
      return { success: true, data: result };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Error al registrar usuario' 
      };
    }
  }, [register, clearError]);

  // Google login con manejo de errores mejorado
  const handleGoogleLogin = useCallback(async (accessToken: string): Promise<AuthActionResult> => {
    try {
      clearError();
      await googleLogin({ access_token: accessToken });
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Error al autenticarse con Google' 
      };
    }
  }, [googleLogin, clearError]);

  // Logout con limpieza completa
  const handleLogout = useCallback(() => {
    try {
      logout();
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Error al cerrar sesión' 
      };
    }
  }, [logout]);

  return {
    handleLogin,
    handleRegister,
    handleGoogleLogin,
    handleLogout,
    clearError,
  };
};
