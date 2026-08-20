**[Documentación](../../README.md)** | **[Inicio](../../../README.md)**
---

# Guía de Manejo de Errores

> Guía completa para entender, manejar y responder apropiadamente a los errores de la API de TecnoCel Web.

---

## Tabla de Contenidos

- [Visión General](#visión-general)
- [Códigos de Estado HTTP](#códigos-de-estado-http)
- [Formato de Respuestas de Error](#formato-de-respuestas-de-error)
- [Tipos de Errores](#tipos-de-errores)
  - [400 Bad Request](#400-bad-request)
  - [401 Unauthorized](#401-unauthorized)
  - [403 Forbidden](#403-forbidden)
  - [404 Not Found](#404-not-found)
  - [409 Conflict](#409-conflict)
  - [500 Internal Server Error](#500-internal-server-error)
- [Errores de Validación](#errores-de-validación)
- [Errores de Autenticación](#errores-de-autenticación)
- [Errores de Negocio](#errores-de-negocio)
- [Implementación Frontend](#implementación-frontend)
  - [Interceptor de Axios](#interceptor-de-axios)
  - [Clase de Manejo de Errores](#clase-de-manejo-de-errores)
  - [Hook de React](#hook-de-react)
- [Estrategias de Retry](#estrategias-de-retry)
- [Logging y Monitoreo](#logging-y-monitoreo)
- [Buenas Prácticas](#buenas-prácticas)

---

## Visión General

La API de TecnoCel Web utiliza códigos de estado HTTP estándar y retorna respuestas de error consistentes que facilitan el manejo de errores en el cliente.

### Principios de Diseño

1. **Códigos HTTP significativos**: Cada código tiene un significado específico
2. **Mensajes descriptivos**: Errores con mensajes claros y accionables
3. **Formato consistente**: Todas las respuestas de error siguen el mismo patrón
4. **Detalles de validación**: Los errores de validación incluyen campos específicos
5. **Sin información sensible**: Los errores no exponen detalles de implementación

---

## Códigos de Estado HTTP

### Respuestas Exitosas (2xx)

| Código | Nombre | Descripción | Uso en la API |
|--------|--------|-------------|---------------|
| 200 | OK | Solicitud exitosa | GET, PUT, DELETE exitosos |
| 201 | Created | Recurso creado exitosamente | POST exitoso (crear recurso) |
| 204 | No Content | Exitoso sin contenido | DELETE sin respuesta |

### Errores del Cliente (4xx)

| Código | Nombre | Descripción | Uso en la API |
|--------|--------|-------------|---------------|
| 400 | Bad Request | Datos inválidos o faltantes | Validación fallida, parámetros incorrectos |
| 401 | Unauthorized | Autenticación requerida/fallida | Sin token, token inválido o expirado |
| 403 | Forbidden | Permiso denegado | Usuario autenticado sin permisos suficientes |
| 404 | Not Found | Recurso no encontrado | Producto, cliente, comentario no existe |
| 409 | Conflict | Conflicto con el estado actual | Email duplicado, carrito ya confirmado |
| 413 | Payload Too Large | Archivo demasiado grande | Imagen > 10MB |
| 429 | Too Many Requests | Límite de tasa excedido | Rate limiting activado |

### Errores del Servidor (5xx)

| Código | Nombre | Descripción | Uso en la API |
|--------|--------|-------------|---------------|
| 500 | Internal Server Error | Error no manejado del servidor | Error de BD, excepción no capturada |
| 503 | Service Unavailable | Servicio temporalmente no disponible | BD desconectada, mantenimiento |

---

## Formato de Respuestas de Error

### Formato Estándar

Todas las respuestas de error siguen este formato JSON:

```typescript
{
  mensaje: string;          // Mensaje descriptivo del error
  error?: string;           // Detalles adicionales (opcional)
  errores?: Array<{         // Errores de validación (opcional)
    msg: string;
    param: string;
    location: string;
  }>;
}
```

### Ejemplos por Tipo de Error

**Error Simple (400)**:
```json
{
  "mensaje": "Datos inválidos",
  "error": "La cantidad debe ser un número positivo"
}
```

**Error de Validación (400)**:
```json
{
  "mensaje": "Errores de validación",
  "errores": [
    {
      "msg": "El email es requerido",
      "param": "email_cliente",
      "location": "body"
    },
    {
      "msg": "La contraseña debe tener al menos 8 caracteres",
      "param": "contrasena",
      "location": "body"
    }
  ]
}
```

**Error de Autenticación (401)**:
```json
{
  "mensaje": "No token provided"
}
```

**Error de Recurso No Encontrado (404)**:
```json
{
  "mensaje": "Producto no encontrado"
}
```

**Error del Servidor (500)**:
```json
{
  "mensaje": "Error interno del servidor",
  "error": "No se pudo procesar la solicitud"
}
```

---

## Tipos de Errores

### 400 Bad Request

**Cuándo ocurre**:
- Datos de entrada inválidos o faltantes
- Formato incorrecto
- Parámetros fuera de rango
- Lógica de negocio violada

**Ejemplos comunes**:

```json
// Stock insuficiente
{
  "mensaje": "Stock insuficiente",
  "stock_disponible": 5
}

// Calificación inválida
{
  "mensaje": "Calificación inválida",
  "error": "La calificación debe estar entre 1 y 5"
}

// Comentario muy corto
{
  "mensaje": "Comentario inválido",
  "error": "El comentario debe tener entre 10 y 2000 caracteres"
}

// Demasiadas imágenes
{
  "mensaje": "Demasiadas imágenes",
  "error": "Máximo 5 imágenes por comentario"
}
```

**Cómo manejarlo**:
```javascript
try {
  const response = await agregarAlCarrito(token, idProducto, cantidad);
} catch (error) {
  if (error.status === 400) {
    if (error.data.stock_disponible !== undefined) {
      mostrarMensaje(`Solo hay ${error.data.stock_disponible} unidades disponibles`);
    } else {
      mostrarMensaje(error.data.mensaje);
    }
  }
}
```

---

### 401 Unauthorized

**Cuándo ocurre**:
- No se proporciona token JWT
- Token inválido o corrupto
- Token expirado
- Token de tipo incorrecto (ej: token de admin en endpoint de cliente)

**Ejemplos comunes**:

```json
// Sin token
{
  "mensaje": "No token provided"
}

// Token inválido
{
  "mensaje": "Invalid token"
}

// Token expirado
{
  "mensaje": "Token expired"
}
```

**Cómo manejarlo**:
```javascript
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Redirigir a login
      window.location.href = '/login';

      // Mostrar mensaje al usuario
      alert('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
    }
    return Promise.reject(error);
  }
);
```

---

### 403 Forbidden

**Cuándo ocurre**:
- Usuario autenticado pero sin permisos
- Intento de acceder/modificar recursos de otro usuario
- Rol insuficiente para la operación

**Ejemplos comunes**:

```json
// Acceso denegado a recurso ajeno
{
  "mensaje": "Acceso denegado",
  "error": "Solo puedes eliminar tus propios comentarios"
}

// Rol insuficiente
{
  "mensaje": "Acceso denegado",
  "error": "Esta acción requiere permisos de administrador"
}
```

**Cómo manejarlo**:
```javascript
try {
  await eliminarComentario(token, idComentario);
} catch (error) {
  if (error.status === 403) {
    mostrarMensaje('No tienes permiso para realizar esta acción');
  }
}
```

---

### 404 Not Found

**Cuándo ocurre**:
- Recurso solicitado no existe
- ID inválido
- Ruta incorrecta

**Ejemplos comunes**:

```json
// Producto no encontrado
{
  "mensaje": "Producto no encontrado"
}

// Cliente no encontrado
{
  "mensaje": "Cliente no encontrado",
  "error": "El cliente especificado no existe"
}

// Comentario no encontrado
{
  "mensaje": "Comentario no encontrado",
  "error": "El comentario especificado no existe"
}
```

**Cómo manejarlo**:
```javascript
try {
  const producto = await obtenerProducto(idProducto);
  return producto;
} catch (error) {
  if (error.status === 404) {
    // Redirigir a página 404 o mostrar mensaje
    navigate('/404');
    // O mostrar mensaje
    mostrarMensaje('El producto que buscas no existe');
    return null;
  }
  throw error;
}
```

---

### 409 Conflict

**Cuándo ocurre**:
- Conflicto con el estado actual del recurso
- Violación de restricción única (email duplicado)
- Operación no permitida en el estado actual

**Ejemplos comunes**:

```json
// Email duplicado en registro
{
  "mensaje": "El email ya está registrado",
  "error": "Este correo electrónico ya está en uso"
}

// Carrito ya confirmado
{
  "mensaje": "Carrito ya procesado",
  "error": "Este carrito ya fue convertido en venta"
}
```

**Cómo manejarlo**:
```javascript
try {
  await registrarCliente(datosCliente);
} catch (error) {
  if (error.status === 409) {
    if (error.data.mensaje.includes('email')) {
      mostrarError('Este correo ya está registrado. ¿Olvidaste tu contraseña?');
    }
  }
}
```

---

### 500 Internal Server Error

**Cuándo ocurre**:
- Error no manejado en el servidor
- Fallo de base de datos
- Excepción no capturada
- Error de configuración

**Ejemplos comunes**:

```json
// Error genérico
{
  "mensaje": "Error interno del servidor",
  "error": "No se pudo procesar la solicitud"
}

// Error de BD
{
  "mensaje": "Error interno del servidor",
  "error": "Database connection failed"
}
```

**Cómo manejarlo**:
```javascript
try {
  await operacionCompleja();
} catch (error) {
  if (error.status === 500) {
    // No exponer detalles técnicos al usuario
    mostrarError(
      'Ocurrió un error inesperado. Por favor, intenta nuevamente más tarde.'
    );

    // Registrar error para análisis
    logError(error);

    // Opcionalmente, reintentar
    if (confirm('¿Deseas intentar nuevamente?')) {
      retry(() => operacionCompleja());
    }
  }
}
```

---

## Errores de Validación

### Express-Validator

La API usa `express-validator` para validación de entrada. Los errores de validación retornan un array con detalles:

```json
{
  "mensaje": "Errores de validación",
  "errores": [
    {
      "msg": "El nombre del producto es requerido",
      "param": "nombre",
      "location": "body"
    },
    {
      "msg": "El precio debe ser un número positivo",
      "param": "precio_venta",
      "location": "body",
      "value": -100
    }
  ]
}
```

### Manejo en Frontend

```javascript
function extraerErroresValidacion(error) {
  if (error.status === 400 && error.data.errores) {
    // Agrupar errores por campo
    const erroresPorCampo = {};

    error.data.errores.forEach(err => {
      if (!erroresPorCampo[err.param]) {
        erroresPorCampo[err.param] = [];
      }
      erroresPorCampo[err.param].push(err.msg);
    });

    return erroresPorCampo;
  }

  return null;
}

// Uso en formulario
try {
  await crearProducto(datos);
} catch (error) {
  const errores = extraerErroresValidacion(error);

  if (errores) {
    // Mostrar errores en cada campo
    Object.keys(errores).forEach(campo => {
      mostrarErrorEnCampo(campo, errores[campo].join(', '));
    });
  }
}
```

---

## Errores de Autenticación

### Tokens Expirados

```javascript
// Detectar y manejar token expirado
async function hacerPeticionConRefresh(peticion) {
  try {
    return await peticion();
  } catch (error) {
    if (error.status === 401 && error.data.mensaje.includes('expired')) {
      // Intentar refrescar token (si tienes refresh token)
      const nuevoToken = await refreshToken();

      if (nuevoToken) {
        // Reintentar con nuevo token
        return await peticion();
      } else {
        // Redirigir a login
        redirectToLogin();
      }
    }
    throw error;
  }
}
```

### Tokens Inválidos

```javascript
function validarToken(token) {
  if (!token) {
    throw new Error('Token no proporcionado');
  }

  try {
    // Verificar formato del token JWT
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Formato de token inválido');
    }

    // Decodificar payload (sin verificar firma, solo para validar expiración)
    const payload = JSON.parse(atob(parts[1]));

    // Verificar expiración
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      throw new Error('Token expirado');
    }

    return true;
  } catch (error) {
    return false;
  }
}

// Uso
if (!validarToken(token)) {
  // Solicitar login antes de hacer petición
  redirectToLogin();
}
```

---

## Errores de Negocio

### Stock Insuficiente

```javascript
async function agregarAlCarritoConValidacion(idProducto, cantidad) {
  try {
    // Verificar stock antes de agregar
    const producto = await obtenerProducto(idProducto);

    if (producto.stock < cantidad) {
      throw {
        status: 400,
        data: {
          mensaje: 'Stock insuficiente',
          stock_disponible: producto.stock
        }
      };
    }

    // Proceder con agregar al carrito
    return await agregarAlCarrito(token, idProducto, cantidad);

  } catch (error) {
    if (error.data?.stock_disponible !== undefined) {
      const { stock_disponible } = error.data;

      if (stock_disponible === 0) {
        mostrarMensaje('Producto agotado');
      } else {
        mostrarMensaje(
          `Solo hay ${stock_disponible} unidades disponibles. ¿Deseas agregar esa cantidad?`,
          {
            accion: () => agregarAlCarrito(token, idProducto, stock_disponible),
            textoBoton: 'Agregar disponible'
          }
        );
      }
    }
    throw error;
  }
}
```

### Límites de Operaciones

```javascript
// Validar límites antes de operación
function validarLimitesCarrito(carrito, nuevoItem) {
  const MAX_ITEMS = 20;
  const MAX_CANTIDAD_POR_ITEM = 10;

  if (carrito.items.length >= MAX_ITEMS) {
    throw new Error(`Máximo ${MAX_ITEMS} productos diferentes en el carrito`);
  }

  if (nuevoItem.cantidad > MAX_CANTIDAD_POR_ITEM) {
    throw new Error(`Máximo ${MAX_CANTIDAD_POR_ITEM} unidades por producto`);
  }
}
```

---

## Implementación Frontend

### Interceptor de Axios

```javascript
import axios from 'axios';

// Configurar Axios con manejo de errores
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000
});

// Request interceptor (agregar token)
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor (manejo de errores)
api.interceptors.response.use(
  response => response,
  error => {
    const status = error.response?.status;
    const data = error.response?.data;

    // Crear objeto de error normalizado
    const normalizedError = {
      status,
      data,
      mensaje: data?.mensaje || 'Error desconocido',
      error: data?.error,
      errores: data?.errores
    };

    // Manejo específico por código
    switch (status) {
      case 401:
        // Token expirado o inválido
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        break;

      case 403:
        console.error('Acceso denegado:', data?.mensaje);
        break;

      case 404:
        console.error('Recurso no encontrado:', data?.mensaje);
        break;

      case 500:
        console.error('Error del servidor:', data);
        // Reportar a servicio de monitoreo
        reportError(error);
        break;

      default:
        console.error('Error:', normalizedError);
    }

    return Promise.reject(normalizedError);
  }
);

export default api;
```

### Clase de Manejo de Errores

```javascript
class ApiErrorHandler {
  static handle(error, options = {}) {
    const {
      showToast = true,
      logToConsole = true,
      reportToSentry = false
    } = options;

    // Logging
    if (logToConsole) {
      console.error('[API Error]', {
        status: error.status,
        mensaje: error.mensaje,
        data: error.data
      });
    }

    // Reportar a Sentry (si está configurado)
    if (reportToSentry && error.status >= 500) {
      // Sentry.captureException(error);
    }

    // Mostrar toast al usuario
    if (showToast) {
      const mensaje = this.getMensajeUsuario(error);
      showToastNotification(mensaje, 'error');
    }

    return error;
  }

  static getMensajeUsuario(error) {
    // Mensajes amigables para el usuario
    const mensajesPersonalizados = {
      401: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
      403: 'No tienes permiso para realizar esta acción.',
      404: 'El recurso que buscas no existe.',
      409: 'Ya existe un recurso con estos datos.',
      500: 'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
      503: 'El servicio está temporalmente no disponible.'
    };

    // Usar mensaje personalizado o mensaje del servidor
    return mensajesPersonalizados[error.status] || error.mensaje;
  }

  static isNetworkError(error) {
    return !error.status || error.message === 'Network Error';
  }

  static isAuthError(error) {
    return error.status === 401 || error.status === 403;
  }

  static isValidationError(error) {
    return error.status === 400 && error.errores;
  }

  static getValidationErrors(error) {
    if (!this.isValidationError(error)) return null;

    const erroresPorCampo = {};
    error.errores.forEach(err => {
      if (!erroresPorCampo[err.param]) {
        erroresPorCampo[err.param] = [];
      }
      erroresPorCampo[err.param].push(err.msg);
    });

    return erroresPorCampo;
  }
}

export default ApiErrorHandler;
```

### Hook de React

```javascript
import { useState, useCallback } from 'react';
import ApiErrorHandler from './ApiErrorHandler';

function useApiError() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const executeRequest = useCallback(async (requestFn, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await requestFn();
      return result;
    } catch (err) {
      const handledError = ApiErrorHandler.handle(err, options);
      setError(handledError);
      throw handledError;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    loading,
    executeRequest,
    clearError
  };
}

// Uso
function ProductoDetalle({ idProducto }) {
  const { error, loading, executeRequest } = useApiError();

  async function cargarProducto() {
    await executeRequest(
      () => obtenerProducto(idProducto),
      {
        showToast: true,
        reportToSentry: true
      }
    );
  }

  useEffect(() => {
    cargarProducto();
  }, [idProducto]);

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>Error: {error.mensaje}</div>;

  // Render normal...
}
```

---

## Estrategias de Retry

### Retry Exponencial

```javascript
async function retryWithExponentialBackoff(
  fn,
  maxRetries = 3,
  baseDelay = 1000
) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // No reintentar en errores del cliente (4xx)
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Solo reintentar en errores del servidor (5xx) o de red
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Reintentando en ${delay}ms (intento ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// Uso
const resultado = await retryWithExponentialBackoff(
  () => confirmarCompra(token, observaciones),
  3,
  2000
);
```

### Retry Solo en Errores de Red

```javascript
async function retryOnNetworkError(fn, maxRetries = 2) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (!ApiErrorHandler.isNetworkError(error) || i === maxRetries - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

---

## Logging y Monitoreo

### Logger Frontend

```javascript
class ErrorLogger {
  static log(error, context = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      status: error.status,
      mensaje: error.mensaje,
      url: window.location.href,
      userAgent: navigator.userAgent,
      context
    };

    // Log a console
    console.error('[Error Log]', logEntry);

    // Guardar en localStorage para debugging
    this.saveToLocalStorage(logEntry);

    // Enviar a servicio de monitoreo (opcional)
    this.sendToMonitoring(logEntry);
  }

  static saveToLocalStorage(logEntry) {
    try {
      const logs = JSON.parse(localStorage.getItem('error_logs') || '[]');
      logs.push(logEntry);

      // Mantener solo últimos 50 logs
      if (logs.length > 50) {
        logs.shift();
      }

      localStorage.setItem('error_logs', JSON.stringify(logs));
    } catch (e) {
      console.error('Error al guardar log:', e);
    }
  }

  static sendToMonitoring(logEntry) {
    // Implementar según servicio de monitoreo (Sentry, LogRocket, etc.)
    // Ejemplo con endpoint personalizado:
    fetch('/api/logs/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry)
    }).catch(() => {
      // Ignorar errores del logger
    });
  }

  static getRecentLogs() {
    try {
      return JSON.parse(localStorage.getItem('error_logs') || '[]');
    } catch (e) {
      return [];
    }
  }
}

export default ErrorLogger;
```

---

## Buenas Prácticas

### 1. Mensajes Claros para el Usuario

```javascript
// Malo - Mensaje técnico
"Error: ECONNREFUSED at Socket.connect"

// Bueno - Mensaje amigable
"No pudimos conectar con el servidor. Por favor, verifica tu conexión a internet."

// Malo - Mensaje genérico
"Error"

// Bueno - Mensaje específico y accionable
"El producto que buscas no está disponible. ¿Deseas ver productos similares?"
```

### 2. No Exponer Información Sensible

```javascript
// Malo
{
  error: "MySQL Error: Table 'users' doesn't exist at line 42"
}

// Bueno
{
  mensaje: "Error interno del servidor",
  error: "No se pudo procesar la solicitud"
}
```

### 3. Validar Antes de Enviar

```javascript
// Validar en el cliente antes de enviar al servidor
function validarFormularioProducto(datos) {
  const errores = {};

  if (!datos.nombre || datos.nombre.trim().length < 3) {
    errores.nombre = 'El nombre debe tener al menos 3 caracteres';
  }

  if (!datos.precio || datos.precio <= 0) {
    errores.precio = 'El precio debe ser mayor a 0';
  }

  if (!datos.stock || datos.stock < 0) {
    errores.stock = 'El stock no puede ser negativo';
  }

  return Object.keys(errores).length > 0 ? errores : null;
}

// Uso
const errores = validarFormularioProducto(formData);
if (errores) {
  mostrarErrores(errores);
  return; // No enviar al servidor
}

await crearProducto(formData);
```

### 4. Manejo Graceful de Errores

```javascript
// Componente con fallback
function ProductoDetalle({ idProducto }) {
  const [producto, setProducto] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarProducto();
  }, [idProducto]);

  async function cargarProducto() {
    try {
      setCargando(true);
      const data = await obtenerProducto(idProducto);
      setProducto(data);
      setError(null);
    } catch (err) {
      setError(err);
      setProducto(null);
    } finally {
      setCargando(false);
    }
  }

  // Estados de carga
  if (cargando) {
    return <SkeletonProducto />;
  }

  // Estado de error con opción de reintentar
  if (error) {
    if (error.status === 404) {
      return (
        <ErrorBoundary
          mensaje="Producto no encontrado"
          accion={() => navigate('/catalogo')}
          textoAccion="Ver catálogo"
        />
      );
    }

    return (
      <ErrorBoundary
        mensaje="Error al cargar el producto"
        accion={cargarProducto}
        textoAccion="Reintentar"
      />
    );
  }

  // Render normal
  return <ProductoCard producto={producto} />;
}
```

### 5. Timeout y Cancelación

```javascript
// Implementar timeout para peticiones largas
async function fetchConTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado tiempo');
    }
    throw error;
  }
}
```

### 6. Error Boundaries en React

```jsx
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error capturado por boundary:', error, errorInfo);
    ErrorLogger.log(error, { errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Algo salió mal</h2>
          <p>Lo sentimos, ocurrió un error inesperado.</p>
          <button onClick={() => window.location.reload()}>
            Recargar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Uso
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

---

**Última actualización**: 15 de Octubre, 2025
**Versión**: 1.0
**Estado**: Completado

**Relacionado con**:
- [API Reference](../ENDPOINTS.md)
- [Guía de Autenticación](./AUTHENTICATION.md)
- [Endpoints de la API](../ENDPOINTS.md)

---

**[Volver arriba](#tabla-de-contenidos)** | **[Documentación](../../README.md)** | **[Inicio](../../../README.md)**
