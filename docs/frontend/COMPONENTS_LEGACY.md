# 📚 Documentación de Componentes - TecnoCel Web

## 📋 Resumen Ejecutivo

Este documento proporciona una visión completa de todos los componentes implementados en el proyecto TecnoCel Web, organizados por categorías funcionales. Incluye análisis de uso, estado de implementación y recomendaciones de mantenimiento.

---

## 🏗️ Estructura de Componentes

### 📁 Organización por Dominios

```
components/
├── common/          # Componentes reutilizables genéricos
├── product/         # Componentes específicos de productos
├── cart/           # Componentes del carrito de compras
├── user/           # Componentes de autenticación y usuario
├── layout/         # Componentes de estructura y navegación
├── location/       # Componentes de ubicación y mapas
└── admin/          # Componentes de administración (vacío)
```

---

## 🎯 Componentes Common (Reutilizables)

### ✅ Componentes Activos

#### 1. LoadingSpinner

- **Archivo**: `common/LoadingSpinner/LoadingSpinner.tsx`
- **Uso**: Indicador de carga con tamaños configurables
- **Props**: `size` (sm/md/lg), `text`, `className`
- **Estado**: ✅ Implementado y en uso
- **Ubicaciones de uso**: Múltiples componentes de carga

#### 2. IconButton

- **Archivo**: `common/IconButton/IconButton.tsx`
- **Uso**: Botón con iconos de Material Design
- **Props**: `icon`, `onClick`, `variant`, `size`, `disabled`, `ariaLabel`
- **Estado**: ✅ Implementado y ampliamente utilizado
- **Ubicaciones de uso**: Navbar, ProductCard, múltiples componentes

#### 3. Notification

- **Archivo**: `common/Notification/Notification.tsx`
- **Uso**: Notificaciones del sistema
- **Props**: `type`, `message`, `onClose`
- **Estado**: ✅ Implementado y en uso
- **Ubicaciones de uso**: Sistema de notificaciones global

#### 4. NotificationContainer

- **Archivo**: `common/NotificationContainer/NotificationContainer.tsx`
- **Uso**: Contenedor para múltiples notificaciones
- **Props**: `notifications`, `onRemove`
- **Estado**: ✅ Implementado y en uso
- **Ubicaciones de uso**: Layout principal

#### 5. CTASection

- **Archivo**: `common/CTASection/CTASection.tsx`
- **Uso**: Sección de llamada a la acción
- **Props**: `title`, `description`, `buttonText`, `onClick`
- **Estado**: ✅ Implementado y en uso
- **Ubicaciones de uso**: Página Home

#### 6. Button

- **Archivo**: `common/Button/Button.tsx`
- **Uso**: Botón universal con múltiples variantes y configuraciones
- **Props**: `variant`, `size`, `disabled`, `loading`, `type`, `href`, `icon`, `fullWidth`, `rounded`, `elevated`, `glass`
- **Estado**: ✅ Implementado y en uso
- **Características**: Soporte para botones, enlaces, formularios, múltiples variantes visuales
- **Ubicaciones de uso**: Componente base para toda la aplicación

---

## 🛍️ Componentes Product (Productos)

### ✅ Componentes Activos y Recientemente Actualizados

#### 1. ProductCard

- **Archivo**: `product/ProductCard/ProductCard.tsx`
- **Uso**: Tarjeta de producto básica con favoritos y ofertas integrados
- **Props**: `product`, `onAddToCart`, `onFavorite`
- **Estado**: ✅ Implementado y actualizado recientemente
- **Características**: Integración completa con favoritos y ofertas

#### 2. ProductCardExtensive

- **Archivo**: `product/ProductCardExtensive/ProductCardExtensive.tsx`
- **Uso**: Tarjeta de producto extendida con más información
- **Props**: `product`, `onAddToCart`, `onFavorite`
- **Estado**: ✅ Implementado y actualizado recientemente
- **Características**: Layout horizontal, información detallada

#### 3. ProductGrid

- **Archivo**: `product/ProductGrid/ProductGrid.tsx`
- **Uso**: Grid responsivo de productos
- **Props**: `products`, `loading`, `error`
- **Estado**: ✅ Implementado y en uso
- **Ubicaciones de uso**: Catálogo de productos, página de ofertas

