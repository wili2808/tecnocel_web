# Button Component

Componente de botón universal para todo el proyecto TecnoCel Web. Proporciona múltiples variantes, tamaños y funcionalidades para cubrir todos los casos de uso de la aplicación.

## 🎯 Características

- **🎨 Sistema de Diseño Integrado**: Utiliza completamente las variables CSS del sistema de diseño
- **📱 Responsive**: Adaptable a todos los tamaños de pantalla
- **♿ Accesible**: Soporte completo para lectores de pantalla y navegación por teclado
- **🌙 Temas**: Compatible con sistema de temas claro/oscuro
- **⚡ Performance**: Optimizado con React.memo y forwardRef
- **🔗 Flexible**: Soporta botones, enlaces y formularios

## 📦 Instalación

```tsx
import Button from '../../components/common/Button';
// o
import { Button } from '../../components/common/Button';
```

## 🎨 Variantes

### Variantes Principales

| Variante | Descripción | Uso Recomendado |
|----------|-------------|-----------------|
| `primary` | Botón principal con color primario | Acciones principales, CTA |
| `secondary` | Botón secundario neutro | Acciones secundarias |
| `ghost` | Botón transparente | Navegación, controles sutiles |
| `outline` | Botón con borde | Acciones alternativas |
| `text` | Botón de texto plano | Enlaces internos |
| `link` | Botón de enlace | Navegación, enlaces externos |

### Variantes de Estado

| Variante | Descripción | Uso Recomendado |
|----------|-------------|-----------------|
| `danger` | Botón de peligro/eliminación | Eliminar, cancelar |
| `success` | Botón de éxito | Confirmar, guardar |
| `warning` | Botón de advertencia | Alertas, confirmaciones |

## 📏 Tamaños

| Tamaño | Altura | Padding | Uso Recomendado |
|--------|--------|---------|-----------------|
| `xs` | 32px | 8px 12px | Controles compactos |
| `sm` | 36px | 12px 16px | Botones pequeños |
| `md` | 44px | 16px 24px | **Default** - Uso general |
| `lg` | 52px | 24px 32px | Botones destacados |
| `xl` | 60px | 32px 48px | CTA principales |

## 🔧 Props

### Props Básicas

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | **Requerido** - Contenido del botón |
| `variant` | `ButtonVariant` | `'primary'` | Variante visual del botón |
| `size` | `ButtonSize` | `'md'` | Tamaño del botón |
| `disabled` | `boolean` | `false` | Si el botón está deshabilitado |
| `loading` | `boolean` | `false` | Si el botón está cargando |

### Props de Funcionalidad

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `onClick` | `(event) => void` | - | Función que se ejecuta al hacer clic |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Tipo de botón HTML |
| `form` | `string` | - | ID del formulario asociado |
| `href` | `string` | - | URL para convertir en enlace |
| `target` | `'_blank' \| '_self' \| '_parent' \| '_top'` | - | Target para enlaces |

### Props de Estilo

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `className` | `string` | `''` | Clases CSS adicionales |
| `fullWidth` | `boolean` | `false` | Si debe ocupar todo el ancho |
| `rounded` | `boolean` | `false` | Si debe tener bordes redondeados |
| `elevated` | `boolean` | `false` | Si debe tener sombra elevada |
| `glass` | `boolean` | `false` | Si debe tener efecto glassmorphism |

### Props de Iconos

| Prop | Tipo | Default | Descripción |
|------|------|---------|-------------|
| `icon` | `string` | - | Nombre del icono Material Design |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Posición del icono |

## 📝 Ejemplos de Uso

### Botón Básico

```tsx
<Button onClick={handleClick}>
  Hacer clic
</Button>
```

### Botón con Variante y Tamaño

```tsx
<Button 
  variant="primary" 
  size="lg" 
  onClick={handleSubmit}
>
  Enviar formulario
</Button>
```

### Botón de Enlace

```tsx
<Button 
  href="/productos" 
  variant="outline"
>
  Ver productos
</Button>
```

### Botón de Formulario

