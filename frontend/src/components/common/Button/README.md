# Button Component - Versión Optimizada

> Componente de botón universal optimizado para TecnoCel Web. Versión simplificada que mantiene todas las funcionalidades esenciales con mejor rendimiento y mantenibilidad.

---

## Tabla de Contenidos

- [Características Principales](#características-principales)
- [Instalación](#instalación)
- [Variantes](#variantes)
- [Tamaños](#tamaños)
- [Props](#props)
- [Ejemplos de Uso](#ejemplos-de-uso)
- [Responsive Design](#responsive-design)
- [Accesibilidad](#accesibilidad)
- [Performance](#performance)
- [Troubleshooting](#troubleshooting)
- [Integración con el Sistema](#integración-con-el-sistema)
- [Cambios en la Versión Optimizada](#cambios-en-la-versión-optimizada)
- [Futuras Mejoras](#futuras-mejoras)

---

## Características Principales

- ** Sistema de Diseño Integrado**: Utiliza completamente las variables CSS del sistema de diseño
- ** Responsive**: Adaptable a 3 breakpoints principales (Mobile, Tablet, Desktop)
- ** Accesible**: Soporte completo para lectores de pantalla y navegación por teclado
- ** Performance**: Optimizado con React.memo y forwardRef, sin hooks innecesarios
- ** Flexible**: Soporta botones, enlaces y formularios
- ** Ligero**: Código simplificado sin funcionalidades duplicadas

## Instalación

```tsx
import Button from "../../components/common/Button";
```

---

## Variantes

### Variantes Principales

| Variante    | Descripción                        | Uso Recomendado               |
| ----------- | ---------------------------------- | ----------------------------- |
| `primary`   | Botón principal con color primario | Acciones principales, CTA     |
| `secondary` | Botón secundario neutro            | Acciones secundarias          |
| `ghost`     | Botón transparente                 | Navegación, controles sutiles |
| `outline`   | Botón con borde                    | Acciones alternativas         |
| `text`      | Botón de texto plano               | Enlaces internos              |
| `link`      | Botón de enlace                    | Navegación, enlaces externos |

### Variantes de Estado

| Variante | Descripción                  | Uso Recomendado         |
| --------- | ---------------------------- | ----------------------- |
| `danger` | Botón de peligro/eliminación | Eliminar, cancelar      |
| `success` | Botón de éxito               | Confirmar, guardar      |
| `warning` | Botón de advertencia         | Alertas, confirmaciones |

---

## Tamaños

| Tamaño | Altura | Padding   | Uso Recomendado           |
| ------ | ------ | --------- | ------------------------- |
| `xs`   | 32px   | 8px 12px | Controles compactos       |
| `sm`   | 36px   | 12px 16px | Botones pequeños          |
| `md`   | 44px   | 16px 24px | **Default** - Uso general |
| `lg`   | 52px   | 24px 32px | Botones destacados        |
| `xl`   | 60px   | 32px 48px | CTA principales           |

---

## Props

### Props Básicas

| Prop       | Tipo            | Default     | Descripción                         |
| ---------- | --------------- | ----------- | ----------------------------------- |
| `children` | `ReactNode`     | -           | **Requerido** - Contenido del botón |
| `variant` | `ButtonVariant` | `'primary'` | Variante visual del botón           |
| `size`     | `ButtonSize`    | `'md'`      | Tamaño del botón                    |
| `disabled` | `boolean`       | `false`     | Si el botón está deshabilitado      |
| `loading` | `boolean`       | `false`     | Si el botón está cargando           |

### Props de Funcionalidad

| Prop      | Tipo                                         | Default    | Descripción                          |
| --------- | -------------------------------------------- | ---------- | ------------------------------------ |
| `onClick` | `(event) => void`                            | -          | Función que se ejecuta al hacer clic |
| `type`    | `'button' \| 'submit' \| 'reset'`            | `'button'` | Tipo de botón HTML                   |
| `form`    | `string`                                     | -          | ID del formulario asociado           |
| `href`    | `string`                                     | -          | URL para convertir en enlace         |
| `target` | `'_blank' \| '_self' \| '_parent' \| '_top'` | -          | Target para enlaces                  |

### Props de Estilo

| Prop              | Tipo      | Default | Descripción                      |
| ----------------- | --------- | ------- | -------------------------------- |
| `className`       | `string` | `''`    | Clases CSS adicionales           |
| `fullWidth`       | `boolean` | `false` | Si debe ocupar todo el ancho     |
| `mobileFullWidth` | `boolean` | `false` | Ancho completo solo en móvil     |
| `rounded`         | `boolean` | `false` | Si debe tener bordes redondeados |
| `elevated`        | `boolean` | `false` | Si debe tener sombra elevada     |

### Props de Iconos

| Prop           | Tipo                | Default | Descripción                      |
| -------------- | ------------------- | -------- | -------------------------------- |
| `icon`         | `string`            | -        | Nombre del icono Material Design |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Posición del icono               |

### Props Responsive

| Prop           | Tipo      | Default | Descripción                          |
| -------------- | --------- | ------- | ------------------------------------ |
| `hideOnMobile` | `boolean` | `false` | Ocultar en dispositivos móviles      |
| `showOnMobile` | `boolean` | `false` | Mostrar solo en dispositivos móviles |

### Props de Accesibilidad

| Prop        | Tipo     | Default | Descripción                                   |
| ----------- | -------- | ------- | --------------------------------------------- |
| `ariaLabel` | `string` | -       | Label personalizado para lectores de pantalla |

---

## Ejemplos de Uso

### Botón Básico

```tsx
<Button onClick={handleClick}>Hacer clic</Button>
```

### Botón con Variante y Tamaño

```tsx
<Button variant="primary" size="lg" onClick={handleSubmit}>
  Enviar formulario
</Button>
```

### Botón de Enlace

```tsx
<Button href="/productos" variant="outline">
  Ver productos
</Button>
```

### Botón de Formulario

```tsx
<Button type="submit" form="loginForm" variant="primary" loading={isSubmitting}>
  Iniciar sesión
</Button>
```

### Botón con Icono

```tsx
<Button icon="shopping_cart" variant="primary" onClick={addToCart}>
  Agregar al carrito
</Button>
```

### Botón Responsive

```tsx
<Button variant="primary" mobileFullWidth hideOnMobile={false}>
  Acción principal
</Button>
```

### Botón de Ancho Completo

```tsx
<Button variant="primary" fullWidth onClick={handleCheckout}>
  Proceder al pago
</Button>
```

---

## Responsive Design

El componente se adapta automáticamente a 3 breakpoints principales:

### Mobile (< 640px)

- Altura mínima: 44px (touch-friendly)
- Padding optimizado para pantallas pequeñas
- Soporte para `mobileFullWidth`
- Controles de visibilidad (`hideOnMobile`, `showOnMobile`)

### Tablet (640px - 1024px)

- Tamaños intermedios optimizados
- Hover effects mejorados
- Transiciones suaves

### Desktop (>= 1024px)

- Tamaños completos
- Efectos de hover más pronunciados
- Sombras elevadas mejoradas

---

## Accesibilidad

- **ARIA Labels**: Automáticos basados en contenido e iconos
- **Navegación por Teclado**: Soporte completo
- **Estados**: `aria-disabled`, `aria-busy`
- **Focus Visible**: Indicador de foco claro
- **Preferencias de Usuario**: Respeta `prefers-reduced-motion`

---

## Performance

- **React.memo**: Evita re-renders innecesarios
- **forwardRef**: Permite referencias externas
- **Sin Hooks Innecesarios**: No hay `useEffect` o `useState` innecesarios
- **CSS Variables**: Transiciones optimizadas por el navegador
- **Bundle Size**: Reducido significativamente

---

## Troubleshooting

### Botón no responde

```tsx
//  Incorrecto
<Button onClick={handleClick()}>

//  Correcto
<Button onClick={handleClick}>
```

### Estilos no se aplican

```tsx
//  Incorrecto
<Button className="custom-class" variant="primary">

//  Correcto
<Button className="custom-class" variant="primary">
```

### Enlace no funciona

```tsx
//  Incorrecto
<Button href="/ruta" onClick={handleClick}>

//  Correcto
<Button href="/ruta">
```

---

## Integración con el Sistema

El componente utiliza completamente el sistema de variables CSS:

- **Colores**: `--color-primary`, `--color-error`, etc.
- **Espaciado**: `--spacing-sm`, `--spacing-md`, etc.
- **Tipografía**: `--font-family-primary`, `--font-size-md`, etc.
- **Transiciones**: `--theme-transition`
- **Sombras**: `--shadow-button-primary`, `--shadow-focus`

---

## Cambios en la Versión Optimizada

### Mantenido

- Todas las variantes de botón
- Sistema de tamaños responsive
- Estados (disabled, loading)
- Soporte para iconos y enlaces
- Accesibilidad completa
- Responsive design

### Eliminado

- Hooks personalizados innecesarios
- Componentes helper duplicados
- Props excesivas y no utilizadas
- CSS duplicado y complejo
- Lógica de responsive innecesaria

### Mejoras

- **Código**: Reducido de 515 a ~80 líneas (85% reducción)
- **CSS**: Reducido de 901 a ~300 líneas (67% reducción)
- **Performance**: Sin re-renders innecesarios
- **Mantenibilidad**: Código más limpio y legible
- **Bundle Size**: Significativamente menor

---

## Futuras Mejoras

- [ ] Soporte para grupos de botones (si es necesario)
- [ ] Variantes de loading más sofisticadas
- [ ] Soporte para tooltips integrados
- [ ] Animaciones de entrada/salida
- [ ] Soporte para iconos SVG personalizados

---

**Nota**: Esta versión optimizada mantiene el 100% de la funcionalidad esencial mientras mejora significativamente el rendimiento y la mantenibilidad del código.

---

**Última actualización**: 8 de Octubre, 2025
**Versión**: 2.0
**Estado**: Completado

**Código fuente**: [Button.tsx](./Button.tsx)

---

**[Volver arriba](#tabla-de-contenidos)** | **[Componentes](../../../../../docs/frontend/COMPONENTS.md)** | **[Inicio](../../../../../README.md)**