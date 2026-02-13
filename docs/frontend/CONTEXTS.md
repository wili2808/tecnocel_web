**[Documentación](README.md)** | **[Inicio](../README.md)**

---

# Contextos del Frontend

> Documentación completa de los 8 contextos globales de React en Tecnocel Web.

---

## Tabla de Contenidos

- [Introducción](#introducción)
- [Arquitectura de Contextos](#arquitectura-de-contextos)
- [Contextos Disponibles](#contextos-disponibles)
  - [AuthContext](#authcontext)
  - [CarritoContext](#carritocontext)
  - [FavoritosGlobalContext](#favoritosglobalcontext)
  - [OfertasGlobalContext](#ofertasglobalcontext)
  - [ProductContext](#productcontext)
  - [SearchContext](#searchcontext)
  - [ThemeContext](#themecontext)
  - [NotificationContext](#notificationcontext)
- [Integración de Contextos](#integración-de-contextos)
- [Optimizaciones y Mejores Prácticas](#optimizaciones-y-mejores-prácticas)
- [Ejemplos de Uso](#ejemplos-de-uso)

---

## Introducción

El sistema de **Context API** de React es utilizado en Tecnocel Web para manejar el estado global de la aplicación. Este documento describe los **8 contextos principales** implementados, su estructura, API pública y patrones de uso.

### Características Principales

- Estado Global Centralizado - Manejo eficiente del estado compartido
- Optimización de Performance - Uso de `useMemo`, `useCallback` y técnicas de memoización
- Sistema de Caché Inteligente - Reducción de llamadas redundantes al backend
- Persistencia de Datos - Sincronización con `localStorage` y `sessionStorage`
- Hooks Personalizados - API limpia y segura para consumir contextos
- TypeScript - Tipado completo para mejor DX

---

## Arquitectura de Contextos

### Jerarquía de Providers

Los contextos están organizados en una jerarquía específica en `App.tsx`:

```tsx
<ThemeProvider>
  <NotificationProvider>
    <AuthProvider>
      <OfertasGlobalProvider>
        <FavoritosGlobalProvider>
          <ProductProvider>
            <CarritoProvider>
              <SearchProvider>
                {/* Aplicación */}
              </SearchProvider>
            </CarritoProvider>
          </ProductProvider>
        </FavoritosGlobalProvider>
      </OfertasGlobalProvider>
    </AuthProvider>
  </NotificationProvider>
</ThemeProvider>
```

### Dependencias entre Contextos

```
ThemeContext (base)
  └─> NotificationContext
      └─> AuthContext
          ├─> OfertasGlobalContext
          ├─> FavoritosGlobalContext
          ├─> CarritoContext
          └─> ProductContext
              └─> SearchContext
```

---

## Contextos Disponibles

### AuthContext

**Ubicación**: `frontend/src/contexts/AuthContext.tsx`
**Hook**: `useAuth()`

#### Descripción

Gestiona la **autenticación y autorización** de usuarios. Soporta login con credenciales y **Google OAuth 2.0**.

#### Estado

```typescript
interface AuthState {
  user: ClienteUser | null;
  token: string | null;
  isVerifying: boolean;
  isInitialized: boolean;
  error: string | null;
}

interface ClienteUser {
  id_cliente: number;
  nombre_cliente: string;
  apellido_cliente: string;
  email_cliente: string;
  celular_cliente?: string;
  nit_ci_cliente?: string;
}
```

#### API Pública

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `user` | `ClienteUser \| null` | Usuario autenticado actual |
| `token` | `string \| null` | Token JWT de autenticación |
| `isAuthenticated` | `boolean` | Estado de autenticación del usuario |
| `isVerifying` | `boolean` | Indica si se está verificando el token |
| `isInitialized` | `boolean` | Indica si la verificación inicial ha terminado |
| `error` | `string \| null` | Mensaje de error si ocurre algún problema |

#### Métodos

**`login(email_cliente: string, contrasena: string): Promise<void>`**

Autentica un usuario con credenciales.

```typescript
const { login } = useAuth();

try {
  await login('usuario@example.com', 'password123');
  // Usuario autenticado exitosamente
} catch (error) {
  console.error('Error al iniciar sesión:', error);
}
```

**`register(data: RegisterData): Promise<any>`**

Registra un nuevo usuario en el sistema.

```typescript
const { register } = useAuth();

try {
  const result = await register({
    nombre_cliente: 'Juan',
    apellido_cliente: 'Pérez',
    email_cliente: 'juan@example.com',
    contrasena: 'password123',
    celular_cliente: '77123456',
    nit_ci_cliente: '12345678'
  });
  console.log('Usuario registrado:', result);
} catch (error) {
  console.error('Error al registrar:', error);
}
```

**`logout(): void`**

Cierra la sesión del usuario actual.

```typescript
const { logout } = useAuth();
logout();
```

**`googleLogin(overrideConfig?: any): void`**

Inicia el flujo de autenticación con Google OAuth 2.0.

```typescript
const { googleLogin } = useAuth();

// Iniciar autenticación con Google
googleLogin();
```

**`clearError(): void`**

Limpia el mensaje de error del contexto.

```typescript
const { error, clearError } = useAuth();

if (error) {
  clearError();
}
```

#### Características Especiales

- **Persistencia de Sesión** - Guarda token y datos de usuario en `localStorage`
- **Verificación Automática** - Verifica el token al iniciar la aplicación
- **Expiración de Sesión** - Limpia datos automáticamente (24h cliente, 8h admin)
- **Google OAuth 2.0** - Integración completa con `@react-oauth/google`
- **Manejo de Errores** - Sistema robusto de manejo de errores

#### Optimizaciones

- **useRef** para evitar verificaciones duplicadas de token
- **useMemo** para memoizar el valor del contexto
- **useCallback** para funciones estables
- Inicialización lazy del estado con datos de `localStorage`

---

### CarritoContext

**Ubicación**: `frontend/src/contexts/CarritoContext.tsx`
**Hook**: `useCarrito()`

#### Descripción

Gestiona el **carrito de compras** del usuario con sincronización completa con el backend.

#### Estado

```typescript
interface EstadoCarrito {
  id_carrito: number | null;
  estado: 'activo' | 'completado' | 'cancelado';
  items: ItemCarrito[];
  total_carrito: number;
  cantidad_items: number;
  cargando: boolean;
  error: string | null;
}

interface ItemCarrito {
  id_item: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  producto?: {
    nombre: string;
    imagen_url?: string;
    stock: number;
  };
}
```

#### API Pública

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `estado` | `EstadoCarrito` | Estado completo del carrito |
| `obtenerCarrito` | `() => Promise<void>` | Carga el carrito desde el backend |
| `agregarItem` | `(id_producto: number, cantidad: number) => Promise<void>` | Agrega un producto al carrito |
| `actualizarCantidad` | `(id_item: number, cantidad: number) => Promise<void>` | Actualiza la cantidad de un item |
| `eliminarItem` | `(id_item: number) => Promise<void>` | Elimina un item del carrito |
| `vaciarCarrito` | `() => Promise<void>` | Vacía completamente el carrito |
| `confirmarCompra` | `(datosCompra: DatosCompra) => Promise<VentaConfirmada>` | Confirma la compra |
| `sincronizarCarrito` | `() => Promise<void>` | Fuerza sincronización con backend |

#### Métodos Utilitarios

| Método | Tipo | Descripción |
|--------|------|-------------|
| `isProductInCart` | `(id_producto: number) => boolean` | Verifica si un producto está en el carrito |
| `getProductQuantityInCart` | `(id_producto: number) => number` | Obtiene la cantidad de un producto en el carrito |
| `canAddMoreOfProduct` | `(id_producto: number, stock: number) => boolean` | Verifica si se puede agregar más stock |

#### Ejemplo de Uso

```typescript
const { estado, agregarItem, actualizarCantidad, eliminarItem } = useCarrito();

// Agregar producto al carrito
const handleAddToCart = async (productId: number, quantity: number) => {
  try {
    await agregarItem(productId, quantity);
    console.log('Producto agregado al carrito');
  } catch (error) {
    console.error('Error al agregar producto:', error);
  }
};

// Actualizar cantidad
const handleUpdateQuantity = async (itemId: number, newQuantity: number) => {
  try {
    await actualizarCantidad(itemId, newQuantity);
  } catch (error) {
    console.error('Error al actualizar cantidad:', error);
  }
};

// Verificar si un producto está en el carrito
const { isProductInCart } = useCarrito();
const estaEnCarrito = isProductInCart(123);
```

#### Características Especiales

- **Sincronización Automática** - Se sincroniza al autenticar usuario
- **Validación de Stock** - Verifica disponibilidad antes de agregar
- **Cálculo Automático** - Calcula totales y subtotales automáticamente
- **useReducer** - Gestión eficiente del estado con acciones inmutables
- **Recuperación de Errores** - Sincroniza con backend en caso de error

---

### FavoritosGlobalContext

**Ubicación**: `frontend/src/contexts/FavoritosGlobalContext.tsx`
**Hooks**: `useFavoritosGlobal()`, `useFavoritoProducto(productId)`

#### Descripción

Gestiona el sistema de **favoritos** del usuario con caché inteligente y sincronización.

#### Estado

```typescript
interface FavoritosState {
  favoritos: Map<number, boolean>; // Map para O(1) lookup
  favoritosCompletos: Favorito[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

interface Favorito {
  id_favorito: number;
  id_cliente: number;
  id_producto: number;
  fyh_creacion: string;
  producto?: {
    id_producto: number;
    nombre: string;
    precio_venta: string;
    imagen_url?: string;
    stock: number;
  };
}
```

#### API Pública

| Método | Tipo | Descripción |
|--------|------|-------------|
| `isFavorito` | `(productId: number) => boolean` | Verifica si un producto es favorito |
| `toggleFavorito` | `(productId: number) => Promise<boolean>` | Alterna el estado de favorito |
| `addFavorito` | `(productId: number) => Promise<boolean>` | Agrega un producto a favoritos |
| `removeFavorito` | `(productId: number) => Promise<boolean>` | Remueve un producto de favoritos |
| `loadFavoritos` | `() => Promise<void>` | Carga favoritos desde el backend |
| `refreshFavoritos` | `() => Promise<void>` | Fuerza recarga de favoritos |
| `clearFavoritos` | `() => void` | Limpia todos los favoritos del estado |
| `removeAllFavoritos` | `(productIds: number[]) => Promise<boolean>` | Elimina múltiples favoritos |
| `syncWithBackend` | `() => Promise<void>` | Sincroniza con el backend |
| `getFavoritosCount` | `() => number` | Obtiene el conteo de favoritos |
| `getFavoritosIds` | `() => number[]` | Obtiene array de IDs de favoritos |
| `getFavoritosCompletos` | `() => Favorito[]` | Obtiene array completo de favoritos |

#### Hook Optimizado: `useFavoritoProducto(productId)`

Hook especializado para un producto específico que **solo se re-renderiza cuando cambia el estado de ese producto**.

```typescript
const { isFavorito, toggleFavorito, loading } = useFavoritoProducto(productId);
```

#### Ejemplo de Uso

```typescript
// Uso global
const { favoritos, toggleFavorito, getFavoritosCount } = useFavoritosGlobal();

const handleToggleFavorito = async (productId: number) => {
  const success = await toggleFavorito(productId);
  if (success) {
    console.log('Favorito actualizado');
  }
};

// Uso optimizado para un producto específico
const ProductCard = ({ productId }) => {
  const { isFavorito, toggleFavorito, loading } = useFavoritoProducto(productId);

  return (
    <button onClick={toggleFavorito} disabled={loading}>
      {isFavorito ? '❤️' : '🤍'}
    </button>
  );
};
```

#### Características Especiales

- **Caché en localStorage** - Persistencia de 5 minutos (configurable)
- **Búsqueda O(1)** - Usa `Map` para búsquedas ultrarápidas
- **Hook Granular** - `useFavoritoProducto` evita re-renders innecesarios
- **Sincronización Inteligente** - Maneja desincronización automáticamente
- **Eliminación Masiva** - Método optimizado para eliminar múltiples favoritos

---

### OfertasGlobalContext

**Ubicación**: `frontend/src/contexts/OfertasGlobalContext.tsx`
**Hook**: `useOfertasGlobal()`

#### Descripción

Gestiona el sistema de **ofertas activas** con caché y actualización automática.

#### Estado

```typescript
interface OfertasState {
  ofertas: Oferta[];
  productosEnOferta: Product[];
  ofertasActivas: Oferta[];
  ofertasExpiradas: Oferta[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  cache: {
    ofertas: Map<number, Oferta>;
    productos: Map<number, Product>;
    ofertasActivas: Set<number>;
    ofertasExpiradas: Set<number>;
  };
}

interface Oferta {
  id_oferta: number;
  nombre_oferta: string;
  descripcion_oferta: string;
  tipo_descuento: 'porcentaje' | 'monto_fijo';
  valor_descuento: number;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
}
```

#### API Pública

| Método | Tipo | Descripción |
|--------|------|-------------|
| `getOfertaById` | `(id: number) => Oferta \| undefined` | Obtiene una oferta por ID |
| `getProductosPorOferta` | `(ofertaId: number) => Product[]` | Obtiene productos de una oferta |
| `isProductoEnOferta` | `(productId: number) => boolean` | Verifica si un producto está en oferta |
| `getOfertaInfo` | `(productId: number) => OfertaConProductos \| null` | Obtiene info completa de oferta |
| `loadOfertas` | `() => Promise<void>` | Carga ofertas desde el backend |
| `refreshOfertas` | `() => Promise<void>` | Fuerza recarga de ofertas |
| `clearOfertas` | `() => void` | Limpia todas las ofertas |
| `getOfertasActivas` | `() => Oferta[]` | Obtiene ofertas activas |
| `getOfertasExpiradas` | `() => Oferta[]` | Obtiene ofertas expiradas |
| `getOfertasCount` | `() => number` | Obtiene conteo de ofertas |
| `calculateTimeRemaining` | `(oferta: Oferta) => string` | Calcula tiempo restante |
| `isOfertaActive` | `(oferta: Oferta) => boolean` | Verifica si oferta está activa |
| `getEstadisticas` | `() => Promise<any>` | Obtiene estadísticas de ofertas |
| `buscarOfertas` | `(criterios) => Promise<any>` | Busca ofertas por criterios |
| `verificarProductoEnOferta` | `(productId: number) => Promise<{...}>` | Verifica oferta de un producto |

#### Ejemplo de Uso

```typescript
const {
  productosEnOferta,
  isProductoEnOferta,
  getOfertaInfo,
  calculateTimeRemaining
} = useOfertasGlobal();

// Verificar si un producto está en oferta
if (isProductoEnOferta(productId)) {
  const ofertaInfo = getOfertaInfo(productId);
  if (ofertaInfo) {
    console.log('Tiempo restante:', calculateTimeRemaining(ofertaInfo));
    console.log('Descuento:', ofertaInfo.valor_descuento);
  }
}
```

#### Características Especiales

- **Caché Dual** - localStorage + memoria para máxima eficiencia
- **Actualización Automática** - Refresca cada 1 minuto (configurable)
- **Cálculo de Tiempo** - Calcula tiempo restante de ofertas
- **Filtros Avanzados** - Separa ofertas activas y expiradas
- **Retry Logic** - Sistema de reintentos en caso de error

---

### ProductContext

**Ubicación**: `frontend/src/contexts/ProductContext.tsx`
**Hook**: `useProductContext()`

#### Descripción

Gestiona el **catálogo de productos** con sistema de caché, filtros y paginación.

#### Estado

```typescript
interface ProductContextState {
  // PRODUCTOS
  products: Product[];
  featuredProducts: Product[];
  currentProduct: Product | null;
  productsLoading: boolean;
  productsError: string | null;

  // CATEGORÍAS
  categories: Category[];
  selectedCategory: Category | null;
  categoriesLoading: boolean;
  categoriesError: string | null;

  // MARCAS
  brands: Marca[];
  selectedBrand: Marca | null;
  brandsLoading: boolean;
  brandsError: string | null;

  // FILTROS Y BÚSQUEDA
  filters: ProductFilters;
  searchQuery: string;
  filteredProducts: Product[];

  // PAGINACIÓN
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };

  // CACHÉ
  cache: Map<string, { data: any; timestamp: number }>;
  imageCache: Map<string, { url: string; timestamp: number }>;
}

interface ProductFilters {
  categoria?: number;
  marca?: number;
  precio_min?: number;
  precio_max?: number;
  busqueda?: string;
  solo_con_stock?: boolean;
  solo_ofertas?: boolean;
  es_destacado?: boolean;
}
```

#### API Pública

**Productos**

| Método | Tipo | Descripción |
|--------|------|-------------|
| `fetchProducts` | `(filters?: ProductFilters, page?: number) => Promise<void>` | Carga productos |
| `fetchProduct` | `(id: number) => Promise<void>` | Carga un producto específico |
| `fetchFeaturedProducts` | `(limit?: number) => Promise<void>` | Carga productos destacados |

**Categorías**

| Método | Tipo | Descripción |
|--------|------|-------------|
| `fetchCategories` | `() => Promise<void>` | Carga categorías |
| `selectCategory` | `(category: Category \| null) => void` | Selecciona una categoría |

**Marcas**

| Método | Tipo | Descripción |
|--------|------|-------------|
| `fetchBrands` | `() => Promise<void>` | Carga marcas |
| `selectBrand` | `(brand: Marca \| null) => void` | Selecciona una marca |

**Filtros**

| Método | Tipo | Descripción |
|--------|------|-------------|
| `updateFilters` | `(filters: Partial<ProductFilters>) => void` | Actualiza filtros |
| `updateSearchQuery` | `(query: string) => void` | Actualiza búsqueda |
| `resetFilters` | `() => void` | Resetea todos los filtros |
| `applyFilters` | `() => void` | Aplica filtros manualmente |

**Paginación**

| Método | Tipo | Descripción |
|--------|------|-------------|
| `updatePagination` | `(page: number, limit: number) => void` | Actualiza paginación |
| `loadMore` | `() => Promise<void>` | Carga más productos |

**Caché**

| Método | Tipo | Descripción |
|--------|------|-------------|
| `getCachedData` | `(key: string) => any \| null` | Obtiene datos del caché |
| `setCachedData` | `(key: string, data: any) => void` | Guarda datos en caché |
| `clearCache` | `(key?: string) => void` | Limpia el caché |
| `loadImageWithCache` | `(imageUrl: string) => Promise<string>` | Carga imagen con caché |
| `clearImageCache` | `() => void` | Limpia caché de imágenes |
| `hasFreshData` | `(dataType: keyof CacheData) => boolean` | Verifica frescura del caché |
| `restoreFromCache` | `() => boolean` | Restaura desde caché |
| `clearProductState` | `(force?: boolean) => void` | Limpia estado de producto |
| `forceClearProductState` | `() => void` | Limpieza forzada completa |

#### Ejemplo de Uso

```typescript
const {
  state,
  fetchProducts,
  updateFilters,
  fetchCategories,
  selectCategory
} = useProductContext();

// Cargar productos con filtros
useEffect(() => {
  fetchProducts({ categoria: 1, solo_con_stock: true });
}, []);

// Aplicar filtros
const handleFilterChange = (filters: Partial<ProductFilters>) => {
  updateFilters(filters);
  fetchProducts(filters);
};

// Seleccionar categoría
const handleCategorySelect = (category: Category) => {
  selectCategory(category);
  fetchProducts(); // Se aplicará el filtro automáticamente
};
```

#### Características Especiales

- **Caché Triple** - localStorage + memoria + imágenes
- **Sincronización con Ofertas** - Se sincroniza automáticamente con `OfertasGlobalContext`
- **Filtros Avanzados** - Múltiples criterios de filtrado
- **Paginación Infinita** - Soporte para `loadMore()`
- **useReducer** - Gestión eficiente del estado
- **Caché de Imágenes** - Optimiza carga de imágenes con `blob:`

---

### SearchContext

**Ubicación**: `frontend/src/contexts/SearchContext.tsx`
**Hook**: `useSearch()`

#### Descripción

Gestiona el **estado global de búsqueda** con debounce y sincronización con URL.

#### Estado

```typescript
interface SearchContextType {
  searchQuery: string;              // Query actual del usuario
  debouncedSearchQuery: string;     // Query con debounce para API
  isSearching: boolean;             // Estado de búsqueda activa
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  navigateToProducts: (query?: string) => void;
}
```

#### API Pública

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `searchQuery` | `string` | Query de búsqueda inmediato |
| `debouncedSearchQuery` | `string` | Query con debounce (300ms) para API |
| `isSearching` | `boolean` | Indica si hay búsqueda en progreso |
| `setSearchQuery` | `(query: string) => void` | Actualiza el query de búsqueda |
| `clearSearch` | `() => void` | Limpia la búsqueda |
| `navigateToProducts` | `(query?: string) => void` | Navega a productos con búsqueda |

#### Ejemplo de Uso

```typescript
const { searchQuery, debouncedSearchQuery, setSearchQuery, navigateToProducts } = useSearch();

// Barra de búsqueda
const SearchBar = () => {
  const { searchQuery, setSearchQuery, navigateToProducts } = useSearch();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigateToProducts(); // Navega con el query actual
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Buscar productos..."
      />
      <button type="submit">Buscar</button>
    </form>
  );
};

// Usar debouncedSearchQuery para API calls
useEffect(() => {
  if (debouncedSearchQuery) {
    fetchProducts({ busqueda: debouncedSearchQuery });
  }
}, [debouncedSearchQuery]);
```

#### Características Especiales

- **Debounce Automático** - 300ms de delay para optimizar llamadas
- **Sincronización con URL** - Se sincroniza con `?search=` params
- **Navegación Integrada** - Método para navegar con búsqueda
- **Estado Dual** - Query inmediato y con debounce para diferentes usos

---

### ThemeContext

**Ubicación**: `frontend/src/contexts/ThemeContext.tsx`
**Hook**: `useTheme()`

#### Descripción

Gestiona el **tema visual** de la aplicación (claro/oscuro).

#### Estado

```typescript
type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}
```

#### API Pública

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `theme` | `'light' \| 'dark'` | Tema actual |
| `toggleTheme` | `() => void` | Alterna entre temas |
| `setTheme` | `(theme: Theme) => void` | Establece un tema específico |

#### Ejemplo de Uso

```typescript
const { theme, toggleTheme } = useTheme();

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      {theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
    </button>
  );
};
```

#### Características Especiales

- **Persistencia** - Guarda tema en `localStorage`
- **Sincronización con DOM** - Actualiza `data-theme` attribute
- **Meta Theme Color** - Actualiza color de barra de navegación móvil
- **System Preferences** - Escucha cambios de `prefers-color-scheme`

---

### NotificationContext

**Ubicación**: `frontend/src/contexts/NotificationContext.tsx`
**Hook**: `useNotification()`

#### Descripción

Gestiona el sistema de **notificaciones** temporales (toasts).

#### Estado

```typescript
interface Notification {
  id: string;
  message: string;
  type: 'error' | 'success' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (message: string, type, duration?, action?) => void;
  hideNotification: (id: string) => void;
  clearNotifications: () => void;
}
```

#### API Pública

| Método | Tipo | Descripción |
|--------|------|-------------|
| `showNotification` | `(message, type, duration?, action?) => void` | Muestra notificación |
| `hideNotification` | `(id: string) => void` | Oculta notificación específica |
| `clearNotifications` | `() => void` | Limpia todas las notificaciones |

#### Ejemplo de Uso

```typescript
const { showNotification } = useNotification();

// Notificación simple
showNotification('Producto agregado al carrito', 'success');

// Notificación con duración personalizada
showNotification('Procesando...', 'info', 3000);

// Notificación con acción
showNotification('Error al cargar datos', 'error', 5000, {
  label: 'Reintentar',
  onClick: () => refetch()
});
```

#### Características Especiales

- **Auto-cierre** - Cierre automático después de `duration` (default: 5000ms)
- **Acciones Personalizables** - Botones de acción opcionales
- **useRef Pattern** - Evita dependencias circulares
- **ID Único** - Usa timestamp para IDs únicos

---

## Integración de Contextos

### App.tsx - Estructura Completa

```tsx
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { AuthProvider } from './contexts/AuthContext';
import { OfertasGlobalProvider } from './contexts/OfertasGlobalContext';
import { FavoritosGlobalProvider } from './contexts/FavoritosGlobalContext';
import { ProductProvider } from './contexts/ProductContext';
import { CarritoProvider } from './contexts/CarritoContext';
import { SearchProvider } from './contexts/SearchContext';

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <OfertasGlobalProvider>
            <FavoritosGlobalProvider>
              <ProductProvider>
                <CarritoProvider>
                  <SearchProvider>
                    <Router>
                      <Layout>
                        <Routes>
                          {/* Rutas de la aplicación */}
                        </Routes>
                      </Layout>
                    </Router>
                  </SearchProvider>
                </CarritoProvider>
              </ProductProvider>
            </FavoritosGlobalProvider>
          </OfertasGlobalProvider>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
```

---

## Optimizaciones y Mejores Prácticas

### Memoización de Valores

Todos los contextos usan `useMemo` para memoizar el valor del contexto:

```typescript
const contextValue = useMemo(() => ({
  state,
  methods...
}), [dependencies]);
```

### useCallback para Funciones

Las funciones se envuelven en `useCallback` para mantener referencia estable:

```typescript
const loadData = useCallback(async () => {
  // lógica
}, [dependencies]);
```

### useRef para Evitar Dependencias Circulares

```typescript
const functionRef = useRef<Function>();

useEffect(() => {
  functionRef.current = actualFunction;
}, [actualFunction]);

// Usar functionRef.current() en lugar de actualFunction()
```

### Sistema de Caché Multi-nivel

```
┌─────────────────┐
│   localStorage  │ ← Persistencia (5-30 min)
└────────┬────────┘
         │
┌────────▼────────┐
│  Memory Cache   │ ← Map/Set (rápido)
└────────┬────────┘
         │
┌────────▼────────┐
│   API Backend   │ ← Source of truth
└─────────────────┘
```

### Patrón de Hook Granular

Para evitar re-renders innecesarios, usa hooks especializados:

```typescript
// MAL - Re-renderiza en cada cambio de favoritos
const { favoritos } = useFavoritosGlobal();
const isFav = favoritos.get(productId);

// BIEN - Solo re-renderiza cuando cambia ESTE producto
const { isFavorito } = useFavoritoProducto(productId);
```

### Sincronización Inteligente

Los contextos se sincronizan entre sí cuando es necesario:

- `ProductContext` escucha `OfertasGlobalContext` para aplicar precios de oferta
- `CarritoContext` escucha `AuthContext` para cargar/limpiar carrito
- `FavoritosGlobalContext` escucha `AuthContext` para cargar/limpiar favoritos

---

## Ejemplos de Uso

### Ejemplo 1: Página de Producto con Múltiples Contextos

```typescript
const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const { state, fetchProduct } = useProductContext();
  const { agregarItem } = useCarrito();
  const { isFavorito, toggleFavorito } = useFavoritoProducto(Number(id));
  const { showNotification } = useNotification();

  useEffect(() => {
    if (id) {
      fetchProduct(Number(id));
    }
  }, [id]);

  const handleAddToCart = async () => {
    try {
      await agregarItem(Number(id), 1);
      showNotification('Producto agregado al carrito', 'success');
    } catch (error) {
      showNotification('Error al agregar al carrito', 'error');
    }
  };

  const handleToggleFavorito = async () => {
    const success = await toggleFavorito();
    if (success) {
      showNotification(
        isFavorito ? 'Removido de favoritos' : 'Agregado a favoritos',
        'success'
      );
    }
  };

  if (state.productsLoading) return <Spinner />;
  if (!state.currentProduct) return <NotFound />;

  return (
    <div>
      <h1>{state.currentProduct.nombre}</h1>
      <button onClick={handleAddToCart}>Agregar al Carrito</button>
      <button onClick={handleToggleFavorito}>
        {isFavorito ? '❤️' : '🤍'}
      </button>
    </div>
  );
};
```

### Ejemplo 2: Catálogo con Filtros y Búsqueda

```typescript
const ProductCatalog = () => {
  const { state, fetchProducts, updateFilters, fetchCategories } = useProductContext();
  const { debouncedSearchQuery } = useSearch();
  const { productosEnOferta } = useOfertasGlobal();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const filters: ProductFilters = {};

    if (debouncedSearchQuery) {
      filters.busqueda = debouncedSearchQuery;
    }

    fetchProducts(filters);
  }, [debouncedSearchQuery]);

  const handleFilterChange = (newFilters: Partial<ProductFilters>) => {
    updateFilters(newFilters);
    fetchProducts(newFilters);
  };

  return (
    <div>
      <SearchBar />
      <CategoryFilter
        categories={state.categories}
        onSelect={(cat) => handleFilterChange({ categoria: cat.id_categoria })}
      />
      <ProductGrid products={state.filteredProducts} />
    </div>
  );
};
```

### Ejemplo 3: Componente de Carrito

```typescript
const Cart = () => {
  const { estado, actualizarCantidad, eliminarItem, confirmarCompra } = useCarrito();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const handleCheckout = async () => {
    if (!user) {
      showNotification('Debes iniciar sesión para comprar', 'warning');
      navigate('/login');
      return;
    }

    try {
      const venta = await confirmarCompra({
        // datos de compra
      });
      showNotification('Compra realizada con éxito', 'success');
      navigate(`/orders/${venta.id_venta}`);
    } catch (error) {
      showNotification('Error al procesar compra', 'error');
    }
  };

  if (estado.cargando) return <Spinner />;

  return (
    <div>
      <h2>Mi Carrito ({estado.cantidad_items} items)</h2>
      {estado.items.map(item => (
        <CartItem
          key={item.id_item}
          item={item}
          onUpdateQuantity={(q) => actualizarCantidad(item.id_item, q)}
          onRemove={() => eliminarItem(item.id_item)}
        />
      ))}
      <p>Total: Bs. {estado.total_carrito.toFixed(2)}</p>
      <button onClick={handleCheckout}>Finalizar Compra</button>
    </div>
  );
};
```

---

## Métricas de Performance

### Tamaños de Caché

| Contexto | localStorage | Memory Cache | Duración |
|----------|--------------|--------------|----------|
| **ProductContext** | ~500KB | Map + Set | 5 min |
| **OfertasGlobalContext** | ~100KB | Map + Set | 5 min |
| **FavoritosGlobalContext** | ~50KB | Map | 5 min |
| **ImageCache** | ~2MB | Map | 30 min |

### Re-renders Optimizados

- **Hook Granular** (`useFavoritoProducto`) reduce re-renders en 90%
- **Memoización** previene re-renders innecesarios en listas grandes
- **useCallback** mantiene referencias estables de funciones

---

## Ver También

- [Hooks Personalizados](HOOKS.md) - Hooks que consumen estos contextos
- [Servicios del Frontend](SERVICES.md) - Servicios usados por los contextos
- [Gestión de Estado](STATE_MANAGEMENT.md) - Patrones de estado global
- [Componentes](COMPONENTS.md) - Componentes que usan estos contextos

---

**Última actualización**: 7 de Octubre, 2025
**Versión**: 1.0
**Estado**: Completado

---

**[Volver arriba](#tabla-de-contenidos)** | **[Documentación](README.md)** | **[Inicio](../README.md)**