#### 4. ProductImage

- **Archivo**: `product/ProductImage/ProductImage.tsx`
- **Uso**: Componente de imagen de producto con lazy loading
- **Props**: `src`, `alt`, `className`
- **Estado**: ✅ Implementado y en uso
- **Ubicaciones de uso**: ProductCard, ProductPage

#### 5. ProductInfo

- **Archivo**: `product/ProductInfo/ProductInfo.tsx`
- **Uso**: Información detallada del producto
- **Props**: `product`, `onAddToCart`
- **Estado**: ✅ Implementado y en uso
- **Ubicaciones de uso**: ProductPage

#### 6. ProductActions

- **Archivo**: `product/ProductActions/ProductActions.tsx`
- **Uso**: Acciones del producto (agregar al carrito, favoritos)
- **Props**: `product`, `onAddToCart`, `onFavorite`
- **Estado**: ✅ Implementado y en uso
- **Ubicaciones de uso**: ProductPage

#### 7. ProductFeatures

- **Archivo**: `product/ProductFeatures/ProductFeatures.tsx`
- **Uso**: Características del producto
- **Props**: `features`
- **Estado**: ✅ Implementado y en uso
- **Ubicaciones de uso**: ProductPage

#### 8. ProductComments

- **Archivo**: `product/ProductComments/ProductComments.tsx`
- **Uso**: Sistema de comentarios del producto
- **Props**: `productId`, `comments`
- **Estado**: ✅ Implementado y en uso
- **Ubicaciones de uso**: ProductPage

#### 9. ProductSearch

- **Archivo**: `product/ProductSearch/ProductSearch.tsx`
- **Uso**: Búsqueda de productos
- **Props**: `onSearch`, `placeholder`
- **Estado**: ✅ Implementado y en uso
- **Ubicaciones de uso**: Navbar, ProductCatalog

#### 10. ProductFilters

- **Archivo**: `product/ProductFilters/ProductFilters.tsx`
- **Uso**: Barra de filtros de productos
- **Props**: `filters`, `onFilterChange`
- **Estado**: ✅ Implementado y en uso
- **Ubicaciones de uso**: ProductCatalog

#### 11. ProductSorting

- **Archivo**: `product/ProductSorting/ProductSorting.tsx`
- **Uso**: Ordenamiento de productos
- **Props**: `onSort`, `currentSort`
- **Estado**: ✅ Implementado y en uso
- **Ubicaciones de uso**: ProductCatalog

#### 13. FeaturedProducts

- **Archivo**: `product/FeaturedProducts/FeaturedProducts.tsx`
- **Uso**: Productos destacados
- **Props**: `products`, `title`
- **Estado**: ✅ Implementado y en uso
- **Ubicaciones de uso**: Home

### 🆕 Componentes Nuevos y Reutilizables

#### 14. FavoriteButtonReusable

- **Archivo**: `product/FavoriteButtonReusable/FavoriteButtonReusable.tsx`
- **Uso**: Botón de favoritos reutilizable con múltiples variantes
- **Props**: `productId`, `productName`, `size`, `position`, `variant`, `showText`
- **Estado**: ✅ Implementado y en uso
- **Características**: Múltiples tamaños, posiciones y variantes
- **Ubicaciones de uso**: ProductCard, ProductCardExtensive, ProductPage

#### 15. OfferIndicator

- **Archivo**: `product/OfferIndicator/OfferIndicator.tsx`
- **Uso**: Indicador de oferta reutilizable
- **Props**: `descuentoPorcentaje`, `size`, `position`, `showLabel`
- **Estado**: ✅ Implementado y en uso
- **Características**: Múltiples tamaños y posiciones
- **Ubicaciones de uso**: ProductCard, ProductCardExtensive, CartItem

### 🎯 Componentes de Ofertas

#### 16. OfferCard

- **Archivo**: `product/OfferCard/OfferCard.tsx`
- **Uso**: Tarjeta de oferta
- **Props**: `offer`, `onClick`
- **Estado**: ✅ Implementado y en uso
- **Ubicaciones de uso**: OffersGrid

#### 17. OffersGrid

- **Archivo**: `product/OffersGrid/OffersGrid.tsx`
- **Uso**: Grid de ofertas
- **Props**: `offers`, `loading`
- **Estado**: ✅ Implementado y en uso
- **Ubicaciones de uso**: Página de ofertas

