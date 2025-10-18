# Sistema de Estilos y Temas - TecnoCel Web

> Documentación completa del sistema de estilos CSS Modules, variables CSS, y el sistema de temas claro/oscuro de la aplicación.

---

## Tabla de Contenidos

- [Introducción](#introducción)
- [Arquitectura de Estilos](#arquitectura-de-estilos)
- [CSS Modules](#css-modules)
- [Variables CSS](#variables-css)
- [Sistema de Temas](#sistema-de-temas)
- [ThemeContext](#themecontext)
- [Uso en Componentes](#uso-en-componentes)
- [Estructura de Archivos](#estructura-de-archivos)
- [Convenciones de Nomenclatura](#convenciones-de-nomenclatura)
- [Utilidades Globales](#utilidades-globales)
- [Responsive Design](#responsive-design)
- [Transiciones y Animaciones](#transiciones-y-animaciones)
- [Persistencia de Tema](#persistencia-de-tema)
- [Personalización](#personalización)
- [Mejores Prácticas](#mejores-prácticas)

---

## Introducción

TecnoCel Web implementa un sistema de estilos moderno y escalable basado en **CSS Modules** con soporte completo para temas claro/oscuro. El sistema proporciona:

### Características Principales

- ✅ **Scoping automático** - CSS Modules previenen conflictos de nombres
- ✅ **Variables CSS** - Sistema centralizado de diseño con tokens
- ✅ **Temas claro/oscuro** - Alternancia dinámica con persistencia
- ✅ **Sincronización con sistema** - Detecta preferencias del OS
- ✅ **Transiciones suaves** - Cambios visuales fluidos entre temas
- ✅ **Utilidades globales** - Clases reutilizables para layouts comunes
- ✅ **Responsive design** - Mobile-first approach con breakpoints
- ✅ **Type-safe** - TypeScript para imports de estilos
- ✅ **Accesibilidad** - WCAG 2.1 AA compatible

---

## Arquitectura de Estilos

### Capas del Sistema

```
frontend/src/styles/
├── global.css           # Estilos globales y resets
├── variables.css        # Variables CSS (colores, espaciado, tipografía)
└── themes.css           # Definición de temas claro/oscuro

frontend/src/contexts/
└── ThemeContext.tsx     # Lógica y estado del tema

frontend/src/components/
├── common/
│   └── Button/
│       ├── Button.tsx
│       └── Button.module.css    # Estilos con scope local
├── product/
│   └── ProductCard/
│       ├── ProductCard.tsx
│       └── ProductCard.module.css
└── ...
```

### Orden de Importación

```tsx
// 1. Estilos globales (solo en App.tsx o main.tsx)
import './styles/global.css';
import './styles/variables.css';
import './styles/themes.css';

// 2. CSS Modules en componentes individuales
import styles from './Button.module.css';
```

### Flujo del Sistema de Temas

```
Usuario → toggleTheme() → ThemeContext
                              ↓
                    Actualiza estado
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
            localStorage         document.documentElement
                                 [data-theme="dark"]
                                        ↓
                                  CSS aplica estilos
```

---

## CSS Modules

### Uso Básico

Los CSS Modules permiten estilos con scope local automático:

```tsx
// Button.tsx
import styles from './Button.module.css';

export const Button = ({ children }) => {
  return (
    <button className={styles.button}>
      {children}
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
  transition: var(--theme-transition);
}

.button:hover {
  background-color: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
```

### Composición de Clases

Combinar múltiples clases del módulo:

```tsx
const Button = ({ variant, size, disabled }) => {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${disabled ? styles.disabled : ''}`}
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

/* Variantes */
.primary {
  background-color: var(--color-primary);
}

.secondary {
  background-color: var(--background-neutral);
}

.danger {
  background-color: var(--color-error);
}

/* Tamaños */
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

/* Estados */
.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}
```

### Usando clsx para Clases Condicionales

```tsx
import clsx from 'clsx';
import styles from './Button.module.css';

const Button = ({ variant, size, disabled, fullWidth }) => {
  return (
    <button
      className={clsx(
        styles.button,
        styles[variant],
        styles[size],
        {
          [styles.disabled]: disabled,
          [styles.fullWidth]: fullWidth
        }
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
  /* === COLORES NEUTROS === */
  --color-neutral-50: #FAFAFA;
  --color-neutral-100: #F8FAFC;
  --color-neutral-200: #F1F5F9;
  --color-neutral-300: #E2E8F0;
  --color-neutral-400: #CBD5E1;
  --color-neutral-500: #94A3B8;
  --color-neutral-600: #64748B;
  --color-neutral-700: #475569;
  --color-neutral-800: #334155;
  --color-neutral-900: #1E293B;

  /* === COLORES SKY (PRINCIPAL) === */
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

  /* === COLORES PÚRPURA (SECUNDARIO) === */
  --color-purple-400: #A78BFA;
  --color-purple-500: #8B5CF6;
  --color-purple-600: #7C3AED;
  --color-purple-700: #6D28D9;

  /* === COLORES DE ESTADO === */
  --color-error: #EF4444;      /* Rojo */
  --color-success: #10B981;    /* Verde */
  --color-warning: #F59E0B;    /* Amarillo */
  --color-info: #3B82F6;       /* Azul */

  /* === TIPOGRAFÍA === */
  --font-family-primary: 'Poppins', system-ui, -apple-system, sans-serif;
  --font-family-secondary: 'Roboto', system-ui, sans-serif;

  --font-size-xs: 0.75rem;     /* 12px */
  --font-size-sm: 0.875rem;    /* 14px */
  --font-size-md: 1rem;        /* 16px */
  --font-size-lg: 1.125rem;    /* 18px */
  --font-size-xl: 1.25rem;     /* 20px */
  --font-size-2xl: 1.5rem;     /* 24px */
  --font-size-3xl: 1.875rem;   /* 30px */
  --font-size-4xl: 2.25rem;    /* 36px */

  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;

  /* === ESPACIADO === */
  --spacing-xs: 0.5rem;        /* 8px */
  --spacing-sm: 0.75rem;       /* 12px */
  --spacing-md: 1rem;          /* 16px */
  --spacing-lg: 1.5rem;        /* 24px */
  --spacing-xl: 2rem;          /* 32px */
  --spacing-2xl: 2.5rem;       /* 40px */
  --spacing-3xl: 3rem;         /* 48px */
  --spacing-4xl: 4rem;         /* 64px */

  /* === BORDES === */
  --border-radius-xs: 4px;
  --border-radius-sm: 6px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  --border-radius-xl: 16px;
  --border-radius-full: 9999px;

  --border-width-thin: 1px;
  --border-width-medium: 2px;
  --border-width-thick: 4px;

  /* === SOMBRAS === */
  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  --shadow-focus: 0 0 0 3px rgba(14, 165, 233, 0.3);

  /* === TRANSICIONES === */
  --transition-fast: 0.15s;
  --transition-normal: 0.3s;
  --transition-slow: 0.5s;
  --transition-curve: cubic-bezier(0.4, 0, 0.2, 1);

  /* === BREAKPOINTS === */
  --breakpoint-sm: 480px;      /* Mobile grande */
  --breakpoint-md: 768px;      /* Tablet */
  --breakpoint-lg: 1024px;     /* Desktop */
  --breakpoint-xl: 1280px;     /* Desktop grande */
  --breakpoint-2xl: 1440px;    /* Desktop extra grande */

  /* === Z-INDEX === */
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
}
```

### Uso de Variables

```css
/* ProductCard.module.css */
.card {
  padding: var(--spacing-lg);
  font-size: var(--font-size-md);
  font-family: var(--font-family-primary);
  border-radius: var(--border-radius-md);
  transition: all var(--transition-normal) var(--transition-curve);
  box-shadow: var(--shadow-sm);
  background-color: var(--background-elevated);
  color: var(--text-primary);
  border: var(--border-width-thin) solid var(--border-color);
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.description {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
}
```

---

## Sistema de Temas

### Archivo themes.css

Define las variables específicas de cada tema mediante el atributo `data-theme`:

```css
/* === TEMA CLARO === */
:root[data-theme="light"] {
  /* Colores principales */
  --color-primary: var(--color-sky-600);
  --color-primary-dark: var(--color-sky-700);
  --color-primary-light: var(--color-sky-400);
  --color-secondary: var(--color-purple-600);

  /* Fondos */
  --background-primary: #ffffff;
  --background-secondary: #F1F5F9;
  --background-elevated: #ffffff;
  --background-neutral: #F8FAFC;
  --background-hover: #F1F5F9;

  /* Textos */
  --text-primary: #2d2d2d;
  --text-secondary: #6e6e6e;
  --text-muted: #94A3B8;
  --text-inverse: #ffffff;
  --text-disabled: #CBD5E1;

  /* Bordes */
  --border-color: #E2E8F0;
  --border-color-light: #F1F5F9;
  --border-color-dark: #CBD5E1;

  /* Sombras con contexto de tema */
  --shadow-colored: 0 4px 6px -1px rgba(14, 165, 233, 0.1);
}

/* === TEMA OSCURO === */
:root[data-theme="dark"] {
  /* Colores principales */
  --color-primary: var(--color-sky-500);
  --color-primary-dark: var(--color-sky-600);
  --color-primary-light: var(--color-sky-300);
  --color-secondary: var(--color-purple-500);

  /* Fondos */
  --background-primary: #18181B;
  --background-secondary: #27272A;
  --background-elevated: #3F3F46;
  --background-neutral: #374151;
  --background-hover: #3F3F46;

  /* Textos */
  --text-primary: #F8FAFC;
  --text-secondary: #CBD5E1;
  --text-muted: #94A3B8;
  --text-inverse: #2d2d2d;
  --text-disabled: #64748B;

  /* Bordes */
  --border-color: #3F3F46;
  --border-color-light: #27272A;
  --border-color-dark: #52525B;

  /* Sombras con contexto de tema */
  --shadow-colored: 0 4px 6px -1px rgba(14, 165, 233, 0.2);
}

/* === TRANSICIÓN DE TEMA === */
* {
  transition-property: background-color, color, border-color, box-shadow;
  transition-duration: var(--transition-normal);
  transition-timing-function: var(--transition-curve);
}

/* Desactivar transiciones en elementos que no las necesitan */
*:where(img, svg, video, canvas, iframe) {
  transition: none;
}
```

### Variables con Transparencias

Para efectos visuales y overlays:

```css
/* themes.css */
:root[data-theme="light"],
:root[data-theme="dark"] {
  /* RGB del color principal para transparencias */
  --color-primary-rgb: 14, 165, 233;

  /* Transparencias generadas */
  --color-primary-alpha-5: rgba(var(--color-primary-rgb), 0.05);
  --color-primary-alpha-10: rgba(var(--color-primary-rgb), 0.1);
  --color-primary-alpha-20: rgba(var(--color-primary-rgb), 0.2);
  --color-primary-alpha-30: rgba(var(--color-primary-rgb), 0.3);
  --color-primary-alpha-50: rgba(var(--color-primary-rgb), 0.5);
}
```

Uso:

```css
.badge {
  background-color: var(--color-primary-alpha-10);
  color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary-alpha-20);
}

.overlay {
  background-color: var(--color-primary-alpha-50);
  backdrop-filter: blur(4px);
}
```

---

## ThemeContext

### Configuración del Provider

El `ThemeProvider` envuelve la aplicación completa:

```tsx
// App.tsx
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      {/* Resto de la aplicación */}
    </ThemeProvider>
  );
}
```

### API del Contexto

```tsx
// ThemeContext.tsx
interface ThemeContextType {
  theme: Theme;                      // 'light' | 'dark'
  toggleTheme: () => void;           // Alterna entre temas
  setTheme: (theme: Theme) => void;  // Establece tema específico
}

export type Theme = 'light' | 'dark';
```

### Hook useTheme

```tsx
import { useTheme } from '@/contexts/ThemeContext';

const Component = () => {
  const { theme, toggleTheme, setTheme } = useTheme();

  return (
    <div>
      <p>Tema actual: {theme}</p>
      <button onClick={toggleTheme}>
        Alternar tema
      </button>
      <button onClick={() => setTheme('light')}>
        Modo claro
      </button>
      <button onClick={() => setTheme('dark')}>
        Modo oscuro
      </button>
    </div>
  );
};
```

### Implementación del Contexto

```tsx
// ThemeContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

export const ThemeProvider = ({ children, defaultTheme = 'dark' }: ThemeProviderProps) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      return (savedTheme as Theme) || defaultTheme;
    } catch (error) {
      console.error('Error al cargar el tema:', error);
      return defaultTheme;
    }
  });

  useEffect(() => {
    // Aplicar tema al elemento raíz
    document.documentElement.setAttribute('data-theme', theme);

    // Guardar en localStorage
    localStorage.setItem('theme', theme);

    // Actualizar meta theme-color para móviles
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        theme === 'light' ? '#ffffff' : '#18181B'
      );
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme debe ser usado dentro de ThemeProvider');
  }
  return context;
};
```

---

## Uso en Componentes

### Componentes con CSS Modules

```tsx
// ProductCard.tsx
import { useTheme } from '@/contexts/ThemeContext';
import styles from './ProductCard.module.css';

const ProductCard = ({ product }) => {
  const { theme } = useTheme();

  return (
    <div className={styles.card}>
      <img
        src={product.image}
        alt={product.name}
        className={styles.image}
      />
      <h3 className={styles.title}>{product.name}</h3>
      <p className={styles.description}>{product.description}</p>
      <span className={styles.price}>${product.price}</span>
      <button className={styles.button}>
        Agregar al carrito
      </button>
    </div>
  );
};
```

```css
/* ProductCard.module.css */
.card {
  background-color: var(--background-elevated);
  color: var(--text-primary);
  border: var(--border-width-thin) solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  transition: var(--theme-transition);
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
  border-color: var(--color-primary);
}

.image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-md);
}

.title {
  color: var(--text-primary);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-xs);
}

.description {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);
  margin-bottom: var(--spacing-md);
}

.price {
  color: var(--color-primary);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  display: block;
  margin-bottom: var(--spacing-md);
}

.button {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  background-color: var(--color-primary);
  color: var(--text-inverse);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.button:hover {
  background-color: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
```

### Botón de Cambio de Tema

```tsx
// ThemeToggle.tsx
import { useTheme } from '@/contexts/ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';
import styles from './ThemeToggle.module.css';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={styles.toggle}
      aria-label={`Cambiar a tema ${theme === 'light' ? 'oscuro' : 'claro'}`}
      aria-pressed={theme === 'dark'}
    >
      {theme === 'light' ? (
        <FaMoon className={styles.icon} />
      ) : (
        <FaSun className={styles.icon} />
      )}
    </button>
  );
};

export default ThemeToggle;
```

```css
/* ThemeToggle.module.css */
.toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: var(--background-neutral);
  border: var(--border-width-thin) solid var(--border-color);
  border-radius: var(--border-radius-full);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.toggle:hover {
  background-color: var(--background-hover);
  transform: rotate(15deg) scale(1.1);
  box-shadow: var(--shadow-md);
}

.toggle:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.icon {
  font-size: var(--font-size-lg);
  color: var(--color-primary);
  transition: all var(--transition-normal);
}

.toggle:hover .icon {
  transform: scale(1.1);
}
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
- `ThemeToggle.module.css`

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
.isActive { }
.variantPrimary { }

/* ❌ Malo */
.product-card { }
.CardHeader { }
.price_label { }
```

### Estructura de Clases

```css
/* === BASE === */
.button { }

/* === VARIANTES === */
.primary { }
.secondary { }
.danger { }
.success { }

/* === TAMAÑOS === */
.sm { }
.md { }
.lg { }
.xl { }

/* === ESTADOS === */
.disabled { }
.loading { }
.active { }
.hover { }

/* === MODIFICADORES === */
.fullWidth { }
.rounded { }
.elevated { }
.outline { }
```

### Prefijos para Modificadores

```css
/* Estados booleanos */
.isActive { }
.isDisabled { }
.isLoading { }
.isOpen { }

/* Variantes */
.variantPrimary { }
.variantSecondary { }
.variantDanger { }

/* Tamaños */
.sizeSmall { }
.sizeMedium { }
.sizeLarge { }
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
.mt-sm { margin-top: var(--spacing-sm); }
.mt-md { margin-top: var(--spacing-md); }
.mt-lg { margin-top: var(--spacing-lg); }
.mt-xl { margin-top: var(--spacing-xl); }

.mr-xs { margin-right: var(--spacing-xs); }
.mb-md { margin-bottom: var(--spacing-md); }
.ml-lg { margin-left: var(--spacing-lg); }

/* Padding */
.p-0 { padding: 0; }
.p-xs { padding: var(--spacing-xs); }
.p-sm { padding: var(--spacing-sm); }
.p-md { padding: var(--spacing-md); }
.p-lg { padding: var(--spacing-lg); }
.p-xl { padding: var(--spacing-xl); }
```

#### Texto

```css
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }

.font-bold { font-weight: var(--font-weight-bold); }
.font-semibold { font-weight: var(--font-weight-semibold); }
.font-medium { font-weight: var(--font-weight-medium); }
.font-normal { font-weight: var(--font-weight-normal); }

.text-primary { color: var(--text-primary); }
.text-secondary { color: var(--text-secondary); }
.text-muted { color: var(--text-muted); }
```

#### Flexbox

```css
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.flex-col { flex-direction: column; }
.flex-row { flex-direction: row; }

.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.items-end { align-items: flex-end; }

.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }
.justify-around { justify-content: space-around; }

.gap-xs { gap: var(--spacing-xs); }
.gap-sm { gap: var(--spacing-sm); }
.gap-md { gap: var(--spacing-md); }
.gap-lg { gap: var(--spacing-lg); }
.gap-xl { gap: var(--spacing-xl); }
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
.shadow-xl { box-shadow: var(--shadow-xl); }
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
--breakpoint-sm: 480px;      /* Mobile grande */
--breakpoint-md: 768px;      /* Tablet */
--breakpoint-lg: 1024px;     /* Desktop */
--breakpoint-xl: 1280px;     /* Desktop grande */
--breakpoint-2xl: 1440px;    /* Desktop extra grande */
```

### Mobile-First Approach

Escribir estilos para móvil primero, luego escalar hacia arriba:

```css
/* Mobile first - base styles */
.card {
  padding: var(--spacing-md);
  flex-direction: column;
  width: 100%;
}

.title {
  font-size: var(--font-size-lg);
}

/* Tablet (768px+) */
@media (min-width: 768px) {
  .card {
    padding: var(--spacing-lg);
    flex-direction: row;
    width: auto;
  }

  .title {
    font-size: var(--font-size-xl);
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .card {
    padding: var(--spacing-xl);
    max-width: 1200px;
  }

  .title {
    font-size: var(--font-size-2xl);
  }
}

/* Desktop grande (1280px+) */
@media (min-width: 1280px) {
  .card {
    max-width: 1440px;
  }
}
```

### Grid Responsive

```css
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-md);
}

/* Tablet: 2 columnas */
@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-lg);
  }
}

