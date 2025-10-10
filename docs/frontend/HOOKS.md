# Hooks Personalizados del Frontend

> Documentación completa de los 14 hooks personalizados de React en Tecnocel Web.

---

## Tabla de Contenidos

- [Introducción](#introducción)
- [Categorías de Hooks](#categorías-de-hooks)
- [Hooks Disponibles](#hooks-disponibles)
  - [Autenticación](#autenticación)
    - [useAutoLogout](#useautologout)
    - [useAuthActions](#useauthactions)
    - [useAuthForm](#useauthform)
  - [Carrito](#carrito)
    - [useCarrito](#usecarrito)
    - [useCarritoOperations](#usecarritooperations)
    - [useCarritoUtils](#usecarritoutils)
  - [Favoritos](#favoritos)
    - [useFavoritos](#usefavoritos)
    - [useFavoritosProductos](#usefavoritosproductos)
  - [Ofertas](#ofertas)
    - [useOfertas](#useofertas)
    - [useOfertasGlobal](#useofertasglobal)
    - [useOfertasPagination](#useofertaspagination)
  - [Productos](#productos)
    - [useProductActions](#useproductactions)
  - [Otros](#otros)
    - [useDirecciones](#usedirecciones)
    - [useEscapeKey](#useescapekey)
- [Patrones de Uso](#patrones-de-uso)
- [Mejores Prácticas](#mejores-prácticas)

---

## Introducción

Los **hooks personalizados** en Tecnocel Web encapsulan lógica reutilizable y compleja en funciones simples y componibles. Este documento describe los **14 hooks personalizados** implementados, organizados por funcionalidad.

### Características Principales

- **Reutilización de Lógica** - Encapsula lógica común en funciones reutilizables
- **Separación de Concerns** - Separa lógica de negocio de la presentación
- **TypeScript** - Tipado completo para mejor DX y seguridad
- **Optimización** - Uso de `useCallback`, `useMemo` y memoización
- **Testing Friendly** - Fácil de testear y mantener

---

## Categorías de Hooks

Los hooks están organizados en 5 categorías principales:

1. **Autenticación** (3 hooks) - Login, registro, auto-logout
2. **Carrito** (3 hooks) - Gestión del carrito de compras
3. **Favoritos** (2 hooks) - Sistema de favoritos
4. **Ofertas** (3 hooks) - Gestión de ofertas y productos en oferta
5. **Productos** (1 hook) - Acciones de productos
6. **Otros** (2 hooks) - Utilidades y funcionalidades diversas

---

## Hooks Disponibles

### Autenticación

#### useAutoLogout

**Ubicación**: `frontend/src/hooks/useAutoLogout.ts`

**Descripción**: Implementa auto-logout por inactividad del usuario.

**Interfaz**:

```typescript
interface UseAutoLogoutOptions {
  timeoutMinutes?: number;  // Default: 30
  enabled?: boolean;         // Default: true
  onLogout?: () => void;
}

interface UseAutoLogoutReturn {
  resetTimer: () => void;
  getTimeRemaining: () => number;
  isEnabled: boolean;
}
```

**Eventos Monitoreados**:
- `mousedown`, `mousemove`
- `keypress`
- `scroll`
- `touchstart`
- `click`, `focus`

**Ejemplo de Uso**:

```typescript
const MyApp = () => {
  const { resetTimer, getTimeRemaining, isEnabled } = useAutoLogout({
    timeoutMinutes: 15,
    enabled: true,
    onLogout: () => {
      console.log('Usuario desconectado por inactividad');
      navigate('/login');
    }
  });

  return (
    <div>
      {isEnabled && (
        <p>Tiempo restante: {Math.floor(getTimeRemaining() / 1000 / 60)} min</p>
      )}
    </div>
  );
};
```

**Características**:
- **Auto-limpieza** - Limpia listeners al desmontar
- **Detección de Actividad** - Múltiples eventos monitoreados
- **Configurable** - Timeout y eventos personalizables
- **Optimizado** - Usa `useCallback` y `useRef`

---

#### useAuthActions

**Ubicación**: `frontend/src/hooks/useAuthActions.ts`

**Descripción**: Proporciona acciones de autenticación con manejo de errores mejorado.

**Interfaz**:

```typescript
interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  nombre_cliente: string;
  apellido_cliente: string;
  email_cliente: string;
  contrasena: string;
  celular_cliente: string;
  nit_ci_cliente: string;
}

interface AuthActionResult {
  success: boolean;
  error?: string;
  data?: any;
}

interface UseAuthActionsReturn {
  handleLogin: (credentials: LoginCredentials) => Promise<AuthActionResult>;
  handleRegister: (data: RegisterData) => Promise<AuthActionResult>;
  handleGoogleLogin: (accessToken: string) => Promise<AuthActionResult>;
  handleLogout: () => AuthActionResult;
  clearError: () => void;
}
```

**Ejemplo de Uso**:

```typescript
const LoginForm = () => {
  const { handleLogin } = useAuthActions();

  const onSubmit = async (data: LoginCredentials) => {
    const result = await handleLogin(data);

    if (result.success) {
      console.log('Login exitoso');
      navigate('/dashboard');
    } else {
      console.error('Error:', result.error);
    }
  };

  return <form onSubmit={handleSubmit(onSubmit)}>...</form>;
};
```

**Características**:
- **Manejo de Errores** - Retorna `AuthActionResult` con éxito/error
- **Limpieza Automática** - Limpia errores antes de cada acción
- **Google OAuth** - Soporte completo para login con Google
- **Tipado Fuerte** - Interfaces claras para credenciales y datos

---

#### useAuthForm

**Ubicación**: `frontend/src/hooks/useAuthForm.ts`

**Descripción**: Hook genérico para manejar formularios de autenticación con validación.

**Interfaz**:

```typescript
interface FieldValidationConfig {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
}

interface ValidationConfig {
  [key: string]: FieldValidationConfig;
}

interface UseAuthFormReturn<T> {
  // Estado del formulario
  formData: T;
  errors: Record<string, string>;
  isLoading: boolean;
  touched: Record<string, boolean>;
  isValid: boolean;
  isPristine: boolean;

  // Métodos
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFieldBlur: (fieldName: string) => void;
  validateForm: () => boolean;
  resetForm: () => void;
  setIsLoading: (loading: boolean) => void;
  setFieldErrors: (errors: Record<string, string>) => void;
  getFieldError: (fieldName: string) => string;
  hasFieldError: (fieldName: string) => boolean;
  setFormData: (data: T) => void;
}
```

**Configuraciones de Validación Predefinidas**:

```typescript
export const authValidationConfigs = {
  login: {
    email_cliente: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    contrasena: {
      required: true,
      minLength: 6
    }
  },
  register: {
    nombre_cliente: {
      required: true,
      minLength: 2,
      maxLength: 50
    },
    apellido_cliente: {
      required: true,
      minLength: 2,
      maxLength: 50
    },
    email_cliente: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    contrasena: {
      required: true,
      minLength: 6,
      maxLength: 128
    },
    celular_cliente: {
      required: true,
      minLength: 7,
      maxLength: 15,
      pattern: /^[0-9+\-\s()]+$/
    },
    nit_ci_cliente: {
      required: true,
      minLength: 6,
      maxLength: 20
    }
  }
};
```

**Ejemplo de Uso**:

```typescript
const LoginForm = () => {
  const {
    formData,
    errors,
    isValid,
    handleInputChange,
    handleFieldBlur,
    validateForm,
    getFieldError
  } = useAuthForm(
    { email_cliente: '', contrasena: '' },
    authValidationConfigs.login
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Enviar formulario
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="email_cliente"
        value={formData.email_cliente}
        onChange={handleInputChange}
        onBlur={() => handleFieldBlur('email_cliente')}
      />
      {getFieldError('email_cliente') && (
        <span>{getFieldError('email_cliente')}</span>
      )}

      <input
        type="password"
        name="contrasena"
        value={formData.contrasena}
        onChange={handleInputChange}
        onBlur={() => handleFieldBlur('contrasena')}
      />
      {getFieldError('contrasena') && (
        <span>{getFieldError('contrasena')}</span>
      )}

      <button type="submit" disabled={!isValid}>Login</button>
    </form>
  );
};
```

**Características**:
- **Validación en Tiempo Real** - Valida mientras el usuario escribe
- **Validación Personalizada** - Función `custom` para reglas específicas
- **Estado de Touched** - Muestra errores solo después de interactuar
- **Reseteo Completo** - Restaura formulario a valores iniciales
- **Errores del Servidor** - Método `setFieldErrors` para errores del backend

---

### Carrito

#### useCarrito

**Ubicación**: `frontend/src/hooks/useCarrito.ts`

**Descripción**: Hook con utilidades básicas del carrito (cálculos, validaciones).

**Interfaz**:

```typescript
interface UseCarritoReturn {
  isProductInCart: (items: ItemCarritoCompleto[], id_producto: number) => boolean;
  getProductQuantityInCart: (items: ItemCarritoCompleto[], id_producto: number) => number;
  canAddMoreOfProduct: (items: ItemCarritoCompleto[], id_producto: number, stock: number) => boolean;
  calculateTotal: (items: ItemCarritoCompleto[]) => number;
  calculateTotalItems: (items: ItemCarritoCompleto[]) => number;
  validateCarritoOperation: () => { isValid: boolean; error?: string };
  handleCarritoError: (error: unknown) => string;
  prepareCompraData: (datosCompra: DatosCompra) => any;
  validateQuantity: (cantidad: number, stock: number) => { isValid: boolean; error?: string };
}
```

**Ejemplo de Uso**:

```typescript
const CartSummary = ({ items }) => {
  const {
    calculateTotal,
    calculateTotalItems,
    isProductInCart
  } = useCarrito();

  const total = calculateTotal(items);
  const itemCount = calculateTotalItems(items);
  const hasProduct = isProductInCart(items, 123);

  return (
    <div>
      <p>Items: {itemCount}</p>
      <p>Total: Bs. {total.toFixed(2)}</p>
      <p>Producto 123: {hasProduct ? 'En carrito' : 'No en carrito'}</p>
    </div>
  );
};
```

**Características**:
- **Funciones Puras** - No modifica estado, solo calcula
- **Validaciones** - Verifica autenticación, stock y cantidad
- **Manejo de Errores** - Procesa errores de API con mensajes claros
- **Memoización** - Todas las funciones están memoizadas

---

#### useCarritoOperations

**Ubicación**: `frontend/src/hooks/useCarritoOperations.ts`

**Descripción**: Hook con operaciones del carrito (agregar, actualizar, eliminar, confirmar compra).

**Interfaz**:

```typescript
interface UseCarritoOperationsReturn {
  obtenerCarrito: () => Promise<any>;
  agregarItem: (id_producto: number, cantidad: number, stock?: number) => Promise<any>;
  actualizarCantidad: (id_item: number, cantidad: number, stock?: number) => Promise<any>;
  eliminarItem: (id_item: number) => Promise<any>;
  vaciarCarrito: () => Promise<string>;
  confirmarCompra: (datosCompra: DatosCompra) => Promise<VentaConfirmada>;
  sincronizarCarrito: () => Promise<any>;
}
```

**Ejemplo de Uso**:

```typescript
const ProductCard = ({ product }) => {
  const { agregarItem } = useCarritoOperations();
  const { showNotification } = useNotification();

  const handleAddToCart = async () => {
    try {
      const result = await agregarItem(product.id_producto, 1, product.stock);
      showNotification('Producto agregado al carrito', 'success');
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  return (
    <button onClick={handleAddToCart}>Agregar al Carrito</button>
  );
};

const CheckoutPage = () => {
  const { confirmarCompra } = useCarritoOperations();

  const handleCheckout = async (datosCompra: DatosCompra) => {
    try {
      const venta = await confirmarCompra(datosCompra);
      console.log('Compra confirmada:', venta);
      navigate(`/orders/${venta.id_venta}`);
    } catch (error) {
      console.error('Error:', error.message);
    }
  };

  return <CheckoutForm onSubmit={handleCheckout} />;
};
```

**Características**:
- **Operaciones Completas** - CRUD completo del carrito
- **Validación Automática** - Valida autenticación y stock antes de operar
- **Manejo de Errores** - Convierte errores de API en mensajes legibles
- **Checkout Completo** - Método `confirmarCompra` para finalizar venta

---

#### useCarritoUtils

**Ubicación**: `frontend/src/hooks/useCarritoUtils.ts`

**Descripción**: Hook con utilidades adicionales para el carrito.

**Interfaz**:

```typescript
interface UseCarritoUtilsReturn {
  calcularTotal: (items: ItemCarritoCompleto[]) => number;
  calcularCantidadItems: (items: ItemCarritoCompleto[]) => number;
  calcularCantidadProductos: (items: ItemCarritoCompleto[]) => number;
  estaVacio: (items: ItemCarritoCompleto[]) => boolean;
  tieneItems: (items: ItemCarritoCompleto[]) => boolean;
  verificarStockDisponible: (items: ItemCarritoCompleto[]) => {
    disponible: boolean;
    productosSinStock: ItemCarritoCompleto[];
  };
}
```

**Ejemplo de Uso**:

```typescript
const CartValidation = ({ items }) => {
  const {
    estaVacio,
    verificarStockDisponible,
    calcularCantidadProductos
  } = useCarritoUtils();

  const isEmpty = estaVacio(items);
  const { disponible, productosSinStock } = verificarStockDisponible(items);
  const totalProductos = calcularCantidadProductos(items);

  if (isEmpty) {
    return <p>El carrito está vacío</p>;
  }

  return (
    <div>
      <p>Total de productos: {totalProductos}</p>
      {!disponible && (
        <div>
          <p>Productos sin stock:</p>
          <ul>
            {productosSinStock.map(item => (
              <li key={item.id_item}>{item.producto?.nombre}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
```

**Características**:
- **Cálculos Útiles** - Totales, cantidades y validaciones
- **Verificación de Stock** - Detecta productos sin stock disponible
- **Estados del Carrito** - Verifica si está vacío o tiene items

---

### Favoritos

#### useFavoritos

**Ubicación**: `frontend/src/hooks/useFavoritos.ts`

**Descripción**: Wrapper del contexto global de favoritos para mantener compatibilidad.

**Interfaz**:

```typescript
interface UseFavoritosReturn {
  // API original (compatibilidad)
  favoritos: number[];
  loading: boolean;
  isFavorito: (productId: number) => boolean;
  toggleFavorito: (productId: number) => Promise<boolean>;
  loadFavoritos: () => Promise<void>;

  // Nuevas funcionalidades
  favoritosCompletos: Favorito[];
  error: string | null;
  addFavorito: (productId: number) => Promise<boolean>;
  removeFavorito: (productId: number) => Promise<boolean>;
  refreshFavoritos: () => Promise<void>;
  clearFavoritos: () => void;
  getFavoritosCount: () => number;
  getFavoritosIds: () => number[];
  getFavoritosCompletos: () => Favorito[];
}
```

**Ejemplo de Uso**:

```typescript
const FavoriteButton = ({ productId }) => {
  const { isFavorito, toggleFavorito, loading } = useFavoritos();

  const handleToggle = async () => {
    const success = await toggleFavorito(productId);
    if (success) {
      console.log('Favorito actualizado');
    }
  };

  return (
    <button onClick={handleToggle} disabled={loading}>
      {isFavorito(productId) ? '❤️' : '🤍'}
    </button>
  );
};
```

**Características**:
- **Retrocompatibilidad** - Mantiene API original
- **Funcionalidades Extendidas** - Acceso a nuevas funciones del contexto
- **Wrapper del Contexto** - Simplifica acceso a `FavoritosGlobalContext`

---

#### useFavoritosProductos

**Ubicación**: `frontend/src/hooks/useFavoritosProductos.ts`

**Descripción**: Hook para cargar y gestionar productos favoritos con paginación.

**Interfaz**:

```typescript
interface UseFavoritosProductosReturn {
  productos: FavoritoProduct[];
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    pages: number;
  };
  loadMore: () => void;
  hasMore: boolean;
  removeFromFavoritos: (productId: number) => Promise<boolean>;
  refresh: () => void;
}
```

**Ejemplo de Uso**:

```typescript
const FavoritesPage = () => {
  const {
    productos,
    loading,
    hasMore,
    loadMore,
    removeFromFavoritos
  } = useFavoritosProductos(20);

  const handleRemove = async (productId: number) => {
    const success = await removeFromFavoritos(productId);
    if (success) {
      console.log('Producto removido de favoritos');
    }
  };

  return (
    <div>
      <ProductGrid products={productos} onRemove={handleRemove} />
      {hasMore && (
        <button onClick={loadMore} disabled={loading}>
          Cargar más
        </button>
      )}
    </div>
  );
};
```

**Características**:
- **Paginación** - Carga productos en lotes
- **Sincronización** - Se sincroniza con el contexto global
- **Optimización** - Solo carga productos cuando es necesario
- **Estado Local** - Gestiona su propio estado de productos

---

### Ofertas

#### useOfertas

**Ubicación**: `frontend/src/hooks/useOfertas.ts`

**Descripción**: Hook para cargar ofertas activas y productos en oferta con paginación.

**Interfaz**:

```typescript
interface UseOfertasReturn {
  ofertas: Oferta[];
  productosEnOferta: Product[];
  loading: boolean;
  error: string | null;
  totalProductos: number;
  paginaActual: number;
  totalPaginas: number;
  cargarMasProductos: () => void;
  hayMasProductos: boolean;
  refetch: () => void;
}
```

**Ejemplo de Uso**:

```typescript
const OffersPage = () => {
  const {
    ofertas,
    productosEnOferta,
    loading,
    hayMasProductos,
    cargarMasProductos,
    paginaActual,
    totalPaginas
  } = useOfertas();

  return (
    <div>
      <h2>Ofertas Activas</h2>
      <OfferList offers={ofertas} />

      <h2>Productos en Oferta</h2>
      <ProductGrid products={productosEnOferta} />

      {hayMasProductos && (
        <button onClick={cargarMasProductos} disabled={loading}>
          Cargar más ({paginaActual}/{totalPaginas})
        </button>
      )}
    </div>
  );
};
```

**Características**:
- **Doble Carga** - Carga ofertas y productos simultáneamente
- **Paginación Automática** - Gestiona paginación de productos
- **Estado de Carga** - Indica cuando está cargando datos
- **Refetch** - Método para recargar ofertas

---

#### useOfertasGlobal

**Ubicación**: `frontend/src/hooks/useOfertasGlobal.ts`

**Descripción**: Hook wrapper del contexto global de ofertas con métodos optimizados.

**Interfaz**:

```typescript
interface UseOfertasGlobalReturn {
  // Estado
  ofertas: Oferta[];
  productosEnOferta: Product[];
  ofertasActivas: Oferta[];
  ofertasExpiradas: Oferta[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;

  // Métodos principales
  getOfertaInfo: (productId: number) => OfertaConProductos | null;
  isProductoEnOferta: (productId: number) => boolean;
  getOfertasActivas: () => Oferta[];
  getOfertasExpiradas: () => Oferta[];
  getProductosPorOferta: (ofertaId: number) => Product[];
  getOfertaById: (id: number) => Oferta | undefined;
  calculateTimeRemaining: (oferta: Oferta) => string;
  isOfertaActive: (oferta: Oferta) => boolean;

  // Métodos de gestión
  loadOfertas: () => Promise<void>;
  refreshOfertas: () => Promise<void>;
  clearOfertas: () => void;

  // Métodos de utilidad
  getOfertasCount: () => number;
  getProductosEnOfertaCount: () => number;

  // Métodos de caché
  isCacheValid: () => boolean;
  invalidateCache: () => void;

  // Nuevos métodos del servicio
  getEstadisticas: () => Promise<any>;
  buscarOfertas: (criterios: any) => Promise<any>;
  getOfertasProximasAExpirar: (dias: number) => Promise<any>;
  verificarProductoEnOferta: (productId: number) => Promise<any>;
}
```

**Hook Especializado: `useOfertasProducto(productId)`**

```typescript
interface UseOfertasProductoReturn {
  isProductoEnOferta: () => boolean;
  getOfertaInfo: () => OfertaConProductos | null;
}

// Uso
const ProductCard = ({ productId }) => {
  const { isProductoEnOferta, getOfertaInfo } = useOfertasProducto(productId);

  const isOnOffer = isProductoEnOferta();
  const offerInfo = getOfertaInfo();

  return (
    <div>
      {isOnOffer && (
        <OfferBadge info={offerInfo} />
      )}
    </div>
  );
};
```

**Ejemplo de Uso**:

```typescript
const OfferDetails = ({ offerId }) => {
  const {
    getOfertaById,
    getProductosPorOferta,
    calculateTimeRemaining,
    isOfertaActive
  } = useOfertasGlobal();

  const oferta = getOfertaById(offerId);
  const productos = getProductosPorOferta(offerId);

  if (!oferta) return <NotFound />;

  const timeRemaining = calculateTimeRemaining(oferta);
  const isActive = isOfertaActive(oferta);

  return (
    <div>
      <h2>{oferta.nombre_oferta}</h2>
      <p>Estado: {isActive ? 'Activa' : 'Expirada'}</p>
      <p>Tiempo restante: {timeRemaining}</p>
      <ProductGrid products={productos} />
    </div>
  );
};
```

**Características**:
- **Acceso Simplificado** - Wrapper del contexto con métodos optimizados
- **Hook Granular** - `useOfertasProducto` para un producto específico
- **Métodos Avanzados** - Estadísticas, búsqueda, próximas a expirar
- **Caché Inteligente** - Gestión de caché con validación

---

#### useOfertasPagination

**Ubicación**: `frontend/src/hooks/useOfertasPagination.ts`

**Descripción**: Hook especializado para paginación de ofertas.

**Interfaz**:

```typescript
interface UseOfertasPaginationOptions {
  itemsPerPage?: number;     // Default: 20
  initialPage?: number;       // Default: 1
}

interface UseOfertasPaginationReturn {
  // Datos del contexto global
  ofertas: any[];
  productosEnOferta: any[];
  loading: boolean;
  error: string | null;

  // Datos de paginación
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;

  // Métodos de paginación
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  loadMore: () => Promise<void>;

  // Métodos del contexto global
  refreshOfertas: () => Promise<void>;
  getOfertasCount: () => number;
  getProductosEnOfertaCount: () => number;
}
```

**Ejemplo de Uso**:

```typescript
const OffersWithPagination = () => {
  const {
    productosEnOferta,
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
    goToPage
  } = useOfertasPagination({ itemsPerPage: 12, initialPage: 1 });

  return (
    <div>
      <ProductGrid products={productosEnOferta} />

      <div className="pagination">
        <button onClick={previousPage} disabled={!hasPreviousPage}>
          Anterior
        </button>

        <span>Página {currentPage} de {totalPages}</span>

        <button onClick={nextPage} disabled={!hasNextPage}>
          Siguiente
        </button>
      </div>
    </div>
  );
};
```

**Características**:
- **Paginación Completa** - Navegación entre páginas
- **Estado de Paginación** - Página actual, total, siguiente/anterior
- **Integración con Contexto** - Usa el contexto global de ofertas
- **Configurable** - Items por página y página inicial

---

### Productos

#### useProductActions

**Ubicación**: `frontend/src/hooks/useProductActions.ts`

**Descripción**: Hook que proporciona una API limpia para interactuar con el ProductContext.

**Interfaz**:

```typescript
interface UseProductActionsReturn {
  // Estado del contexto
  products: Product[];
  featuredProducts: Product[];
  currentProduct: Product | null;
  productsLoading: boolean;
  productsError: string | null;
  categories: Category[];
  selectedCategory: Category | null;
  brands: Marca[];
  selectedBrand: Marca | null;
  filters: ProductFilters;
  searchQuery: string;
  filteredProducts: Product[];
  pagination: Pagination;

  // Acciones de productos
  loadProducts: (filters?: ProductFilters, page?: number) => Promise<void>;
  loadProduct: (id: number) => Promise<void>;
  loadFeaturedProducts: (limit?: number) => Promise<void>;

  // Acciones de categorías
  loadCategories: () => Promise<void>;
  selectCategory: (category: Category | null) => void;
  getCategoryById: (id: number) => Category | undefined;
  getCategoryByName: (name: string) => Category | undefined;

  // Acciones de marcas
  loadBrands: () => Promise<void>;
  selectBrand: (brand: Marca | null) => void;
  getBrandById: (id: number) => Marca | undefined;
  getBrandByName: (name: string) => Marca | undefined;

  // Acciones de filtros
  updateFilters: (filters: Partial<ProductFilters>) => void;
  applyFilters: () => void;
  clearFilters: () => void;
  setCategoryFilter: (categoryId?: number) => void;
  setBrandFilter: (brandId?: number) => void;
  setMinPriceFilter: (price?: number) => void;
  setMaxPriceFilter: (price?: number) => void;
  setStockFilter: (onlyInStock: boolean) => void;
  setOffersFilter: (onlyOffers: boolean) => void;
  setFeaturedFilter: (onlyFeatured: boolean) => void;

  // Acciones de búsqueda
  updateSearch: (query: string) => void;
  clearSearch: () => void;
  search: (query: string) => void;

  // Acciones de paginación
  goToPage: (page: number) => void;
  setPageLimit: (limit: number) => void;
  loadMore: () => Promise<void>;
  goToFirstPage: () => void;
  goToPreviousPage: () => void;
  goToNextPage: () => void;

  // Acciones de caché
  getCachedData: (key: string) => any | null;
  setCachedData: (key: string, data: any) => void;
  clearCache: (key?: string) => void;
  clearProductState: () => void;
  forceClearProductState: () => void;

  // Utilidades
  isLoading: () => boolean;
  hasErrors: () => boolean;
  getErrors: () => { products: string | null; categories: string | null; brands: string | null };
  getProductsByCategory: (categoryId: number) => Product[];
  getProductsByBrand: (brandId: number) => Product[];
  getProductsOnSale: () => Product[];
  getFeaturedProducts: () => Product[];
  getProductsInStock: () => Product[];
  getProductsByPriceRange: (minPrice: number, maxPrice: number) => Product[];
  getStats: () => { totalProducts: number; totalCategories: number; ... };
}
```

**Ejemplo de Uso**:

```typescript
const ProductCatalog = () => {
  const {
    products,
    loadProducts,
    updateFilters,
    loadCategories,
    categories,
    setCategoryFilter,
    setStockFilter,
    clearFilters,
    isLoading
  } = useProductActions();

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  const handleCategoryChange = (categoryId: number) => {
    setCategoryFilter(categoryId);
    loadProducts();
  };

  const handleStockFilter = (onlyInStock: boolean) => {
    setStockFilter(onlyInStock);
    loadProducts();
  };

  return (
    <div>
      <CategoryFilter
        categories={categories}
        onChange={handleCategoryChange}
      />

      <Checkbox
        label="Solo con stock"
        onChange={handleStockFilter}
      />

      <button onClick={clearFilters}>Limpiar Filtros</button>

      {isLoading() ? (
        <LoadingSpinner />
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
};
```

**Características**:
- **API Completa** - Acceso a todas las funcionalidades de productos
- **Métodos Específicos** - Filtros dedicados para cada tipo
- **Navegación de Páginas** - Métodos convenientes para paginación
- **Utilidades Integradas** - Métodos para obtener productos filtrados
- **Estado Consolidado** - Un solo hook para todo lo relacionado con productos

---

### Otros

#### useDirecciones

**Ubicación**: `frontend/src/hooks/useDirecciones.ts`

**Descripción**: Hook para gestionar direcciones del cliente.

**Interfaz**:

```typescript
interface CreateDireccionData {
  departamento: string;
  provincia: string;
  municipio: string;
  zona_barrio: string;
  calle_avenida: string;
  numero_puerta: string;
  referencia?: string;
  es_principal?: boolean;
}

interface UseDireccionesReturn {
  direcciones: Direccion[];
  loading: boolean;
  error: string | null;
  createDireccion: (data: CreateDireccionData) => Promise<void>;
  updateDireccion: (id: number, data: Partial<CreateDireccionData>) => Promise<void>;
  deleteDireccion: (id: number) => Promise<void>;
  refetch: () => Promise<void>;
}
```

**Ejemplo de Uso**:

```typescript
const AddressManager = () => {
  const {
    direcciones,
    loading,
    createDireccion,
    updateDireccion,
    deleteDireccion
  } = useDirecciones();

  const handleCreate = async (data: CreateDireccionData) => {
    try {
      await createDireccion(data);
      console.log('Dirección creada');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleUpdate = async (id: number, data: Partial<CreateDireccionData>) => {
    try {
      await updateDireccion(id, data);
      console.log('Dirección actualizada');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteDireccion(id);
      console.log('Dirección eliminada');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <AddressList
          addresses={direcciones}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}

      <AddressForm onSubmit={handleCreate} />
    </div>
  );
};
```

**Características**:
- **CRUD Completo** - Crear, leer, actualizar y eliminar direcciones
- **Auto-carga** - Carga direcciones automáticamente al autenticar
- **Refetch** - Método para recargar direcciones manualmente
- **Manejo de Errores** - Captura y reporta errores de la API

---

#### useEscapeKey

**Ubicación**: `frontend/src/hooks/useEscapeKey.ts`

**Descripción**: Hook simple para detectar cuando se presiona la tecla ESC.

**Interfaz**:

```typescript
useEscapeKey(onEscape: () => void): void
```

**Ejemplo de Uso**:

```typescript
const Modal = ({ isOpen, onClose }) => {
  useEscapeKey(onClose);

  if (!isOpen) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <button onClick={onClose}>Cerrar</button>
        <p>Presiona ESC para cerrar</p>
      </div>
    </div>
  );
};

const SearchBar = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEscapeKey(() => {
    if (isOpen) {
      setIsOpen(false);
    }
  });

  return (
    <div>
      <input
        onFocus={() => setIsOpen(true)}
        placeholder="Buscar..."
      />
      {isOpen && <SearchResults />}
    </div>
  );
};
```

**Características**:
- **Simple y Directo** - Un solo propósito bien definido
- **Auto-limpieza** - Limpia event listener al desmontar
- **Reutilizable** - Puede usarse en múltiples componentes
- **Sin Dependencias** - Solo usa React hooks nativos

---

## Patrones de Uso

### Patrón 1: Hook + Contexto

Muchos hooks son wrappers de contextos para simplificar el acceso:

```typescript
// Hook wrapper
export const useFavoritos = () => {
  const context = useFavoritosGlobal();

  return {
    // API simplificada
    favoritos: context.getFavoritosIds(),
    toggleFavorito: context.toggleFavorito,
    loading: context.loading
  };
};

// Uso en componente
const Component = () => {
  const { favoritos, toggleFavorito } = useFavoritos();
  // ...
};
```

### Patrón 2: Hook de Operaciones

Hooks que encapsulan operaciones complejas con validación y manejo de errores:

```typescript
export const useCarritoOperations = () => {
  const { validateCarritoOperation, handleCarritoError } = useCarrito();

  const agregarItem = async (id_producto, cantidad) => {
    const validation = validateCarritoOperation();
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    try {
      const response = await CarritoService.agregarItem(id_producto, cantidad);
      return response;
    } catch (error) {
      const mensajeError = handleCarritoError(error);
      throw new Error(mensajeError);
    }
  };

  return { agregarItem, ... };
};
```

### Patrón 3: Hook de Utilidades

Hooks con funciones puras para cálculos y transformaciones:

```typescript
export const useCarritoUtils = () => {
  const calcularTotal = useCallback((items) => {
    return items.reduce((total, item) => total + item.subtotal, 0);
  }, []);

  const estaVacio = useCallback((items) => {
    return items.length === 0;
  }, []);

  return { calcularTotal, estaVacio, ... };
};
```

### Patrón 4: Hook de Formulario

Hook genérico con validación integrada:

```typescript
export const useAuthForm = <T>(initialValues: T, validationConfig) => {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});

  const validateField = (fieldName, value) => {
    // Lógica de validación
  };

  const validateForm = () => {
    // Validar todo el formulario
  };

  return {
    formData,
    errors,
    handleInputChange,
    validateForm,
    ...
  };
};
```

---

## Mejores Prácticas

### 1. Memoización

Usa `useCallback` y `useMemo` para optimizar:

```typescript
const myHook = () => {
  const expensiveCalculation = useMemo(() => {
    return heavyComputation();
  }, [dependencies]);

  const stableFunction = useCallback(() => {
    // Función que no cambia
  }, [dependencies]);

  return { expensiveCalculation, stableFunction };
};
```

### 2. Separación de Responsabilidades

Divide hooks grandes en hooks más pequeños y especializados:

```typescript
// ❌ MAL - Hook monolítico
const useEverything = () => {
  // Muchas responsabilidades mezcladas
};

// ✅ BIEN - Hooks especializados
const useCarrito = () => { /* Utilidades */ };
const useCarritoOperations = () => { /* Operaciones CRUD */ };
const useCarritoUtils = () => { /* Cálculos */ };
```

### 3. Manejo de Errores Consistente

Retorna objetos con `success`/`error` o lanza excepciones:

```typescript
// Opción 1: Retornar resultado
const result = await handleLogin(credentials);
if (!result.success) {
  console.error(result.error);
}

// Opción 2: Lanzar excepción
try {
  await agregarItem(productId, cantidad);
} catch (error) {
  console.error(error.message);
}
```

### 4. TypeScript

Siempre tipar hooks y sus retornos:

```typescript
interface UseMyHookReturn {
  data: Data[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useMyHook = (): UseMyHookReturn => {
  // ...
};
```

### 5. Composición de Hooks

Combina hooks para crear funcionalidades complejas:

```typescript
const useCheckout = () => {
  const { confirmarCompra } = useCarritoOperations();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const handleCheckout = async (datosCompra) => {
    if (!user) {
      showNotification('Debe iniciar sesión', 'warning');
      navigate('/login');
      return;
    }

    try {
      const venta = await confirmarCompra(datosCompra);
      showNotification('Compra exitosa', 'success');
      navigate(`/orders/${venta.id_venta}`);
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  return { handleCheckout };
};
```

---

## Ver También

- [Contextos del Frontend](CONTEXTS.md) - Contextos usados por estos hooks
- [Servicios del Frontend](SERVICES.md) - Servicios llamados por los hooks
- [Componentes](COMPONENTS.md) - Componentes que usan estos hooks
- [Gestión de Estado](STATE_MANAGEMENT.md) - Arquitectura de estado global

---

**Última actualización**: 7 de Octubre, 2025
**Versión**: 1.0
**Estado**: Completado

---

**[Volver arriba](#tabla-de-contenidos)** | **[Documentación](README.md)** | **[Inicio](../README.md)**