```tsx
<Button 
  type="submit" 
  form="loginForm" 
  variant="primary"
  loading={isSubmitting}
>
  Iniciar sesión
</Button>
```

### Botón con Icono

```tsx
<Button 
  icon="shopping_cart" 
  variant="primary"
  onClick={addToCart}
>
  Agregar al carrito
</Button>
```

### Botón de Peligro

```tsx
<Button 
  variant="danger" 
  icon="delete"
  onClick={handleDelete}
>
  Eliminar producto
</Button>
```

### Botón de Ancho Completo

```tsx
<Button 
  variant="primary" 
  fullWidth 
  onClick={handleCheckout}
>
  Proceder al pago
</Button>
```

### Botón Glassmorphism

```tsx
<Button 
  variant="ghost" 
  glass 
  elevated
  onClick={handleAction}
>
  Acción especial
</Button>
```

## 🎨 Personalización

### Clases CSS Personalizadas

```tsx
<Button 
  className="my-custom-button"
  variant="primary"
>
  Botón personalizado
</Button>
```

### Estilos Inline

```tsx
<Button 
  style={{ backgroundColor: '#custom-color' }}
  variant="ghost"
>
  Botón con color personalizado
</Button>
```

## 🔄 Estados

### Estado de Carga

```tsx
<Button 
  loading={isLoading}
  variant="primary"
>
  {isLoading ? 'Guardando...' : 'Guardar'}
</Button>
```

### Estado Deshabilitado

```tsx
<Button 
  disabled={!isValid}
  variant="primary"
>
  Continuar
</Button>
```

## 📱 Responsive

El componente se adapta automáticamente a diferentes tamaños de pantalla:

- **Desktop**: Tamaños completos con espaciado óptimo
- **Tablet**: Ajustes de padding y altura
- **Mobile**: Optimizaciones para pantallas pequeñas

## ♿ Accesibilidad

- **ARIA Labels**: Automáticos basados en contenido
- **Navegación por Teclado**: Soporte completo
- **Estados**: `aria-disabled`, `aria-busy`
- **Focus Visible**: Indicador de foco claro

## 🎯 Casos de Uso Recomendados

### IconButton vs Button

- **IconButton**: Para botones con solo iconos (navegación, controles)
- **Button**: Para botones con texto, formularios, enlaces

### Variantes por Contexto

- **Formularios**: `primary` para submit, `secondary` para reset
- **Navegación**: `ghost` o `text` para enlaces internos
- **Acciones**: `primary` para principales, `outline` para alternativas
- **Estados**: `success`, `warning`, `danger` para feedback

## 🚀 Performance

- **React.memo**: Evita re-renders innecesarios
- **forwardRef**: Permite referencias externas
- **CSS Variables**: Transiciones optimizadas por el navegador

## 🔧 Troubleshooting

### Botón no responde

```tsx
// ❌ Incorrecto
<Button onClick={handleClick()}>

// ✅ Correcto
<Button onClick={handleClick}>
```

### Estilos no se aplican

```tsx
// ❌ Incorrecto
<Button className="custom-class" variant="primary">

// ✅ Correcto
<Button className="custom-class" variant="primary">
```

### Enlace no funciona

```tsx
// ❌ Incorrecto
<Button href="/ruta" onClick={handleClick}>

// ✅ Correcto
<Button href="/ruta">
```

## 📚 Integración con el Sistema

El componente utiliza completamente el sistema de variables CSS:

- **Colores**: `--color-primary`, `--color-error`, etc.
- **Espaciado**: `--spacing-sm`, `--spacing-md`, etc.
- **Tipografía**: `--font-family-primary`, `--font-size-md`, etc.
- **Transiciones**: `--transition-normal`, `--theme-transition`
- **Sombras**: `--shadow-button-primary`, `--shadow-focus`

## 🔮 Futuras Mejoras

- [ ] Soporte para grupos de botones
- [ ] Variantes de loading más sofisticadas
- [ ] Soporte para tooltips integrados
- [ ] Animaciones de entrada/salida
- [ ] Soporte para iconos SVG personalizados
