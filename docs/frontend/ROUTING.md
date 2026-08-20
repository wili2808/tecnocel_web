# Sistema de Routing - React Router

> Documentación del sistema de navegación y rutas de la aplicación usando React Router v6.

---

## Tabla de Contenidos

- [Introducción](#introducción)
- [Configuración](#configuración)
- [Estructura de Rutas](#estructura-de-rutas)
- [Lazy Loading](#lazy-loading)
- [Layouts Anidados](#layouts-anidados)
- [Navegación Programática](#navegación-programática)
- [Rutas Protegidas](#rutas-protegidas)
- [Parámetros de Ruta](#parámetros-de-ruta)
- [Navegación en Componentes](#navegación-en-componentes)
- [Query Parameters](#query-parameters)
- [Rutas del Proyecto](#rutas-del-proyecto)
- [Navegación en el Navbar](#navegación-en-el-navbar)
- [Mejores Prácticas](#mejores-prácticas)
- [Redirecciones](#redirecciones)
- [Navegación con Estado](#navegación-con-estado)
- [Recursos Adicionales](#recursos-adicionales)

---

## Introducción

Tecnocel Web utiliza **React Router v6** para gestionar la navegación del cliente (SPA). El sistema de routing implementa:

- **Lazy loading** de componentes para optimizar rendimiento
- **Layouts anidados** con configuración de footer condicional
- **Navegación programática** con `useNavigate()`
- **Detección de ruta activa** con `useLocation()`
- **Rutas protegidas** mediante autenticación
- **Parámetros dinámicos** para productos y entidades

---

## Configuración

### Instalación

```bash
npm install react-router-dom
```

### Versión Utilizada

```json
{
  "react-router-dom": "^6.x.x"
}
```

---

## Estructura de Rutas

### Árbol de Rutas Completo

```
/                            Home (con footer)
├── /login                  → Login (con footer)
├── /register               → Register (con footer)
├── /panel                  → UserPanel (con footer)
├── /carrito                → Cart (con footer)
├── /ofertas                → Offers (con footer)
├── /marcas                 → Brands (con footer)
├── /productos              → ProductCatalog (sin footer)
└── /productos/:id          → ProductPage (sin footer)
```

### Configuración en App.tsx

```tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Layout from './components/layout/Layout';

// Lazy loading de componentes
const Home = lazy(() => import('./pages/Home'));
const ProductCatalog = lazy(() => import('./pages/ProductCatalog'));
const ProductPage = lazy(() => import('./pages/ProductPage'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const UserPanel = lazy(() => import('./pages/UserPanel'));
const Cart = lazy(() => import('./pages/Cart'));
const Offers = lazy(() => import('./pages/Offers/Offers'));
const Brands = lazy(() => import('./pages/Brands/Brands'));

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Rutas con Layout completo (navbar + footer) */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/panel" element={<UserPanel />} />
            <Route path="/carrito" element={<Cart />} />
            <Route path="/ofertas" element={<Offers />} />
            <Route path="/marcas" element={<Brands />} />
          </Route>

          {/* Rutas sin footer */}
          <Route element={<Layout hideFooter />}>
            <Route path="/productos" element={<ProductCatalog />} />
            <Route path="/productos/:id" element={<ProductPage />} />
          </Route>
        </Routes>
      </Suspense>
    </Router>
  )
}
```

---

## Lazy Loading

### Implementación

El lazy loading mejora el rendimiento inicial cargando componentes bajo demanda:

```tsx
// Importación directa (carga todo al inicio)
import Home from './pages/Home';

// Lazy loading (carga solo cuando se necesita)
const Home = lazy(() => import('./pages/Home'));
```

### Componente de Carga

```tsx
const LoadingFallback = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
  </div>
);

// Uso con Suspense
<Suspense fallback={<LoadingFallback />}>
  <Routes>
    {/* rutas */}
  </Routes>
</Suspense>
```

### Beneficios

- **Carga inicial más rápida**: Solo se descarga el código de la ruta actual
- **Code splitting**: Bundle dividido en chunks más pequeños
- **Mejor Time to Interactive**: Reduce el JavaScript inicial
- **Menor consumo de ancho de banda**: Solo se descarga lo necesario

---

## Layouts Anidados

### Componente Layout

El componente `Layout` envuelve las rutas y proporciona estructura común:

```tsx
// components/layout/Layout/Layout.tsx
import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar';
import Footer from '../Footer';

interface LayoutProps {
  hideFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ hideFooter = false }) => {
  return (
    <>
      <Navbar />
      <main>
        <Outlet /> {/* Aquí se renderiza la ruta activa */}
      </main>
      {!hideFooter && <Footer />}
    </>
  );
};
```

### Uso de Layouts Condicionales

```tsx
{/* Layout con footer */}
<Route element={<Layout />}>
  <Route path="/" element={<Home />} />
  <Route path="/ofertas" element={<Offers />} />
</Route>

{/* Layout sin footer */}
<Route element={<Layout hideFooter />}>
  <Route path="/productos" element={<ProductCatalog />} />
  <Route path="/productos/:id" element={<ProductPage />} />
</Route>
```

---

## Navegación Programática

### Hook useNavigate

Permite navegar programáticamente en respuesta a eventos:

```tsx
import { useNavigate } from 'react-router-dom';

const MyComponent = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    // Navegar a una ruta
    navigate('/panel');
  };

  const handleBack = () => {
    // Navegar hacia atrás
    navigate(-1);
  };

  const handleForward = () => {
    // Navegar hacia adelante
    navigate(1);
  };

  const handleReplace = () => {
    // Navegar sin agregar al historial
    navigate('/login', { replace: true });
  };

  const handleWithState = () => {
    // Navegar pasando estado
    navigate('/productos', {
      state: { from: 'homepage' }
    });
  };
};
```

### Ejemplos del Proyecto

#### Navegación en Navbar

```tsx
// Navbar.tsx
const { isAuthenticated } = useAuth();
const navigate = useNavigate();

const handleAuthClick = () => {
  if (isAuthenticated) {
    navigate('/panel');
  } else {
    navigate('/login');
  }
};
```

#### Navegación después de Login

```tsx
// Login.tsx
const handleLoginSuccess = () => {
  navigate('/panel', { replace: true });
};
```

#### Navegación a Producto

```tsx
// ProductCard.tsx
const handleProductClick = () => {
  navigate(`/productos/${producto.id_producto}`);
};
```

---

## Rutas Protegidas

El sistema implementa protección de rutas basada en **tipo de usuario** (cliente, admin, empleado), no solo autenticación.

### Componentes de Protección

#### ProtectedRoute - Protección por tipo de usuario

```tsx
// components/common/ProtectedRoute/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import type { UserType } from '../../../types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedUserTypes: UserType[];  // ['cliente'] o ['admin', 'empleado']
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedUserTypes,
  redirectTo
}) => {
  const { isAuthenticated, userType, isVerifying } = useAuth();
  const location = useLocation();

  // Mientras verifica token, no renderizar nada (evita flash)
  if (isVerifying) return null;

  // No autenticado → redirect a login correspondiente
  if (!isAuthenticated) {
    const isAdminRoute = allowedUserTypes.includes('admin') || allowedUserTypes.includes('empleado');
    const loginPath = isAdminRoute ? '/admin-login' : '/login';
    return <Navigate to={redirectTo || loginPath} state={{ from: location }} replace />;
  }

  // Autenticado pero tipo incorrecto → redirect inteligente
  if (userType && !allowedUserTypes.includes(userType)) {
    const fallback = userType === 'cliente' ? '/' : '/admin-panel';
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
};
```

#### PublicOnlyRoute - Solo para no autenticados

```tsx
// components/common/PublicOnlyRoute/PublicOnlyRoute.tsx
export const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({
  children,
  redirectTo
}) => {
  const { isAuthenticated, userType, isVerifying } = useAuth();

  if (isVerifying) return null;

  if (isAuthenticated) {
    const defaultRedirect = userType === 'cliente' ? '/panel' : '/admin-panel';
    return <Navigate to={redirectTo || defaultRedirect} replace />;
  }

  return <>{children}</>;
};
```

### Uso en App.tsx

```tsx
import ProtectedRoute from './components/common/ProtectedRoute';
import PublicOnlyRoute from './components/common/PublicOnlyRoute';

<Routes>
  {/* Rutas públicas */}
  <Route path="/" element={<Home />} />
  <Route path="/productos" element={<ProductCatalog />} />

  {/* Rutas de autenticación - solo para no logueados */}
  <Route path="/login" element={
    <PublicOnlyRoute>
      <Login />
    </PublicOnlyRoute>
  } />

  {/* Rutas protegidas de CLIENTE */}
  <Route path="/panel" element={
    <ProtectedRoute allowedUserTypes={['cliente']}>
      <UserPanel />
    </ProtectedRoute>
  } />
  <Route path="/carrito" element={
    <ProtectedRoute allowedUserTypes={['cliente']}>
      <Cart />
    </ProtectedRoute>
  } />

  {/* Rutas protegidas de ADMIN */}
  <Route path="/admin-panel" element={
    <ProtectedRoute allowedUserTypes={['admin', 'empleado']}>
      <AdminPanel />
    </ProtectedRoute>
  } />
</Routes>
```

### Comportamiento de Redirección

| Usuario | Intenta acceder | Resultado |
|---------|-----------------|-----------|
| Anónimo | `/panel` | Redirect a `/login` |
| Anónimo | `/admin-panel` | Redirect a `/admin-login` |
| Cliente | `/admin-panel` | Redirect a `/` |
| Admin/Empleado | `/panel`, `/carrito` | Redirect a `/admin-panel` |
| Cliente logueado | `/login` | Redirect a `/panel` |
| Admin logueado | `/admin-login` | Redirect a `/admin-panel` |

---

## Parámetros de Ruta

### Hook useParams

Extrae parámetros dinámicos de la URL:

```tsx
import { useParams } from 'react-router-dom';

// Ruta: /productos/:id
const ProductPage = () => {
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    fetchProduct(id);
  }, [id]);
};
```

### Múltiples Parámetros

```tsx
// Ruta: /categorias/:categoria/productos/:id
const ProductDetail = () => {
  const { categoria, id } = useParams<{
    categoria: string;
    id: string;
  }>();

  // categoria = "celulares"
  // id = "123"
};
```

### Parámetros Opcionales

```tsx
// Ruta con parámetro opcional
<Route path="/productos/:id?" element={<Products />} />

const Products = () => {
  const { id } = useParams();

  if (id) {
    // Mostrar producto específico
  } else {
    // Mostrar listado de productos
  }
};
```

---

## Navegación en Componentes

### Hook useLocation

Obtiene información sobre la ruta actual:

```tsx
import { useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  console.log(location.pathname);  // "/productos"
  console.log(location.search);    // "?categoria=celulares"
  console.log(location.hash);      // "#reviews"
  console.log(location.state);     // Estado pasado con navigate()

  // Detectar ruta activa
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav>
      <Link
        to="/productos"
        className={isActive('/productos') ? 'active' : ''}
      >
        Productos
      </Link>
    </nav>
  );
};
```

### Componente Link

Navegación declarativa sin recarga de página:

```tsx
import { Link } from 'react-router-dom';

// Link básico
<Link to="/productos">Ver Productos</Link>

// Link con estado
<Link to="/productos" state={{ from: 'home' }}>
  Ver Productos
</Link>

// Link con clase activa
<Link
  to="/ofertas"
  className={({ isActive }) => isActive ? 'active' : ''}
>
  Ofertas
</Link>

// Link que reemplaza historial
<Link to="/login" replace>
  Iniciar Sesión
</Link>
```

### Componente NavLink

Link con detección automática de ruta activa:

```tsx
import { NavLink } from 'react-router-dom';

<NavLink
  to="/productos"
  className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link'}
>
  Productos
</NavLink>

// Con múltiples estilos
<NavLink
  to="/ofertas"
  style={({ isActive }) => ({
    color: isActive ? 'blue' : 'black',
    fontWeight: isActive ? 'bold' : 'normal'
  })}
>
  Ofertas
</NavLink>
```

---

## Query Parameters

### Lectura de Query Params

```tsx
import { useSearchParams } from 'react-router-dom';

const ProductCatalog = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Leer parámetros: /productos?categoria=celulares&precio=500
  const categoria = searchParams.get('categoria'); // "celulares"
  const precio = searchParams.get('precio');       // "500"

  // Actualizar parámetros
  const handleFilterChange = (key: string, value: string) => {
    setSearchParams({ ...Object.fromEntries(searchParams), [key]: value });
  };

  // Eliminar parámetro
  const clearFilter = (key: string) => {
    const params = new URLSearchParams(searchParams);
    params.delete(key);
    setSearchParams(params);
  };
};
```

### Navegación con Query Params

```tsx
// Usando navigate
navigate('/productos?categoria=celulares&orden=precio');

// Usando Link
<Link to="/productos?categoria=celulares">Celulares</Link>

// Usando setSearchParams
setSearchParams({ categoria: 'celulares', orden: 'precio' });
```

---

## Rutas del Proyecto

### Tabla de Rutas

| Ruta | Componente | Layout | Descripción | Protegida |
|------|-----------|--------|-------------|-----------|
| `/` | `Home` | Con footer | Página principal | No |
| `/login` | `Login` | Con footer | Inicio de sesión | PublicOnly |
| `/register` | `Register` | Con footer | Registro de usuario | PublicOnly |
| `/panel` | `UserPanel` | Con footer | Panel de usuario | Cliente |
| `/carrito` | `Cart` | Con footer | Carrito de compras | Cliente |
| `/checkout` | `Checkout` | Con footer | Proceso de compra | Cliente |
| `/order-confirmation/:id` | `OrderConfirmation` | Con footer | Confirmación de orden | Cliente |
| `/ofertas` | `Offers` | Con footer | Productos en oferta | No |
| `/marcas` | `Brands` | Con footer | Catálogo de marcas | No |
| `/contacto` | `Contacto` | Con footer | Formulario de contacto | No |
| `/productos` | `ProductCatalog` | Sin footer | Catálogo de productos | No |
| `/productos/:id` | `ProductPage` | Sin footer | Detalle de producto | No |
| `/admin-login` | `AdminLogin` | Sin layout | Login de administrador | PublicOnly |
| `/admin-panel` | `AdminPanel` | Sin layout | Panel de administración | Admin/Empleado |

**Tipos de protección:**
- **No**: Ruta pública, accesible por cualquiera
- **PublicOnly**: Solo usuarios no autenticados (redirige si ya logueado)
- **Cliente**: Solo clientes autenticados (redirige admin a /admin-panel)
- **Admin/Empleado**: Solo usuarios del sistema (redirige cliente a /)

---

## Navegación en el Navbar

### Rutas de Navegación Secundaria

```tsx
// Navbar.tsx
const SECONDARY_NAV_ROUTES = [
  { path: '/productos', label: 'Productos' },
  { path: '/ofertas', label: 'Ofertas' },
  { path: '/marcas', label: 'Marcas' },
  { path: '/contacto', label: 'Contacto' },
];
```

### Renderizado de Enlaces

```tsx
const SecondaryNav = () => {
  const location = useLocation();

  return (
    <nav>
      {SECONDARY_NAV_ROUTES.map(({ path, label }) => (
        <Link
          key={path}
          to={path}
          className={location.pathname === path ? 'active' : ''}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
};
```

---

## Mejores Prácticas

### 1. Usar Lazy Loading

```tsx
// Bueno
const Home = lazy(() => import('./pages/Home'));

// Malo
import Home from './pages/Home';
```

### 2. Memoizar Navegación

```tsx
// Bueno
const handleNavigation = useCallback(() => {
  navigate('/productos');
}, [navigate]);

// Malo - crea función nueva en cada render
const handleNavigation = () => navigate('/productos');
```

### 3. Usar NavLink para Navegación

```tsx
// Bueno - detecta automáticamente ruta activa
<NavLink to="/productos" className={({ isActive }) => isActive ? 'active' : ''}>
  Productos
</NavLink>

// Malo - detección manual
<Link to="/productos" className={location.pathname === '/productos' ? 'active' : ''}>
  Productos
</Link>
```

### 4. Centralizar Rutas

```tsx
// routes/routes.ts
export const ROUTES = {
  HOME: '/',
  PRODUCTS: '/productos',
  PRODUCT_DETAIL: (id: string) => `/productos/${id}`,
  LOGIN: '/login',
  PANEL: '/panel',
} as const;

// Uso
navigate(ROUTES.PRODUCT_DETAIL('123'));
```

### 5. Tipado de Parámetros

```tsx
// Bueno
const { id } = useParams<{ id: string }>();

// Malo
const { id } = useParams();
```

### 6. Validar Parámetros

```tsx
const ProductPage = () => {
  const { id } = useParams<{ id: string }>();

  if (!id || isNaN(Number(id))) {
    return <Navigate to="/productos" replace />;
  }

  // Continuar con la lógica
};
```

### 7. Manejar Rutas No Encontradas

```tsx
<Routes>
  {/* Rutas definidas */}
  <Route path="/" element={<Home />} />

  {/* Ruta 404 */}
  <Route path="*" element={<NotFound />} />
</Routes>
```

---

## Redirecciones

### Redirección Simple

```tsx
import { Navigate } from 'react-router-dom';

<Route path="/old-path" element={<Navigate to="/new-path" replace />} />
```

### Redirección Condicional

```tsx
const RedirectIfAuth = () => {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <Navigate to="/panel" /> : <Outlet />;
};

<Route element={<RedirectIfAuth />}>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
</Route>
```

---

## Navegación con Estado

### Pasar Estado en Navegación

```tsx
// Enviar estado
navigate('/productos', {
  state: {
    from: 'home',
    categoria: 'celulares'
  }
});

// Recibir estado
const location = useLocation();
const from = location.state?.from;
const categoria = location.state?.categoria;
```

### Limpiar Estado después de Usar

```tsx
useEffect(() => {
  if (location.state) {
    // Usar el estado
    const from = location.state.from;

    // Limpiar el estado para evitar persistencia
    window.history.replaceState({}, document.title);
  }
}, [location.state]);
```

---

## Recursos Adicionales

### Documentación Oficial

- [React Router v6](https://reactrouter.com/en/main)
- [React Router Tutorial](https://reactrouter.com/en/main/start/tutorial)

### Documentación del Proyecto

- [Componentes](COMPONENTS.md)
- [Contextos](CONTEXTS.md)
- [Hooks](HOOKS.md)

---

**Última actualización**: 13 de Febrero, 2026
**Versión**: 2.0
**Estado**: Completado

---

**[Volver arriba](#tabla-de-contenidos)** | **[Frontend](../../frontend/README.md)** | **[Documentación](../README.md)**
