import axios from 'axios';
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

// Interceptor para las solicitudes
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Solo añadir el token si no está ya presente en los headers
    // Esto evita duplicar el token cuando se configura desde AuthContext
    const token = localStorage.getItem('token');
    
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
        // No autorizado - limpiar token y redirigir a login
        localStorage.removeItem('token');
        // Aquí se podría implementar una redirección al login
      } else if (status === 403) {
        // Prohibido - el usuario no tiene permisos
        console.error('No tienes permisos para realizar esta acción');
      } else if (status === 404) {
        // No encontrado
        console.error('El recurso solicitado no existe');
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