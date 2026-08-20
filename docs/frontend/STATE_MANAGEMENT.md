# Gestión de Estado

> Documentación del sistema de gestión de estado de la aplicación usando Context API, hooks personalizados y patrones de estado local.

---

## Tabla de Contenidos

- [Introducción](#introducción)
- [Arquitectura de Estado](#arquitectura-de-estado)
- [Context API](#context-api)
- [Estado Local vs Global](#estado-local-vs-global)
- [Hooks Personalizados](#hooks-personalizados)
- [Patrones de Estado](#patrones-de-estado)
- [Optimización de Rendimiento](#optimización-de-rendimiento)
- [Sincronización con Backend](#sincronización-con-backend)
- [Mejores Prácticas](#mejores-prácticas)

---

## Introducción

Tecnocel Web utiliza un sistema de gestión de estado basado en **React Context API** combinado con **hooks personalizados** para manejar el estado de la aplicación de forma escalable y mantenible.

### Tecnologías Utilizadas

- **Context API** - Estado global compartido
- **useState** - Estado local de componentes
- **useReducer** - Estado complejo con lógica
- **Custom Hooks** - Lógica de estado reutilizable
- **localStorage** - Persistencia de estado
- **TypeScript** - Type-safe state management

---

## Arquitectura de Estado

### Capas de Estado

```
┌─────────────────────────────────────┐
│     Componentes (UI Layer)          │
├─────────────────────────────────────┤
│   Custom Hooks (Logic Layer)        │
├─────────────────────────────────────┤
│   Contexts (Global State)           │
├─────────────────────────────────────┤
│   Services (API Layer)              │
├─────────────────────────────────────┤
│   Backend API                       │
└─────────────────────────────────────┘
```

### Estructura de Contextos

```
frontend/src/contexts/
├── AuthContext.tsx              # Autenticación
├── CarritoContext.tsx           # Carrito de compras
├── FavoritosGlobalContext.tsx   # Favoritos globales
├── OfertasGlobalContext.tsx     # Ofertas globales
├── ProductContext.tsx           # Productos
├── SearchContext.tsx            # Búsqueda
├── ThemeContext.tsx             # Tema
└── NotificationContext.tsx      # Notificaciones
```

---

## Context API

### Patrón de Implementación

Todos los contextos siguen un patrón consistente:

```tsx
// ExampleContext.tsx

// 1. Tipos
interface ExampleContextType {
  state: ExampleState;
  actions: ExampleActions;
}

// 2. Creación del contexto
const ExampleContext = createContext<ExampleContextType | undefined>(undefined);

// 3. Hook personalizado
export const useExample = () => {
  const context = useContext(ExampleContext);
  if (!context) {
    throw new Error('useExample debe usarse dentro de ExampleProvider');
  }
  return context;
};

// 4. Provider
export const ExampleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ExampleState>(initialState);

  // Lógica y acciones

  const value = useMemo(() => ({
    state,
    actions
  }), [state]);

  return (
    <ExampleContext.Provider value={value}>
      {children}
    </ExampleContext.Provider>
  );
};
```

### Contextos Principales

#### AuthContext

Maneja la autenticación del usuario:

```tsx
const { user, isAuthenticated, login, logout, register } = useAuth();
```

**Estado**:
- `user`: Usuario autenticado
- `isAuthenticated`: Estado de autenticación
- `isLoading`: Cargando datos

**Acciones**:
- `login()`: Iniciar sesión
- `logout()`: Cerrar sesión
- `register()`: Registrar usuario
- `updateProfile()`: Actualizar perfil

#### CarritoContext

Gestiona el carrito de compras:

```tsx
const { estado, agregarItem, eliminarItem, actualizarCantidad, vaciarCarrito } = useCarrito();
```

**Estado**:
- `items`: Items del carrito
- `total`: Total del carrito
- `loading`: Estado de carga

**Acciones**:
- `agregarItem()`: Añadir producto
- `eliminarItem()`: Remover producto
- `actualizarCantidad()`: Cambiar cantidad
- `vaciarCarrito()`: Limpiar carrito

#### ProductContext

Centraliza el estado de productos:

```tsx
const { products, loading, fetchProducts, searchProducts } = useProducts();
```

**Estado**:
- `products`: Lista de productos
- `loading`: Estado de carga
- `error`: Errores

**Acciones**:
- `fetchProducts()`: Cargar productos
- `searchProducts()`: Buscar productos
- `filterProducts()`: Filtrar productos

---

## Estado Local vs Global

### Cuándo Usar Estado Local

Estado que solo afecta a un componente específico:

```tsx
const Component = () => {
  //  Estado local
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({});
  const [selectedTab, setSelectedTab] = useState(0);

  return <div>{/* ... */}</div>;
};
```

**Casos de uso**:
- Visibilidad de modales
- Valores de formularios
- Estados de UI (hover, focus)
- Tabs/accordion activos

### Cuándo Usar Estado Global

Estado que necesita ser compartido entre múltiples componentes:

```tsx
// Estado global
const { user, isAuthenticated } = useAuth();
const { items, total } = useCarrito();
const { theme, toggleTheme } = useTheme();
```

**Casos de uso**:
- Autenticación de usuario
- Carrito de compras
- Configuración global (tema, idioma)
- Datos compartidos (productos, ofertas)

---

## Hooks Personalizados

### Patrón de Custom Hook

```tsx
// useProductActions.ts
export const useProductActions = () => {
  const { addNotification } = useNotification();
  const { agregarItem } = useCarrito();
  const { agregarFavorito, eliminarFavorito } = useFavoritos();

  const handleAddToCart = useCallback(async (producto: Producto) => {
    try {
      await agregarItem(producto);
      addNotification({
        type: 'success',
        message: 'Producto agregado al carrito'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: 'Error al agregar producto'
      });
    }
  }, [agregarItem, addNotification]);

  const handleToggleFavorite = useCallback(async (productoId: number) => {
    // Lógica de favorito
  }, [agregarFavorito, eliminarFavorito]);

  return {
    handleAddToCart,
    handleToggleFavorite
  };
};
```

### Hooks de Estado del Proyecto

#### useAutoLogout

Maneja auto-logout por inactividad:

```tsx
useAutoLogout({
  timeoutMinutes: 30,
  enabled: true,
  onLogout: () => console.log('Usuario desconectado')
});
```

#### useCarritoOperations

Operaciones del carrito con manejo de errores:

```tsx
const {
  agregarProducto,
  eliminarProducto,
  actualizarCantidad,
  isLoading
} = useCarritoOperations();
```

#### useFavoritos

Gestión de productos favoritos:

```tsx
const {
  favoritos,
  esFavorito,
  agregarFavorito,
  eliminarFavorito
} = useFavoritos();
```

---

## Patrones de Estado

### 1. Estado con useReducer

Para estado complejo con múltiples acciones:

```tsx
type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PRODUCTS'; payload: Producto[] }
  | { type: 'SET_ERROR'; payload: string };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload, loading: false };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};

const Component = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const fetchProducts = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const products = await api.getProducts();
      dispatch({ type: 'SET_PRODUCTS', payload: products });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };
};
```

### 2. Estado Derivado

Calcular estado basado en otros estados:

```tsx
const Component = () => {
  const { items } = useCarrito();

  // Estado derivado (memoizado)
  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  }, [items]);

  const itemCount = useMemo(() => {
    return items.reduce((count, item) => count + item.cantidad, 0);
  }, [items]);

  return (
    <div>
      <p>Items: {itemCount}</p>
      <p>Total: ${total}</p>
    </div>
  );
};
```

### 3. Estado Síncrono

Sincronizar estado entre tabs/ventanas:

```tsx
useEffect(() => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'cart') {
      const newCart = JSON.parse(e.newValue || '[]');
      setState(newCart);
    }
  };

  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);
```

### 4. Estado Optimista

Actualizar UI antes de confirmar con backend:

```tsx
const handleLike = async (productId: number) => {
  // Actualización optimista
  setLiked(true);
  setLikeCount(prev => prev + 1);

  try {
    await api.likeProduct(productId);
  } catch (error) {
    // Revertir en caso de error
    setLiked(false);
    setLikeCount(prev => prev - 1);
    showError('Error al dar like');
  }
};
```

---

## Optimización de Rendimiento

### 1. Memoización de Valores

```tsx
const Component = () => {
  const { items } = useCarrito();

  //  Memoizado - solo recalcula cuando items cambia
  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
  }, [items]);

  //  Sin memoizar - recalcula en cada render
  const totalBad = items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
};
```

### 2. Memoización de Callbacks

```tsx
const Component = () => {
  const { addNotification } = useNotification();

  //  Memoizado - misma referencia
  const handleClick = useCallback(() => {
    addNotification({ type: 'success', message: 'Clicked' });
  }, [addNotification]);

  //  Sin memoizar - nueva función en cada render
  const handleClickBad = () => {
    addNotification({ type: 'success', message: 'Clicked' });
  };

  return <Button onClick={handleClick} />;
};
```

### 3. División de Contextos

Dividir contextos grandes en contextos más pequeños:

```tsx
// Malo - un contexto gigante
const AppContext = {
  user,
  cart,
  products,
  theme,
  notifications
};

// Bueno - contextos separados
<AuthProvider>
  <CarritoProvider>
    <ThemeProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </ThemeProvider>
  </CarritoProvider>
</AuthProvider>
```

### 4. Selectores de Estado

Extraer solo el estado necesario:

```tsx
// Malo - componente se re-renderiza cuando cambia cualquier parte del estado
const Component = () => {
  const allState = useCarrito();
  return <div>{allState.items.length}</div>;
};

// Bueno - solo se re-renderiza cuando cambia items
const Component = () => {
  const { items } = useCarrito();
  return <div>{items.length}</div>;
};
```

---

## Sincronización con Backend

### Patrón de Fetch con Estado

```tsx
const Component = () => {
  const [data, setData] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await productService.getAll();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return <ProductList products={data} />;
};
```

### Actualización Automática

```tsx
const Component = () => {
  const { items } = useCarrito();

  // Sincronizar con backend cada vez que cambia el carrito
  useEffect(() => {
    const syncCart = async () => {
      try {
        await carritoService.sync(items);
      } catch (error) {
        console.error('Error al sincronizar carrito:', error);
      }
    };

    if (items.length > 0) {
      syncCart();
    }
  }, [items]);
};
```

### Polling

```tsx
const Component = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const pollData = async () => {
      const result = await api.fetchData();
      setData(result);
    };

    // Poll cada 30 segundos
    const interval = setInterval(pollData, 30000);

    // Fetch inicial
    pollData();

    return () => clearInterval(interval);
  }, []);
};
```

---

## Mejores Prácticas

### 1. Inicialización de Estado

```tsx
// Bueno - función de inicialización
const [state, setState] = useState(() => {
  const saved = localStorage.getItem('key');
  return saved ? JSON.parse(saved) : defaultValue;
});

// Malo - se ejecuta en cada render
const [state, setState] = useState(
  JSON.parse(localStorage.getItem('key') || 'null') || defaultValue
);
```

### 2. Actualización de Estado

```tsx
// Bueno - usar función para actualizar basado en estado anterior
setCount(prevCount => prevCount + 1);

// Malo - puede tener race conditions
setCount(count + 1);
```

### 3. Evitar Estado Redundante

```tsx
// Malo - estado derivado innecesario
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const [fullName, setFullName] = useState('');

// Bueno - calcular fullName cuando se necesita
const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const fullName = `${firstName} ${lastName}`;
```

### 4. Normalizar Estado

```tsx
// Malo - arrays anidados difíciles de actualizar
const [products] = useState([
  { id: 1, name: 'Product 1', reviews: [...] },
  { id: 2, name: 'Product 2', reviews: [...] }
]);

// Bueno - estado normalizado
const [products] = useState({
  byId: {
    1: { id: 1, name: 'Product 1', reviewIds: [1, 2] },
    2: { id: 2, name: 'Product 2', reviewIds: [3, 4] }
  },
  allIds: [1, 2]
});

const [reviews] = useState({
  byId: {
    1: { id: 1, text: 'Great!' },
    2: { id: 2, text: 'Good' }
  }
});
```

### 5. Limpiar Efectos

```tsx
useEffect(() => {
  const subscription = api.subscribe(data => {
    setState(data);
  });

  //  Siempre limpiar suscripciones/timers
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

### 6. Tipos TypeScript

```tsx
// Definir tipos claramente
interface ProductState {
  products: Producto[];
  loading: boolean;
  error: string | null;
  selectedId: number | null;
}

const [state, setState] = useState<ProductState>({
  products: [],
  loading: false,
  error: null,
  selectedId: null
});
```

### 7. Separar Lógica de UI

```tsx
// Bueno - lógica en custom hook
const useProductList = () => {
  const [products, setProducts] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts().then(setProducts).finally(() => setLoading(false));
  }, []);

  return { products, loading };
};

// Componente solo maneja UI
const ProductList = () => {
  const { products, loading } = useProductList();

  if (loading) return <Loading />;
  return <List items={products} />;
};
```

---

## Recursos Adicionales

### Documentación Oficial

- [React Hooks](https://react.dev/reference/react)
- [Context API](https://react.dev/learn/passing-data-deeply-with-context)
- [useReducer](https://react.dev/reference/react/useReducer)

### Documentación del Proyecto

- [Contextos](CONTEXTS.md)
- [Hooks Personalizados](HOOKS.md)
- [Servicios](SERVICES.md)

---

**Última actualización**: 8 de Octubre, 2025
**Versión**: 1.0
**Estado**: Completado

---

**[Volver arriba](#tabla-de-contenidos)** | **[Frontend](../../frontend/README.md)** | **[Documentación](../README.md)**
