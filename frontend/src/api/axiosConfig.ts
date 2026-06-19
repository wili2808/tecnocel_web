import axios from 'axios';
import axiosRetry from 'axios-retry';
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Obtener la URL base desde las variables de entorno
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Crear una instancia de axios con la configuración base
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000, // Aumentado de 10s a 30s para evitar timeouts
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// ============================================================================
// CONFIGURACIÓN DE RETRY AUTOMÁTICO
// ============================================================================
// Configura reintentos automáticos para mejorar resiliencia en redes inestables
axiosRetry(axiosInstance, {
  retries: 3, // Número de reintentos antes de fallar
  retryDelay: axiosRetry.exponentialDelay, // Delay exponencial: 1s, 2s, 4s

  // Condiciones para reintentar
  retryCondition: (error: AxiosError) => {
    // No reintentar métodos que modifican datos (no son idempotentes)
    const method = error.config?.method?.toUpperCase();
    if (method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      return false;
    }

    // Si es error de red o timeout, reintentar (solo GET y similares)
    if (axiosRetry.isNetworkError(error) || error.code === 'ECONNABORTED') {
      return true;
    }

    // Si es error 5xx del servidor, reintentar
    if (error.response && error.response.status >= 500) {
      return true;
    }

    return false;
  },

  // Log de reintentos en desarrollo
  onRetry: (retryCount, error, requestConfig) => {
    if (import.meta.env.DEV) {
      console.log(`🔄 Reintento ${retryCount} para ${requestConfig.url} debido a:`, error.message);
    }
  }
});

// Interceptor para las solicitudes
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Solo añadir el token si no está ya presente en los headers
    // Esto evita duplicar el token cuando se configura desde AuthContext
    const token = localStorage.getItem('token');
    const adminToken = localStorage.getItem('admin_token');
    
    // Si hay un token de administrador, lo enviamos en un header personalizado
    // para permitir el bypass del modo mantenimiento en rutas públicas
    if (adminToken && config.headers) {
      config.headers['X-Admin-Token'] = adminToken;
    }
    
    if (token && config.headers && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Interceptor para las respuestas
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Manejar errores comunes
    if (error.response) {
      // El servidor respondió con un código de estado fuera del rango 2xx
      const status = error.response.status;
      
      if (status === 401) {
        // No autorizado - limpiar token y notificar al AuthContext
        localStorage.removeItem('token');
        window.dispatchEvent(new CustomEvent('auth:token-expired'));
      } else if (status === 403) {
        // Prohibido - el usuario no tiene permisos
        console.error('No tienes permisos para realizar esta acción');
      } else if (status === 404) {
        // No encontrado
        console.error('El recurso solicitado no existe');
      } else if (status === 503 && (error.response.data as any)?.error === 'MODO_MANTENIMIENTO') {
        // Redirigir a mantenimiento si el servidor reporta modo mantenimiento activo
        // EXCEPTO si estamos en la página de login admin o el panel, para permitir el acceso al personal
        const isPageAdmin = window.location.pathname.startsWith('/admin-login') || 
                            window.location.pathname.startsWith('/admin-panel');
                            
        if (window.location.pathname !== '/mantenimiento' && !isPageAdmin) {
          window.location.href = '/mantenimiento';
        }
      } else if (status >= 500) {
        // Error del servidor
        console.error('Error en el servidor, por favor intenta más tarde');
      }
    } else if (error.request) {
      // La solicitud fue hecha pero no se recibió respuesta
      console.error('No se pudo conectar con el servidor');
    } else {
      // Algo ocurrió al configurar la solicitud
      console.error('Error al realizar la solicitud:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;