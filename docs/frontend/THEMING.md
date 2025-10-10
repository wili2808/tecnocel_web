# Sistema de Temas

> Documentación del sistema de temas claro/oscuro de la aplicación, incluyendo implementación, personalización y mejores prácticas.

---

## Tabla de Contenidos

- [Introducción](#introducción)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [ThemeContext](#themecontext)
- [Configuración de Temas](#configuración-de-temas)
- [Uso en Componentes](#uso-en-componentes)
- [Variables de Tema](#variables-de-tema)
- [Personalización](#personalización)
- [Transiciones Suaves](#transiciones-suaves)
- [Persistencia](#persistencia)
- [Mejores Prácticas](#mejores-prácticas)

---

## Introducción

Tecnocel Web implementa un sistema de temas dinámico que permite alternar entre modo claro y oscuro. El sistema proporciona:

- ✅ **Dos temas predefinidos** - Claro y oscuro
- ✅ **Persistencia automática** - Guarda preferencia del usuario
- ✅ **Sincronización con sistema** - Detecta preferencias del OS
- ✅ **Transiciones suaves** - Cambios visuales fluidos
- ✅ **Variables CSS dinámicas** - Personalización sencilla
- ✅ **TypeScript** - Type-safe theme management

---

## Arquitectura del Sistema

### Componentes Clave

```
frontend/src/
├── contexts/
│   └── ThemeContext.tsx        # Contexto y lógica del tema
├── styles/
│   ├── themes.css              # Definición de temas
│   └── variables.css           # Variables base
└── App.tsx                     # Provider principal
```

### Flujo de Datos

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
interface ThemeContextType {
  theme: Theme;                    // 'light' | 'dark'
  toggleTheme: () => void;         // Alterna entre temas
  setTheme: (theme: Theme) => void;  // Establece tema específico
}
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

---

## Configuración de Temas

### Archivo themes.css

Los temas se definen mediante el atributo `data-theme` en `:root`:

```css
/* Tema Claro */
:root[data-theme="light"] {
  /* Colores principales */
  --color-primary: var(--color-sky-600);
  --color-primary-dark: var(--color-sky-700);
  --color-primary-light: var(--color-sky-400);

  /* Fondos */
  --background-primary: #ffffff;
  --background-secondary: #F1F5F9;
  --background-elevated: #ffffff;
  --background-neutral: #F8FAFC;

  /* Textos */
  --text-primary: #2d2d2d;
  --text-secondary: #6e6e6e;
  --text-inverse: #ffffff;

  /* Bordes */
  --border-color: var(--color-neutral-500);
  --border-color-light: var(--color-neutral-400);
}

/* Tema Oscuro */
:root[data-theme="dark"] {
  /* Colores principales */
  --color-primary: var(--color-sky-500);
  --color-primary-dark: var(--color-sky-600);
  --color-primary-light: var(--color-sky-300);

  /* Fondos */
  --background-primary: #18181B;
  --background-secondary: #27272A;
  --background-elevated: #3F3F46;
  --background-neutral: #374151;

  /* Textos */
  --text-primary: #F8FAFC;
  --text-secondary: #CBD5E1;
  --text-inverse: #2d2d2d;

  /* Bordes */
  --border-color: var(--color-zinc-700);
  --border-color-light: var(--color-neutral-800);
}
```

### Aplicación del Tema

El `ThemeContext` actualiza automáticamente el atributo `data-theme`:

```tsx
// ThemeContext.tsx
useEffect(() => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}, [theme]);
```

---

## Uso en Componentes

### Componentes con CSS Modules

```tsx
// ProductCard.tsx
import styles from './ProductCard.module.css';

const ProductCard = () => {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Producto</h3>
      <p className={styles.description}>Descripción</p>
    </div>
  );
};
```

```css
/* ProductCard.module.css */
.card {
  background-color: var(--background-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-lg);
  transition: var(--theme-transition);
}

.title {
  color: var(--text-primary);
  font-size: var(--font-size-xl);
}

.description {
  color: var(--text-secondary);
  font-size: var(--font-size-md);
}
```

### Botón de Cambio de Tema

```tsx
// ThemeToggle.tsx
import { useTheme } from '@/contexts/ThemeContext';
import { FaSun, FaMoon } from 'react-icons/fa';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Cambiar a tema ${theme === 'light' ? 'oscuro' : 'claro'}`}
      className="theme-toggle"
    >
      {theme === 'light' ? <FaMoon /> : <FaSun />}
    </button>
  );
};
```

### Estilos Condicionales por Tema

```tsx
const Component = () => {
  const { theme } = useTheme();

  return (
    <div
      style={{
        background: theme === 'light' ? '#ffffff' : '#1a1a1a',
        color: theme === 'light' ? '#000000' : '#ffffff'
      }}
    >
      Contenido
    </div>
  );
};
```

**Nota**: Preferir variables CSS sobre estilos inline condicionales.

---

## Variables de Tema

### Variables Principales

#### Colores de Fondo

```css
--background-primary       # Fondo principal de la página
--background-secondary     # Fondo secundario (cards, sidebars)
--background-elevated      # Fondo elevado (modales, dropdowns)
--background-neutral       # Fondo neutral (hover states)
```

#### Colores de Texto

```css
--text-primary            # Texto principal
--text-secondary          # Texto secundario (descriptions)
--text-inverse            # Texto inverso (botones)
--text-muted              # Texto apagado (placeholders)
--text-disabled           # Texto deshabilitado
```

#### Colores de Borde

```css
--border-color            # Borde estándar
--border-color-light      # Borde claro
--border-color-dark       # Borde oscuro
```

#### Colores Primarios

```css
--color-primary           # Color principal de la marca
--color-primary-light     # Variante clara
--color-primary-dark      # Variante oscura
```

### Variables con Transparencias

Para efectos visuales y overlays:

```css
/* Tema Claro */
--color-primary-rgb: 2, 132, 199;  /* RGB del color principal */

/* Transparencias generadas */
--color-primary-50: rgba(var(--color-primary-rgb), 0.05);
--color-primary-100: rgba(var(--color-primary-rgb), 0.1);
--color-primary-200: rgba(var(--color-primary-rgb), 0.2);
--color-primary-300: rgba(var(--color-primary-rgb), 0.3);
--color-primary-400: rgba(var(--color-primary-rgb), 0.4);
```

Uso:

```css
.card {
  background-color: var(--color-primary-100);
  box-shadow: 0 4px 12px var(--color-primary-200);
}
```

---

## Personalización

### Agregar un Nuevo Tema

#### Paso 1: Definir el Tema

```css
/* themes.css */
:root[data-theme="custom"] {
  --color-primary: #FF6B6B;
  --background-primary: #FFFACD;
  --text-primary: #2C3E50;
  /* ... más variables */
}
```

#### Paso 2: Actualizar TypeScript

```tsx
// ThemeContext.tsx
export type Theme = 'light' | 'dark' | 'custom';
```

#### Paso 3: Agregar Opción en UI

```tsx
<select onChange={(e) => setTheme(e.target.value as Theme)}>
  <option value="light">Claro</option>
  <option value="dark">Oscuro</option>
  <option value="custom">Personalizado</option>
</select>
```

### Personalizar Colores Existentes

Modificar variables en `themes.css`:

```css
:root[data-theme="dark"] {
  /* Cambiar el color primario */
  --color-primary: #10B981;  /* Verde en lugar de azul */

  /* Cambiar fondos */
  --background-primary: #0F172A;  /* Azul oscuro */
  --background-secondary: #1E293B;
}
```

---

## Transiciones Suaves

### Variable de Transición Global

```css
/* variables.css */
--theme-transition:
  background-color var(--transition-normal) var(--transition-curve),
  color var(--transition-normal) var(--transition-curve),
  border-color var(--transition-normal) var(--transition-curve),
  box-shadow var(--transition-normal) var(--transition-curve);
```

### Aplicar Transiciones

```css
.component {
  transition: var(--theme-transition);
}

/* O específicamente */
.component {
  background-color: var(--background-primary);
  color: var(--text-primary);
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}
```

### Clase de Utilidad

```css
/* themes.css */
.theme-aware {
  transition: var(--theme-transition);
}

.theme-aware-all {
  transition: all var(--transition-normal) var(--transition-curve);
}
```

Uso:

```tsx
<div className="theme-aware">
  Contenido con transición suave
</div>
```

---

## Persistencia

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
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleChange = (e: MediaQueryListEvent) => {
    setThemeState(e.matches ? 'dark' : 'light');
  };

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
      theme === 'light' ? '#ffffff' : '#1a1a1a'
    );
  }
}, [theme]);
```

---

## Mejores Prácticas

### 1. Usar Variables CSS Siempre

```css
/* ✅ Bueno */
.component {
  background-color: var(--background-primary);
  color: var(--text-primary);
}

/* ❌ Malo */
.component {
  background-color: #ffffff;
  color: #000000;
}
```

### 2. Evitar Estilos Condicionales Inline

```tsx
/* ✅ Bueno */
<div className={styles.card}>Content</div>

/* ❌ Malo */
<div style={{
  backgroundColor: theme === 'light' ? '#fff' : '#000'
}}>
  Content
</div>
```

### 3. Probar Ambos Temas

Verificar que todos los componentes funcionan correctamente en ambos temas:

```tsx
// En desarrollo
const DevThemeToggle = () => {
  const { toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>Toggle</button>;
};
```

### 4. Usar Transiciones Apropiadas

```css
/* ✅ Bueno - solo propiedades que cambian */
.card {
  transition:
    background-color var(--transition-normal),
    color var(--transition-normal);
}

/* ❌ Malo - transition: all puede ser lento */
.card {
  transition: all 0.3s;
}
```

### 5. Considerar Contraste

Asegurar buen contraste en ambos temas:

```css
/* Tema claro */
:root[data-theme="light"] {
  --text-primary: #2d2d2d;      /* Oscuro sobre claro */
  --background-primary: #ffffff;
}

/* Tema oscuro */
:root[data-theme="dark"] {
  --text-primary: #F8FAFC;       /* Claro sobre oscuro */
  --background-primary: #18181B;
}
```

### 6. Documentar Variables Personalizadas

```css
/**
 * Variables del tema personalizado
 *
 * --custom-highlight: Color para elementos destacados
 * --custom-shadow: Sombra personalizada para cards
 */
:root[data-theme="custom"] {
  --custom-highlight: #FF6B6B;
  --custom-shadow: 0 4px 12px rgba(255, 107, 107, 0.2);
}
```

### 7. Fallbacks para Variables

```css
.component {
  /* Fallback por si la variable no está definida */
  background-color: var(--background-primary, #ffffff);
  color: var(--text-primary, #000000);
}
```

### 8. Accesibilidad

```tsx
// Botón de tema con aria-label
<button
  onClick={toggleTheme}
  aria-label={`Cambiar a tema ${theme === 'light' ? 'oscuro' : 'claro'}`}
  aria-pressed={theme === 'dark'}
>
  {theme === 'light' ? <MoonIcon /> : <SunIcon />}
</button>
```

---

## Recursos Adicionales

### Documentación Oficial

- [CSS Custom Properties (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [prefers-color-scheme (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme)

### Documentación del Proyecto

- [Sistema de Estilos](STYLING.md)
- [Contextos](CONTEXTS.md)
- [Variables CSS](../project/DESIGN_SYSTEM.md)

---

**Última actualización**: 8 de Octubre, 2025
**Versión**: 1.0
**Estado**: Completado

---

**[Volver arriba](#tabla-de-contenidos)** | **[Frontend](README.md)** | **[Documentación](../README.md)**
