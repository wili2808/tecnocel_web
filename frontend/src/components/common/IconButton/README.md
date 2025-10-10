# IconButton Component

Componente de botón con icono optimizado para el sistema de diseño de TecnoCel.

## Características

- **Sistema de variables CSS**: Utiliza las variables definidas en `variables.css`, `global.css` y `themes.css`
- **Transiciones suaves**: Integrado con el sistema de transiciones del tema
- **Accesibilidad**: Soporte completo para lectores de pantalla y navegación por teclado
- **Responsive**: Adaptable a diferentes tamaños de pantalla
- **Estados**: Soporte para estados de carga, deshabilitado y focus

## Props

| Prop        | Tipo                                               | Default    | Descripción                                 |
| ----------- | -------------------------------------------------- | ---------- | ------------------------------------------- |
| `icon`      | `string`                                           | -          | Nombre del icono de Material Design         |
| `onClick`   | `() => void`                                       | -          | Función que se ejecuta al hacer clic        |
| `ariaLabel` | `string`                                           | -          | Texto descriptivo para lectores de pantalla |
| `className` | `string`                                           | `''`       | Clases CSS adicionales                      |
| `disabled`  | `boolean`                                          | `false`    | Si el botón está deshabilitado              |
| `variant`   | `'primary' \| 'secondary' \| 'ghost' \| 'outline'` | `'ghost'`  | Variante visual del botón                   |
| `size`      | `'sm' \| 'md' \| 'lg'`                             | `'md'`     | Tamaño del botón                            |
| `children`  | `React.ReactNode`                                  | -          | Contenido adicional                         |
| `loading`   | `boolean`                                          | `false`    | Si el botón está en estado de carga         |
| `type`      | `'button' \| 'submit' \| 'reset'`                  | `'button'` | Tipo de botón HTML                          |

## Variantes

### Primary

Botón con fondo del color primario y texto inverso.

### Secondary

Botón con fondo neutro y borde.

### Ghost (Default)

Botón transparente que muestra fondo al hacer hover.

### Outline

Botón con borde del color primario que se llena al hacer hover.

## Tamaños

- **sm**: 36px × 36px
- **md**: 44px × 44px (default)
- **lg**: 52px × 52px

## Ejemplos de uso

```tsx
// Botón básico
<IconButton
  icon="favorite"
  onClick={handleLike}
  ariaLabel="Agregar a favoritos"
/>

// Botón primario grande
<IconButton
  icon="shopping_cart"
  onClick={handleAddToCart}
  ariaLabel="Agregar al carrito"
  variant="primary"
  size="lg"
/>

// Botón con estado de carga
<IconButton
  icon="save"
  onClick={handleSave}
  ariaLabel="Guardar cambios"
  loading={isSaving}
  variant="outline"
/>
```

## Variables CSS utilizadas

El componente utiliza las siguientes variables del sistema de diseño:

- `--color-primary`, `--color-primary-dark`
- `--text-primary`, `--text-secondary`, `--text-inverse`
- `--background-neutral`, `--background-secondary`
- `--border-color`, `--border-color-dark`
- `--border-radius-md`
- `--spacing-xs`, `--spacing-sm`, `--spacing-md`
- `--icon-size-sm`, `--icon-size-md`, `--icon-size-lg`, `--icon-size-xl`
- `--shadow-sm`, `--shadow-button-primary`, `--shadow-button-primary-hover`
- `--theme-transition`

---

**[⬆ Volver arriba](#tabla-de-contenidos)** | **[📚 Documentación](../../../../../docs/README.md)** | **[🏠 Inicio](../../../../../README.md)**
