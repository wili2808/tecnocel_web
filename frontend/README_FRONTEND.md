# 🚀 TecnoCel Web - Frontend

## Descripción

Frontend de TecnoCel Web, una plataforma de e-commerce completa para productos tecnológicos desarrollada con React 18, TypeScript y Vite.

## 🛠️ Stack Tecnológico

- **React 18.2.0** con TypeScript 5.3.3
- **Vite 5.0.12** con SWC para Fast Refresh
- **React Router DOM 6.21.3** para navegación
- **CSS Modules** con sistema de variables centralizado
- **Context API** para gestión de estado global
- **Axios 1.9.0** para comunicación con el backend
- **React Icons 5.5.0** para iconografía
- **React Toastify 11.0.5** para notificaciones

## 🚀 Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Build de producción
npm run build

# Linting con ESLint
npm run lint

# Vista previa de producción
npm run preview
```

## 🏗️ Estructura del Proyecto

```
src/
├── components/          # Componentes React organizados por dominio
│   ├── cart/           # Componentes del carrito de compras
│   │   ├── CartItem/   # Item individual del carrito
│   │   ├── CartSummary/# Resumen y checkout
│   │   └── CartItemCard/# Tarjeta de item del carrito
│   ├── common/         # Componentes reutilizables
│   │   ├── LoadingSpinner/    # Spinner de carga
│   │   ├── IconButton/        # Botón con icono
│   │   ├── Notification/      # Sistema de notificaciones
│   │   └── CTASection/        # Sección de llamada a la acción
│   ├── layout/         # Componentes de estructura
│   │   ├── Navbar/     # Navegación principal
│   │   ├── Footer/     # Pie de página
│   │   ├── Layout/     # Layout principal
│   │   └── HeroSection/# Sección hero de la página
│   ├── location/       # Componentes de ubicación y mapas
│   │   ├── GoogleMap/  # Integración con Google Maps
│   │   ├── LocationSection/   # Sección de ubicación
│   │   └── HistorySection/    # Historia de la empresa
│   ├── product/        # Componentes de productos
│   │   ├── ProductCard/       # Tarjeta de producto
│   │   ├── ProductGrid/       # Grid de productos
│   │   ├── ProductFiltersBar/ # Barra de filtros
│   │   ├── ProductSearch/     # Búsqueda de productos
│   │   ├── ProductComments/   # Sistema de comentarios
│   │   ├── ProductFeatures/   # Características del producto
│   │   ├── ProductImage/      # Imagen del producto
│   │   ├── ProductInfo/       # Información del producto
│   │   ├── ProductActions/    # Acciones del producto
│   │   ├── FavoriteButtonReusable/ # Botón de favoritos
│   │   ├── BrandFilter/       # Filtro por marcas
│   │   ├── CategoryFilters/   # Filtro por categorías
│   │   ├── ProductSorting/    # Ordenamiento de productos

