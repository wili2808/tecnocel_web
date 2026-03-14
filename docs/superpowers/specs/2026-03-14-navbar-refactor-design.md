# Spec: Refactor Navbar — Renderizado Condicional y Simplificación CSS

**Fecha:** 2026-03-14
**Estado:** Aprobado
**Alcance:** `Navbar.tsx`, `Navbar.module.css`, `NotificationBell.tsx`, `NotificationPanel.tsx`

---

## Contexto y Problema

El `Navbar` actual renderiza dos contenedores completos en el DOM simultáneamente (`desktopContainer` y `mobileContainer`) y usa CSS para ocultar uno u otro según el viewport. Esto genera:

1. **Instancias duplicadas** de `ControlButtons` (y por tanto de `NotificationBell`, carrito, tema), lo que produce dos pollings de notificaciones, dos sets de event listeners y dos componentes montados innecesariamente.
2. **Workarounds artificiales:** `data-mobile-menu` en spans envolventes del botón hamburguesa para el click-outside, y `data-notification-panel` + `querySelectorAll` en `NotificationPanel` para evitar que una instancia cierre la otra.
3. **CSS redundante:** reglas `display: none` / `display: flex` para mostrar/ocultar contenedores enteros, y `menuToggle` oculto en desktop por CSS aunque siempre esté en el DOM.

---

## Solución: Opción A — Renderizado Condicional con `useIsMobile`

Usar el hook `useIsMobile` (ya existente, usa `matchMedia` sin flash de layout) para renderizar **un único layout** según el viewport. Una sola instancia de cada componente en el DOM en todo momento.

---

## Diseño Detallado

### 1. `Navbar.tsx`

**Estructura JSX resultante:**

```tsx
<header>
  <nav>
    {isMobile
      ? <MobileLayout />   // solo montado en mobile
      : <DesktopLayout />  // solo montado en desktop
    }
  </nav>
  {isMobile && <MobileMenu menuRef={menuRef} />}
</header>
```

**Click-outside del menú móvil:**
- Dos `useRef` declarados en `Navbar`: `menuBtnRef` (botón hamburguesa) y `menuRef` (dropdown).
- `useEffect` activo solo cuando `isMenuOpen === true`, escucha `mousedown` en `document`.
- Cierra si el click no está contenido en ninguno de los dos refs.
- Eliminar completamente los `<span data-mobile-menu>` y el atributo `data-mobile-menu`.

**Adjuntar los refs:**
- `menuRef` se pasa como prop a `MobileMenu`, que lo aplica en su `<div>` raíz.
- `menuBtnRef` se pasa como prop a `MobileLayout`. Como `IconButton` no soporta `forwardRef`, el botón hamburguesa se envuelve en un `<span ref={menuBtnRef}>` dentro de `MobileLayout`.

```tsx
// En Navbar.tsx
const menuBtnRef = useRef<HTMLSpanElement>(null);
const menuRef = useRef<HTMLDivElement>(null);

// MobileLayout recibe menuBtnRef
function MobileLayout() {
  return (
    <div className={navbarStyle.mobileLayout}>
      {/* ... */}
      <span ref={menuBtnRef}>
        <IconButton icon={isMenuOpen ? 'close' : 'menu'} onClick={toggleMobileMenu} ... />
      </span>
    </div>
  );
}

// MobileMenu recibe menuRef
function MobileMenu() {
  return (
    <div ref={menuRef} className={...}>
      {/* ... */}
    </div>
  );
}
```

**Componentes internos que se mantienen:**
- `SecondaryNavLinks` — sin cambios
- `ControlButtons` — sin cambios, pero ahora se renderiza **una sola vez**
- `AuthSection` — sin cambios
- `MobileMenu` — recibe `menuRef: React.RefObject<HTMLDivElement>` como prop
- `MobileLayout` — recibe `menuBtnRef: React.RefObject<HTMLSpanElement>` como prop

**Layouts nuevos (antes eran los dos contenedores):**
- `DesktopLayout` — función interna, contiene la estructura de 3 columnas (logo+nav | search | controls+auth)
- `MobileLayout` — función interna, contiene logo | search | controls+hamburguesa; recibe `menuBtnRef` como prop

