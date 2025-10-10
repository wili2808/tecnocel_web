# Sistema de Estilos - CSS Modules

> Documentación del sistema de estilos, CSS Modules, variables CSS y convenciones de diseño de la aplicación.

---

## Tabla de Contenidos

- [Introducción](#introducción)
- [Arquitectura de Estilos](#arquitectura-de-estilos)
- [CSS Modules](#css-modules)
- [Variables CSS](#variables-css)
- [Sistema de Temas](#sistema-de-temas)
- [Estructura de Archivos](#estructura-de-archivos)
- [Convenciones de Nomenclatura](#convenciones-de-nomenclatura)
- [Utilidades Globales](#utilidades-globales)
- [Responsive Design](#responsive-design)
- [Mejores Prácticas](#mejores-prácticas)

---

## Introducción

Tecnocel Web implementa un sistema de estilos modular basado en **CSS Modules** que proporciona:

- ✅ **Scoping automático** - Previene conflictos de nombres
- ✅ **Variables CSS** - Sistema centralizado de diseño
- ✅ **Temas claro/oscuro** - Soporte nativo para múltiples temas
- ✅ **Utilidades globales** - Clases reutilizables
- ✅ **Responsive design** - Mobile-first approach
- ✅ **Type-safe** - TypeScript para imports de estilos

---

## Arquitectura de Estilos

### Capas del Sistema

```
frontend/src/styles/
├── global.css           # Estilos globales y resets
├── variables.css        # Variables CSS (colores, espaciado, etc.)
└── themes.css           # Temas claro/oscuro

frontend/src/components/
├── common/
│   └── Button/
│       └── Button.module.css    # Estilos del componente
├── product/
│   └── ProductCard/
│       └── ProductCard.module.css
└── ...
```

### Orden de Importación

```tsx
// 1. Estilos globales (solo en App.tsx o main.tsx)
import './styles/global.css';

// 2. CSS Modules en componentes
import styles from './Button.module.css';
```

---

## CSS Modules

### Uso Básico

Los CSS Modules permiten estilos con scope local automático:

```tsx
// Button.tsx
import styles from './Button.module.css';

export const Button = () => {
  return (
    <button className={styles.button}>
      Click me
    </button>
  );
};
```

```css
/* Button.module.css */
.button {
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-primary);
  color: var(--text-inverse);
  border-radius: var(--border-radius-md);
}

.button:hover {
  background-color: var(--color-primary-dark);
}
```

### Composición de Clases

Combinar múltiples clases del módulo:

```tsx
const Button = ({ variant, size }) => {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${styles[size]}`}
    >
      Click me
    </button>
  );
};
```

```css
/* Button.module.css */
.button {
  /* estilos base */
}

.primary {
  background-color: var(--color-primary);
}

.secondary {
  background-color: var(--background-neutral);
}

.sm {
  padding: var(--spacing-sm) var(--spacing-md);
}

.md {
  padding: var(--spacing-md) var(--spacing-lg);
}
```

### Usando clsx para Clases Condicionales

```tsx
import clsx from 'clsx';
import styles from './Button.module.css';

const Button = ({ variant, size, disabled }) => {
  return (
    <button
      className={clsx(
        styles.button,
        styles[variant],
        styles[size],
        disabled && styles.disabled
      )}
    >
      Click me
    </button>
  );
};
```

---

## Variables CSS

### Archivo variables.css

Todas las variables de diseño están centralizadas en `src/styles/variables.css`:

```css
:root {
  /* === COLORES === */
  --color-neutral-50: #FAFAFA;
  --color-neutral-100: #F8FAFC;
  /* ... */

  /* === TIPOGRAFÍA === */
  --font-family-primary: 'Poppins', system-ui, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  /* ... */

  /* === ESPACIADO === */
  --spacing-xs: 0.5rem;
  --spacing-sm: 0.75rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  /* ... */

  /* === BORDES === */
  --border-radius-xs: 4px;
  --border-radius-sm: 6px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  --border-radius-full: 9999px;

  /* === SOMBRAS === */
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

  /* === TRANSICIONES === */
  --transition-fast: 0.15s;
  --transition-normal: 0.3s;
  --transition-slow: 0.5s;
  --transition-curve: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Paleta de Colores

#### Colores Neutros

```css
--color-neutral-50: #FAFAFA;   /* Más claro */
--color-neutral-100: #F8FAFC;
--color-neutral-200: #F1F5F9;
--color-neutral-300: #E2E8F0;
--color-neutral-400: #CBD5E1;
--color-neutral-500: #94A3B8;
--color-neutral-600: #64748B;
--color-neutral-700: #475569;
--color-neutral-800: #334155;
--color-neutral-900: #1E293B;  /* Más oscuro */
```

#### Colores Sky (Principal)

```css
--color-sky-50: #F0F9FF;
--color-sky-100: #E0F2FE;
--color-sky-200: #BAE6FD;
--color-sky-300: #7DD3FC;
--color-sky-400: #38BDF8;
--color-sky-500: #0EA5E9;  /* Color principal */
--color-sky-600: #0284C7;
--color-sky-700: #0369A1;
--color-sky-800: #075985;
--color-sky-900: #0C4A6E;
```

#### Colores de Estado

```css
--color-error: #EF4444;      /* Rojo */
--color-success: #10B981;    /* Verde */
--color-warning: #F59E0B;    /* Amarillo */
--color-info: #3B82F6;       /* Azul */
```

### Uso de Variables

```css
/* Button.module.css */
.button {
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-md);
  font-family: var(--font-family-primary);
  border-radius: var(--border-radius-md);
  transition: all var(--transition-normal) var(--transition-curve);
  box-shadow: var(--shadow-sm);
}

.button:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

---

## Sistema de Temas

### Archivo themes.css

Define las variables específicas de cada tema:

```css
/* Tema Claro */
[data-theme="light"] {
  --color-primary: var(--color-sky-500);
  --color-primary-light: var(--color-sky-400);
  --color-primary-dark: var(--color-sky-600);

  --background-primary: #ffffff;
  --background-secondary: #F1F5F9;
  --background-elevated: #ffffff;
  --background-neutral: #F8FAFC;

  --text-primary: #2d2d2d;
  --text-secondary: #6e6e6e;
  --text-inverse: #ffffff;

  --border-color: #E2E8F0;
  --border-color-dark: #CBD5E1;
}

/* Tema Oscuro */
[data-theme="dark"] {
  --color-primary: var(--color-sky-400);
  --color-primary-light: var(--color-sky-300);
  --color-primary-dark: var(--color-sky-500);

  --background-primary: #18181B;
  --background-secondary: #27272A;
  --background-elevated: #3F3F46;
  --background-neutral: #374151;

  --text-primary: #F8FAFC;
  --text-secondary: #CBD5E1;
  --text-inverse: #2d2d2d;

  --border-color: #3F3F46;
  --border-color-dark: #52525B;
}
```

### Cambio de Tema

El tema se aplica mediante el atributo `data-theme` en el elemento raíz:

```tsx
// ThemeContext.tsx
const applyTheme = (theme: 'light' | 'dark') => {
  document.documentElement.setAttribute('data-theme', theme);
};
```

### Estilos Responsivos al Tema

```css
/* Los componentes automáticamente responden al tema */
.card {
  background-color: var(--background-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

/* Sin necesidad de media queries para temas */
```

---

## Estructura de Archivos

### Organización por Componente

Cada componente tiene su propio archivo CSS Module:

```
Button/
├── Button.tsx
├── Button.module.css
├── Button.test.tsx
└── index.ts
```

### Convención de Nombres

```
ComponentName.module.css
```

Ejemplos:
- `Button.module.css`
- `ProductCard.module.css`
- `Navbar.module.css`
- `CartIndicator.module.css`

---

## Convenciones de Nomenclatura

### Clases en CSS

Usar **camelCase** para nombres de clases en CSS Modules:

```css
/* ✅ Bueno */
.productCard { }
.cardHeader { }
.priceLabel { }
.addToCartButton { }

/* ❌ Malo */
.product-card { }
.CardHeader { }
.price_label { }
```

### Estructura de Clases

```css
/* Elemento base */
.button { }

/* Variantes */
.primary { }
.secondary { }
.danger { }

/* Tamaños */
.sm { }
.md { }
.lg { }

/* Estados */
.disabled { }
.loading { }
.active { }

/* Modificadores */
.fullWidth { }
.rounded { }
.elevated { }
```

### Ejemplo Completo

```css
/* Button.module.css */

/* === BASE === */
.button {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--border-radius-md);
  transition: var(--theme-transition);
}

/* === VARIANTES === */
.primary {
  background-color: var(--color-primary);
  color: var(--text-inverse);
}

.secondary {
  background-color: var(--background-neutral);
  color: var(--text-primary);
}

.danger {
  background-color: var(--color-error);
  color: var(--text-inverse);
}

/* === TAMAÑOS === */
.sm {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: var(--font-size-sm);
}

.md {
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: var(--font-size-md);
}

.lg {
  padding: var(--spacing-lg) var(--spacing-xl);
  font-size: var(--font-size-lg);
}

/* === ESTADOS === */
.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.loading {
  cursor: wait;
  pointer-events: none;
}

/* === MODIFICADORES === */
.fullWidth {
  width: 100%;
}

.rounded {
  border-radius: var(--border-radius-full);
}
```

---

## Utilidades Globales

### Disponibles en global.css

El archivo `global.css` proporciona clases de utilidad reutilizables:

#### Espaciado

```css
/* Márgenes */
.m-0 { margin: 0; }
.mt-xs { margin-top: var(--spacing-xs); }
.mr-sm { margin-right: var(--spacing-sm); }
.mb-md { margin-bottom: var(--spacing-md); }
.ml-lg { margin-left: var(--spacing-lg); }

/* Padding */
.p-0 { padding: 0; }
.pt-xs { padding-top: var(--spacing-xs); }
.pr-sm { padding-right: var(--spacing-sm); }
.pb-md { padding-bottom: var(--spacing-md); }
.pl-lg { padding-left: var(--spacing-lg); }
```

#### Texto

```css
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }

.font-bold { font-weight: 600; }
.font-normal { font-weight: 400; }

.text-primary { color: var(--color-primary); }
.text-secondary { color: var(--color-secondary); }
```

#### Flexbox

```css
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }

.gap-xs { gap: var(--spacing-xs); }
.gap-sm { gap: var(--spacing-sm); }
.gap-md { gap: var(--spacing-md); }
.gap-lg { gap: var(--spacing-lg); }
```

#### Bordes y Sombras

```css
.rounded-sm { border-radius: var(--border-radius-sm); }
.rounded-md { border-radius: var(--border-radius-md); }
.rounded-lg { border-radius: var(--border-radius-lg); }
.rounded-full { border-radius: var(--border-radius-full); }

.shadow-sm { box-shadow: var(--shadow-sm); }
.shadow-md { box-shadow: var(--shadow-md); }
.shadow-lg { box-shadow: var(--shadow-lg); }
```

### Cuándo Usar Utilidades

```tsx
// ✅ Bueno - Para ajustes menores de layout
<div className="flex items-center gap-md">
  <Icon />
  <span>Texto</span>
</div>

// ❌ Malo - Para estilos complejos del componente
<div className="flex items-center gap-md p-lg rounded-md shadow-md bg-primary">
  {/* Usar CSS Module en su lugar */}
</div>
```

---

## Responsive Design

### Breakpoints

Definidos en `variables.css`:

```css
--breakpoint-sm: 480px;   /* Mobile grande */
--breakpoint-md: 768px;   /* Tablet */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Desktop grande */
```

### Mobile-First Approach

Escribir estilos para móvil primero, luego escalar hacia arriba:

```css
/* Mobile first - base styles */
.card {
  padding: var(--spacing-md);
  flex-direction: column;
}

/* Tablet */
@media (min-width: 768px) {
  .card {
    padding: var(--spacing-lg);
    flex-direction: row;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .card {
    padding: var(--spacing-xl);
  }
}
```

### Utilidades Responsive

```css
/* Button.module.css */
.button {
  width: 100%;  /* Mobile: ancho completo */
}

@media (min-width: 768px) {
  .button {
    width: auto;  /* Tablet+: ancho automático */
  }
}

.mobileFullWidth {
  width: 100%;
}

@media (min-width: 640px) {
  .mobileFullWidth {
    width: auto;
  }
}
```

### Variables Responsive

Las variables CSS pueden ajustarse por breakpoint:

```css
:root {
  --container-padding: 1rem;
  --navbar-height: 70px;
}

@media (min-width: 768px) {
  :root {
    --container-padding: 2rem;
  }
}
```

---

## Mejores Prácticas

### 1. Usar Variables CSS

```css
/* ✅ Bueno */
.button {
  padding: var(--spacing-md);
  color: var(--text-primary);
  font-size: var(--font-size-md);
}

/* ❌ Malo */
.button {
  padding: 16px;
  color: #2d2d2d;
  font-size: 1rem;
}
```

### 2. Composición sobre Repetición

```css
/* ✅ Bueno */
.button {
  /* estilos base compartidos */
}

.primary {
  background-color: var(--color-primary);
}

.secondary {
  background-color: var(--background-neutral);
}

/* ❌ Malo */
.primaryButton {
  /* todos los estilos repetidos */
  background-color: var(--color-primary);
}

.secondaryButton {
  /* todos los estilos repetidos */
  background-color: var(--background-neutral);
}
```

### 3. Evitar !important

```css
/* ✅ Bueno - Mayor especificidad */
.button.disabled {
  opacity: 0.6;
}

/* ❌ Malo */
.disabled {
  opacity: 0.6 !important;
}
```

### 4. Organizar por Categorías

```css
/* === LAYOUT === */
.container {
  display: flex;
  align-items: center;
}

/* === TIPOGRAFÍA === */
.title {
  font-size: var(--font-size-2xl);
  font-weight: 600;
}

/* === COLORES === */
.primary {
  background-color: var(--color-primary);
  color: var(--text-inverse);
}

/* === ESTADOS === */
.active {
  /* ... */
}

.disabled {
  /* ... */
}
```

### 5. Prefijos para Modificadores

```css
/* Estados */
.isActive { }
.isDisabled { }
.isLoading { }

/* Variantes */
.variantPrimary { }
.variantSecondary { }

/* Tamaños */
.sizeSmall { }
.sizeMedium { }
.sizeLarge { }
```

### 6. Documentar Componentes Complejos

```css
/**
 * Button Component Styles
 *
 * Variantes: primary, secondary, danger, success
 * Tamaños: xs, sm, md, lg, xl
 * Estados: disabled, loading, active
 */

.button {
  /* ... */
}
```

### 7. Transiciones Suaves

```css
.button {
  transition: var(--theme-transition);
}

/* Definición en variables.css */
--theme-transition:
  background-color var(--transition-normal) var(--transition-curve),
  color var(--transition-normal) var(--transition-curve),
  border-color var(--transition-normal) var(--transition-curve),
  box-shadow var(--transition-normal) var(--transition-curve);
```

### 8. Accesibilidad

```css
/* Focus visible para navegación por teclado */
.button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  box-shadow: var(--shadow-focus);
}

/* Reducir movimiento para usuarios con preferencias */
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## Recursos Adicionales

### Documentación Oficial

- [CSS Modules](https://github.com/css-modules/css-modules)
- [CSS Variables (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)

### Documentación del Proyecto

- [Sistema de Temas](THEMING.md)
- [Componentes](COMPONENTS.md)
- [Guía de Diseño](../project/DESIGN_SYSTEM.md)

---

**Última actualización**: 8 de Octubre, 2025
**Versión**: 1.0
**Estado**: Completado

---

**[Volver arriba](#tabla-de-contenidos)** | **[Frontend](README.md)** | **[Documentación](../README.md)**
