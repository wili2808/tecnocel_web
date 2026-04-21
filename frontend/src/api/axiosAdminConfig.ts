import axios from 'axios';
import axiosRetry from 'axios-retry';
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Constantes de almacenamiento local para admin
const ADMIN_TOKEN_KEY = 'admin_token';
const ADMIN_USER_KEY = 'admin_user';
const ADMIN_TIMESTAMP_KEY = 'admin_timestamp';

// ============================================================================
// INSTANCIA PÚBLICA (sin token) - para logins
// ============================================================================
const publicApi: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

axiosRetry(publicApi, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error: AxiosError) => {
    const method = error.config?.method?.toUpperCase();
    if (method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      return false;
    }
    if (axiosRetry.isNetworkError(error) || error.code === 'ECONNABORTED') {
      return true;
    }
    if (error.response && error.response.status >= 500) {
      return true;
    }
    return false;
  }
});

// Instancia de axios configurada para peticiones de usuarios del sistema (admin/empleado)
const adminApi: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// ============================================================================
// CONFIGURACIÓN DE RETRY AUTOMÁTICO
// ============================================================================
axiosRetry(adminApi, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,

  retryCondition: (error: AxiosError) => {
    // No reintentar métodos que modifican datos (no son idempotentes)
    const method = error.config?.method?.toUpperCase();
    if (method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      return false;
    }

    if (axiosRetry.isNetworkError(error) || error.code === 'ECONNABORTED') {
      return true;
    }

    if (error.response && error.response.status >= 500) {
      return true;
    }

    return false;
  },

  onRetry: (retryCount, error, requestConfig) => {
    if (import.meta.env.DEV) {
      console.log(`🔄 [Admin] Reintento ${retryCount} para ${requestConfig.url} debido a:`, error.message);
    }
  }
});

// Interceptor para agregar token de autorización admin
adminApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);

    if (token && config.headers && !config.headers['Authorization']) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación admin
adminApi.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        // Token expirado o inválido - limpiar sesión admin
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem(ADMIN_USER_KEY);
        localStorage.removeItem(ADMIN_TIMESTAMP_KEY);
      } else if (status === 403) {
        console.error('No tienes permisos para realizar esta acción');
      } else if (status === 404) {
        console.error('El recurso solicitado no existe');
      } else if (status >= 500) {
        console.error('Error en el servidor, por favor intenta más tarde');
      }
    } else if (error.request) {
      console.error('No se pudo conectar con el servidor');
    } else {
      console.error('Error al realizar la solicitud:', error.message);
    }

    return Promise.reject(error);
  }
);

export { adminApi, publicApi };
export default adminApi;