/* Desktop: 3 columnas */
@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Desktop XL: 4 columnas */
@media (min-width: 1280px) {
  .grid {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--spacing-xl);
  }
}
```

### Variables Responsive

Las variables CSS pueden ajustarse por breakpoint:

```css
:root {
  --container-padding: 1rem;
  --navbar-height: 60px;
  --font-size-hero: 2rem;
}

@media (min-width: 768px) {
  :root {
    --container-padding: 2rem;
    --navbar-height: 70px;
    --font-size-hero: 3rem;
  }
}

@media (min-width: 1024px) {
  :root {
    --container-padding: 3rem;
    --navbar-height: 80px;
    --font-size-hero: 4rem;
  }
}
```

---

## Transiciones y Animaciones

### Variable de Transición Global

```css
/* variables.css */
:root {
  --theme-transition:
    background-color var(--transition-normal) var(--transition-curve),
    color var(--transition-normal) var(--transition-curve),
    border-color var(--transition-normal) var(--transition-curve),
    box-shadow var(--transition-normal) var(--transition-curve);
}
```

### Aplicar Transiciones

```css
.component {
  transition: var(--theme-transition);
}

/* O específicamente */
.button {
  background-color: var(--color-primary);
  color: var(--text-inverse);
  transform: scale(1);
  transition:
    background-color 0.3s ease,
    transform 0.2s ease,
    box-shadow 0.3s ease;
}

