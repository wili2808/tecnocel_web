import axiosInstance from '../api/axiosConfig';
import type { ClienteUser } from '../contexts/AuthContext';

// Constantes
const TOKEN_KEY = 'token';
const AUTH_TIMESTAMP_KEY = 'auth_timestamp';
const AUTH_USER_KEY = 'auth_user';

// Tipos
interface AuthData {
  user: ClienteUser;
  token: string;
}

interface AuthError {
  code: string;
  message: string;
  details?: any;
}

// Servicio de autenticación
export const authService = {
  // Configurar token de autenticación
  setAuthToken: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  // Limpiar token de autenticación
  clearAuthToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TIMESTAMP_KEY);
    delete axiosInstance.defaults.headers.common['Authorization'];
  },

  // Guardar datos de autenticación completos
  saveAuthData: (data: AuthData) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
  },

  // Obtener datos de autenticación
  getAuthData: (): AuthData | null => {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = localStorage.getItem(AUTH_USER_KEY);
    const timestamp = localStorage.getItem(AUTH_TIMESTAMP_KEY);

    if (!token || !user || !timestamp) {
      return null;
    }

    // Verificar expiración (24 horas)
    const isExpired = Date.now() - parseInt(timestamp) > 24 * 60 * 60 * 1000;
    if (isExpired) {
      authService.clearAuthToken();
      return null;
    }

    return {
      token,
      user: JSON.parse(user),
    };
  },

  // Verificar token en el servidor
  verifyToken: async (): Promise<ClienteUser> => {
    try {
      const response = await axiosInstance.get('/clientes/verify-token');
      const cliente = response.data?.cliente;
      
      if (!cliente) {
        throw new Error('Datos de cliente no encontrados');
      }

      return cliente;
    } catch (error) {
      authService.clearAuthToken();
      throw error;
    }
  },

  // Login con email y contraseña
  login: async (email: string, password: string): Promise<AuthData> => {
    try {
      const response = await axiosInstance.post('/clientes/login', {
        email_cliente: email.trim(),
        contrasena: password.trim(),
      });

      const { cliente, token } = response.data;
      
      if (!token || !cliente) {
        throw new Error('Respuesta inválida del servidor');
      }

      return { user: cliente, token };
    } catch (error) {
      throw authService.handleAuthError(error);
    }
  },

  // Registro de usuario
  register: async (data: {
    nombre_cliente: string;
    apellido_cliente: string;
    email_cliente: string;
    contrasena: string;
    celular_cliente: string;
    nit_ci_cliente: string;
  }): Promise<AuthData> => {
    try {
      const response = await axiosInstance.post('/clientes/register', data);
      const { cliente, token } = response.data;

      if (!token || !cliente) {
        throw new Error('Respuesta inválida del servidor');
      }

      return { user: cliente, token };
    } catch (error) {
      throw authService.handleAuthError(error);
    }
  },

  // Login con Google
  googleLogin: async (accessToken: string): Promise<AuthData> => {
    try {
      const response = await axiosInstance.post('/clientes/google-login', {
        access_token: accessToken
      });

      const { cliente, token } = response.data;
      
      if (!token || !cliente) {
        throw new Error('Respuesta inválida del servidor');
      }

      return { user: cliente, token };
    } catch (error) {
      throw authService.handleAuthError(error);
    }
  },

  // Manejo centralizado de errores
  handleAuthError: (error: any): AuthError => {
    if (error.response?.status === 401) {
      return {
        code: 'UNAUTHORIZED',
        message: 'Credenciales inválidas',
        details: error.response.data
      };
    }
    
    if (error.response?.status === 409) {
      return {
        code: 'EMAIL_EXISTS',
        message: 'El correo electrónico ya está registrado',
        details: error.response.data
      };
    }
    
    if (error.response?.status === 422) {
      return {
        code: 'VALIDATION_ERROR',
        message: 'Datos de entrada inválidos',
        details: error.response.data
      };
    }
    
    if (error.response?.status >= 500) {
      return {
        code: 'SERVER_ERROR',
        message: 'Error en el servidor. Intente más tarde.',
        details: error.response.data
      };
    }

    return {
      code: 'UNKNOWN',
      message: error.message || 'Error inesperado',
      details: error
    };
  },

  // Verificar si el usuario está autenticado
  isAuthenticated: (): boolean => {
    const authData = authService.getAuthData();
    return !!authData;
  },

  // Obtener usuario actual
  getCurrentUser: (): ClienteUser | null => {
    const authData = authService.getAuthData();
    return authData?.user || null;
  },

  // Obtener token actual
  getCurrentToken: (): string | null => {
    const authData = authService.getAuthData();
    return authData?.token || null;
  },
};
