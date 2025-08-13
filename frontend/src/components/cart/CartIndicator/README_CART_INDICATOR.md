# CartIndicator - Indicador del Carrito

## Descripción

El `CartIndicator` es un componente visual que muestra el estado de un producto en el carrito de compras. Funciona de manera similar al botón de favoritos pero para indicar si un producto está en el carrito y en qué cantidad.

## Características

- **Indicador Visual**: Muestra si el producto está o no en el carrito
- **Contador de Cantidad**: Muestra la cantidad actual en el carrito
- **Estados Múltiples**: Diferentes visualizaciones según el estado
- **Responsive**: Se adapta a diferentes tamaños de pantalla
- **Accesible**: Incluye ARIA labels y tooltips informativos

## Estados del Indicador

### 1. No en el Carrito (`not-in-cart`)

- **Icono**: Carrito vacío (outline)
- **Color**: Gris neutro
- **Tooltip**: "Agregar al carrito"

### 2. En el Carrito (`in-cart`)

- **Icono**: Carrito lleno (filled)
- **Color**: Azul cielo
- **Tooltip**: "En el carrito (X unidades)"
- **Badge**: Muestra la cantidad actual

### 3. Cantidad Máxima (`max-quantity`)

- **Icono**: Carrito lleno + símbolo +
- **Color**: Naranja
- **Tooltip**: "Máxima cantidad alcanzada (X/stock)"
- **Indicador**: Símbolo de exclamación pulsante

## Props

```typescript
interface CartIndicatorProps {
  id_producto: number; // ID del producto a verificar
  stock: number; // Stock disponible del producto
  className?: string; // Clases CSS adicionales
  showQuantity?: boolean; // Mostrar badge de cantidad (default: true)
  size?: "small" | "medium" | "large"; // Tamaño del indicador (default: 'medium')
}
```

## Tamaños Disponibles

- **Small**: 24x24px (icono: 16x16px)
- **Medium**: 32x32px (icono: 20x20px) - **Por defecto**
- **Large**: 40x40px (icono: 24x24px)

## Uso Básico

```tsx
import CartIndicator from "../common/CartIndicator";

<CartIndicator
  id_producto={123}
  stock={10}
  size="medium"
  showQuantity={true}
/>;
```

## Integración con ProductCard

El `CartIndicator` se integra en los componentes `ProductCard` y `ProductCardExtensive` para mostrar el estado del carrito de manera visual e intuitiva.

### Posicionamiento

- **ProductCard**: Posicionado en la esquina superior izquierda
- **ProductCardExtensive**: Posicionado en la esquina superior izquierda de la imagen

## Estilos CSS

Los estilos están definidos en `CartIndicator.module.css` y utilizan las variables CSS del sistema de diseño del proyecto:

- **Colores**: Utiliza la paleta de colores definida en `variables.css`
- **Espaciado**: Sistema de espaciado consistente (8px base)
- **Transiciones**: Animaciones suaves y consistentes
- **Responsive**: Breakpoints para mobile y tablet

## Estados de Hover y Focus

- **Hover**: Elevación sutil y cambio de color
- **Focus**: Outline para accesibilidad
- **Active**: Feedback visual al hacer clic

## Animaciones

- **Fade In**: Aparece suavemente al montar el componente
- **Badge Appear**: El contador aparece con animación de escala
- **Max Indicator Pulse**: Indicador de cantidad máxima pulsa continuamente

## Accesibilidad

- **ARIA Labels**: Descripciones claras del estado
- **Tooltips**: Información contextual al hacer hover
- **Focus Management**: Outline visible para navegación por teclado
- **Screen Readers**: Compatible con lectores de pantalla

## Integración con CarritoContext

El componente utiliza los siguientes métodos del `CarritoContext`:

- `isProductInCart(id_producto)`: Verifica si el producto está en el carrito
- `getProductQuantityInCart(id_producto)`: Obtiene la cantidad actual

## Ejemplos de Uso

### Indicador Simple

```tsx
<CartIndicator id_producto={123} stock={5} />
```

### Indicador Personalizado

```tsx
<CartIndicator
  id_producto={123}
  stock={5}
  size="large"
  showQuantity={false}
  className="custom-cart-indicator"
/>
```

### Con Estilos Personalizados

```css
.custom-cart-indicator {
  border: 2px solid var(--color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

## Consideraciones de Performance

- **Memoización**: El componente está optimizado para evitar re-renders innecesarios
- **Callback Optimization**: Los métodos del contexto están memoizados
- **State Updates**: Solo se actualiza cuando cambia el estado del carrito

## Troubleshooting

### El indicador no se actualiza

1. Verificar que el `CarritoContext` esté funcionando correctamente
2. Confirmar que el `id_producto` sea válido
3. Revisar la consola para errores de JavaScript

### Estilos no se aplican

1. Verificar que `CartIndicator.module.css` esté importado
2. Confirmar que las variables CSS estén definidas
3. Revisar la especificidad de los selectores CSS

### Problemas de posicionamiento

1. Verificar que el contenedor padre tenga `position: relative`
2. Ajustar el `z-index` si hay conflictos de capas
3. Revisar que no haya otros elementos interfiriendo

## Futuras Mejoras

- [ ] Animaciones más elaboradas
- [ ] Soporte para temas claro/oscuro
- [ ] Integración con notificaciones push
- [ ] Sincronización en tiempo real
- [ ] Personalización de iconos
- [ ] Soporte para múltiples carritos