### 2. `NotificationBell.tsx`

- Agregar `useRef<HTMLDivElement>(null)` y adjuntarlo al `<div className={styles.wrapper}>` raíz del componente — el mismo div que actualmente lleva `data-notification-panel`. Este div ya contiene tanto el botón campana como el panel renderizado condicionalmente, por lo que cualquier click en el botón campana queda dentro del ref y no dispara el cierre.
- Pasar el ref como prop `wrapperRef` a `NotificationPanel`.
- Eliminar el atributo `data-notification-panel` del div.
- Sin otros cambios en lógica ni estilos.

```tsx
const wrapperRef = useRef<HTMLDivElement>(null);

return (
  // wrapperRef en el div raíz que envuelve botón + panel
  <div ref={wrapperRef} className={styles.wrapper}>
    <button onClick={toggle} className={styles.bell}>...</button>
    {panelAbierto && <NotificationPanel wrapperRef={wrapperRef} onClose={cerrarPanel} />}
  </div>
);
```

### 3. `NotificationPanel.tsx`

**Cambios:**
- Recibe nueva prop: `wrapperRef: React.RefObject<HTMLDivElement>`.
- Reemplazar el mecanismo de `PANEL_ATTR` / `querySelectorAll` por:
  ```ts
  const handleOutsideClick = (e: MouseEvent) => {
    if (!wrapperRef.current?.contains(e.target as Node)) {
      onClose();
    }
  };
  ```
- Eliminar la constante `PANEL_ATTR` y toda referencia a `data-notification-panel`.
- El resto de la lógica (ESC, marcar leídas, scroll) no cambia.

### 4. `NotificacionesContext.tsx`

Sin cambios. `panelAbierto`, `abrirPanel` y `cerrarPanel` se mantienen en el contexto porque son consumidos por `NotificationBell` y potencialmente por otros consumidores futuros.

### 5. `Navbar.module.css`

**Eliminar:**
- Reglas `display: none` que ocultaban `.desktopContainer` / `.mobileContainer` en cada breakpoint.
- Regla que ocultaba `.menuToggle` en desktop (ya no existe en desktop layout).
- Clases huérfanas exclusivas del layout dual que ya no se usen.

**Renombrar/consolidar:**
- `.desktopContainer` → `.layout` (grid 3 columnas, solo usado en desktop)
- `.mobileContainer` → `.mobileLayout` (flex row, solo usado en mobile)
- Consolidar bloques `@media` dispersos: agrupar todas las reglas por breakpoint en un único bloque por breakpoint.

**Sin cambios visuales:** el resultado visual debe ser idéntico al actual en ambos viewports.

---

## Archivos Modificados

| Archivo | Tipo de cambio |
|---------|---------------|
| `frontend/src/components/layout/Navbar/Navbar.tsx` | Refactor principal |
| `frontend/src/components/layout/Navbar/Navbar.module.css` | Limpieza y consolidación |
| `frontend/src/components/notifications/NotificationBell.tsx` | Agregar `useRef` + pasar al panel |
| `frontend/src/components/notifications/NotificationPanel.tsx` | Simplificar click-outside |

## Archivos Sin Cambios

| Archivo | Razón |
|---------|-------|
| `frontend/src/contexts/NotificacionesContext.tsx` | Lógica correcta, no afectada |
| `frontend/src/components/notifications/NotificationBell.module.css` | Ya limpio |
| `frontend/src/components/notifications/NotificationPanel.module.css` | Sin cambios necesarios |
| `frontend/src/hooks/useIsMobile.ts` | Ya correcto |
| `frontend/src/components/common/IconButton/IconButton.tsx` | Sin cambios |

---

## Criterios de Éxito

1. En desktop: un solo `ControlButtons` montado, sin `.mobileLayout` en el DOM.
2. En mobile: un solo `ControlButtons` montado, sin `.desktopLayout` en el DOM.
3. El menú hamburguesa se cierra al hacer click fuera, sin `data-mobile-menu` en el DOM.
4. El panel de notificaciones se cierra al hacer click fuera, sin `data-notification-panel` en el DOM.
5. Cero regresiones visuales en ambos viewports.
6. Una sola instancia de polling de notificaciones activa.
