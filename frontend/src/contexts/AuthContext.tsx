import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axiosInstance from '../api/axiosConfig';
// import { toast } from 'react-toastify'; // Eliminado porque los toasts deben ir en el componente de UI

export interface User {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
  telefono?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
  googleLogin: () => Promise<void>;
  subscribeToAuthChanges: (callback: (user: User | null) => void) => () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [subscribers, setSubscribers] = useState<((user: User | null) => void)[]>([]);

  const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
    setSubscribers(prevSubscribers => [...prevSubscribers, callback]);
    return () => {
      setSubscribers(prevSubscribers => prevSubscribers.filter(sub => sub !== callback));
    };
  };

  const notifySubscribers = () => {
    subscribers.forEach(callback => callback(user));
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axiosInstance.get('/auth/verify')
        .then(response => {
          setUser(response.data.user);
        })
        .catch(() => {
          localStorage.removeItem('token');
          // El token inválido será manejado por el interceptor de axiosInstance
        });
    } else {
      setUser(null);
    }
  }, [localStorage.getItem('token')]);

  const login = async (email: string, password: string) => {
    try {
      const response = await axiosInstance.post('/auth/login', {
        email,
        contrasena: password,
      });
      const { user: userData, token } = response.data;
      setUser(userData);
      localStorage.setItem('token', token);
      // El token se añadirá automáticamente a través del interceptor de axiosInstance
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      // toast.error(error.response?.data?.mensaje || 'Error al iniciar sesión. Por favor, intente nuevamente.');
      throw error;
    }
  };

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
      }).catch((error) => {
        if (error.code === 'ERR_NETWORK') {
          throw new Error('No se pudo conectar con el servidor. Por favor, verifica que el servidor esté ejecutándose.');
        }
        throw error;
      });

      if (response?.data?.usuario && response?.data?.token) {
        const { usuario: userData, token } = response.data;
        setUser(userData);
        notifySubscribers();
        localStorage.setItem('token', token);
        // alert('¡Usuario registrado exitosamente!');
      } else {
        throw new Error('Respuesta del servidor inválida');
      }
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

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    delete axiosInstance.defaults.headers.common['Authorization'];
  };

  const googleLogin = async () => {
    // Implementar la lógica de autenticación con Google
    try {
      // Aquí irá la implementación con Google OAuth
      console.log('Autenticación con Google pendiente de implementar');
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
