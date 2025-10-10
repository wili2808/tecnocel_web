[Documentación](../README.md#estructura-de-documentación) | [Inicio](../../README.md)

---

# Documentación del Frontend

**Última actualización**: 8 de Octubre, 2025

Documentación completa del frontend de TecnoCel Web desarrollado con React 18 + TypeScript.

---

## Tabla de Contenidos

- [Documentos Disponibles](#documentos-disponibles)
- [Inicio Rápido](#inicio-rápido)
- [Estructura del Frontend](#estructura-del-frontend)
- [Recursos Adicionales](#recursos-adicionales)

---

## Documentos Disponibles

### [COMPONENTS.md](COMPONENTS.md)
**Guía completa de los 39 componentes del proyecto - ACTUALIZADO**

**Contenido**:
- 39 componentes documentados completamente
- 6 categorías: Common, Product, Cart, Layout, User, Location
- Props detalladas con TypeScript
- Ejemplos de uso prácticos
- Características y funcionalidades
- Guías de accesibilidad
- Convenciones de CSS Modules
- Optimización y mejores prácticas

**Componentes por Categoría**:
- **Comunes (6)**: Button, IconButton, LoadingSpinner, Notification, NotificationContainer, CTASection
- **Productos (14)**: ProductCard, ProductGrid, ProductImage, ProductInfo, ProductFeatures, ProductFilters, ProductSearch, ProductActions, ProductComments, FavoriteButtonReusable, OfferCard, OfferIndicator, OffersGrid, OffersProductsSection, FeaturedProducts
- **Carrito (3)**: CartIndicator, CartItemCard, CartSummary
- **Layout (4)**: Layout, Navbar, Footer, HeroSection
- **Usuario (2)**: AuthForm, RegisterForm
- **Ubicación (4)**: Location, LocationSection, GoogleMap, HistorySection

---

### [COMPONENTS_LEGACY.md](COMPONENTS_LEGACY.md)
Documentación anterior de componentes (versión legacy - referencia histórica).

---

### [CONTEXTS.md](CONTEXTS.md)
Guía completa de los 8 contextos globales del proyecto.

**Contenido**:
- 8 contextos documentados completamente
- API pública con TypeScript
- Ejemplos de uso prácticos
- Optimizaciones y mejores prácticas
- Sistema de caché multi-nivel
- Integración entre contextos
- Hooks personalizados por contexto

**Contextos Documentados**:
1. **AuthContext** - Autenticación JWT y Google OAuth 2.0
2. **CarritoContext** - Gestión del carrito de compras
3. **FavoritosGlobalContext** - Sistema de favoritos con caché
4. **OfertasGlobalContext** - Ofertas activas y productos en oferta
5. **ProductContext** - Catálogo de productos con filtros y paginación
6. **SearchContext** - Búsqueda global con debounce
7. **ThemeContext** - Tema claro/oscuro
8. **NotificationContext** - Sistema de notificaciones toast

---

### [HOOKS.md](HOOKS.md)
Guía completa de los 14 hooks personalizados del proyecto.

**Contenido**:
- 14 hooks documentados completamente
- Organizados por categoría (Autenticación, Carrito, Favoritos, Ofertas, Productos, Otros)
- Interfaces TypeScript completas
- Ejemplos de uso prácticos
- Patrones de uso y mejores prácticas
- Composición de hooks

**Hooks por Categoría**:
- **Autenticación (3)**: useAutoLogout, useAuthActions, useAuthForm
- **Carrito (3)**: useCarrito, useCarritoOperations, useCarritoUtils
- **Favoritos (2)**: useFavoritos, useFavoritosProductos
- **Ofertas (3)**: useOfertas, useOfertasGlobal, useOfertasPagination
- **Productos (1)**: useProductActions
- **Otros (2)**: useDirecciones, useEscapeKey

---

### [SERVICES.md](SERVICES.md)
Guía completa de los 9 servicios de API del frontend.

**Contenido**:
- 9 servicios documentados completamente
- Interfaces TypeScript completas
- Ejemplos de uso para cada método
- Patrones comunes de implementación
- Manejo de errores estandarizado
- Sistema de caché y reintentos

**Servicios Documentados**:
1. **authService** - Autenticación, registro y sesiones (JWT + Google OAuth)
2. **carritoService** - Gestión completa del carrito de compras
3. **commentService** - Comentarios con imágenes y estadísticas
4. **direccionService** - CRUD de direcciones de envío
5. **favoritoService** - Sistema de favoritos con paginación
6. **marcaService** - Consulta de marcas de productos
7. **ofertaService** - Ofertas activas con caché y reintentos
8. **productService** - Productos, categorías e imágenes
9. **uploadService** - Subida de imágenes de comentarios

---

### [ROUTING.md](ROUTING.md)
Guía completa del sistema de navegación con React Router v6.

**Contenido**:
- Configuración de React Router v6
- Estructura completa de rutas (9 rutas principales)
- Lazy loading de componentes
- Layouts anidados con configuración condicional
- Navegación programática con useNavigate
- Rutas protegidas mediante autenticación
- Parámetros de ruta dinámicos
- Query parameters y estado de navegación
- Mejores prácticas y optimización

---

### [STYLING.md](STYLING.md)
Guía completa del sistema de estilos con CSS Modules.

**Contenido**:
- Arquitectura de estilos (global.css, variables.css, themes.css)
- CSS Modules: uso básico y composición de clases
- Variables CSS centralizadas (colores, tipografía, espaciado, bordes, sombras)
- Paleta de colores completa (neutros, sky, cyan, estados)
- Utilidades globales (espaciado, texto, flexbox, bordes, sombras)
- Responsive design con breakpoints
- Convenciones de nomenclatura (camelCase)
- Mejores prácticas y optimización

---

### [THEMING.md](THEMING.md)
Guía completa del sistema de temas claro/oscuro.

**Contenido**:
- Arquitectura del sistema de temas
- ThemeContext: configuración y API
- Definición de temas (light/dark) en themes.css
- Variables de tema (fondos, textos, bordes, colores primarios)
- Variables con transparencias para efectos visuales
- Uso en componentes con CSS Modules
- Transiciones suaves entre temas
- Persistencia en localStorage
- Sincronización con preferencias del sistema
- Personalización: agregar temas personalizados
- Mejores prácticas y accesibilidad

---

### [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md)
Guía completa de la gestión de estado con Context API.

**Contenido**:
- Arquitectura de estado (capas y estructura)
- Context API: patrón de implementación
- Estado local vs estado global (cuándo usar cada uno)
- Hooks personalizados para lógica reutilizable
- Patrones de estado: useReducer, estado derivado, optimista, síncrono
- Optimización de rendimiento (memoización, división de contextos, selectores)
- Sincronización con backend (fetch, polling, actualización automática)
- Mejores prácticas: inicialización, actualización, limpieza, tipos TypeScript

---

## Inicio Rápido

Para iniciar el frontend:

```bash
cd frontend
npm install
npm run dev

# La aplicación estará disponible en:
http://localhost:5173
```

## Estructura del Frontend

```
frontend/src/
├── components/       # Componentes reutilizables
├── pages/           # Páginas de la aplicación
├── contexts/        # Contextos globales
├── hooks/           # Hooks personalizados
├── services/        # Servicios de API
├── types/           # Tipos TypeScript
├── utils/           # Utilidades
├── styles/          # Estilos globales
└── assets/          # Assets estáticos
```

## Recursos Adicionales

- [Código del frontend](../../frontend/README.md)
- [Documentación de API](../api/README.md)
- [Volver al índice de documentación](../README.md)

---

[Volver arriba](#documentación-del-frontend) | [Documentación](../README.md) | [Inicio](../../README.md)
