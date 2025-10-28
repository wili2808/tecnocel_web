# 🎨 Sistema de Estilos TecnoCel Web

Guía completa del sistema de estilos optimizado para el proyecto TecnoCel Web.

---

## 📋 Tabla de Contenidos

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Cuándo Usar Cada Archivo](#cuándo-usar-cada-archivo)
3. [Sistema RGB para Transparencias](#sistema-rgb-para-transparencias)
4. [Variables Más Usadas](#variables-más-usadas)
5. [Mejores Prácticas](#mejores-prácticas)
6. [Migración de Componentes](#migración-de-componentes)
7. [Cheatsheet Rápido](#cheatsheet-rápido)

---

## 🏗️ Arquitectura del Sistema

```
variables.css → Define TODAS las variables base (paleta, espaciado, tipografía, RGB)
     ↓
themes.css → Mapea a nombres semánticos por tema (light/dark)
     ↓
global.css → Importa ambos + define reset CSS y estilos globales
     ↓
Component.module.css → Usa variables semánticas de themes.css
```

### Flujo de Datos

1. **variables.css** contiene todos los valores "duros" (colores hex, tamaños en px/rem)
2. **themes.css** mapea esos valores a nombres semánticos que cambian según el tema
3. **global.css** importa ambos y define estilos base de HTML
4. **Component.module.css** usa las variables semánticas

---

## 📂 Cuándo Usar Cada Archivo

### 1. `variables.css` - Variables Base

**✅ Definir aquí:**
- Paletas de colores completas (sky-50 a sky-900)
- Sistema de espaciado (spacing-xs a spacing-4xl)
- Tipografía (font-size, font-weight, font-family)
- Sombras base (shadow-xs a shadow-xl)
- Bordes (border-radius, border-width)
- Transiciones y animaciones
- **Variables RGB para transparencias**
- Breakpoints y z-index

**❌ NO definir aquí:**
- Variables que cambien según el tema (light/dark)
- Estilos CSS (solo variables)
- Componentes específicos

**Ejemplo:**
```css
/* ✅ BIEN - Variable base */
--color-sky-600: #0284C7;
--spacing-md: 1rem;
--font-size-lg: 1.125rem;

/* ✅ BIEN - RGB para transparencias */
--color-sky-600-rgb: 2, 132, 199;

/* ❌ MAL - Variable semántica (va en themes.css) */
--color-primary: #0284C7;
```

---

### 2. `themes.css` - Mapeo Semántico

**✅ Definir aquí:**
- Colores primarios/secundarios/accent del tema
- Colores de texto (primary, secondary, muted, inverse)
- Colores de fondo (primary, secondary, elevated)
- Colores de borde
- Sombras que cambian con el tema
- **Variables RGB dinámicas que cambian por tema**

**❌ NO definir aquí:**
- Valores base hardcodeados
- Paletas de colores completas
- Estilos CSS

**Ejemplo:**
```css
/* ✅ BIEN - Mapeo semántico que cambia por tema */
:root[data-theme="light"] {
  --color-primary: var(--color-sky-600);
  --text-primary: var(--color-text-light-primary);
  --color-primary-rgb: 2, 132, 199; /* Cambia en dark */
}

:root[data-theme="dark"] {
  --color-primary: var(--color-sky-500); /* Más claro */
  --text-primary: var(--color-text-dark-primary);
  --color-primary-rgb: 14, 165, 233; /* Diferente en dark */
}

/* ❌ MAL - Valor hardcodeado (va en variables.css) */
:root[data-theme="light"] {
  --color-primary: #0284C7;
}
```

---

### 3. `global.css` - Reset y Estilos Globales

**✅ Definir aquí:**
- Reset CSS (`* { margin: 0; ... }`)
- Estilos de elementos HTML base (body, h1-h6, a, button, input)
- Componentes base globales (.btn, .btn-primary, .container)
- Layout containers (.app, .main-content, .section)
- Clases utilitarias reutilizables (.flex, .grid, .gap-md)

**❌ NO definir aquí:**
- Variables CSS nuevas (van en variables.css o themes.css)
- Estilos específicos de un solo componente

**Ejemplo:**
```css
/* ✅ BIEN - Reset y estilos base */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-family-primary);
  color: var(--text-primary);
}

/* ✅ BIEN - Componente base global */
.btn {
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--border-radius-md);
}

/* ❌ MAL - Variable nueva (va en variables.css) */
:root {
  --my-new-color: #ff0000;
}

/* ❌ MAL - Componente específico (va en ProductCard.module.css) */
.productCard {
  border: 1px solid var(--border-color);
}
```

---

### 4. `Component.module.css` - Estilos de Componentes

**✅ Usar aquí:**
- Variables semánticas de themes.css
- Variables RGB para transparencias
- Variables de espaciado, tipografía, bordes
- Clases con alcance de componente

**❌ NO usar aquí:**
- Colores hardcodeados (#0EA5E9, rgb(), rgba())
- Variables base directamente (--color-sky-600)
- Valores hardcodeados (16px, 1rem sin variables)

**Ejemplo:**
```css
/* ✅ BIEN - Variables semánticas */
.productCard {
  background-color: var(--background-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-md);
}

.productCard:hover {
  box-shadow: 0 4px 8px rgba(var(--color-primary-rgb), 0.3);
}

/* ❌ MAL - Colores hardcodeados */
.productCard {
  background-color: #ffffff;
  color: #2d2d2d;
  box-shadow: 0 4px 8px rgba(14, 165, 233, 0.3);
}

/* ❌ MAL - Variable base directamente */
.productCard {
  background-color: var(--color-neutral-100);
  color: var(--color-neutral-900);
}
```

---

## 🌈 Sistema RGB para Transparencias

### ¿Por qué RGB?

Los colores con transparencia (rgba) necesitan adaptarse al tema. Con el sistema RGB, puedes usar transparencias dinámicas:

```css
/* ❌ MAL - Hardcodeado, no se adapta al tema */
box-shadow: 0 4px 8px rgba(14, 165, 233, 0.3);
background: rgba(255, 255, 255, 0.9);

/* ✅ BIEN - Usa variables RGB, se adapta al tema */
box-shadow: 0 4px 8px rgba(var(--color-primary-rgb), 0.3);
background: rgba(var(--color-white-rgb), 0.9);
```

### Variables RGB Disponibles

**En variables.css (valores base):**
```css
/* Paleta principal */
--color-sky-500-rgb: 14, 165, 233;
--color-sky-600-rgb: 2, 132, 199;
--color-cyan-500-rgb: 6, 182, 212;

/* Estados */
--color-error-rgb: 239, 68, 68;
--color-success-rgb: 16, 185, 129;
--color-warning-rgb: 245, 158, 11;
--color-info-rgb: 59, 130, 246;

/* Neutrales */
--color-white-rgb: 255, 255, 255;
--color-black-rgb: 0, 0, 0;
--color-neutral-900-rgb: 30, 41, 59;
```

**En themes.css (dinámicas por tema):**
```css
/* Estas cambian según el tema */
--color-primary-rgb: ...      /* sky-600 en light, sky-500 en dark */
--color-secondary-rgb: ...    /* cyan-500 en light, cyan-400 en dark */
--text-primary-rgb: ...       /* #2d2d2d en light, #F8FAFC en dark */
--background-primary-rgb: ... /* #ffffff en light, #18181B en dark */
```

### Cómo Usarlas

```css
/* Sombras con color del tema */
.card {
  box-shadow: 0 4px 12px rgba(var(--color-primary-rgb), 0.2);
}

.card:hover {
  box-shadow: 0 8px 24px rgba(var(--color-primary-rgb), 0.4);
}

/* Fondos con transparencia */
.overlay {
  background: rgba(var(--color-black-rgb), 0.5);
}

.modal-backdrop {
  background: rgba(var(--background-primary-rgb), 0.95);
}

/* Bordes con transparencia */
.input {
  border: 1px solid rgba(var(--color-primary-rgb), 0.3);
}

/* Gradientes con transparencias */
.hero {
  background: linear-gradient(
    135deg,
    rgba(var(--color-primary-rgb), 0.9) 0%,
    rgba(var(--color-secondary-rgb), 0.9) 100%
  );
}
```

---

## 📊 Variables Más Usadas

### Top 10 Variables (Según análisis)

| Variable | Usos | Descripción |
|----------|------|-------------|
| `--spacing-sm` | 386 | Espaciado pequeño (12px) |
| `--spacing-md` | 377 | Espaciado medio (16px) |
| `--spacing-xs` | 268 | Espaciado extra pequeño (8px) |
| `--spacing-lg` | 243 | Espaciado grande (24px) |
| `--color-primary` | 215 | Color primario del tema |
| `--font-size-sm` | 193 | Fuente pequeña (14px) |
| `--text-secondary` | 172 | Texto secundario |
| `--text-primary` | 167 | Texto principal |
| `--font-size-md` | 148 | Fuente media (16px) |
| `--border-radius-md` | 127 | Radio de borde (8px) |

### Variables por Categoría

**Espaciado (1380+ usos):**
```css
--spacing-2xs: 4px    /* NUEVO */
--spacing-xs: 8px     /* 268 usos */
--spacing-sm: 12px    /* 386 usos */
--spacing-md: 16px    /* 377 usos */
--spacing-lg: 24px    /* 243 usos */
--spacing-xl: 32px    /* 118 usos */
--spacing-xxl: 28px   /* NUEVO */
--spacing-2xl: 48px
--spacing-3xl: 64px
--spacing-4xl: 96px
```

**Tipografía (859 usos):**
```css
--font-size-xs: 12px   /* 76 usos */
--font-size-sm: 14px   /* 193 usos */
--font-size-md: 16px   /* 148 usos */
--font-size-lg: 18px   /* 75 usos */
--font-size-xl: 20px   /* 74 usos */
--font-size-2xl: 24px
--font-size-3xl: 30px
--font-size-4xl: 36px
--font-size-5xl: 48px
```

**Colores de Tema:**
```css
--color-primary        /* 215 usos */
--color-primary-dark   /* Para hovers */
--color-primary-light  /* Para fondos suaves */
--text-primary         /* 167 usos */
--text-secondary       /* 172 usos */
--background-primary
--background-elevated
--border-color         /* 105 usos */
```

**Sombras (148 usos):**
```css
--shadow-sm           /* 24 usos */
--shadow-md           /* 29 usos */
--shadow-lg
--shadow-elevated     /* NUEVO */
--shadow-focus
```

---

## ✅ Mejores Prácticas

### 1. Siempre Usar Variables Semánticas

```css
/* ❌ MAL - Variable base */
color: var(--color-sky-600);
background: var(--color-neutral-100);

/* ✅ BIEN - Variable semántica */
color: var(--color-primary);
background: var(--background-elevated);
```

### 2. Usar border-radius-full para Círculos

```css
/* ❌ MAL - Hardcodeado */
border-radius: 50%;

/* ✅ BIEN - Variable */
border-radius: var(--border-radius-full);
```

### 3. Usar RGB para Transparencias

```css
/* ❌ MAL - RGBA hardcodeado */
box-shadow: 0 4px 8px rgba(14, 165, 233, 0.3);
background: rgba(255, 255, 255, 0.9);

/* ✅ BIEN - RGB variable */
box-shadow: 0 4px 8px rgba(var(--color-primary-rgb), 0.3);
background: rgba(var(--color-white-rgb), 0.9);
```

### 4. Preferir Variables sobre Valores Directos

```css
/* ❌ MAL - Valores hardcodeados */
padding: 16px;
font-size: 14px;
margin-top: 24px;

/* ✅ BIEN - Variables */
padding: var(--spacing-md);
font-size: var(--font-size-sm);
margin-top: var(--spacing-lg);
```

### 5. No Usar Colores Directos en Componentes

```css
/* ❌ MAL - Colores hex/rgb directos */
.button {
  background: #0EA5E9;
  color: #ffffff;
  border: 1px solid #e5e7eb;
}

/* ✅ BIEN - Variables del tema */
.button {
  background: var(--color-primary);
  color: var(--text-inverse);
  border: 1px solid var(--border-color);
}
```

---

## 🔄 Migración de Componentes

### Proceso Paso a Paso

#### 1. Identificar Colores Hardcodeados

Buscar en tu componente:
- Colores hex: `#0EA5E9`, `#ffffff`, etc.
- RGB/RGBA: `rgb(14, 165, 233)`, `rgba(0, 0, 0, 0.1)`
- Valores hardcodeados: `16px`, `12px`, etc.

#### 2. Reemplazar con Variables

**Colores sólidos:**
```css
/* Antes */
background: #0EA5E9;
color: #2d2d2d;
border: 1px solid #e5e7eb;

/* Después */
background: var(--color-primary);
color: var(--text-primary);
border: 1px solid var(--border-color-light);
```

**Transparencias:**
```css
/* Antes */
box-shadow: 0 4px 8px rgba(14, 165, 233, 0.3);
background: rgba(255, 255, 255, 0.9);

/* Después */
box-shadow: 0 4px 8px rgba(var(--color-primary-rgb), 0.3);
background: rgba(var(--color-white-rgb), 0.9);
```

**Espaciado:**
```css
/* Antes */
padding: 16px 24px;
margin-top: 12px;
gap: 8px;

/* Después */
padding: var(--spacing-md) var(--spacing-lg);
margin-top: var(--spacing-sm);
gap: var(--spacing-xs);
```

#### 3. Verificar en Ambos Temas

1. Cambiar a tema light → Verificar colores
2. Cambiar a tema dark → Verificar contraste
3. Probar hover/focus → Verificar interacciones

#### 4. Ejemplo Completo de Migración

**Antes (CommentFilters.module.css):**
```css
.orderButton.active {
  background: #2563eb;
  color: #ffffff;
  box-shadow: 0 1px 2px rgba(37, 99, 235, 0.3);
}

.separator {
  background: #e5e7eb;
}

.totalCount {
  color: #6b7280;
}
```

**Después:**
```css
.orderButton.active {
  background: var(--color-primary);
  color: var(--text-inverse);
  box-shadow: 0 1px 2px rgba(var(--color-primary-rgb), 0.3);
}

.separator {
  background: var(--border-color-light);
}

.totalCount {
  color: var(--text-muted);
}
```

---

## 🚀 Cheatsheet Rápido

### Colores

```css
/* Principales */
--color-primary          /* Color principal del tema */
--color-primary-dark     /* Hover del primary */
--color-primary-light    /* Fondos suaves */
--color-secondary        /* Color secundario */

/* Texto */
--text-primary           /* Texto principal */
--text-secondary         /* Texto secundario */
--text-muted             /* Texto apagado */
--text-inverse           /* Texto sobre primary */
--text-error             /* NUEVO - Texto de error */
--text-success           /* NUEVO - Texto de éxito */

/* Fondo */
--background-primary     /* Fondo principal */
--background-secondary   /* Fondo secundario */
--background-elevated    /* Cards, modales */
--background-hover       /* Hover de elementos */
--background-error       /* NUEVO - Fondo de error */
--background-success     /* NUEVO - Fondo de éxito */

/* Bordes */
--border-color           /* Borde normal */
--border-color-light     /* Borde suave */
--border-color-dark      /* Borde oscuro */

/* Estados */
--color-error            /* #EF4444 */
--color-success          /* #10B981 */
--color-warning          /* #F59E0B */
--color-info             /* #3B82F6 */

/* RGB (para transparencias) */
--color-primary-rgb      /* Cambia por tema */
--color-error-rgb        /* 239, 68, 68 */
--color-success-rgb      /* 16, 185, 129 */
--color-white-rgb        /* 255, 255, 255 */
--color-black-rgb        /* 0, 0, 0 */
```

### Espaciado

```css
--spacing-2xs: 4px      /* NUEVO */
--spacing-xs: 8px       /* MUY USADO */
--spacing-sm: 12px      /* MUY USADO */
--spacing-md: 16px      /* MUY USADO */
--spacing-lg: 24px      /* MUY USADO */
--spacing-xl: 32px
--spacing-xxl: 28px     /* NUEVO */
--spacing-2xl: 48px
--spacing-3xl: 64px
--spacing-4xl: 96px
```

### Tipografía

```css
/* Tamaños */
--font-size-xs: 12px
--font-size-sm: 14px    /* MUY USADO */
--font-size-md: 16px    /* MUY USADO */
--font-size-lg: 18px
--font-size-xl: 20px
--font-size-2xl: 24px
--font-size-3xl: 30px
--font-size-4xl: 36px

/* Pesos */
--font-weight-normal: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 800
--font-weight-extrabold: 900  /* NUEVO */
```

### Bordes

```css
--border-radius-sm: 6px
--border-radius-md: 8px       /* MUY USADO */
--border-radius-lg: 12px
--border-radius-xl: 16px
--border-radius-full: 9999px  /* Para círculos */
```

### Sombras

```css
--shadow-xs
--shadow-sm
--shadow-md              /* MUY USADO */
--shadow-lg
--shadow-xl
--shadow-elevated        /* NUEVO */
--shadow-focus           /* Para focus de inputs */
```

### Transiciones

```css
--transition-fast: 0.15s
--transition-normal: 0.3s
--transition-slow: 0.5s
--theme-transition       /* Transición completa de tema */
```

---

## 📱 Responsive Design

### Breakpoints

```css
--breakpoint-sm: 480px
--breakpoint-md: 768px
--breakpoint-lg: 1024px
--breakpoint-xl: 1280px
```

### Desktop-First

```css
/* Base: Desktop */
.component {
  padding: var(--spacing-xl);
  font-size: var(--font-size-lg);
}

/* Tablet */
@media (max-width: 1024px) {
  .component {
    padding: var(--spacing-lg);
  }
}

/* Mobile */
@media (max-width: 768px) {
  .component {
    padding: var(--spacing-md);
    font-size: var(--font-size-md);
  }
}
```

---

## 🎯 Próximos Pasos

Ahora que tienes el sistema base optimizado:

1. **Verificar que compila**: `npm run build` en frontend
2. **Probar ambos temas**: Cambiar entre light/dark
3. **Migrar componentes**: Ir uno por uno reemplazando hardcoded → variables
4. **Priorizar críticos**: Empezar por CommentFilters, BrandCard, Button

---

## 🔍 Debugging

### ¿El color no cambia con el tema?

```css
/* ❌ Estás usando variable base */
color: var(--color-sky-600);

/* ✅ Usa variable semántica */
color: var(--color-primary);
```

### ¿La transparencia se ve mal?

```css
/* ❌ RGBA hardcodeado */
rgba(14, 165, 233, 0.3)

/* ✅ RGB variable */
rgba(var(--color-primary-rgb), 0.3)
```

### ¿La variable no existe?

Verifica en qué archivo debe estar:
- **Valor base** → variables.css
- **Mapeo por tema** → themes.css
- **Alias o variable semántica** → themes.css

---

## 📚 Recursos

- **Archivo principal**: `variables.css` - Todas las variables base
- **Mapeo de temas**: `themes.css` - Variables por tema light/dark
- **Estilos globales**: `global.css` - Reset y componentes base
- **Documentación proyecto**: `CLAUDE.md` en la raíz

---

**Versión**: 2.0.0
**Última actualización**: 2024
**Autor**: Sistema CSS Optimizado TecnoCel
