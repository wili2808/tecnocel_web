[Frontend](./README.md) | [Documentación](../README.md) | [Inicio](../../README.md)

---

# 💻 Componentes del Frontend - TecnoCel Web

**Última actualización**: 25 de Marzo, 2026 | **Versión**: 1.4

---

## Tabla de Contenidos

- [Visión General](#visión-general)
- [Arquitectura de Componentes](#arquitectura-de-componentes)
- [Componentes Comunes](#componentes-comunes)
- [Componentes de Productos](#componentes-de-productos)
- [Componentes de Carrito](#componentes-de-carrito)
- [Componentes de Layout](#componentes-de-layout)
- [Componentes de Usuario](#componentes-de-usuario)
- [Componentes de Ubicación](#componentes-de-ubicación)
- [Guías de Uso](#guías-de-uso)
- [Convenciones y Mejores Prácticas](#convenciones-y-mejores-prácticas)

---

## Visión General

El frontend de TecnoCel Web está construido con **React 18** + **TypeScript** utilizando una arquitectura de componentes modular y reutilizable. Todos los componentes siguen principios de:

- **Responsividad**: Diseño mobile-first con soporte completo para smartphones, tablets y desktop
- **Accesibilidad**: ARIA labels, navegación por teclado y lectores de pantalla
- **Optimización**: Memoización, lazy loading y code splitting
- **Tipado fuerte**: TypeScript para prevenir errores en tiempo de desarrollo
- **CSS Modules**: Estilos encapsulados sin conflictos globales

### Estadísticas del Proyecto

| Métrica | Valor |
|---------|-------|
| **Total de componentes** | 101+ |
| **Componentes comunes** | 8 |
| **Componentes de productos** | 18+ |
| **Componentes de carrito** | 5 |
| **Componentes de checkout** | 5 |
| **Componentes de layout** | 4 |
| **Componentes de usuario** | 10 |
| **Componentes de ubicación** | 4 |
| **Componentes de admin** | 28+ |
| **Componentes de notificaciones** | 3 |
| **Componentes de contacto** | 2 |
| **Componentes de marcas** | 2 |

---

## Arquitectura de Componentes

### Estructura de Carpetas

```
frontend/src/components/
├── common/                    # Componentes reutilizables globales
│   ├── Button/               # Botón universal con variantes
│   ├── IconButton/           # Botón con solo icono
│   ├── LoadingSpinner/       # Indicador de carga
│   ├── Notification/         # Notificación individual
│   ├── NotificationContainer/# Contenedor de notificaciones
│   ├── ProtectedRoute/       # Protección de rutas por tipo de usuario
│   ├── PublicOnlyRoute/      # Rutas solo para no autenticados
│   └── CTASection/           # Sección de llamada a la acción
│
├── product/                   # Componentes relacionados con productos
│   ├── ProductCard/          # Tarjeta de producto para grid
│   ├── ProductGrid/          # Cuadrícula de productos
│   ├── ProductImage/         # Imagen de producto con zoom
│   ├── ProductInfo/          # Información detallada
│   ├── ProductFeatures/      # Características técnicas
│   ├── ProductFilters/       # Filtros de búsqueda
│   ├── ProductSearch/        # Búsqueda de productos
│   ├── ProductActions/       # Acciones del producto
│   ├── ProductComments/      # Sistema de comentarios
│   ├── FeaturedProducts/     # Productos destacados
│   ├── FavoriteButtonReusable/ # Botón de favoritos
│   ├── OfferCard/            # Tarjeta de oferta
│   ├── OfferIndicator/       # Indicador de descuento
│   ├── OffersGrid/           # Cuadrícula de ofertas
│   └── OffersProductsSection/ # Sección de productos en oferta
│
├── cart/                      # Componentes del carrito de compras
│   ├── CartIndicator/        # Indicador de producto en carrito
│   ├── CartItemCard/         # Tarjeta de item del carrito
│   └── CartSummary/          # Resumen del carrito
│
├── layout/                    # Componentes de estructura
│   ├── Layout/               # Layout principal
│   ├── Navbar/               # Barra de navegación
│   ├── Footer/               # Pie de página
│   └── HeroSection/          # Sección hero de homepage
│
├── user/                      # Componentes de usuario y autenticación
│   ├── AuthForm/             # Formulario de login
│   ├── RegisterForm/         # Formulario de registro
│   ├── InformacionPersonal/  # Formulario de datos personales
│   ├── DatosCuenta/          # Información de cuenta (solo lectura)
│   ├── Seguridad/            # Cambio de contraseña
│   ├── Direcciones/          # Gestión de direcciones
│   ├── DireccionModal/       # Modal de dirección
│   ├── MisCompras/           # Historial de compras
│   └── Soporte/              # Centro de ayuda
│
└── location/                  # Componentes de ubicación
    ├── Location/             # Página de ubicación
    ├── LocationSection/      # Sección de ubicación
    ├── GoogleMap/            # Mapa de Google
    └── HistorySection/       # Sección de historia
```

### Convención de Nombres

Cada componente sigue esta estructura:

```
ComponentName/
├── ComponentName.tsx         # Componente principal
├── ComponentName.module.css  # Estilos CSS Modules
├── types.ts                  # Tipos TypeScript (opcional)
└── index.ts                  # Exportación del componente
```

---

## Componentes Comunes

### Button

**Ubicación**: [`frontend/src/components/common/Button/`](../../frontend/src/components/common/Button/)

Botón universal optimizado para toda la aplicación con múltiples variantes y estados.

#### Props

```typescript
interface ButtonProps {
  children: React.ReactNode;        // Contenido del botón
  variant?: ButtonVariant;          // 'primary' | 'secondary' | 'ghost' | 'outline' | 'text' | 'link' | 'danger' | 'success' | 'warning'
  size?: ButtonSize;                // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  disabled?: boolean;               // Estado deshabilitado
  loading?: boolean;                // Estado de carga
  type?: 'button' | 'submit' | 'reset';
  form?: string;                    // ID del formulario asociado
  onClick?: (event: React.MouseEvent) => void;

  // Enlaces
  href?: string;                    // Convertir a link
  target?: '_blank' | '_self' | '_parent' | '_top';
  rel?: string;

  // Estilos
  className?: string;
  fullWidth?: boolean;              // Ancho completo
  rounded?: boolean;                // Bordes redondeados
  elevated?: boolean;               // Elevación con sombra

  // Iconos
  icon?: string;                    // Nombre del icono Material Icons
  iconPosition?: 'left' | 'right'; // Posición del icono

  // Responsive
  mobileFullWidth?: boolean;        // Ancho completo solo en móvil
  hideOnMobile?: boolean;           // Ocultar en móvil
  showOnMobile?: boolean;           // Mostrar solo en móvil

  // Accesibilidad
  ariaLabel?: string;
}
```

#### Ejemplos de Uso

```tsx
import Button from '@/components/common/Button';

// Botón primario básico
<Button variant="primary" size="md">
  Agregar al carrito
</Button>

// Botón con icono
<Button
  variant="secondary"
  icon="shopping_cart"
  iconPosition="left"
>
  Ver carrito
</Button>

// Botón de carga
<Button variant="primary" loading>
  Procesando...
</Button>

// Botón como enlace
<Button
  variant="ghost"
  href="/productos"
  target="_blank"
>
  Ver productos
</Button>

// Botón responsive
<Button
  variant="primary"
  mobileFullWidth
  hideOnMobile={false}
>
  Comprar ahora
</Button>
```

#### Variantes Disponibles

| Variante | Uso | Color |
|----------|-----|-------|
| `primary` | Acciones principales | Azul principal |
| `secondary` | Acciones secundarias | Gris oscuro |
| `ghost` | Acciones sutiles | Transparente con hover |
| `outline` | Acciones con borde | Borde con fondo transparente |
| `text` | Enlaces de texto | Sin fondo, solo texto |
| `link` | Enlaces nativos | Estilo de enlace |
| `danger` | Acciones destructivas | Rojo |
| `success` | Acciones exitosas | Verde |
| `warning` | Advertencias | Amarillo/Naranja |

---

### IconButton

**Ubicación**: [`frontend/src/components/common/IconButton/`](../../frontend/src/components/common/IconButton/)

Botón compacto que contiene solo un icono, optimizado para acciones rápidas.

#### Props

```typescript
interface IconButtonProps {
  icon: string;                     // Nombre del icono Material Icons (requerido)
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  ariaLabel: string;                // Requerido para accesibilidad
  className?: string;
  title?: string;                   // Tooltip
}
```

#### Ejemplo de Uso

```tsx
import IconButton from '@/components/common/IconButton';

<IconButton
  icon="favorite"
  variant="primary"
  size="medium"
  ariaLabel="Agregar a favoritos"
  onClick={handleAddToFavorites}
/>
```

---

### LoadingSpinner

**Ubicación**: [`frontend/src/components/common/LoadingSpinner/`](../../frontend/src/components/common/LoadingSpinner/)

Indicador de carga animado con opciones de tamaño y overlay.

#### Props

```typescript
interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'; // Tamaño del spinner
  overlay?: boolean;                    // Mostrar overlay de fondo
  message?: string;                     // Mensaje de carga
  className?: string;
}
```

#### Ejemplo de Uso

```tsx
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Spinner básico
<LoadingSpinner size="medium" />

// Spinner con overlay y mensaje
<LoadingSpinner
  size="large"
  overlay
  message="Cargando productos..."
/>
```

---

### Notification

**Ubicación**: [`frontend/src/components/common/Notification/`](../../frontend/src/components/common/Notification/)

Componente de notificación individual con tipos y auto-dismiss.

#### Props

```typescript
interface NotificationProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;                    // Duración en ms (default: 3000)
  onClose: (id: string) => void;
}
```

#### Ejemplo de Uso

```tsx
import Notification from '@/components/common/Notification';

<Notification
  id="notif-1"
  message="Producto agregado al carrito"
  type="success"
  duration={3000}
  onClose={handleClose}
/>
```

---

### NotificationContainer

**Ubicación**: [`frontend/src/components/common/NotificationContainer/`](../../frontend/src/components/common/NotificationContainer/)

Contenedor para gestionar múltiples notificaciones en stack.

#### Uso

Se utiliza a través del contexto `NotificationContext`:

```tsx
import { useNotification } from '@/contexts/NotificationContext';

const { showNotification } = useNotification();

// Mostrar notificación
showNotification('Producto agregado exitosamente', 'success', 3000);
showNotification('Error al procesar la solicitud', 'error', 5000);
```

---

### CTASection

**Ubicación**: [`frontend/src/components/common/CTASection/`](../../frontend/src/components/common/CTASection/)

Sección de llamada a la acción reutilizable para promociones.

#### Props

```typescript
interface CTASectionProps {
  title: string;
  description?: string;
  buttonText: string;
  buttonLink: string;
  variant?: 'primary' | 'secondary';
  className?: string;
}
```

---

## Componentes de Productos

### ProductCard

**Ubicación**: [`frontend/src/components/product/ProductCard/`](../../frontend/src/components/product/ProductCard/)

Tarjeta de producto para vista de cuadrícula. Componente principal para mostrar productos en catálogos y listados.

#### Props

```typescript
interface ProductCardProps {
  id_producto: number;
  nombre: string;
  descripcion?: string;
  imagen_url: string;
  imagenes?: ProductImage[];
  precio_venta: number | string;
  stock: number;
  className?: string;

  // Ofertas
  precio_original?: number;
  precio_oferta?: number;
  en_oferta?: boolean;
}
```

#### Características

- Imagen responsive con ProductImage
- Overlay interactivo con 4 estados:
  - Agregar al carrito (azul)
  - Éxito al agregar (verde)
  - Límite alcanzado (rojo)
  - Producto agotado (gris)
- Indicadores visuales:
  - Oferta (OfferIndicator)
  - Cantidad en carrito (CartIndicator)
  - Favoritos (FavoriteButtonReusable)
- Precios dinámicos con descuentos
- Validaciones de stock integradas
- Navegación a detalle del producto

#### Ejemplo de Uso

```tsx
import ProductCard from '@/components/product/ProductCard';

<ProductCard
  id_producto={1}
  nombre="iPhone 15 Pro"
  descripcion="Smartphone de última generación"
  imagen_url="/images/iphone15.jpg"
  precio_venta={1299990}
  stock={10}
  precio_oferta={1199990}
  en_oferta={true}
/>
```

#### Estados del Overlay

| Estado | Color | Acción | Condición |
|--------|-------|--------|-----------|
| **Agregar al carrito** | Azul | Agregar producto | Stock disponible y no en límite |
| **Éxito** | Verde | Mostrar confirmación | Producto recién agregado |
| **Límite alcanzado** | Rojo | Ir al carrito | Cantidad máxima en carrito |
| **Agotado** | Gris | Sin acción | Stock = 0 |

---

### ProductGrid

**Ubicación**: [`frontend/src/components/product/ProductGrid/`](../../frontend/src/components/product/ProductGrid/)

Cuadrícula responsive de productos que renderiza múltiples ProductCards.

#### Props

```typescript
interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  columns?: {
    mobile?: number;    // Default: 1
    tablet?: number;    // Default: 2
    desktop?: number;   // Default: 3-4
  };
}
```

#### Características

- Grid responsive con CSS Grid
- Skeleton loading durante carga
- Mensaje de lista vacía
- Optimización con virtualización (en lista larga)

#### Ejemplo de Uso

```tsx
import ProductGrid from '@/components/product/ProductGrid';

<ProductGrid
  products={productos}
  loading={isLoading}
  emptyMessage="No se encontraron productos"
  columns={{ mobile: 1, tablet: 2, desktop: 4 }}
/>
```

---

### ProductImage

**Ubicación**: [`frontend/src/components/product/ProductImage/`](../../frontend/src/components/product/ProductImage/)

Componente de imagen de producto con soporte para múltiples imágenes, zoom y galería.

#### Props

```typescript
interface ProductImageProps {
  images?: ProductImage[];
  defaultImage: string;
  alt: string;
  className?: string;
  mode?: 'simple' | 'gallery';  // Simple para cards, gallery para detalle
  onImageClick?: () => void;
}

interface ProductImage {
  url: string;
  es_principal: boolean;
  orden?: number;
}
```

#### Características

- Modo simple: Solo muestra imagen principal
- Modo galería: Thumbnails + imagen principal
- Lazy loading con IntersectionObserver
- Fallback image si falla la carga
- Optimización de imágenes

#### Ejemplo de Uso

```tsx
import ProductImage from '@/components/product/ProductImage';

// Modo simple (para cards)
<ProductImage
  images={imagenes}
  defaultImage="/images/product.jpg"
  alt="Producto"
  mode="simple"
/>

// Modo galería (para detalle)
<ProductImage
  images={imagenes}
  defaultImage="/images/product.jpg"
  alt="Producto"
  mode="gallery"
/>
```

---

### ProductInfo

**Ubicación**: [`frontend/src/components/product/ProductInfo/`](../../frontend/src/components/product/ProductInfo/)

Información detallada del producto en la página de detalle.

#### Props

```typescript
interface ProductInfoProps {
  product: Product;
  loading?: boolean;
  className?: string;
}
```

#### Características

- Título y descripción del producto
- Precios con descuentos formateados
- Stock disponible con indicador visual
- Categoría y marca
- Rating y comentarios
- Botones de acción (comprar, favorito)

---

### ProductFeatures

**Ubicación**: [`frontend/src/components/product/ProductFeatures/`](../../frontend/src/components/product/ProductFeatures/)

Tabla de características técnicas del producto.

#### Props

```typescript
interface ProductFeaturesProps {
  features: ProductFeature[];
  className?: string;
}

interface ProductFeature {
  nombre: string;
  valor: string;
  categoria?: string;
}
```

#### Ejemplo de Uso

```tsx
import ProductFeatures from '@/components/product/ProductFeatures';

<ProductFeatures
  features={[
    { nombre: 'Pantalla', valor: '6.1 pulgadas' },
    { nombre: 'Procesador', valor: 'A17 Pro' },
    { nombre: 'RAM', valor: '8 GB' },
    { nombre: 'Almacenamiento', valor: '256 GB' }
  ]}
/>
```

---

### ProductFilters

**Ubicación**: [`frontend/src/components/product/ProductFilters/`](../../frontend/src/components/product/ProductFilters/)

Panel de filtros para búsqueda avanzada de productos.

#### Props

```typescript
interface ProductFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  brands?: Brand[];
  categories?: Category[];
  priceRange?: { min: number; max: number };
  className?: string;
}

interface FilterState {
  marca?: number;
  categoria?: string;
  precioMin?: number;
  precioMax?: number;
  enOferta?: boolean;
  enStock?: boolean;
  ordenar?: 'precio_asc' | 'precio_desc' | 'nombre' | 'nuevos';
}
```

#### Características

- Filtros múltiples: marca, categoría, precio, stock, ofertas
- Ordenamiento por diferentes criterios
- Rango de precios con sliders
- Chips de filtros activos con opción de eliminar
- Reset de todos los filtros

---

### ProductSearch

**Ubicación**: [`frontend/src/components/product/ProductSearch/`](../../frontend/src/components/product/ProductSearch/)

Barra de búsqueda de productos con autocompletado.

#### Props

```typescript
interface ProductSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  autoComplete?: boolean;
  className?: string;
}
```

#### Características

- Búsqueda en tiempo real con debounce
- Sugerencias de productos
- Teclado navegable (flechas, enter, escape)
- Responsive mobile/desktop

---

### ProductActions

**Ubicación**: [`frontend/src/components/product/ProductActions/`](../../frontend/src/components/product/ProductActions/)

Acciones disponibles para un producto (agregar a carrito, favoritos, compartir).

#### Props

```typescript
interface ProductActionsProps {
  productId: number;
  productName: string;
  stock: number;
  className?: string;
}
```

#### Características

- Selector de cantidad con validación de stock
- Botón de agregar a carrito
- Botón de favoritos
- Botón de compartir (Web Share API)

---

### ProductComments

**Ubicación**: [`frontend/src/components/product/ProductComments/`](../../frontend/src/components/product/ProductComments/)

Sistema completo de comentarios y reseñas de productos.

#### Estructura de Subcomponentes

```
ProductComments/
├── ProductComments.tsx      # Componente principal
├── CommentForm.tsx          # Formulario de nuevo comentario
├── CommentCard.tsx          # Tarjeta de comentario individual
├── CommentStats.tsx         # Estadísticas de comentarios
├── CommentFilters.tsx       # Filtros de ordenamiento
└── index.ts
```

#### Props del Componente Principal

```typescript
interface ProductCommentsProps {
  productId: number;
  productName: string;
}
```

#### Características

- Formulario de comentarios con calificación (1-5 estrellas)
- Carga de imágenes en comentarios (hasta 5)
- Estadísticas: promedio, total, distribución de calificaciones
- Filtros: recientes, antiguos, mejor/peor calificación
- Paginación de comentarios
- Edición y eliminación (solo el autor)
- Validación de autenticación

#### Ejemplo de Uso

```tsx
import ProductComments from '@/components/product/ProductComments';

<ProductComments
  productId={123}
  productName="iPhone 15 Pro"
/>
```

---

### FavoriteButtonReusable

**Ubicación**: [`frontend/src/components/product/FavoriteButtonReusable/`](../../frontend/src/components/product/FavoriteButtonReusable/)

Botón de favoritos reutilizable con sincronización.

#### Props

```typescript
interface FavoriteButtonReusableProps {
  productId: number;
  productName: string;
  size?: 'small' | 'medium' | 'large';
  position?: 'absolute' | 'relative';
  variant?: 'minimal' | 'full';
  className?: string;
}
```

#### Características

- Toggle animado de favorito
- Sincronización con backend
- Validación de autenticación
- Feedback visual con animaciones

---

### OfferCard

**Ubicación**: [`frontend/src/components/product/OfferCard/`](../../frontend/src/components/product/OfferCard/)

Tarjeta destacada para productos en oferta.

#### Props

```typescript
interface OfferCardProps {
  product: Product;
  offer: Offer;
  className?: string;
}

interface Offer {
  id_oferta: number;
  nombre_oferta: string;
  descripcion_oferta: string;
  descuento_porcentaje: number;
  fecha_inicio: string;
  fecha_fin: string;
}
```

#### Características

- Badge de descuento destacado
- Timer de oferta con cuenta regresiva
- Precios comparativos (antes/después)
- Indicador de urgencia (últimas horas)

---

### OfferIndicator

**Ubicación**: [`frontend/src/components/product/OfferIndicator/`](../../frontend/src/components/product/OfferIndicator/)

Badge de descuento para indicar ofertas.

#### Props

```typescript
interface OfferIndicatorProps {
  descuentoPorcentaje: number;
  size?: 'small' | 'medium' | 'large';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showLabel?: boolean;
  className?: string;
}
```

#### Ejemplo de Uso

```tsx
import OfferIndicator from '@/components/product/OfferIndicator';

<OfferIndicator
  descuentoPorcentaje={25}
  size="medium"
  position="top-right"
  showLabel={true}
/>
```

---

### OffersGrid

**Ubicación**: [`frontend/src/components/product/OffersGrid/`](../../frontend/src/components/product/OffersGrid/)

Grid específico para mostrar productos en oferta con OfferCards.

---

### OffersProductsSection

**Ubicación**: [`frontend/src/components/product/OffersProductsSection/`](../../frontend/src/components/product/OffersProductsSection/)

Sección completa de productos en oferta para homepage.

---

### FeaturedProducts

**Ubicación**: [`frontend/src/components/product/FeaturedProducts/`](../../frontend/src/components/product/FeaturedProducts/)

Carrusel de productos destacados para homepage.

#### Características

- Carrusel responsive con navegación
- Auto-play opcional
- Indicadores de página
- Swipe en móvil

---

## Componentes de Carrito

### CartIndicator

**Ubicación**: [`frontend/src/components/cart/CartIndicator/`](../../frontend/src/components/cart/CartIndicator/)

Indicador visual de que un producto está en el carrito.

#### Props

```typescript
interface CartIndicatorProps {
  productId: number;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showQuantity?: boolean;  // Mostrar badge de cantidad
}
```

#### Características

- Badge de cantidad dinámico
- Sincronización con CarritoContext
- Auto-hide cuando cantidad = 0
- Posicionamiento absoluto en cards

#### Ejemplo de Uso

```tsx
import CartIndicator from '@/components/cart/CartIndicator';

<CartIndicator
  productId={123}
  size="small"
  showQuantity={true}
/>
```

---

### CartItemCard

**Ubicación**: [`frontend/src/components/cart/CartItemCard/`](../../frontend/src/components/cart/CartItemCard/)

Tarjeta de item individual del carrito con controles de cantidad.

#### Props

```typescript
interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (itemId: number, newQuantity: number) => void;
  onRemove: (itemId: number) => void;
  disabled?: boolean;
}

interface CartItem {
  id_carrito_item: number;
  id_producto: number;
  nombre: string;
  imagen_url: string;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
  stock_disponible: number;
}
```

#### Características

- Controles de cantidad (+/- con validación)
- Imagen del producto
- Precio unitario y subtotal calculados
- Validación de stock en tiempo real
- Botón de eliminar con confirmación
- Estado de deshabilitado durante operaciones

---

### CartSummary

**Ubicación**: [`frontend/src/components/cart/CartSummary/`](../../frontend/src/components/cart/CartSummary/)

Resumen del carrito con totales y botón de checkout.

#### Props

```typescript
interface CartSummaryProps {
  items: CartItem[];
  subtotal: number;
  descuentos: number;
  envio: number;
  total: number;
  onCheckout: () => void;
  loading?: boolean;
  className?: string;
}
```

#### Características

- Desglose de precios: subtotal, descuentos, envío, total
- Contador de items
- Botón de pagar destacado
- Sticky en scroll (desktop)
- Responsive mobile/desktop

---

## Componentes de Layout

### Layout

**Ubicación**: [`frontend/src/components/layout/Layout/`](../../frontend/src/components/layout/Layout/)

Wrapper principal de la aplicación que contiene Navbar y Footer.

#### Props

```typescript
interface LayoutProps {
  children: React.ReactNode;
  showNavbar?: boolean;
  showFooter?: boolean;
  className?: string;
}
```

#### Ejemplo de Uso

```tsx
import Layout from '@/components/layout/Layout';

<Layout>
  <YourPageContent />
</Layout>
```

---

### Navbar

**Ubicación**: [`frontend/src/components/layout/Navbar/`](../../frontend/src/components/layout/Navbar/)

Barra de navegación principal con búsqueda, carrito y autenticación.

#### Características

- Navegación principal: Productos, Ofertas, Marcas, Contacto
- Barra de búsqueda integrada (ProductSearch)
- Indicador de carrito con contador
- Menú de usuario autenticado
- Toggle de tema claro/oscuro
- Menú móvil con hamburger
- Sticky en scroll
- Logo de TecnoCel

#### Secciones

| Sección | Contenido |
|---------|-----------|
| **Logo** | Imagen y link a home |
| **Navegación secundaria** | Links a páginas principales |
| **Búsqueda** | ProductSearch con autocompletado |
| **Carrito** | Icono con badge de cantidad |
| **Usuario** | Login/Panel según autenticación |
| **Tema** | Toggle claro/oscuro |

---

### Footer

**Ubicación**: [`frontend/src/components/layout/Footer/`](../../frontend/src/components/layout/Footer/)

Pie de página con información de contacto, redes y enlaces.

#### Secciones

- Información de empresa: nombre, descripción, logo
- Enlaces rápidos: Productos, Ofertas, Marcas, Contacto
- Redes sociales: Facebook, Instagram, WhatsApp
- Contacto: teléfono, email, dirección
- Copyright y año actual

---

### HeroSection

**Ubicación**: [`frontend/src/components/layout/HeroSection/`](../../frontend/src/components/layout/HeroSection/)

Sección hero de la homepage con llamada a la acción.

#### Props

```typescript
interface HeroSectionProps {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  ctaText?: string;
  ctaLink?: string;
  overlay?: boolean;
}
```

#### Características

- Imagen de fondo con parallax
- Overlay oscuro opcional
- Título y subtítulo destacados
- CTA con botón
- Responsive mobile/desktop

---

## Componentes de Usuario

### AuthForm

**Ubicación**: [`frontend/src/components/user/AuthForm/`](../../frontend/src/components/user/AuthForm/)

Formulario de inicio de sesión con validaciones.

#### Props

```typescript
interface AuthFormProps {
  onSubmit: (credentials: LoginCredentials) => void;
  loading?: boolean;
  error?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}
```

#### Características

- Validación de email en tiempo real
- Validación de contraseña con requisitos
- Mensajes de error específicos
- Toggle de mostrar/ocultar contraseña
- Botón de Google OAuth
- Link a registro

---

### RegisterForm

**Ubicación**: [`frontend/src/components/user/RegisterForm/`](../../frontend/src/components/user/RegisterForm/)

Formulario de registro de nuevos usuarios.

#### Props

```typescript
interface RegisterFormProps {
  onSubmit: (userData: RegisterData) => void;
  loading?: boolean;
  error?: string;
}

interface RegisterData {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  password_confirmation: string;
  telefono?: string;
}
```

#### Características

- Validación completa de todos los campos
- Confirmación de contraseña con match
- Requisitos de contraseña (min 8 caracteres, etc.)
- Validación de teléfono opcional
- Google OAuth alternativo
- Link a login

---

### InformacionPersonal

**Ubicación**: [`frontend/src/components/user/InformacionPersonal/`](../../frontend/src/components/user/InformacionPersonal/)

Formulario editable para actualizar datos personales del usuario autenticado.

#### Props

Este componente no recibe props, utiliza el contexto `AuthContext` para obtener los datos del usuario.

#### Características

- Edición de nombre y apellido (requeridos)
- Edición de celular (validación 8-15 dígitos)
- Edición de NIT/CI (mínimo 5 caracteres)
- Validación en tiempo real de todos los campos
- Detección automática de cambios
- Sincronización con localStorage y contexto
- Indicador visual de cambios sin guardar
- Botones de cancelar y guardar con estados
- Recarga automática tras actualización exitosa

#### Ejemplo de Uso

```tsx
import InformacionPersonal from '@/components/user/InformacionPersonal';

// Uso en UserPanel
<InformacionPersonal />
```

---

### DatosCuenta

**Ubicación**: [`frontend/src/components/user/DatosCuenta/`](../../frontend/src/components/user/DatosCuenta/)

Componente de solo lectura que muestra información general de la cuenta del usuario.

#### Características

- Muestra email del cliente (no editable)
- Tipo de cuenta: Google OAuth o cuenta normal
- ID de cliente único
- Estado de la cuenta (activo)
- Fecha de registro formateada
- Último acceso formateado
- Carga automática de datos del perfil
- Estados de carga y error
- Badge visual para tipo de cuenta

#### Datos Mostrados

| Campo | Descripción | Editable |
|-------|-------------|----------|
| **Email** | Correo electrónico | No |
| **Tipo de cuenta** | Google/Normal | No |
| **ID Cliente** | Identificador único | No |
| **Estado** | Activo/Inactivo | No |
| **Fecha de registro** | Creación de cuenta | No |
| **Último acceso** | Última sesión | No |

---

### Seguridad

**Ubicación**: [`frontend/src/components/user/Seguridad/`](../../frontend/src/components/user/Seguridad/)

Componente para cambio de contraseña y gestión de seguridad de la cuenta.

#### Características

- Cambio de contraseña para cuentas normales
- Bloqueo automático para cuentas de Google OAuth
- Validación de contraseña actual
- Validación de nueva contraseña:
  - Mínimo 8 caracteres
  - Confirmación de contraseña
  - Match entre nueva contraseña y confirmación
- Toggle de mostrar/ocultar contraseñas
- Mensajes de error específicos por campo
- Recomendaciones de seguridad
- Estados de carga durante el proceso

#### Ejemplo de Uso

```tsx
import Seguridad from '@/components/user/Seguridad';

<Seguridad />
```

---

### Direcciones

**Ubicación**: [`frontend/src/components/user/Direcciones/`](../../frontend/src/components/user/Direcciones/)

Componente CRUD completo para gestión de direcciones de envío del usuario.

#### Características

- Listado de todas las direcciones del cliente
- Grid responsive de tarjetas de dirección
- Creación de nueva dirección con modal
- Edición de direcciones existentes
- Eliminación con modal de confirmación
- Badges visuales:
  - Dirección predeterminada
  - Dirección de facturación
- Información completa de cada dirección:
  - Nombre identificador
  - Calle, número, piso, departamento
  - Barrio, ciudad, provincia
  - Código postal, referencia
  - Teléfono de contacto
- Estado vacío con call-to-action
- Sincronización con backend
- Validaciones de datos

#### Estructura de Dirección

```typescript
interface Direccion {
  id_direccion: number;
  nombre_direccion: string;
  calle: string;
  numero: string;
  piso?: string;
  departamento?: string;  // Apartamento
  barrio: string;
  ciudad: string;
  provincia: string;
  codigo_postal?: string;
  referencia?: string;
  telefono_contacto: string;
  es_predeterminada: boolean;
  es_facturacion: boolean;
}
```

---

### DireccionModal

**Ubicación**: [`frontend/src/components/user/DireccionModal/`](../../frontend/src/components/user/DireccionModal/)

Modal reutilizable para crear y editar direcciones.

#### Props

```typescript
interface DireccionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: DireccionFormData) => Promise<void>;
  direccion?: Direccion;  // Para modo edición
  title?: string;
}
```

#### Características

- Formulario completo con todos los campos de dirección
- Validación en tiempo real:
  - Nombre de dirección (requerido)
  - Calle y número (requeridos)
  - Barrio, ciudad, provincia (requeridos)
  - Teléfono de contacto con validación
- Campos opcionales bien indicados
- Checkboxes para:
  - Dirección predeterminada
  - Dirección de facturación
- Modos: crear nueva o editar existente
- Precarga de datos en modo edición
- Botones de cancelar y guardar
- Estado de guardando con spinner
- Cierre con overlay o botón X

#### Ejemplo de Uso

```tsx
import DireccionModal from '@/components/user/DireccionModal';

<DireccionModal
  isOpen={modalOpen}
  onClose={() => setModalOpen(false)}
  onSave={handleGuardarDireccion}
  direccion={editingDireccion}
  title="Editar Dirección"
/>
```

---

### MisCompras

**Ubicación**: [`frontend/src/components/user/MisCompras/`](../../frontend/src/components/user/MisCompras/)

Componente para mostrar el historial de compras del usuario.

#### Características

- Lista completa de órdenes/ventas del usuario
- Información de cada venta:
  - Número de orden
  - Fecha de compra
  - Estado del pedido
  - Total de la compra
- Detalles expandibles de productos:
  - Nombre del producto
  - Cantidad comprada
  - Precio unitario
  - Subtotal
- Estado vacío si no hay compras
- Ordenamiento por fecha (más reciente primero)
- Estados de carga y error
- Navegación a detalle de orden
- Información de envío y pago

---

### Soporte

**Ubicación**: [`frontend/src/components/user/Soporte/`](../../frontend/src/components/user/Soporte/)

Centro de ayuda y soporte al usuario con FAQ y contacto.

#### Características

- Sección de preguntas frecuentes (FAQ)
  - Acordeón interactivo
  - Categorías de preguntas
  - Búsqueda de preguntas
- Información de contacto:
  - Teléfono de soporte
  - Email de atención al cliente
  - WhatsApp Business
  - Horarios de atención
- Formulario de contacto (opcional)
- Enlaces útiles:
  - Políticas de devolución
  - Términos y condiciones
  - Política de privacidad
- Iconos Material Design
- Diseño responsive

#### FAQ Incluidas

| Categoría | Preguntas |
|-----------|-----------|
| **Pedidos** | ¿Cómo rastrear mi pedido? |
| **Pagos** | ¿Qué métodos de pago aceptan? |
| **Envíos** | ¿Cuánto tarda la entrega? |
| **Devoluciones** | ¿Cómo devolver un producto? |
| **Cuenta** | ¿Cómo cambio mi contraseña? |

---

## Componentes de Ubicación

### Location

**Ubicación**: [`frontend/src/components/location/Location/`](../../frontend/src/components/location/Location/)

Página completa de ubicación de la tienda.

---

### LocationSection

**Ubicación**: [`frontend/src/components/location/LocationSection/`](../../frontend/src/components/location/LocationSection/)

Sección con dirección, horarios y mapa.

---

### GoogleMap

**Ubicación**: [`frontend/src/components/location/GoogleMap/`](../../frontend/src/components/location/GoogleMap/)

Mapa de Google embebido con marker de la tienda.

#### Props

```typescript
interface GoogleMapProps {
  lat: number;
  lng: number;
  zoom?: number;
  markerTitle?: string;
  className?: string;
}
```

---

### HistorySection

**Ubicación**: [`frontend/src/components/location/HistorySection/`](../../frontend/src/components/location/HistorySection/)

Sección de historia de la empresa.

---

## Guías de Uso

### Crear un Nuevo Componente

1. **Crear carpeta del componente**:
```bash
mkdir -p frontend/src/components/category/ComponentName
```

2. **Crear archivos base**:
```bash
cd frontend/src/components/category/ComponentName
touch ComponentName.tsx
touch ComponentName.module.css
touch index.ts
touch types.ts  # Opcional si tiene tipos complejos
```

3. **Estructura del componente TypeScript**:

```tsx
// ComponentName.tsx
import React, { memo } from 'react';
import styles from './ComponentName.module.css';
import type { ComponentNameProps } from './types';

const ComponentName: React.FC<ComponentNameProps> = ({
  prop1,
  prop2,
  className
}) => {
  return (
    <div className={`${styles.container} ${className || ''}`}>
      {/* Contenido */}
    </div>
  );
};

ComponentName.displayName = 'ComponentName';

export default memo(ComponentName);
```

4. **Archivo de tipos**:

```typescript
// types.ts
export interface ComponentNameProps {
  prop1: string;
  prop2?: number;
  className?: string;
}
```

5. **Archivo de exportación**:

```typescript
// index.ts
export { default } from './ComponentName';
export type { ComponentNameProps } from './types';
```

6. **Estilos CSS Modules**:

```css
/* ComponentName.module.css */
.container {
  /* Estilos base */
}

/* Responsive */
@media (max-width: 768px) {
  .container {
    /* Estilos móvil */
  }
}
```

---

### Usar Contextos en Componentes

Los componentes pueden acceder a contextos globales:

```tsx
import { useAuth } from '@/contexts/AuthContext';
import { useCarrito } from '@/contexts/CarritoContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useProducts } from '@/contexts/ProductContext';

const MyComponent = () => {
  // Autenticación
  const { user, isAuthenticated, login, logout } = useAuth();

  // Carrito
  const { estado, agregarItem, eliminarItem } = useCarrito();

  // Notificaciones
  const { showNotification } = useNotification();

  // Tema
  const { theme, toggleTheme } = useTheme();

  // Productos
  const { productos, loading, fetchProductos } = useProducts();

  // Usar en el componente...
};
```

Ver [CONTEXTS.md](./CONTEXTS.md) para documentación completa de contextos.

---

### Optimización de Componentes

#### 1. Memoización

```tsx
import React, { memo, useMemo, useCallback } from 'react';

// Memoizar el componente completo
const ExpensiveComponent = memo(({ data }) => {
  // Memoizar cálculos costosos
  const processedData = useMemo(() => {
    return data.map(item => heavyCalculation(item));
  }, [data]);

  // Memoizar callbacks
  const handleClick = useCallback(() => {
    doSomething(data);
  }, [data]);

  return <div onClick={handleClick}>{processedData}</div>;
});
```

#### 2. Lazy Loading

```tsx
import { lazy, Suspense } from 'react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Lazy load de componente pesado
const HeavyComponent = lazy(() => import('./HeavyComponent'));

const MyPage = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <HeavyComponent />
  </Suspense>
);
```

#### 3. Code Splitting

Los componentes ya están organizados para code splitting automático con Vite.

---

## Convenciones y Mejores Prácticas

### Nomenclatura

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| **Componente** | PascalCase | `ProductCard.tsx` |
| **Archivo CSS** | PascalCase.module.css | `ProductCard.module.css` |
| **Props Interface** | ComponentNameProps | `ProductCardProps` |
| **Hook personalizado** | useCamelCase | `useProductActions` |
| **Constantes** | UPPER_SNAKE_CASE | `MAX_ITEMS_PER_PAGE` |
| **Funciones** | camelCase | `handleAddToCart` |

### Estructura de Props

Ordenar props en este orden:

1. **Props requeridas** (sin `?`)
2. **Props de contenido** (children, title, etc.)
3. **Props de estado** (loading, disabled, error)
4. **Props de eventos** (onClick, onChange, etc.)
5. **Props de estilo** (className, style)
6. **Props opcionales** con `?`

```typescript
interface ComponentProps {
  // Requeridas
  id: number;
  name: string;

  // Contenido
  children?: React.ReactNode;
  title?: string;

  // Estado
  loading?: boolean;
  disabled?: boolean;
  error?: string;

  // Eventos
  onClick?: () => void;
  onChange?: (value: string) => void;

  // Estilos
  className?: string;
  style?: React.CSSProperties;
}
```

### Accesibilidad (a11y)

Todos los componentes deben incluir:

```tsx
<button
  onClick={handleClick}
  disabled={disabled}
  aria-label="Agregar al carrito"
  aria-disabled={disabled}
  aria-busy={loading}
  role="button"
  tabIndex={0}
>
  {children}
</button>
```

### CSS Modules

- Usar clases en **camelCase**: `styles.productCard`
- Prefijos de estado con **is**: `styles.isActive`
- Modificadores con **--**: `styles['button--primary']`
- Mobile-first: media queries de menor a mayor

```css
/* Base styles (mobile) */
.container {
  padding: 1rem;
}

/* Tablet */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    padding: 3rem;
  }
}
```

### TypeScript

- Siempre tipar props con interfaces
- Evitar `any`, usar `unknown` si es necesario
- Usar tipos específicos en lugar de genéricos
- Export de tipos desde index.ts

```typescript
// Mal
const handleClick = (data: any) => { ... }

// Bien
const handleClick = (data: Product) => { ... }
```

### Componentes Funcionales

- Usar arrow functions para componentes
- Usar React.FC con TypeScript
- Añadir displayName para debugging
- Memo para componentes que rerenderean frecuentemente

```tsx
import React, { memo } from 'react';

const MyComponent: React.FC<MyComponentProps> = ({ prop1 }) => {
  return <div>{prop1}</div>;
};

MyComponent.displayName = 'MyComponent';

export default memo(MyComponent);
```

### Manejo de Estados

- useState para estado local simple
- useReducer para estado complejo
- Contextos para estado global
- Custom hooks para lógica reutilizable

```tsx
// Estado local simple
const [count, setCount] = useState(0);

// Estado complejo con useReducer
const [state, dispatch] = useReducer(reducer, initialState);

// Estado global con contexto
const { user } = useAuth();

// Custom hook
const { products, loading } = useProducts();
```

---

## 📊 Resumen de Componentes por Categoría

### Componentes Comunes (6)

| Componente | Descripción | Complejidad |
|------------|-------------|-------------|
| Button | Botón universal con variantes | Media |
| IconButton | Botón solo con icono | Baja |
| LoadingSpinner | Indicador de carga | Baja |
| Notification | Notificación individual | Media |
| NotificationContainer | Contenedor de notificaciones | Media |
| CTASection | Sección de llamada a la acción | Baja |

### Componentes de Productos (14)

| Componente | Descripción | Complejidad |
|------------|-------------|-------------|
| ProductCard | Tarjeta de producto | Alta |
| ProductGrid | Cuadrícula de productos | Media |
| ProductImage | Imagen con galería | Media |
| ProductInfo | Información detallada | Media |
| ProductFeatures | Características técnicas | Baja |
| ProductFilters | Filtros de búsqueda | Alta |
| ProductSearch | Búsqueda con autocompletado | Alta |
| ProductActions | Acciones del producto | Media |
| ProductComments | Sistema de comentarios | Alta |
| FavoriteButtonReusable | Botón de favoritos | Media |
| OfferCard | Tarjeta de oferta | Media |
| OfferIndicator | Badge de descuento | Baja |
| OffersGrid | Grid de ofertas | Media |
| OffersProductsSection | Sección de ofertas | Media |
| FeaturedProducts | Carrusel de destacados | Alta |

### Componentes de Carrito (3)

| Componente | Descripción | Complejidad |
|------------|-------------|-------------|
| CartIndicator | Indicador en carrito | Baja |
| CartItemCard | Item del carrito | Media |
| CartSummary | Resumen de compra | Media |

### Componentes de Layout (4)

| Componente | Descripción | Complejidad |
|------------|-------------|-------------|
| Layout | Wrapper principal | Baja |
| Navbar | Navegación principal | Alta |
| Footer | Pie de página | Baja |
| HeroSection | Hero de homepage | Media |

### Componentes de Usuario (9)

| Componente | Descripción | Complejidad |
|------------|-------------|-------------|
| AuthForm | Login | Media |
| RegisterForm | Registro | Media |
| InformacionPersonal | Datos personales editables | Media |
| DatosCuenta | Información de cuenta | Baja |
| Seguridad | Cambio de contraseña | Media |
| Direcciones | CRUD de direcciones | Alta |
| DireccionModal | Modal de dirección | Media |
| MisCompras | Historial de compras | Media |
| Soporte | Centro de ayuda | Baja |

### Componentes de Ubicación (4)

| Componente | Descripción | Complejidad |
|------------|-------------|-------------|
| Location | Página de ubicación | Baja |
| LocationSection | Sección de ubicación | Baja |
| GoogleMap | Mapa de Google | Baja |
| HistorySection | Historia de empresa | Baja |

---

## 🔗 Enlaces Relacionados

- [Contextos del Frontend](./CONTEXTS.md)
- [Hooks Personalizados](./HOOKS.md)
- [Servicios de API](./SERVICES.md)
- [Sistema de Rutas](./ROUTING.md)
- [Sistema de Estilos](./STYLING.md)
- [Gestión de Estado](./STATE_MANAGEMENT.md)

---

[Volver arriba](#componentes-del-frontend---tecnocel-web) | [Frontend](./README.md) | [Documentación](../README.md) | [Inicio](../../README.md)
