/**
 * Contexto de Autenticación - Maneja el estado global de autenticación
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import axiosInstance from '../api/axiosConfig';

// Constantes
const TOKEN_KEY = 'token';

/**
 * Estructura de un cliente en el sistema
 */
export interface ClienteUser {
  id_cliente: number;
  nombre_cliente: string;
  email_cliente: string;
  celular_cliente?: string;
  nit_ci_cliente?: string;
}

/**
 * Métodos y propiedades del contexto de autenticación
 */
interface AuthContextType {
  user: ClienteUser | null;
  isAuthenticated: boolean;
  login: (email_cliente: string, contrasena: string) => Promise<void>;
  register: (data: {
    nombre_cliente: string;
    apellidos: string;
    email_cliente: string;
    contrasena: string;
    celular_cliente: string;
    nit_ci_cliente: string;
  }) => Promise<void>;
  logout: () => void;
  googleLogin: () => Promise<void>;
  subscribeToAuthChanges: (callback: (user: ClienteUser | null) => void) => () => void;
}

// Creación del contexto de autenticación
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Hook personalizado para acceder al contexto de autenticación
 * @throws Error si se usa fuera de un AuthProvider
 * @returns {AuthContextType} Contexto de autenticación con sus métodos y propiedades
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  return context;
};

/**
 * Props para el componente AuthProvider
 * @property {ReactNode} children - Componentes hijos
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Proveedor del contexto de autenticación
 * Maneja el estado global de autenticación y la persistencia de sesión
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  // Estados
  const [user, setUser] = useState<ClienteUser | null>(null);
  const [subscribers, setSubscribers] = useState<((user: ClienteUser | null) => void)[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Efecto para monitorear cambios en isAuthenticated
  useEffect(() => {
    console.log('Estado de autenticación:', !!user ? 'Autenticado' : 'No autenticado');
  }, [user]);

  /**
   * Notifica a todos los suscriptores sobre cambios en el usuario
   */
  const notifySubscribers = useCallback((newUser: ClienteUser | null) => {
    subscribers.forEach(callback => callback(newUser));
  }, [subscribers]);

  /**
   * Actualiza el estado del usuario y notifica a los suscriptores
   */
  const updateUser = useCallback((newUser: ClienteUser | null) => {
    setUser(newUser);
    notifySubscribers(newUser);
  }, [notifySubscribers]);

  /**
   * Función para suscribirse a cambios en el estado de autenticación
   */
  const subscribeToAuthChanges = useCallback((callback: (user: ClienteUser | null) => void) => {
    setSubscribers(prevSubscribers => [...prevSubscribers, callback]);
    // Solo notificar al suscriptor si ya hemos inicializado
    if (isInitialized) {
      callback(user);
    }
    return () => {
      setSubscribers(prevSubscribers => prevSubscribers.filter(sub => sub !== callback));
    };
  }, [user, isInitialized]);

  /**
   * Verifica el token de autenticación
   */
  const verifyToken = useCallback(async () => {
    console.log('verifyToken llamado - Estado:', { isVerifying, isInitialized });

    // Solo ejecutar si no está ya verificando Y no ha sido inicializado aún
    if (isVerifying || isInitialized) {
      console.log('Verificación ya en progreso o inicializada, retornando...');
      return;
    }

    setIsVerifying(true); // Indicar que la verificación está en progreso
    console.log('Iniciando verificación de token...');

    const token = localStorage.getItem(TOKEN_KEY);
    console.log('Token en localStorage:', token ? 'Presente' : 'No presente');

    if (!token) {
      updateUser(null);
      console.log('Verify Token: No hay token en localStorage.');
      setIsVerifying(false);
      setIsInitialized(true);
      return;
    }

    try {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Cambiar endpoint a clientes y mapear respuesta
      const response = await axiosInstance.get('/clientes/verify-token');
      const cliente = response.data?.cliente;
      if (!cliente) {
        throw new Error('Datos de cliente no encontrados en la respuesta');
      }
      updateUser(cliente);
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY);
      delete axiosInstance.defaults.headers.common['Authorization'];
      updateUser(null);
    } finally {
      setIsVerifying(false);
      setIsInitialized(true);
    }
  }, [updateUser, isVerifying, isInitialized]);

  // Efecto para verificar el token solo una vez al montar el componente
  useEffect(() => {
    console.log('AuthProvider montado - Iniciando verificación de token');
    console.log('Estado actual:', { isVerifying, isInitialized });
    verifyToken();
  }, [verifyToken]);

  /**
   * Función para iniciar sesión con email y contraseña
   */
  const login = async (email_cliente: string, contrasena: string) => {
    try {
      const response = await axiosInstance.post('/clientes/login', {
        email_cliente: email_cliente.trim(),
        contrasena: contrasena.trim(),
      });
      const { cliente, token } = response.data;
      if (!token) throw new Error('No se recibió token del servidor');
      localStorage.setItem(TOKEN_KEY, token);
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(cliente);
    } catch (error: any) {
      localStorage.removeItem(TOKEN_KEY);
      delete axiosInstance.defaults.headers.common['Authorization'];
      throw new Error(error.response?.data?.mensaje || 'Error al iniciar sesión. Por favor, intente nuevamente.');
    }
  };

  /**
   * Función para registrar un nuevo usuario
   */
  const register = async (data: {
    nombre_cliente: string;
    apellidos: string;
    email_cliente: string;
    contrasena: string;
    celular_cliente: string;
    nit_ci_cliente: string;
  }) => {
    try {
      const response = await axiosInstance.post('/clientes/register', {
        nombre_cliente: data.nombre_cliente,
        email_cliente: data.email_cliente,
        celular_cliente: data.celular_cliente,
        nit_ci_cliente: data.nit_ci_cliente,
        contrasena: data.contrasena
      });
      // El backend responde con mensaje, no con token ni cliente, porque requiere verificación de email
      // Puedes mostrar un toast con el mensaje de éxito
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new Error(error.response.data.mensaje || 'Datos de registro inválidos');
      } else if (error.response?.status === 409) {
        throw new Error('El correo electrónico ya está registrado');
      }
      throw new Error(error.message || 'Error al registrar usuario. Por favor, intente nuevamente.');
    }
  };

  /**
   * Función para cerrar sesión
   */
  const logout = useCallback(() => {
    updateUser(null);
    localStorage.removeItem(TOKEN_KEY);
    delete axiosInstance.defaults.headers.common['Authorization'];
  }, [updateUser]);

  /**
   * Función para iniciar sesión con Google
   */
  const googleLogin = async () => {
    try {
      // Implementación pendiente de Google OAuth
      console.log('Autenticación con Google pendiente de implementar');
      throw new Error('Funcionalidad no implementada');
    } catch (error) {
      console.error('Error en autenticación con Google:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        googleLogin,
        subscribeToAuthChanges,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