#### 18. OffersProductsSection

- **Archivo**: `product/OffersProductsSection/OffersProductsSection.tsx`
- **Uso**: Sección de productos en oferta
- **Props**: `products`, `title`
- **Estado**: ✅ Implementado y en uso
- **Ubicaciones de uso**: Home, página de ofertas

---

## 🛒 Componentes Cart (Carrito)

### ✅ Componentes Activos

#### 1. CartItemCard

- **Archivo**: `cart/CartItemCard/CartItemCard.tsx`
- **Uso**: Tarjeta de item del carrito
- **Props**: `item`, `onUpdateQuantity`, `onRemove`
- **Estado**: ✅ Implementado y en uso
- **Ubicaciones de uso**: Página del carrito

#### 2. CartSummary

- **Archivo**: `cart/CartSummary/CartSummary.tsx`
- **Uso**: Resumen del carrito con totales
- **Props**: `items`, `onCheckout`
- **Estado**: ✅ Implementado y en uso
- **Ubicaciones de uso**: Página del carrito

#### 3. CartIndicator

- **Archivo**: `cart/CartIndicator/CartIndicator.tsx`
- **Uso**: Indicador visual de productos en el carrito
- **Props**: `productId`, `className`
- **Estado**: ✅ Implementado y en uso
- **Características**: Muestra cantidad de productos en carrito, optimizado con useMemo
- **Ubicaciones de uso**: ProductCard, ProductPage

---

## 👤 Componentes User (Usuario)

### ✅ Componentes Activos

#### 1. AuthForm

- **Archivo**: `user/AuthForm/AuthForm.tsx`
- **Uso**: Formulario de autenticación
- **Props**: `type` (login/register), `onSubmit`
- **Estado**: ✅ Implementado y en uso
- **Ubicaciones de uso**: Páginas de login y registro

#### 2. RegisterForm

- **Archivo**: `user/RegisterForm/RegisterForm.tsx`
- **Uso**: Formulario de registro
- **Props**: `onSubmit`, `onGoogleAuth`
- **Estado**: ✅ Implementado y en uso
- **Ubicaciones de uso**: Página de registro

---

## 🏗️ Componentes Layout (Estructura)

### ✅ Componentes Activos

#### 1. Layout

- **Archivo**: `layout/Layout/Layout.tsx`
- **Uso**: Layout principal de la aplicación
- **Props**: `children`
- **Estado**: ✅ Implementado y en uso
- **Ubicaciones de uso**: App.tsx

#### 2. Navbar

- **Archivo**: `layout/Navbar/Navbar.tsx`
- **Uso**: Barra de navegación principal
- **Props**: Ninguna (usa contextos)
- **Estado**: ✅ Implementado y en uso
- **Características**: Integración con autenticación, carrito, tema
- **Ubicaciones de uso**: Layout

#### 3. Footer

- **Archivo**: `layout/Footer/Footer.tsx`
- **Uso**: Pie de página
- **Props**: Ninguna
- **Estado**: ✅ Implementado y en uso
- **Ubicaciones de uso**: Layout

#### 4. HeroSection

- **Archivo**: `layout/HeroSection/HeroSection.tsx`
- **Uso**: Sección hero de la página principal
- **Props**: `title`, `subtitle`, `ctaText`, `onCtaClick`
- **Estado**: ✅ Implementado y en uso
- **Ubicaciones de uso**: Home

---

## 📍 Componentes Location (Ubicación)

### ✅ Componentes Activos

#### 1. Location

- **Archivo**: `location/Location/Location.tsx`
- **Uso**: Página de ubicación principal
- **Props**: Ninguna
- **Estado**: ✅ Implementado y en uso
- **Ubicaciones de uso**: Ruta /contacto

#### 2. LocationSection

- **Archivo**: `location/LocationSection/LocationSection.tsx`
- **Uso**: Sección de ubicación
- **Props**: `title`, `address`, `phone`, `email`
- **Estado**: ✅ Implementado y en uso
- **Ubicaciones de uso**: Location

#### 3. GoogleMap