.button:hover {
  background-color: var(--color-primary-dark);
  transform: scale(1.05);
  box-shadow: var(--shadow-lg);
}
```

### Animaciones Personalizadas

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.fadeIn {
  animation: fadeIn var(--transition-normal) var(--transition-curve);
}

.slideIn {
  animation: slideIn var(--transition-normal) var(--transition-curve);
}

.pulse {
  animation: pulse 2s ease-in-out infinite;
}
```

### Reducir Movimiento

Respetar preferencias de usuario:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## Persistencia de Tema

### localStorage

El tema se guarda automáticamente en localStorage:

```tsx
// ThemeContext.tsx
useEffect(() => {
  localStorage.setItem('theme', theme);
}, [theme]);
```

### Carga Inicial

```tsx
const [theme, setThemeState] = useState<Theme>(() => {
  try {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as Theme) || 'dark';
  } catch (error) {
    console.error('Error al cargar el tema:', error);
    return 'dark';
  }
});
```

### Sincronización con Preferencias del Sistema

```tsx
useEffect(() => {
  // Solo sincronizar si no hay tema guardado
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) return;

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleChange = (e: MediaQueryListEvent) => {
    setThemeState(e.matches ? 'dark' : 'light');
  };

  // Aplicar tema inicial del sistema
  setThemeState(mediaQuery.matches ? 'dark' : 'light');

  mediaQuery.addEventListener('change', handleChange);

  return () => {
    mediaQuery.removeEventListener('change', handleChange);
  };
}, []);
```

