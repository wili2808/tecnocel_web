**[Inicio](../README.md)**

---

# TecnoCel Web - Frontend

> Aplicación web de e-commerce desarrollada con React 18, TypeScript y Vite.

---

## Tabla de Contenidos

- [Descripción](#descripción)
- [Stack Principal](#stack-principal)
- [Inicio Rápido](#inicio-rápido)
- [Scripts Disponibles](#scripts-disponibles)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Sistema de Diseño](#sistema-de-diseño)
- [Arquitectura Frontend](#arquitectura-frontend)
- [Configuración](#configuración)
- [Componentes Principales](#componentes-principales)
- [Responsive Design](#responsive-design)
- [Performance](#performance)
- [Desarrollo](#desarrollo)
- [Documentación](#documentación)
- [Deployment](#deployment)

---

## Descripción

Frontend de TecnoCel Web, una plataforma SPA (Single Page Application) moderna con diseño **mobile-first**, gestión de estado con Context API, y sistema de diseño centralizado con variables CSS.

## Stack Principal

| Tecnología       | Versión | Uso                     |
| ---------------- | ------- | ----------------------- |
| **React**        | 18.2.0  | UI Library              |
| **TypeScript**   | 5.3.3   | Lenguaje                |
| **Vite**         | 5.0.12  | Build tool + Dev server |
| **React Router** | 6.21.3  | Navegación SPA          |
| **Axios**        | 1.9.0   | HTTP Client             |
| **CSS Modules**  | -       | Estilos scoped          |
| **React Icons**  | 5.5.0   | Iconografía             |

Ver stack completo → [docs/project/TECNOLOGIAS.md](../docs/project/TECNOLOGIAS.md)

---

## Inicio Rápido

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con la URL del backend

# Iniciar servidor de desarrollo
npm run dev
```

**URL:** http://localhost:5173

---

## Scripts Disponibles

```bash
npm run dev       # Servidor de desarrollo (HMR)
npm run build     # Build optimizado para producción
npm run preview   # Preview del build de producción
npm run lint      # Linting con ESLint
```

---

## Estructura del Proyecto

```
frontend/src/
├── components/          # Componentes organizados por dominio
│   ├── cart/           # Carrito de compras
│   ├── common/         # Componentes reutilizables
│   ├── layout/         # Layout y navegación
│   ├── product/        # Productos, filtros, ofertas
│   └── user/           # Autenticación y perfil
├── contexts/           # Contextos de estado global
├── hooks/              # Custom hooks
├── pages/              # Páginas/Rutas principales
├── services/           # Servicios de API
├── styles/             # Sistema de diseño CSS
├── types/              # Tipos TypeScript
└── utils/              # Utilidades
```

Ver estructura completa → [docs/frontend/ESTRUCTURA.md](../docs/frontend/ESTRUCTURA.md)

---

## Sistema de Diseño

### Variables CSS Centralizadas

```css
/* Colores, tipografía, espaciado en: */
src/styles/variables.css  # Variables base
src/styles/themes.css     # Temas claro/oscuro
src/styles/global.css     # Estilos globales
```

### Características

- **Colores**: Sistema semántico con soporte para tema claro/oscuro
- **Tipografía**: Poppins como fuente principal
- **Espaciado**: Sistema base de 8px
- **Responsive**: Breakpoints mobile-first (480px, 768px, 1024px, 1440px)

Ver guía de diseño → [docs/frontend/THEMING.md](../docs/frontend/THEMING.md)

---

## Arquitectura Frontend

### Gestión de Estado

- **Context API**: Estado global compartido
  - `AuthContext` - Autenticación y sesión
  - `CarritoContext` - Carrito de compras
  - `FavoritosGlobalContext` - Favoritos
  - `ThemeContext` - Tema claro/oscuro
  - `SearchContext` - Búsqueda

Ver guía de contextos → [docs/frontend/CONTEXTS.md](../docs/frontend/CONTEXTS.md)

### Custom Hooks

```typescript
useCart()          # Gestión del carrito
useFavorites()     # Gestión de favoritos
useProducts()      # Productos y filtros
useOffers()        # Ofertas activas
useAuth()          # Autenticación
```

Ver guía de hooks → [docs/frontend/HOOKS.md](../docs/frontend/HOOKS.md)

### Servicios de API

```typescript
productService     # CRUD de productos
cartService        # Operaciones del carrito
authService        # Login, registro, OAuth
commentService     # Comentarios y reseñas
offerService       # Ofertas y descuentos
```

Ver guía de servicios → [docs/frontend/SERVICES.md](../docs/frontend/SERVICES.md)

---

## Configuración

### Variables de Entorno

```env
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=tu-google-client-id
```

Ver todas las variables → [docs/deployment/ENVIRONMENT.md](../docs/deployment/ENVIRONMENT.md)

### Axios Config

Configuración centralizada en `src/api/axiosConfig.ts`:

- Interceptores para JWT automático
- Manejo global de errores
- Transformación de respuestas

---

## Componentes Principales

### Productos

- `ProductCard` - Tarjeta de producto
- `ProductGrid` - Grid responsive
- `ProductFilters` - Filtros avanzados
- `FeaturedProducts` - Productos destacados

### Carrito

- `CartItem` - Item individual
- `CartSummary` - Resumen y checkout
- `CartIndicator` - Indicador en navbar

### Ofertas

- `OfferCard` - Tarjeta de oferta
- `OffersGrid` - Grid de ofertas
- `OfferIndicator` - Badge de descuento

Ver catálogo completo → [docs/frontend/COMPONENTS.md](../docs/frontend/COMPONENTS.md)

---

## Responsive Design

### Breakpoints

```css
--breakpoint-mobile: 480px
--breakpoint-tablet: 768px
--breakpoint-desktop: 1024px
--breakpoint-large: 1440px
```

### Estrategia

- **Mobile-first**: Diseño base para móviles
- **Progressive enhancement**: Mejoras para pantallas grandes
- **Touch-friendly**: Tamaños mínimos de 44px para interacciones

---

## Performance

### Optimizaciones Implementadas

- ✅ **Code splitting** - División automática del bundle
- ✅ **Lazy loading** - Carga diferida de componentes
- ✅ **Image lazy load** - Imágenes cargadas bajo demanda
- ✅ **React.memo** - Optimización de re-renders
- ✅ **CSS Modules** - Estilos scoped sin colisiones

Ver guía de optimización → [docs/frontend/OPTIMIZATION.md](../docs/frontend/OPTIMIZATION.md)

---

## Desarrollo

### Convenciones

- **Nomenclatura**: PascalCase para componentes, camelCase para funciones
- **Estructura de archivos**: Un componente por archivo
- **Imports**: Orden: React → Third-party → Local
- **Estilos**: CSS Modules obligatorio

Ver guía de desarrollo → [docs/guides/DEVELOPMENT.md](../docs/guides/DEVELOPMENT.md)

---

## Documentación

### Frontend - Arquitectura

- [Componentes](../docs/frontend/COMPONENTS.md) - Catálogo completo de componentes
- [Contextos](../docs/frontend/CONTEXTS.md) - Contextos de estado global
- [Hooks](../docs/frontend/HOOKS.md) - Hooks personalizados
- [Servicios](../docs/frontend/SERVICES.md) - Servicios de API

### Frontend - Sistema de Diseño

- [Routing](../docs/frontend/ROUTING.md) - React Router v6, navegación y rutas
- [Styling](../docs/frontend/STYLING.md) - CSS Modules, variables y convenciones
- [Theming](../docs/frontend/THEMING.md) - Sistema de temas claro/oscuro
- [State Management](../docs/frontend/STATE_MANAGEMENT.md) - Gestión de estado

### Desarrollo

- [Guía de desarrollo](../docs/guides/DEVELOPMENT.md)
- [Configuración de entorno](../docs/deployment/ENVIRONMENT.md)
- [Convenciones de código](../docs/guides/CODING_STANDARDS.md)

---

## Deployment

```bash
# Build para producción
npm run build

# Preview del build
npm run preview
```

Ver guía de deployment → [docs/deployment/HOSTING.md](../docs/deployment/HOSTING.md)

**Última actualización**: 8 de Octubre, 2025
**Versión**: 1.1.0
**Puerto**: 5173
**Stack**: React 18 + TypeScript + Vite

---

**[Volver arriba](#tabla-de-contenidos)** | **[Inicio](../README.md)**
