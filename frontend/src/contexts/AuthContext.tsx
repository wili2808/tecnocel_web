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
  apellido_cliente: string;
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
    apellido_cliente: string;
    email_cliente: string;
    contrasena: string;
    celular_cliente: string;
    nit_ci_cliente: string;
  }) => Promise<any>;
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

  // Efecto para monitorear cambios en isAuthenticated y notificar suscriptores
  useEffect(() => {
    console.log('Estado de autenticación:', !!user ? 'Autenticado' : 'No autenticado');
    // Notificar a los suscriptores solo si ya se inicializó
    if (isInitialized) {
      subscribers.forEach(callback => callback(user));
    }
  }, [user, isInitialized, subscribers]);

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
   * Verifica el token de autenticación - Solo se ejecuta UNA VEZ
   */
  const verifyToken = useCallback(async () => {
    console.log('verifyToken llamado - Estado:', { isVerifying, isInitialized });

    // Solo ejecutar si no está ya verificando Y no está inicializado
    if (isVerifying || isInitialized) {
      console.log('Verificación ya en progreso o ya inicializada, retornando...');
      return;
    }

    setIsVerifying(true);
    console.log('Iniciando verificación de token...');

    const token = localStorage.getItem(TOKEN_KEY);
    console.log('Token en localStorage:', token ? 'Presente' : 'No presente');

    if (!token) {
      setUser(null);
      console.log('Verify Token: No hay token en localStorage.');
      setIsVerifying(false);
      setIsInitialized(true);
      return;
    }

    try {
      // NO configurar headers aquí - dejar que el interceptor lo maneje
      const response = await axiosInstance.get('/clientes/verify-token');
      const cliente = response.data?.cliente;
      if (!cliente) {
        throw new Error('Datos de cliente no encontrados en la respuesta');
      }
      setUser(cliente);
      console.log('Token verificado exitosamente:', cliente.email_cliente);
    } catch (error) {
      console.error('Error al verificar token:', error);
      localStorage.removeItem(TOKEN_KEY);
      delete axiosInstance.defaults.headers.common['Authorization'];
      setUser(null);
    } finally {
      setIsVerifying(false);
      setIsInitialized(true);
    }
  }, []); // Sin dependencias - la función nunca cambia

  // Efecto para verificar el token SOLO UNA VEZ al montar el componente
  useEffect(() => {
    console.log('AuthProvider montado - Iniciando verificación de token');
    verifyToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Array vacío - solo se ejecuta al montar, verifyToken es estable

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
      // No configurar headers aquí - dejar que el interceptor lo maneje automáticamente
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
    apellido_cliente: string;
    email_cliente: string;
    contrasena: string;
    celular_cliente: string;
    nit_ci_cliente: string;
  }) => {
    try {
      const response = await axiosInstance.post('/clientes/register', {
        nombre_cliente: data.nombre_cliente,
        apellido_cliente: data.apellido_cliente,
        email_cliente: data.email_cliente,
        celular_cliente: data.celular_cliente,
        nit_ci_cliente: data.nit_ci_cliente,
        contrasena: data.contrasena
      });

      // El backend ahora responde con token y datos del cliente para login automático
      const { cliente, token } = response.data;
      if (token && cliente) {
        // Guardar token y actualizar estado del usuario para login automático
        localStorage.setItem(TOKEN_KEY, token);
        setUser(cliente);
        console.log('Usuario registrado y logeado automáticamente:', cliente.email_cliente);
      }

      return response.data; // Devolver la respuesta para mostrar el mensaje de éxito
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
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    delete axiosInstance.defaults.headers.common['Authorization'];
  }, []);

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