### Meta Theme Color para Móviles

```tsx
useEffect(() => {
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute(
      'content',
      theme === 'light' ? '#ffffff' : '#18181B'
    );
  }
}, [theme]);
```

---

## Personalización

### Agregar un Nuevo Tema

#### Paso 1: Definir el Tema en CSS

```css
/* themes.css */
:root[data-theme="custom"] {
  /* Colores principales */
  --color-primary: #FF6B6B;
  --color-primary-dark: #E63946;
  --color-primary-light: #FF8A8A;

  /* Fondos */
  --background-primary: #FFFACD;
  --background-secondary: #FFF8DC;
  --background-elevated: #FFFFF0;
  --background-neutral: #FFEFD5;

  /* Textos */
  --text-primary: #2C3E50;
  --text-secondary: #34495E;
  --text-inverse: #FFFACD;

  /* Bordes */
  --border-color: #F4A460;
  --border-color-light: #FFE4B5;
  --border-color-dark: #DAA520;
}
```

#### Paso 2: Actualizar TypeScript

```tsx
// ThemeContext.tsx
export type Theme = 'light' | 'dark' | 'custom';
```

#### Paso 3: Agregar Opción en UI

```tsx
const ThemeSelector = () => {
  const { theme, setTheme } = useTheme();

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value as Theme)}
    >
      <option value="light">Claro</option>
      <option value="dark">Oscuro</option>
      <option value="custom">Personalizado</option>
    </select>
  );
};
```

