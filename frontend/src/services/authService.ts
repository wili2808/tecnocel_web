import axiosInstance from '../api/axiosConfig';
import type { ClienteUser } from '../contexts/AuthContext';

/**
 * Claves utilizadas para almacenar datos de autenticación en localStorage
 */
const TOKEN_KEY = 'token';
const AUTH_TIMESTAMP_KEY = 'auth_timestamp';
const AUTH_USER_KEY = 'auth_user';

/**
 * Estructura de datos de autenticación
 */
interface AuthData {
  user: ClienteUser;
  token: string;
}

/**
 * Estructura de error de autenticación estandarizada
 */
interface AuthError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Servicio de autenticación para manejar login, registro y gestión de sesiones
 * Incluye autenticación tradicional y con Google OAuth
 */
export const authService = {
  /**
   * Configura el token de autenticación en axios y localStorage
   * @param token - Token JWT de autenticación
   */
  setAuthToken: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  },

  /**
   * Limpia todos los datos de autenticación del localStorage y axios
   * Utilizado para logout y limpieza de sesión
   */
  clearAuthToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TIMESTAMP_KEY);
    delete axiosInstance.defaults.headers.common['Authorization'];
  },

  /**
   * Guarda todos los datos de autenticación en localStorage y configura axios
   * @param data - Datos completos de autenticación (usuario y token)
   */
  saveAuthData: (data: AuthData) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
  },

  /**
   * Obtiene los datos de autenticación almacenados en localStorage
   * Verifica la expiración automáticamente (24 horas)
   * @returns Datos de autenticación o null si no existen o han expirado
   */
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

  /**
   * Verifica la validez del token en el servidor
   * Si el token es inválido, limpia la sesión automáticamente
   * @returns Promise con los datos del cliente autenticado
   */
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

  /**
   * Autentica un usuario con email y contraseña
   * @param email - Email del cliente
   * @param password - Contraseña del cliente
   * @returns Promise con los datos de autenticación (usuario y token)
   */
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

  /**
   * Registra un nuevo usuario en el sistema
   * @param data - Datos del nuevo cliente
   * @returns Promise con los datos de autenticación del usuario registrado
   */
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

  /**
   * Autentica un usuario usando Google OAuth
   * @param accessToken - Token de acceso de Google
   * @returns Promise con los datos de autenticación del usuario
   */
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

  /**
   * Maneja centralizadamente los errores de autenticación
   * Convierte errores HTTP en errores estandarizados con códigos
   * @param error - Error capturado de la petición HTTP
   * @returns Error estandarizado con código y mensaje descriptivo
   */
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

  /**
   * Verifica si el usuario está autenticado actualmente
   * @returns true si hay datos de autenticación válidos, false en caso contrario
   */
  isAuthenticated: (): boolean => {
    const authData = authService.getAuthData();
    return !!authData;
  },

  /**
   * Obtiene el usuario actualmente autenticado
   * @returns Datos del usuario autenticado o null si no hay sesión
   */
  getCurrentUser: (): ClienteUser | null => {
    const authData = authService.getAuthData();
    return authData?.user || null;
  },

  /**
   * Obtiene el token de autenticación actual
   * @returns Token JWT actual o null si no hay sesión
   */
  getCurrentToken: (): string | null => {
    const authData = authService.getAuthData();
    return authData?.token || null;
  },
};
