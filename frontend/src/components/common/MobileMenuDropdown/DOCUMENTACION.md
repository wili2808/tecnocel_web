# MobileMenuDropdown - Componente Reutilizable

## Descripción

`MobileMenuDropdown` es un componente React reutilizable que proporciona un menú desplegable touch-friendly optimizado para pantallas pequeñas (smartphones). Diseñado con aesthetic refinado y micro-interactions suaves.

**Características:**
- ✅ Dropdown desplegable con animaciones suaves
- ✅ Iconografía Material Design integrada
- ✅ Estados visuales claros (activo, hover, expandido)
- ✅ Touch-friendly con padding generoso
- ✅ Accesibilidad ARIA completa
- ✅ Tema claro/oscuro compatible
- ✅ Reutilizable en cualquier contexto de navegación

## Props

```typescript
interface MobileMenuDropdownProps {
  // Array de opciones del menú
  options: MenuDropdownOption[];

  // ID de la opción actualmente seleccionada
  activeOptionId: string;

  // Callback cuando se selecciona una opción
  onSelect: (optionId: string) => void;

  // Estado actual del dropdown (abierto/cerrado)
  isOpen: boolean;

  // Callback para cambiar el estado del dropdown
  onToggle: (isOpen: boolean) => void;

  // (Opcional) Clase CSS adicional para el trigger button
  triggerClassName?: string;

  // (Opcional) Label para aria-label del trigger (default: "Abrir menú")
  triggerAriaLabel?: string;

  // (Opcional) Mostrar icono en el trigger (default: true)
  showTriggerIcon?: boolean;

  // (Opcional) Clase CSS para el contenedor
  containerClassName?: string;
}

interface MenuDropdownOption {
  id: string;        // Identificador único
  label: string;     // Texto a mostrar
  icon?: string;     // Nombre de icono Material Design (opcional)
}
```

## Uso

### Ejemplo Básico

```tsx
import { useState } from 'react';
import { MobileMenuDropdown } from '@/components/common/MobileMenuDropdown';

const MyComponent = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [isOpen, setIsOpen] = useState(false);

  const menuOptions = [
    { id: 'home', label: 'Inicio', icon: 'home' },
    { id: 'profile', label: 'Perfil', icon: 'person' },
    { id: 'settings', label: 'Configuración', icon: 'settings' },
  ];

  return (
    <MobileMenuDropdown
      options={menuOptions}
      activeOptionId={activeSection}
      onSelect={setActiveSection}
      isOpen={isOpen}
      onToggle={setIsOpen}
      showTriggerIcon={true}
      triggerAriaLabel="Abrir menú de navegación"
    />
  );
};
```

### Ejemplo en UserPanel

```tsx
// Los menús se cierran automáticamente cuando se selecciona una opción
<MobileMenuDropdown
  options={MENU_OPTIONS}
  activeOptionId={activeSection}
  onSelect={(id) => {
    setActiveSection(id);
    setIsMobileMenuOpen(false);  // Cerrar el menú
  }}
  isOpen={isMobileMenuOpen}
  onToggle={setIsMobileMenuOpen}
  showTriggerIcon={true}
  triggerAriaLabel="Abrir menú de navegación"
  containerClassName={styles.mobileMenuWrapper}
/>
```

### Integración con CSS Modules

En tu archivo CSS (ej: `Panel.module.css`):

```css
/* Ocultar dropdown en desktop, mostrar en móvil */
.mobileMenuWrapper {
  display: none;
}

@media (max-width: 480px) {
  /* Mostrar el menú desplegable mobile */
  .mobileMenuWrapper {
    display: flex;
  }

  /* Ocultar el menú desktop */
  .menuOptions {
    display: none;
  }
}
```

## Comportamiento

### Trigger Button
- Muestra la opción actualmente seleccionada
- Icono + Label + Chevron expandible
- Estados: default, hover, active, expanded
- Animación suave del chevron (rotate 180°)

### Dropdown Menu
- Aparece debajo del trigger button
- Animación slide-down-and-fade
- Lista de opciones con click/tap
- Highlighting del item activo

### Interacciones
1. Click en trigger → Abre/cierra dropdown
2. Seleccionar opción → Cierra dropdown automáticamente
3. Hover en items → Cambio de color de fondo
4. Active (opción seleccionada) → Borde izquierdo + color primario