### Personalizar Colores Existentes

Modificar variables en `themes.css`:

```css
:root[data-theme="dark"] {
  /* Cambiar el color primario a verde */
  --color-primary: #10B981;
  --color-primary-dark: #059669;
  --color-primary-light: #34D399;

  /* Cambiar a fondo azul oscuro */
  --background-primary: #0F172A;
  --background-secondary: #1E293B;
  --background-elevated: #334155;
}
```

---

## Mejores Prácticas

### 1. Usar Variables CSS Siempre

```css
/* ✅ Bueno */
.button {
  padding: var(--spacing-md);
  color: var(--text-primary);
  font-size: var(--font-size-md);
  border-radius: var(--border-radius-md);
  background-color: var(--color-primary);
}

/* ❌ Malo */
.button {
  padding: 16px;
  color: #2d2d2d;
  font-size: 1rem;
  border-radius: 8px;
  background-color: #0EA5E9;
}
```

### 2. Composición sobre Repetición

```css
/* ✅ Bueno */
.button {
  /* estilos base compartidos */
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  font-weight: var(--font-weight-medium);
  transition: var(--theme-transition);
}

.primary {
  background-color: var(--color-primary);
  color: var(--text-inverse);
}

.secondary {
  background-color: var(--background-neutral);
  color: var(--text-primary);
}

/* ❌ Malo */
.primaryButton {
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  font-weight: var(--font-weight-medium);
  background-color: var(--color-primary);
  color: var(--text-inverse);
}

.secondaryButton {
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  font-weight: var(--font-weight-medium);
  background-color: var(--background-neutral);
  color: var(--text-primary);
}
```

