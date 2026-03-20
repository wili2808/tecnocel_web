# Servicios del Frontend

> Documentación completa de los 17+ servicios de API del frontend en Tecnocel Web.

---

## Tabla de Contenidos

- [Introducción](#introducción)
- [Configuración de Axios](#configuración-de-axios)
- [Servicios Disponibles](#servicios-disponibles)
  - [authService](#authservice)
  - [carritoService](#carritoservice)
  - [commentService](#commentservice)
  - [direccionService](#direccionservice)
  - [favoritoService](#favoritoservice)
  - [marcaService](#marcaservice)
  - [ofertaService](#ofertaservice)
  - [productService](#productservice)
  - [uploadService](#uploadservice)
  - [adminProductService](#adminproductservice) ⭐
  - [adminCommentService](#admincommentservice) ⭐
  - [adminOfertaService](#adminofertaservice) ⭐
  - [ventaAdminService](#ventaadminservice) ⭐
  - [envioAdminService](#envioadminservice) ⭐
  - [notificacionService](#notificacionservice) ⭐
  - [reporteService](#reporteservice) ⭐
  - [usuarioService](#usuarioservice) ⭐
  - [UsuarioAdminService](#usuarioadminservice) ⭐
- [Patrones Comunes](#patrones-comunes)
- [Manejo de Errores](#manejo-de-errores)
- [Mejores Prácticas](#mejores-prácticas)

---

## Introducción

Los **servicios** encapsulan toda la lógica de comunicación con el backend API. Cada servicio es responsable de un dominio específico y proporciona una interfaz limpia para realizar operaciones CRUD y acciones especializadas.

### Características Principales

- **Separación de Responsabilidades** - Un servicio por dominio
- **TypeScript** - Tipado completo de requests y responses
- **Axios Configurado** - Instancia centralizada con interceptors
- **Manejo de Errores** - Procesamiento estandarizado de errores
- **Caché Inteligente** - Algunos servicios implementan caché local
- **Reintentos Automáticos** - Sistema de retry con backoff exponencial

---

## Configuración de Axios

Todos los servicios usan una instancia centralizada de Axios configurada en `frontend/src/api/axiosConfig.ts`:

```typescript
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
```

---

## Servicios Disponibles

### authService

**Ubicación**: `frontend/src/services/authService.ts`

**Descripción**: Maneja autenticación, registro y gestión de sesiones.

**API Pública**:

```typescript
// Gestión de tokens
setAuthToken(token: string): void
clearAuthToken(): void
saveAuthData(data: AuthData): void
getAuthData(): AuthData | null

// Autenticación
login(email: string, password: string): Promise<AuthData>
register(data: RegisterData): Promise<AuthData>
googleLogin(accessToken: string): Promise<AuthData>
verifyToken(): Promise<ClienteUser>

// Utilidades
handleAuthError(error: any): AuthError
isAuthenticated(): boolean
getCurrentUser(): ClienteUser | null
getCurrentToken(): string | null
```

**Ejemplo de Uso**:

```typescript
import { authService } from '../services/authService';

// Login
const { user, token } = await authService.login('email@example.com', 'password');
authService.saveAuthData({ user, token });

// Verificar token
try {
  const cliente = await authService.verifyToken();
  console.log('Token válido:', cliente);
} catch (error) {
  authService.clearAuthToken();
}

// Google OAuth
const { user, token } = await authService.googleLogin(googleAccessToken);
authService.saveAuthData({ user, token });
```

**Características**:
- **Persistencia** - Guarda datos en localStorage
- **Expiración** - Limpia sesión después de 24 horas
- **Manejo de Errores** - Códigos estandarizados (UNAUTHORIZED, EMAIL_EXISTS, etc.)
- **Google OAuth** - Soporte completo para login con Google

---

### carritoService

**Ubicación**: `frontend/src/services/carritoService.ts`

**Descripción**: Gestiona operaciones del carrito de compras.

**API Pública**:

```typescript
obtenerCarrito(): Promise<CarritoResponse>
agregarItem(id_producto: number, cantidad: number): Promise<ItemResponse>
actualizarCantidad(id_item: number, cantidad: number): Promise<ItemResponse>
eliminarItem(id_item: number): Promise<EliminarItemResponse>
vaciarCarrito(): Promise<{ mensaje: string }>
confirmarCompra(datosCompra: DatosCompra): Promise<{ venta: VentaConfirmada }>
```

**Ejemplo de Uso**:

```typescript
import { CarritoService } from '../services/carritoService';

// Agregar producto
const { item, total_carrito } = await CarritoService.agregarItem(123, 2);

// Actualizar cantidad
const { item, total_carrito } = await CarritoService.actualizarCantidad(45, 3);

// Confirmar compra
const { venta } = await CarritoService.confirmarCompra({
  observaciones: 'Entrega urgente',
  moneda: 'BOB',
  metodo_pago: 'efectivo'
});
```

**Tipos Exportados**:
- `ItemCarritoCompleto`, `EstadoCarrito`
- `DatosCompra`, `VentaConfirmada`
- `CarritoResponse`, `ItemResponse`, `EliminarItemResponse`

---

### commentService

**Ubicación**: `frontend/src/services/commentService.ts`

**Descripción**: Maneja comentarios de productos con imágenes y estadísticas.

**API Pública**:

```typescript
// CRUD Comentarios
getComentariosProducto(idProducto: number, params?: ObtenerComentariosParams): Promise<ComentariosResponse>
getEstadisticasProducto(idProducto: number): Promise<EstadisticasComentarios>
crearComentario(data: CrearComentarioData): Promise<Comentario>
actualizarComentario(idComentario: number, data: ActualizarComentarioData): Promise<Comentario>
eliminarComentario(idComentario: number): Promise<void>

// Gestión de Imágenes
subirImagenComentario(file: File): Promise<{ ruta_imagen: string; nombre_archivo: string }>
eliminarImagenComentario(idComentario: number, idImagen: number): Promise<void>

// Utilidades
validarImagenComentario(file: File): { valid: boolean; error?: string }
formatearFechaComentario(fecha: string): string
generarTextoCalificacion(calificacion: number): string
validarDatosComentario(datos: Partial<CrearComentarioData>): { valid: boolean; errors: string[] }
```

**Ejemplo de Uso**:

```typescript
import commentService from '../services/commentService';

// Obtener comentarios con paginación
const { datos } = await commentService.getComentariosProducto(123, {
  limite: 10,
  offset: 0,
  orden: 'recientes'
});

// Crear comentario
const comentario = await commentService.crearComentario({
  id_producto: 123,
  id_cliente: 456,
  comentario: 'Excelente producto',
  calificacion: 5,
  imagenes: [...]
});

// Validar imagen
const validation = commentService.validarImagenComentario(file);
if (!validation.valid) {
  console.error(validation.error);
}
```

**Validaciones**:
- **Imágenes**: JPG, PNG, WEBP, GIF - Máximo 10MB - Máximo 5 imágenes
- **Comentario**: Mínimo 10 caracteres - Máximo 2000 caracteres
- **Calificación**: Entre 1 y 5

---

### direccionService

**Ubicación**: `frontend/src/services/direccionService.ts`

**Descripción**: Gestiona direcciones de clientes para envíos.

**API Pública**:

```typescript
getDirecciones(idCliente: number): Promise<Direccion[]>
getDireccionPredeterminada(idCliente: number): Promise<Direccion | null>
getDireccionById(id: number): Promise<Direccion>
createDireccion(idCliente: number, data: CreateDireccionData): Promise<Direccion>
updateDireccion(id: number, data: Partial<CreateDireccionData>): Promise<Direccion>
setPredeterminada(id: number): Promise<Direccion>
deleteDireccion(id: number): Promise<void>
```

**Ejemplo de Uso**:

```typescript
import { direccionService } from '../services/direccionService';

// Obtener direcciones del cliente
const direcciones = await direccionService.getDirecciones(clienteId);

// Crear nueva dirección
const nuevaDireccion = await direccionService.createDireccion(clienteId, {
  nombre_direccion: 'Casa',
  calle: 'Av. Principal',
  numero: '123',
  ciudad: 'Santa Cruz',
  provincia: 'Santa Cruz',
  es_predeterminada: true
});

// Establecer como predeterminada
await direccionService.setPredeterminada(direccionId);
```

---

### favoritoService

**Ubicación**: `frontend/src/services/favoritoService.ts`

**Descripción**: Gestiona la lista de favoritos del cliente.

**API Pública**:

```typescript
getFavoritos(idCliente: number, limit?: number, offset?: number): Promise<FavoritoResponse>
verificarFavorito(idCliente: number, idProducto: number): Promise<boolean>
toggleFavorito(idCliente: number, idProducto: number): Promise<FavoritoToggleResponse>
addFavorito(idCliente: number, idProducto: number): Promise<any>
removeFavorito(idCliente: number, idProducto: number): Promise<any>
getEstadisticas(idCliente: number): Promise<EstadisticasFavoritosResponse>
```

**Ejemplo de Uso**:

```typescript
import { favoritoService } from '../services/favoritoService';

// Obtener favoritos con paginación
const { data, pagination } = await favoritoService.getFavoritos(clienteId, 20, 0);

// Toggle favorito
const { action, esFavorito } = await favoritoService.toggleFavorito(clienteId, productoId);
console.log(action); // 'added' o 'removed'

// Estadísticas
const { data } = await favoritoService.getEstadisticas(clienteId);
console.log('Total favoritos:', data.total);
console.log('Por categoría:', data.porCategoria);
```

---

### marcaService

**Ubicación**: `frontend/src/services/marcaService.ts`

**Descripción**: Consulta marcas de productos.

**API Pública**:

```typescript
getMarcas(): Promise<Marca[]>
getMarcaById(id: number): Promise<Marca>
```

**Ejemplo de Uso**:

```typescript
import marcaService from '../services/marcaService';

// Obtener todas las marcas
const marcas = await marcaService.getMarcas();

// Obtener marca específica
const marca = await marcaService.getMarcaById(5);
console.log(marca.nombre_marca);
```

---

### ofertaService

**Ubicación**: `frontend/src/services/ofertaService.ts`

**Descripción**: Gestiona ofertas activas con caché y reintentos automáticos.

**API Pública**:

```typescript
// Gestión de Ofertas
getOfertasActivas(useCache?: boolean): Promise<Oferta[]>
getProductosEnOferta(limit?: number, offset?: number, useCache?: boolean): Promise<ProductosOfertaResponse>
getOfertaDetalle(ofertaId: number): Promise<OfertaDetalleResponse['data']>
getEstadisticas(): Promise<OfertasEstadisticasResponse['data']>

// Búsqueda y Verificación
buscarOfertas(criterios: BusquedaCriterios): Promise<OfertaResponse>
verificarProductoEnOferta(productId: number): Promise<{ enOferta: boolean; oferta?: Oferta; precioOferta?: number }>
getOfertasProximasAExpirar(dias?: number): Promise<Oferta[]>

// Caché
clearCache(pattern?: string): void
cache.clear(key?: string): void
cache.isExpired(key: string): boolean

// Utilidades
utils.calculateTimeRemaining(oferta: Oferta): string
utils.isOfertaActive(oferta: Oferta): boolean
utils.calculateDiscount(precioOriginal: number, precioOferta: number): { monto: number; porcentaje: number }
```

**Ejemplo de Uso**:

```typescript
import { ofertaService } from '../services/ofertaService';

// Obtener ofertas activas (con caché)
const ofertas = await ofertaService.getOfertasActivas();

// Obtener productos en oferta con paginación
const { data, pagination } = await ofertaService.getProductosEnOferta(20, 0);

// Verificar si producto está en oferta
const { enOferta, oferta, precioOferta } = await ofertaService.verificarProductoEnOferta(123);

// Utilidades
const timeLeft = ofertaService.utils.calculateTimeRemaining(oferta);
const isActive = ofertaService.utils.isOfertaActive(oferta);
const { monto, porcentaje } = ofertaService.utils.calculateDiscount(100, 75);
```

**Características Especiales**:
- **Caché Local** - 5 minutos de duración por defecto
- **Reintentos Automáticos** - Hasta 3 reintentos con backoff exponencial
- **Utilidades Incluidas** - Cálculos de tiempo, descuentos y validaciones

---

### productService

**Ubicación**: `frontend/src/services/productService.ts`

**Descripción**: Gestiona productos, categorías y sus imágenes.

**API Pública**:

```typescript
// Productos
getProducts(options?: GetProductsOptions): Promise<Product[]>
getProductById(id: number): Promise<Product>
getFeaturedProducts(limit?: number): Promise<Product[]>

// Categorías y Marcas
getCategorias(): Promise<Category[]>
getMarcas(): Promise<Marca[]>

// Gestión de Imágenes
getProductImages(productId: number): Promise<ProductoImagen[]>
uploadProductImage(productId: number, imageFile: File, isPrincipal?: boolean): Promise<ProductoImagen>
updateProductImage(productId: number, imageId: number, data: UpdateImageData): Promise<ProductoImagen>
deleteProductImage(productId: number, imageId: number): Promise<void>
reorderProductImages(productId: number, imageOrder: ImageOrder[]): Promise<void>
```

**Ejemplo de Uso**:

```typescript
import productService from '../services/productService';

// Obtener productos con filtros y paginación
const products = await productService.getProducts({
  page: 1,
  limit: 12,
  filters: {
    categoria: 1,
    marca: 5,
    precio_min: 100,
    precio_max: 500
  }
});

// Obtener producto específico
const product = await productService.getProductById(123);

// Subir imagen
const imagen = await productService.uploadProductImage(123, file, true);
```

---

### uploadService

**Ubicación**: `frontend/src/services/uploadService.ts`

**Descripción**: Maneja subida de imágenes de comentarios.

**API Pública**:

```typescript
uploadCommentImages(files: File[]): Promise<UploadedImage[]>
generatePreview(file: File): Promise<string>
formatFileSize(bytes: number): string
isValidImageType(fileType: string): boolean
getRecommendedExtension(fileType: string): string
```

**Ejemplo de Uso**:

```typescript
import uploadService from '../services/uploadService';

// Subir múltiples imágenes
const uploadedImages = await uploadService.uploadCommentImages([file1, file2]);

// Generar preview
const previewUrl = await uploadService.generatePreview(file);

// Validar tipo
if (!uploadService.isValidImageType(file.type)) {
  console.error('Tipo de archivo no válido');
}

// Formatear tamaño
const sizeText = uploadService.formatFileSize(file.size); // "2.5 MB"
```

**Validaciones Automáticas**:
- Máximo 5 imágenes por comentario
- Formatos permitidos: JPG, PNG, WEBP, GIF
- Tamaño máximo: 10MB por imagen
- Timeout: 30 segundos

### Servicios Administrativos ⭐

#### adminProductService

**Ubicación**: `frontend/src/services/adminProductService.ts`

**Descripción**: CRUD completo de productos desde panel admin.

**API Pública**:
```typescript
const {
  crearProducto: (data: CreateProductoBody) => Promise<Almacen>,
  actualizarProducto: (id: number, data: UpdateProductoBody) => Promise<Almacen>,
  eliminarProducto: (id: number) => Promise<void>,
  actualizarStock: (id: number, data: UpdateStockBody) => Promise<void>,
  obtenerProductoAdmin: (id: number) => Promise<TransformedProduct>,
} = adminProductService;
```

#### adminCommentService

**Ubicación**: `frontend/src/services/adminCommentService.ts`

**Descripción**: Moderación y gestión de comentarios desde admin.

**API Pública**:
```typescript
const {
  obtenerComentarios: (filtros?: GetComentariosQuery) => Promise<Comentario[]>,
  responderComentario: (id: number, respuesta: string) => Promise<void>,
  ocultarComentario: (id: number) => Promise<void>,
  eliminarComentario: (id: number) => Promise<void>,
} = adminCommentService;
```

#### adminOfertaService

**Ubicación**: `frontend/src/services/adminOfertaService.ts`

**Descripción**: CRUD de ofertas desde admin.

**API Pública**:
```typescript
const {
  crearOferta: (data: CreateOfertaBody) => Promise<Oferta>,
  actualizarOferta: (id: number, data: UpdateOfertaBody) => Promise<Oferta>,
  eliminarOferta: (id: number) => Promise<void>,
  asignarProductos: (idOferta: number, productIds: number[]) => Promise<void>,
} = adminOfertaService;
```

#### ventaAdminService

**Ubicación**: `frontend/src/services/ventaAdminService.ts`

**Descripción**: Gestión de ventas, estados y cancelaciones desde admin.

**API Pública**:
```typescript
const {
  obtenerVentas: (filtros?) => Promise<VentaAdminDetalle[]>,
  obtenerDetalleVenta: (id: number) => Promise<VentaAdminDetalle>,
  cancelarVenta: (id: number, motivo: string) => Promise<void>,
  registrarVentaManual: (data: RegistrarVentaManualBody) => Promise<Venta>,
} = ventaAdminService;
```

#### envioAdminService ⭐

**Ubicación**: `frontend/src/services/envioAdminService.ts`

**Descripción**: Gestión de envíos y rastreo desde admin.

**API Pública**:
```typescript
const {
  listarEnvios: (filtros?) => Promise<Envio[]>,
  obtenerEnvio: (id: number) => Promise<Envio>,
  actualizarEstado: (id: number, estado: string, observaciones?: string) => Promise<void>,
} = envioAdminService;
```

#### notificacionService ⭐

**Ubicación**: `frontend/src/services/notificacionService.ts`

**Descripción**: Gestión de notificaciones del cliente.

**API Pública**:
```typescript
const {
  obtenerNotificaciones: () => Promise<Notificacion[]>,
  obtenerNoLeidasCount: () => Promise<number>,
  marcarComoLeida: (id: number) => Promise<void>,
  marcarTodasComoLeidas: () => Promise<void>,
  eliminarNotificacion: (id: number) => Promise<void>,
} = notificacionService;
```

#### reporteService ⭐

**Ubicación**: `frontend/src/services/reporteService.ts`

**Descripción**: Reportes analíticos (ventas, productos, clientes, cancelaciones).

**API Pública**:
```typescript
const {
  obtenerReporteVentas: (filtros: FiltroReporte) => Promise<ReporteVentas>,
  obtenerReporteProductos: (filtros: FiltroReporte) => Promise<ReporteProductos>,
  obtenerReporteClientes: (filtros: FiltroReporte) => Promise<ReporteClientes>,
  obtenerReporteCancelaciones: (filtros: FiltroReporte) => Promise<ReporteCancelaciones>,
  exportarCSV: (tipo: string, filtros: FiltroReporte) => Promise<Blob>,
} = reporteService;
```

#### usuarioService ⭐

**Ubicación**: `frontend/src/services/usuarioService.ts`

**Descripción**: Login y gestión de usuarios del sistema (admin/gerente/vendedor).

**API Pública**:
```typescript
const {
  loginUsuario: (email: string, password: string) => Promise<{ token: string; usuario: AdminUser }>,
  obtenerPerfil: () => Promise<AdminUser>,
  cambiarContraseña: (passwordActual: string, passwordNueva: string) => Promise<void>,
} = usuarioService;
```

#### UsuarioAdminService ⭐

**Ubicación**: `frontend/src/services/UsuarioAdminService.ts`

**Descripción**: CRUD de usuarios desde admin y gestión de clientes.

**API Pública**:
```typescript
const {
  crearUsuario: (data: CreateUsuarioBody) => Promise<AdminUser>,
  actualizarUsuario: (id: number, data: UpdateUsuarioBody) => Promise<AdminUser>,
  eliminarUsuario: (id: number) => Promise<void>,
  listarClientes: (filtros?) => Promise<ClienteListItem[]>,
  habilitarCliente: (id: number) => Promise<void>,
  deshabilitarCliente: (id: number) => Promise<void>,
} = UsuarioAdminService;
```

---

## Patrones Comunes

### Patrón 1: Servicio con Clase Estática

```typescript
export class CarritoService {
  static async obtenerCarrito(): Promise<CarritoResponse> {
    const response = await axiosInstance.get('/carrito/');
    return response.data;
  }
}
```

### Patrón 2: Servicio como Objeto

```typescript
export const authService = {
  login: async (email, password) => {
    const response = await axiosInstance.post('/login', { email, password });
    return response.data;
  }
};
```

### Patrón 3: Servicio con Clase Instanciada

```typescript
class UploadService {
  async uploadCommentImages(files) {
    // ...
  }
}

export default new UploadService();
```

### Patrón 4: Servicio con Caché

```typescript
const cacheManager = new LocalCacheManager();

export const ofertaService = {
  async getOfertasActivas(useCache = true) {
    if (useCache) {
      const cached = cacheManager.get('ofertas');
      if (cached) return cached;
    }

    const data = await axiosInstance.get('/ofertas/activas');
    cacheManager.set('ofertas', data);
    return data;
  }
};
```

---

## Manejo de Errores

### Errores Estandarizados

```typescript
try {
  await authService.login(email, password);
} catch (error) {
  const authError = authService.handleAuthError(error);

  switch (authError.code) {
    case 'UNAUTHORIZED':
      console.error('Credenciales inválidas');
      break;
    case 'EMAIL_EXISTS':
      console.error('Email ya registrado');
      break;
    case 'SERVER_ERROR':
      console.error('Error del servidor');
      break;
  }
}
```

### Try-Catch en Servicios

Todos los métodos de servicio envuelven llamadas en try-catch:

```typescript
async getProductById(id: number): Promise<Product> {
  try {
    const response = await axiosInstance.get(`/productos/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error; // Re-lanzar para manejo en componente
  }
}
```

### Reintentos Automáticos

El `ofertaService` implementa reintentos con backoff exponencial:

```typescript
const data = await retryWithBackoff(
  async () => await axiosInstance.get('/ofertas/activas'),
  3,      // Máximo 3 reintentos
  1000    // Delay base de 1 segundo
);
```

---

## Mejores Prácticas

### 1. Tipado Completo

Siempre tipar requests y responses:

```typescript
interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: ClienteUser;
  token: string;
}

async login(email: string, password: string): Promise<LoginResponse> {
  const response = await axiosInstance.post<LoginResponse>('/login', {
    email,
    password
  });
  return response.data;
}
```

### 2. Manejo Consistente de Errores

```typescript
try {
  return await apiCall();
} catch (error) {
  console.error('Descripción del error:', error);
  throw error; // Re-lanzar o transformar
}
```

### 3. Usar Caché Cuando Sea Apropiado

Para datos que cambian poco frecuentemente:

```typescript
// BIEN - Cachear marcas (raramente cambian)
const cacheKey = 'marcas';
const cached = cacheManager.get(cacheKey);
if (cached) return cached;

const marcas = await fetchMarcas();
cacheManager.set(cacheKey, marcas, 30 * 60 * 1000); // 30 min

// MAL - Cachear carrito (cambia frecuentemente)
```

### 4. Validaciones del Cliente

Validar antes de enviar al servidor:

```typescript
if (!email || !password) {
  throw new Error('Email y contraseña son requeridos');
}

if (files.length > 5) {
  throw new Error('Máximo 5 imágenes');
}
```

### 5. Exportar Tipos

Facilitar el uso importando tipos desde servicios:

```typescript
export type {
  ItemCarritoCompleto,
  EstadoCarrito,
  DatosCompra
} from '../types/carrito';
```

---

## Ver También

- [Hooks Personalizados](HOOKS.md) - Hooks que usan estos servicios
- [Contextos del Frontend](CONTEXTS.md) - Contextos que consumen servicios
- [Tipos TypeScript](../types/README.md) - Definiciones de tipos compartidos
- [API Backend](../../backend/README.md) - Documentación de endpoints

---

**Última actualización**: 7 de Octubre, 2025
**Versión**: 1.0
**Estado**: Completado

---

**[Volver arriba](#tabla-de-contenidos)** | **[Documentación](README.md)** | **[Inicio](../README.md)**
