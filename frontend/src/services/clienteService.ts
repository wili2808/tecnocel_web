import axios from 'axios';
import axiosInstance from '../api/axiosConfig';
import type { AuthResponse, AuthError, RegisterData } from '../types/auth';
import type { Cliente } from '../types/cliente';

/**
 * Claves utilizadas para almacenar datos de autenticación en localStorage
 */
const TOKEN_KEY = 'token';
const AUTH_TIMESTAMP_KEY = 'auth_timestamp';
const AUTH_USER_KEY = 'auth_user';

/**
 * Servicio de autenticación y gestión de sesiones para CLIENTES de la tienda web
 * Incluye login, registro, Google OAuth, perfil y cambio de contraseña
 */
const clienteService = {
  /**
   * Configura el token de autenticación en axios y localStorage
   * @param token - Token JWT de autenticación
   */
  setAuthToken: (token: string): void => {
    if (!token) {
      console.warn('[AuthService] Intento de configurar un token vacío o nulo');
      return;
    }

    localStorage.setItem(TOKEN_KEY, token);
    
    // Configuración global para todas las futuras peticiones de la tienda
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Usamos log solo para desarrollo
    if (import.meta.env.DEV) {
      console.log('[AuthService] Cabeceras de autorización actualizadas correctamente');
    }
  },

  /**
   * Limpia todos los datos de autenticación del localStorage y axios
   * Utilizado para logout y limpieza de sesión
   */
  clearAuthToken: (): void => {
    // 1. Limpieza de persistencia
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(AUTH_TIMESTAMP_KEY);

    // 2. Limpieza de Axios
    // Usamos 'delete' para eliminar completamente la propiedad del header
    if (axiosInstance.defaults.headers.common['Authorization']) {
      delete axiosInstance.defaults.headers.common['Authorization'];
    }

    if (import.meta.env.DEV) {
      console.log('[AuthService] Datos de sesión eliminados y headers de Axios limpiados');
    }
  },

  /**
   * Guarda todos los datos de autenticación en localStorage y configura axios
   * @param data - Datos de AuthResponse (incluye token y objeto cliente)
   */
  saveAuthData: (data: AuthResponse): void => {
    // 1. Extraemos los datos usando los nuevos nombres de la interfaz
    const { token, cliente } = data;

    if (!token || !cliente) {
      console.warn('[AuthService] Intento de guardar datos de sesión incompletos');
      return;
    }

    // 2. Persistencia en LocalStorage
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.cliente));
    localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());

    // 3. Configuración de Axios para futuras peticiones
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    if (import.meta.env.DEV) {
      console.log(`[AuthService] Sesión guardada para el cliente: ${cliente.email}`);
    }
  },

  /**
   * Obtiene los datos de autenticación almacenados en localStorage
   * Verifica la expiración automáticamente (24 horas)
   * @returns Datos de autenticación o null si no existen o han expirado
   */
  getAuthData: (): AuthResponse | null => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userJson = localStorage.getItem(AUTH_USER_KEY);
    const timestamp = localStorage.getItem(AUTH_TIMESTAMP_KEY);

    // 1. Verificación de existencia de datos básicos
    if (!token || !userJson || !timestamp) {
      return null;
    }

    // 2. Verificar expiración (24 horas)
    // Usamos milisegundos: 24h * 60m * 60s * 1000ms
    const isExpired = Date.now() - parseInt(timestamp) > 86400000;
    
    if (isExpired) {
      if (import.meta.env.DEV) console.log('[AuthService] La sesión ha expirado');
      clienteService.clearAuthToken();
      return null;
    }

    try {
      // 3. Retornamos el objeto siguiendo la interfaz AuthData (usando 'cliente')
      return {
        token,
        cliente: JSON.parse(userJson) as Cliente,
      };
    } catch (error) {
      console.error('[AuthService] Error al parsear datos de sesión', error);
      clienteService.clearAuthToken();
      return null;
    }
  },

  /**
   * Verifica la validez del token en el servidor
   * Si el token es inválido, limpia la sesión automáticamente
   * @returns Promise con los datos del cliente autenticado (Interfaz Cliente)
   */
  verifyToken: async (): Promise<Cliente> => {
    try {
      // 1. Llamada a la API (El token ya va en los headers gracias a Axios Interceptors)
      const response = await axiosInstance.get('/clientes/verify-token');
      
      // 2. Extraemos el objeto cliente del JSON { cliente: { ... } }
      const cliente = response.data?.cliente;
      
      if (!cliente) {
        throw new Error('La respuesta del servidor no contiene datos del cliente');
      }

      // Opcional: Actualizar los datos en localStorage si el servidor devolvió cambios
      // localStorage.setItem(AUTH_USER_KEY, JSON.stringify(cliente));

      return cliente as Cliente;
    } catch (error) {
      // 3. Si el token expiró o es inválido (401/403), limpiamos todo rastro local
      console.warn('[AuthService] Token inválido o expirado. Limpiando sesión...');
      clienteService.clearAuthToken();
      throw error;
    }
  },

  /**
   * Autentica un usuario con email y contraseña
   * @param email - Email del cliente
   * @param password - Contraseña del cliente
   * @returns Promise con los datos de autenticación (cliente y token) AuthResponse
   */
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      // 1. Petición al Backend con los nombres que configuramos en el controlador
      const response = await axiosInstance.post('/clientes/login', {
        email_cliente: email.trim(),
        contrasena: password.trim(),
      });

      // 2. Extraemos los datos del JSON de respuesta { token, cliente }
      const { cliente, token } = response.data;
      
      if (!token || !cliente) {
        throw new Error('Respuesta inválida del servidor');
      }

      // 3. Retornamos el objeto sincronizado con la interfaz AuthResponse
      return { 
        cliente, 
        token 
      };
    } catch (error) {
      // Manejo de errores estandarizado
      throw clienteService.handleAuthError(error);
    }
  },

  /**
   * Registra un nuevo usuario en el sistema sincronizado con el Backend
   * @param data - Datos del formulario (Interfaz RegisterData)
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      // 1. Mapeo de nombres: Del Front (RegisterData) al Back (req.body)
      const response = await axiosInstance.post('/clientes/register', {
        nombre_cliente: data.nombre.trim(),
        apellido_cliente: data.apellido.trim(),
        email_cliente: data.email.trim(),
        contrasena: data.password, // Convertimos 'password' a 'contrasena' para el Backend
        celular_cliente: data.celular?.trim(), // Campo opcional
        nit_ci_cliente: data.nitCi?.trim(), // Campo opcional
      });

      // 2. Extraemos los datos según el res.status(201).json del Backend
      const { cliente, token } = response.data;

      if (!token || !cliente) {
        throw new Error('La respuesta del servidor está incompleta');
      }

      // 3. Devolvemos el objeto siguiendo tu interfaz AuthResponse
      return { 
        cliente,
        token 
      };
    } catch (error) {
      // Usamos el manejador de errores estandarizado
      throw clienteService.handleAuthError(error);
    }
  },

  /**
   * Autentica un usuario usando Google OAuth
   * @param accessToken - Token de acceso de Google
   * @returns Promise con los datos de autenticación del usuario
   */
  googleLogin: async (accessToken: string): Promise<AuthResponse> => {
    try {
      // Llamada al endpoint de login con Google en el backend
      const response = await axiosInstance.post('/clientes/google-login', {
        access_token: accessToken
      });

      // Extraemos los datos del JSON de respuesta { token, cliente }
      const { cliente, token } = response.data;
      
      if (!token || !cliente) {
        throw new Error('Respuesta inválida del servidor para Google Login');
      }

      // Retornamos el objeto sincronizado con la interfaz AuthResponse
      return { cliente, token };
    } catch (error) {
      // Manejo de errores estandarizado
      throw clienteService.handleAuthError(error);
    }
  },

  /**
   * Maneja centralizadamente los errores de autenticación
   * Convierte errores HTTP en errores estandarizados con códigos
   * @param error - Error capturado (tratado como unknown por seguridad)
   */
  handleAuthError: (error: unknown): AuthError => {
    // 1. Verificamos si es un error de Axios de forma segura
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 401) {
        return {
          code: 'UNAUTHORIZED',
          message: data?.mensaje || 'Credenciales inválidas',
          details: data
        };
      }

      if (status === 409) {
        return {
          code: 'EMAIL_EXISTS',
          message: data?.mensaje || 'El correo electrónico ya está registrado',
          details: data
        };
      }

      if (status === 403) {
        return {
          code: 'FORBIDDEN',
          message: data?.mensaje || 'Acceso denegado o cuenta no habilitada',
          details: data
        };
      }

      if (status === 422) {
        return {
          code: 'VALIDATION_ERROR',
          message: 'Datos de entrada inválidos',
          details: data
        };
      }

      if (status === 429) {
        return {
          code: 'TOO_MANY_REQUESTS',
          message: data?.mensaje || 'Demasiados intentos de inicio de sesión. Por favor, espera algunos minutos e intenta nuevamente.',
          details: data
        };
      }

      if (status && status >= 500) {
        return {
          code: 'SERVER_ERROR',
          message: 'Error en el servidor de TecnoCell. Intente más tarde.',
          details: data
        };
      }
    }

    // 2. Manejo de errores que no son de red (ej. errores de JS)
    const err = error as Error;
    return {
      code: 'UNKNOWN',
      message: err.message || 'Error inesperado en la aplicación',
      details: error
    };
  },

  /**
   * Verifica si el usuario tiene una sesión activa y válida
   * @returns true si existen datos de autenticación no expirados
   */
  isAuthenticated: (): boolean => {
    // Reutilizamos la lógica de expiración que ya definimos en getAuthData
    const authData = clienteService.getAuthData();
    
    // El operador !! convierte el objeto (o null) a un booleano real
    const active = !!authData?.token && !!authData?.cliente;

    if (import.meta.env.DEV && active) {
      console.debug('[AuthService] Verificación de identidad: Sesión activa');
    }

    return active;
  },

  /**
   * Obtiene el usuario actualmente autenticado desde la persistencia
   * @returns Datos del objeto Cliente o null si la sesión no es válida o expiró
   */
  getCurrentUser: (): Cliente | null => {
    // Aprovechamos la lógica de expiración de 24h ya definida en getAuthData
    const authData = clienteService.getAuthData();
    
    // Retornamos el cliente si los datos son válidos, de lo contrario null
    return authData?.cliente || null;
  },

  /**
   * Obtiene el token de autenticación actual validando su vigencia
   * @returns Token JWT actual o null si la sesión expiró o no existe
   */
  getCurrentToken: (): string | null => {
    // Al usar getAuthData, nos aseguramos de que el token 
    // no solo exista, sino que no haya expirado
    const authData = clienteService.getAuthData();
    
    return authData ? authData.token : null;
  },

  /**
   * Obtiene el perfil completo del cliente autenticado desde el servidor
   * @returns Promise con el perfil mapeado (Interfaz Cliente ampliada)
   */
  obtenerPerfil: async (): Promise<Cliente & {
    miembroDesde?: string;
    ultimoIngreso?: string;
    isGoogleAccount?: boolean;
    emailVerificado?: boolean;
  }> => {
    try {
      // 1. Petición GET al endpoint de perfil
      const response = await axiosInstance.get('/clientes/perfil');
      
      // 2. Extraemos el objeto según el contrato del Backend { cliente: { ... } }
      const cliente = response.data?.cliente;

      if (!cliente) {
        throw new Error('No se pudo recuperar la información del perfil');
      }

      // 3. Retornamos los datos (El backend ya los envía mapeados con nombres limpios)
      return cliente;
    } catch (error) {
      // 4. Manejo de errores estandarizado
      throw clienteService.handleAuthError(error);
    }
  },

  /**
   * Actualiza el perfil del cliente autenticado y sincroniza la sesión local
   * @param data - Campos del perfil a actualizar (usando nombres del backend)
   * @returns Promise con el objeto Cliente actualizado
   */
  actualizarPerfil: async (data: {
    nombre_cliente?: string;
    apellido_cliente?: string;
    celular_cliente?: string;
    nit_ci_cliente?: string;
  }): Promise<Cliente> => {
    try {
      // 1. Petición PUT al backend con los nombres que espera el controlador
      const response = await axiosInstance.put('/clientes/perfil', data);
      const clienteActualizado = response.data?.cliente;

      if (!clienteActualizado) {
        throw new Error('No se recibieron los datos actualizados del servidor');
      }

      // 2. Sincronización de Persistencia
      // Recuperamos el token actual para no perderlo al sobrescribir los datos
      const currentToken = clienteService.getCurrentToken();
      
      if (currentToken) {
        // Usamos saveAuthData con la nueva interfaz: { token, cliente }
        clienteService.saveAuthData({
          token: currentToken,
          cliente: clienteActualizado 
        });
      }

      if (import.meta.env.DEV) {
        console.log('[AuthService] Perfil sincronizado localmente tras actualización');
      }

      return clienteActualizado as Cliente;
    } catch (error) {
      // 3. Manejo de errores estandarizado
      throw clienteService.handleAuthError(error);
    }
  },

  /**
   * Cambia la contraseña del cliente autenticado
   * @param contrasenaActual - Password vigente
   * @param contrasenaNueva - Password nueva deseada
   */
  cambiarContrasena: async (
    contrasenaActual: string,
    contrasenaNueva: string
  ): Promise<{ mensaje: string }> => {
    try {
      // 1. Petición PUT sincronizada con los nombres del backend (snake_case)
      const response = await axiosInstance.put<{ mensaje: string }>('/clientes/cambiar-contrasena', {
        contrasena_actual: contrasenaActual,
        contrasena_nueva: contrasenaNueva
      });

      return response.data;
    } catch (error: unknown) {
      // 2. Manejo de error específico para cuentas de Google (403 Forbidden)
      // Usamos axios.isAxiosError para eliminar el 'any'
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        throw {
          code: 'GOOGLE_ACCOUNT',
          message: error.response.data?.mensaje || 'No puedes cambiar la contraseña de una cuenta vinculada a Google',
          details: error.response.data
        };
      }
      
      // 3. Fallback al manejador general de auth
      throw clienteService.handleAuthError(error);
    }
  },
};

export default clienteService;