- **Archivo**: `location/GoogleMap/GoogleMap.tsx`
- **Uso**: Integración con Google Maps
- **Props**: `latitude`, `longitude`, `zoom`
- **Estado**: ✅ Implementado y en uso
- **Ubicaciones de uso**: Location

#### 4. HistorySection

- **Archivo**: `location/HistorySection/HistorySection.tsx`
- **Uso**: Sección de historia de la empresa
- **Props**: `title`, `content`
- **Estado**: ✅ Implementado y en uso
- **Ubicaciones de uso**: Location

---

## 🚫 Componentes Admin (Administración)

### ❌ Estado Actual

- **Directorio**: `admin/`
- **Estado**: Vacío - Sin componentes implementados
- **Nota**: Pendiente de desarrollo para panel de administración

---

## 📊 Análisis de Uso y Estado

### ✅ Componentes Activos y en Uso: 29

- Todos los componentes principales están implementados y funcionando
- Integración completa con el sistema de autenticación y carrito
- Responsive design implementado en todos los componentes
- Nuevo componente Button agregado como componente base universal

### 🚫 Componentes Pendientes: 1

1. **Admin** - Directorio vacío, pendiente de desarrollo

---

## 🎨 Sistema de Diseño Implementado

### Variables CSS Centralizadas

- Todos los componentes utilizan el sistema de variables CSS
- Consistencia en colores, espaciado y tipografía
- Soporte para temas claro/oscuro

### Responsive Design

- Mobile-first approach implementado
- Breakpoints: 480px, 768px, 1024px, 1440px
- Componentes adaptativos en todas las resoluciones

### Accesibilidad

- ARIA labels implementados
- Navegación por teclado
- Contraste de colores adecuado

---

## 🔧 Integración con Contextos

### Contextos Utilizados

- **AuthContext**: Autenticación y sesión de usuario
- **CarritoContext**: Estado del carrito de compras
- **NotificationContext**: Sistema de notificaciones
- **SearchContext**: Estado de búsqueda y filtros
- **ThemeContext**: Gestión de tema claro/oscuro

### Patrones de Integración

- Hooks personalizados para lógica de negocio
- Componentes conectados a contextos apropiados
- Separación clara entre UI y lógica de estado

---

## 🚀 Recomendaciones de Mantenimiento

### Inmediatas

1. ✅ **Eliminar DataDebugger** - Completado
2. ✅ **Migrar FavoriteButton** a FavoriteButtonReusable - Completado
3. ✅ **Migrar OfferBadge** a OfferIndicator - Completado
4. ✅ **Limpiar imports** no utilizados - Completado
5. ✅ **Componente Button universal** - Implementado

### A Mediano Plazo

1. **Implementar componentes Admin** para panel de administración
2. **Optimizar bundle size** con lazy loading
3. **Agregar tests** para componentes críticos
4. **Documentar props** con TypeScript JSDoc

### A Largo Plazo

1. **Implementar Storybook** para documentación visual
2. **Agregar tests de integración**
3. **Optimizar performance** con React.memo y useMemo
4. **Implementar PWA features**

---

## 📝 Nota de Actualización

**IMPORTANTE**: Este README debe actualizarse cada vez que se modifique, agregue o elimine un componente. Para mantener la documentación actualizada:

1. **Al crear un nuevo componente**: Agregar entrada en la sección correspondiente
2. **Al modificar un componente**: Actualizar descripción y estado
3. **Al eliminar un componente**: Marcar como deprecado o eliminar entrada
4. **Al cambiar uso de componentes**: Actualizar sección "Ubicaciones de uso"

### Proceso de Actualización

1. Modificar el componente
2. Actualizar este README
3. Verificar que la documentación refleje el estado actual
4. Commit con mensaje descriptivo

---

## 📚 Documentación Relacionada

- [README de Productos](./product/README_COMPONENTES_ACTUALIZADOS.md)
- [Sistema de Colores Centralizado](../styles/variables.css)
- [Guía de Estilos](../styles/themes.css)
- [Documentación del Backend](../../../backend/CONFIGURACION.md)

---

_Última actualización: Diciembre 2024_
_Total de componentes documentados: 29_
_Componentes activos: 29_
_Componentes pendientes: 1_

---

**[⬆ Volver arriba](#tabla-de-contenidos)** | **[📚 Documentación](../README.md)** | **[🏠 Inicio](../../README.md)**