## Estilo

### Tokens CSS Utilizados

```css
/* Variables esperadas en el proyecto */
--background-primary       /* Fondo principal */
--background-neutral       /* Fondo neutral del trigger */
--background-light         /* Fondo en hover */
--border-color            /* Color del borde */
--color-primary           /* Color primario para activos */
--color-primary-rgb       /* RGB sin alpha para rgba() */
--color-primary-200       /* Variación light del primario */
--text-primary            /* Texto principal */
--text-secondary          /* Texto secundario */
--font-family-primary     /* Font primaria */
--font-size-sm            /* Tamaño de font pequeño */
--spacing-xs              /* Espaciado muy pequeño */
--spacing-sm              /* Espaciado pequeño */
--spacing-md              /* Espaciado medio */
--border-radius-md        /* Border radius medio */
--transition-normal       /* Transición normal */
--transition-curve        /* Curva de timing */
```

### Customización

Puedes personalizar el componente agregando clases CSS adicionales:

```tsx
<MobileMenuDropdown
  options={menuOptions}
  activeOptionId={active}
  onSelect={setActive}
  isOpen={isOpen}
  onToggle={setIsOpen}
  triggerClassName={styles.customTrigger}
  containerClassName={styles.customContainer}
/>
```

## Accesibilidad

- ✅ Roles ARIA: `listbox`, `option`
- ✅ Atributos: `aria-expanded`, `aria-selected`, `aria-haspopup`
- ✅ Keyboard navigation: Tab, Enter, Space
- ✅ Screen reader friendly
- ✅ Respeta `prefers-reduced-motion`

## Responsive

El componente NO incluye media queries por defecto. El control de cuando mostrarlo es responsabilidad del padre:

```css
/* Mostrar solo en móvil (≤480px) */
.mobileMenuWrapper {
  display: none;  /* Hidden by default */
}

@media (max-width: 480px) {
  .mobileMenuWrapper {
    display: flex;
  }
}
```

## Rendimiento

- Componente memoizado con `React.memo()`
- Evita re-renders innecesarios
- Tamaño gzip: ~0.61 kB (código) + ~0.80 kB (CSS)

## Extensiones Futuras

Potenciales mejoras:
- [ ] Soporte para submenús (nested options)
- [ ] Teclado: Flechas arriba/abajo para navegación
- [ ] Buscador dentro del dropdown (filter)
- [ ] Múltiples selecciones (checkboxes)
- [ ] Badges/contadores en opciones
- [ ] Dividers entre grupos

## Ejemplos de Uso en el Proyecto

**UserPanel** (`frontend/src/pages/UserPanel/UserPanel.tsx`)
```tsx
<MobileMenuDropdown
  options={MENU_OPTIONS}
  activeOptionId={activeSection}
  onSelect={setActiveSection}
  isOpen={isMobileMenuOpen}
  onToggle={setIsMobileMenuOpen}
  showTriggerIcon={true}
  containerClassName={userPanelStyles.mobileMenuWrapper}
/>
```

**AdminPanel** (`frontend/src/pages/AdminPanel/AdminPanel.tsx`)
```tsx
<MobileMenuDropdown
  options={filteredMenuOptions}
  activeOptionId={activeSection}
  onSelect={(id) => {
    setActiveSection(id);
    setIsMobileMenuOpen(false);
  }}
  isOpen={isMobileMenuOpen}
  onToggle={setIsMobileMenuOpen}
  showTriggerIcon={true}
  containerClassName={adminPanelStyles.mobileMenuWrapper}
/>
```

## Troubleshooting

### Dropdown no aparece
- Verificar que `isOpen={true}`
- Verificar z-index si hay elementos superpuestos
- Revisar `position: absolute` del padre

### Estilos no se aplican
- Importar correctamente: `import { MobileMenuDropdown } from '@/components/common/MobileMenuDropdown'`
- Verificar que las variables CSS están definidas en `global.css`
- Usar `containerClassName` para agregar clases personalizadas

### Animación no funciona
- Verificar `prefers-reduced-motion` en navegador
- Los estilos de animación están en `MobileMenuDropdown.module.css`

---

**Última actualización**: 2026-03-29
**Aesthetic**: Soft-refined minimalism con micro-interactions elegantes