│   │   ├── FeaturedProducts/  # Productos destacados
│   │   ├── OffersGrid/        # Grid de ofertas
│   │   ├── OfferCard/         # Tarjeta de oferta
│   │   ├── OfferIndicator/    # Indicador de oferta
│   │   └── OffersProductsSection/ # Sección de productos en oferta
│   └── user/           # Componentes de usuario
│       ├── AuthForm/   # Formulario de autenticación
│       └── RegisterForm/      # Formulario de registro
├── contexts/           # Contextos de estado global
│   ├── AuthContext.tsx        # Autenticación y sesión
│   ├── CarritoContext.tsx     # Estado del carrito
│   ├── FavoritosGlobalContext.tsx # Estado de favoritos
│   ├── NotificationContext.tsx     # Notificaciones
│   ├── SearchContext.tsx      # Estado de búsqueda
│   └── ThemeContext.tsx       # Tema claro/oscuro
├── hooks/              # Custom hooks personalizados
│   ├── useAuthActions.ts      # Acciones de autenticación
│   ├── useAuthForm.ts         # Lógica de formularios
│   ├── useCart.ts             # Gestión del carrito
│   ├── useFavorites.ts        # Gestión de favoritos
│   ├── useOffers.ts           # Gestión de ofertas
│   ├── useProducts.ts         # Gestión de productos
│   ├── useComments.ts         # Gestión de comentarios
│   ├── useLocation.ts         # Gestión de ubicación
│   ├── useNotifications.ts    # Gestión de notificaciones
│   ├── useSearch.ts           # Gestión de búsqueda
│   ├── useTheme.ts            # Gestión de tema
│   └── useValidation.ts       # Validaciones
├── pages/              # Páginas principales
│   ├── Home.tsx               # Página principal
│   ├── Auth/                  # Páginas de autenticación
│   ├── ProductCatalog/        # Catálogo de productos
│   ├── ProductPage/           # Página de producto
│   ├── Cart/                  # Página del carrito
│   ├── UserPanel/             # Panel de usuario
│   ├── Brands/                # Página de marcas
│   └── Offers/                # Página de ofertas
├── services/           # Servicios de API
│   ├── authService.ts         # Servicios de autenticación
│   ├── productService.ts      # Servicios de productos
│   ├── cartService.ts         # Servicios del carrito
│   ├── commentService.ts      # Servicios de comentarios
│   ├── favoriteService.ts     # Servicios de favoritos
│   ├── offerService.ts        # Servicios de ofertas
│   └── direccionService.ts    # Servicios de ubicación
├── styles/             # Sistema de estilos centralizado
│   ├── variables.css          # Variables CSS base
│   ├── themes.css             # Mapeo semántico de temas
│   └── global.css             # Estilos globales
├── types/              # Definiciones TypeScript
│   └── product.ts             # Tipos de productos
├── utils/              # Utilidades y helpers
│   ├── productCategorization.ts # Categorización de productos
│   ├── productFiltering.ts    # Filtrado de productos
│   └── index.ts               # Exportaciones
├── api/                # Configuración de API
│   └── axiosConfig.ts         # Configuración de Axios
├── assets/             # Recursos estáticos
│   └── logo2.svg              # Logo de la aplicación
├── App.tsx             # Componente raíz
└── main.tsx            # Punto de entrada
```

## 🎨 Sistema de Diseño

### Variables CSS Centralizadas

- **Colores**: Sistema de colores con variables semánticas
- **Tipografía**: Poppins como fuente principal
- **Espaciado**: Sistema base de 8px
- **Breakpoints**: Mobile-first (480px, 768px, 1024px, 1440px)

### Temas

- **Claro**: Colores claros y legibles
- **Oscuro**: Colores oscuros con contraste adecuado
- **Transición**: Cambio suave entre temas

## 🔧 Configuración

### Variables de Entorno

```env
VITE_API_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=tu-google-client-id
```

### API Configuration

- **Base URL**: Configurada en `src/api/axiosConfig.ts`
- **Interceptores**: Para manejo automático de tokens JWT
- **CORS**: Configurado para desarrollo local

## 📱 Responsive Design

### Breakpoints

- **Mobile**: < 480px
- **Tablet**: 480px - 768px
- **Desktop**: 768px - 1024px
- **Large**: > 1024px

### Características

- **Mobile-first**: Diseño optimizado para móviles
- **Flexible**: Adaptación automática a diferentes tamaños
- **Touch-friendly**: Interacciones optimizadas para touch

## 🚀 Performance

### Optimizaciones

- **Lazy Loading**: Componentes cargados bajo demanda
- **Code Splitting**: División automática del bundle
- **Image Optimization**: Lazy loading de imágenes
- **Memoization**: React.memo y hooks de optimización

### Build

- **Vite**: Build tool ultra-rápido
- **SWC**: Compilador TypeScript optimizado
- **Compression**: Compresión automática de assets

## 🧪 Desarrollo

### Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run preview      # Vista previa de producción
npm run lint         # Linting con ESLint
```

### ESLint Configuration

- **TypeScript**: Reglas estrictas de TypeScript
- **React**: Reglas específicas de React
- **Import/Export**: Organización de imports

## 📚 Documentación

### Componentes

- Ver `DOCUMENTACION_COMPONENTES.md` para detalles de componentes
- Ver `Implementaciones_doc/` para análisis y planes

### Convenciones

- **Nomenclatura**: PascalCase para componentes, camelCase para funciones
- **Estructura**: Imports → Types → Component → Export
- **Estilos**: CSS Modules con variables centralizadas

## 🎯 Funcionalidades Principales

### ✅ Implementadas

- Catálogo de productos con filtros y búsqueda
- Sistema de carrito de compras completo
- Autenticación con JWT y Google OAuth
- Sistema de comentarios con imágenes
- Gestión de favoritos y ofertas
- Sistema de temas claro/oscuro
- Responsive design completo
- Optimización de imágenes y performance

### 🔄 En Desarrollo

- Panel de administración
- Sistema de pagos
- Notificaciones push
- Analytics y métricas

## 🤝 Contribución

### Flujo de Trabajo

1. Crear rama feature/ desde main
2. Seguir convenciones establecidas
3. Verificar funcionalidad y linting
4. Commit con mensajes descriptivos
5. Pull request con revisión de código

### Estándares

- TypeScript estricto
- ESLint configurado
- CSS Modules obligatorio
- Responsive design requerido

## 📱 Características Técnicas

### Estado Global

- **Context API**: Para estado compartido entre componentes
- **Local Storage**: Persistencia de datos del usuario
- **Optimistic Updates**: Actualizaciones inmediatas de UI

### Routing

- **React Router 6**: Navegación declarativa
- **Protected Routes**: Rutas con autenticación
- **Dynamic Routes**: Rutas con parámetros

### HTTP Client

- **Axios**: Cliente HTTP con interceptores
- **Error Handling**: Manejo centralizado de errores
- **Request/Response**: Transformación automática de datos

## 🔍 Debugging

### Herramientas

- **React DevTools**: Para inspección de componentes
- **Redux DevTools**: Para estado global (si se implementa)
- **Network Tab**: Para debugging de API calls

### Logs

- **Console**: Logs estructurados para desarrollo
- **Error Boundaries**: Captura de errores en componentes
- **Performance**: Métricas de renderizado
