import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { RegisterData, RegisterResult } from '../types/auth';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthActionResult {
  success: boolean;
  error?: string;
  data?: RegisterResult;
}

export const useAuthActions = () => {
  const { login, register, logout, googleLogin, clearError } = useAuth();

  const handleLogin = useCallback(async (credentials: LoginCredentials): Promise<AuthActionResult> => {
    try {
      clearError();
      await login(credentials.email, credentials.password);
      return { success: true };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al iniciar sesión';
      return { success: false, error: message };
    }
  }, [login, clearError]);

  const handleRegister = useCallback(async (data: RegisterData): Promise<AuthActionResult> => {
    try {
      clearError();
      const result = await register(data);
      return { success: true, data: result };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al registrar usuario';
      return { success: false, error: message };
    }
  }, [register, clearError]);

  /**
   * Inicia el flujo de Google OAuth (popup)
   * Los errores se manejan internamente en el callback onError de useGoogleLogin
   */
  const handleGoogleLogin = useCallback(() => {
    clearError();
    googleLogin();
  }, [googleLogin, clearError]);

  const handleLogout = useCallback(() => {
    logout();
  }, [logout]);

  return {
    handleLogin,
    handleRegister,
    handleGoogleLogin,
    handleLogout,
    clearError,
  };
};