### 3. Evitar !important

```css
/* ✅ Bueno - Mayor especificidad */
.button.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

/* ❌ Malo */
.disabled {
  opacity: 0.6 !important;
  cursor: not-allowed !important;
}
```

### 4. Organizar CSS por Categorías

```css
/* === LAYOUT === */
.container {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

/* === TIPOGRAFÍA === */
.title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
}

/* === COLORES === */
.primary {
  background-color: var(--color-primary);
  color: var(--text-inverse);
}

/* === ESTADOS === */
.active {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

/* === RESPONSIVE === */
@media (min-width: 768px) {
  .container {
    gap: var(--spacing-lg);
  }
}
```

### 5. Documentar Componentes Complejos

```css
/**
 * Button Component Styles
 *
 * Variantes: primary, secondary, danger, success, outline
 * Tamaños: xs, sm, md, lg, xl
 * Estados: disabled, loading, active
 * Modificadores: fullWidth, rounded, elevated
 *
 * Ejemplo:
 * <button className={`${styles.button} ${styles.primary} ${styles.lg}`}>
 */

.button {
  /* ... */
}
```

### 6. Evitar Estilos Condicionales Inline

```tsx
/* ✅ Bueno */
<div className={styles.card}>Content</div>

/* ❌ Malo */
<div style={{
  backgroundColor: theme === 'light' ? '#fff' : '#000',
  color: theme === 'light' ? '#000' : '#fff'
}}>
  Content
</div>
```

