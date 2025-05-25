/**
 * Contexto de Autenticación - Maneja el estado global de autenticación
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import axiosInstance from '../api/axiosConfig';

// Constantes
const TOKEN_KEY = 'token';

/**
 * Estructura de un usuario en el sistema
 */
export interface User {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
  telefono?: string;
  avatarUrl?: string;
}

/**
 * Métodos y propiedades del contexto de autenticación
 */
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
  googleLogin: () => Promise<void>;
  subscribeToAuthChanges: (callback: (user: User | null) => void) => () => void;
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
  const [user, setUser] = useState<User | null>(null);
  const [subscribers, setSubscribers] = useState<((user: User | null) => void)[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Efecto para monitorear cambios en isAuthenticated
  useEffect(() => {
    console.log('Estado de autenticación:', !!user ? 'Autenticado' : 'No autenticado');
  }, [user]);

  /**
   * Notifica a todos los suscriptores sobre cambios en el usuario
   */
  const notifySubscribers = useCallback((newUser: User | null) => {
    subscribers.forEach(callback => callback(newUser));
  }, [subscribers]);

  /**
   * Actualiza el estado del usuario y notifica a los suscriptores
   */
  const updateUser = useCallback((newUser: User | null) => {
    setUser(newUser);
    notifySubscribers(newUser);
  }, [notifySubscribers]);

  /**
   * Función para suscribirse a cambios en el estado de autenticación
   */
  const subscribeToAuthChanges = useCallback((callback: (user: User | null) => void) => {
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
      // Configurar el token en axios antes de hacer la verificación
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('Headers de axios configurados:', axiosInstance.defaults.headers.common);
      
      console.log('Verify Token: Token encontrado, verificando con el servidor...');
      const response = await axiosInstance.get('/auth/verify');
      console.log('Verify Token: Respuesta completa del servidor:', response);
      
      // Asegurarnos de que la estructura de datos sea consistente
      const userData = response.data.usuario || response.data.user;
      console.log('Datos de usuario extraídos:', userData);
      
      if (!userData) {
        throw new Error('Datos de usuario no encontrados en la respuesta');
      }
      
      updateUser(userData);
      console.log('Verify Token: Usuario actualizado desde verificación exitosa.');
    } catch (error) {
      console.error('Error detallado al verificar token:', error);
      localStorage.removeItem(TOKEN_KEY);
      delete axiosInstance.defaults.headers.common['Authorization'];
      updateUser(null);
      console.log('Verify Token: Error al verificar token, usuario desautenticado.');
    } finally {
      setIsVerifying(false);
      setIsInitialized(true); // Marcar como inicializado al finalizar la primera verificación
      console.log('Verify Token: Proceso de verificación finalizado.');
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
  const login = async (email: string, password: string) => {
    try {
      console.log('Iniciando proceso de login...');
      const response = await axiosInstance.post('/auth/login', {
        email: email.trim(),
        contrasena: password.trim(),
      });
      
      console.log('Respuesta completa del servidor:', response);
      const { usuario: userData, token } = response.data;
      
      if (!token) {
        throw new Error('No se recibió token del servidor');
      }
      
      console.log('Token recibido, guardando en localStorage...');
      localStorage.setItem(TOKEN_KEY, token);
      
      console.log('Configurando token en axios...');
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log('Headers de axios configurados:', axiosInstance.defaults.headers.common);
      
      console.log('Actualizando estado del usuario...');
      updateUser(userData);
      console.log('Login exitoso, usuario actualizado en el contexto');
    } catch (error: any) {
      console.error('Error detallado en el proceso de login:', error);
      localStorage.removeItem(TOKEN_KEY);
      delete axiosInstance.defaults.headers.common['Authorization'];
      throw new Error(error.response?.data?.mensaje || 'Error al iniciar sesión. Por favor, intente nuevamente.');
    }
  };

  /**
   * Función para registrar un nuevo usuario
   */
  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      if (!email || !password || !firstName || !lastName) {
        throw new Error('Todos los campos son requeridos');
      }

      const response = await axiosInstance.post('/auth/registro', {
        email: email.trim(),
        contrasena: password.trim(),
        nombre: firstName.trim(),
        apellido: lastName.trim(),
        telefono: ''
      });

      if (!response?.data?.usuario || !response?.data?.token) {
        throw new Error('Respuesta del servidor inválida');
      }

      const { usuario: userData, token } = response.data;
      localStorage.setItem(TOKEN_KEY, token);
      updateUser(userData);
    } catch (error: any) {
      console.error('Error al registrar usuario:', error);
      if (error.response?.status === 400) {
        throw new Error(error.response.data.message || 'Datos de registro inválidos');
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