### 7. Usar Transiciones Apropiadas

```css
/* ✅ Bueno - solo propiedades que cambian */
.card {
  transition:
    background-color var(--transition-normal),
    color var(--transition-normal),
    box-shadow var(--transition-normal),
    transform var(--transition-fast);
}

/* ❌ Malo - transition: all puede ser lento */
.card {
  transition: all 0.3s;
}
```

### 8. Considerar Contraste y Accesibilidad

```css
/* Asegurar buen contraste en ambos temas */
:root[data-theme="light"] {
  --text-primary: #2d2d2d;      /* Contraste 13:1 sobre #ffffff */
  --background-primary: #ffffff;
}

:root[data-theme="dark"] {
  --text-primary: #F8FAFC;       /* Contraste 14:1 sobre #18181B */
  --background-primary: #18181B;
}

/* Focus visible para navegación por teclado */
.button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  box-shadow: var(--shadow-focus);
}

/* Estados hover y focus */
.link:hover,
.link:focus-visible {
  color: var(--color-primary);
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
}
```

### 9. Fallbacks para Variables

```css
.component {
  /* Fallback por si la variable no está definida */
  background-color: var(--background-primary, #ffffff);
  color: var(--text-primary, #000000);
  padding: var(--spacing-md, 1rem);
}
```

### 10. Testing Visual en Ambos Temas

Siempre verificar componentes en ambos temas durante desarrollo:

```tsx
// Componente de desarrollo para testing rápido
const DevThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div style={{ position: 'fixed', top: 10, right: 10, zIndex: 9999 }}>
      <button onClick={toggleTheme}>
        {theme === 'light' ? '🌙' : '☀️'} Toggle Theme
      </button>
    </div>
  );
};
```

---

## Recursos Adicionales

### Documentación Oficial

- [CSS Modules](https://github.com/css-modules/css-modules)
- [CSS Variables (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [prefers-color-scheme (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Documentación del Proyecto

- [Componentes](COMPONENTS.md)
- [Contextos](CONTEXTS.md)
- [Guía de Frontend](README.md)

### Herramientas Útiles

- [Contrast Checker](https://webaim.org/resources/contrastchecker/) - Verificar contraste de colores
- [Color Palette Generator](https://coolors.co/) - Generar paletas de colores
- [CSS Variables Inspector](https://chrome.google.com/webstore) - Extensión para inspeccionar variables CSS

---

**Última actualización**: 15 de Octubre, 2025
**Versión**: 2.0 (Unificado)
**Estado**: Completado

---

**[Volver arriba](#tabla-de-contenidos)** | **[Frontend](README.md)** | **[Documentación](../README.md)** | **[Inicio](../../README.md)**
