# Navbar Refactor — Renderizado Condicional Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar el renderizado dual del Navbar (dos contenedores siempre en DOM) reemplazándolo por renderizado condicional con `useIsMobile`, y simplificar el mecanismo de click-outside en notificaciones eliminando el workaround `data-notification-panel`.

**Architecture:** Tres tareas independientes y secuenciales: (1) simplificar NotificationBell/Panel, (2) refactorizar Navbar.tsx, (3) limpiar Navbar.module.css. Cada tarea produce un commit limpio y funcional.

**Tech Stack:** React 18, TypeScript, CSS Modules, hook `useIsMobile` (matchMedia), `useRef` para click-outside.

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `frontend/src/components/notifications/NotificationBell.tsx` | Agrega `useRef` en wrapper, pasa a Panel, elimina `data-notification-panel` |
| `frontend/src/components/notifications/NotificationPanel.tsx` | Simplifica click-outside con `wrapperRef`, elimina `PANEL_ATTR` |
| `frontend/src/components/layout/Navbar/Navbar.tsx` | Renderizado condicional, un solo `ControlButtons`, refs para menú |
| `frontend/src/components/layout/Navbar/Navbar.module.css` | Elimina show/hide dual, mueve estilos mobile fuera de media query |

---

## Chunk 1: Simplificar NotificationBell y NotificationPanel

### Task 1: Actualizar `NotificationPanel.tsx`

**Files:**
- Modify: `frontend/src/components/notifications/NotificationPanel.tsx`

Reemplazar el mecanismo `PANEL_ATTR`/`querySelectorAll` por un `wrapperRef` directo.
El panel se sigue montando solo cuando `panelAbierto === true` (esto lo controla `NotificationBell`),
así que el listener de `mousedown` existe únicamente mientras el panel está visible.

- [ ] **Step 1: Reemplazar el contenido completo de `NotificationPanel.tsx`**

```tsx
/**
 * Componente NotificationPanel - Panel dropdown de notificaciones
 * Muestra la lista de notificaciones con acciones de marcar leídas y eliminar.
 * Se cierra al hacer click fuera del wrapper de NotificationBell o al presionar Escape.
 */
import React, { memo, useEffect, useCallback } from 'react';
import { useNotificaciones } from '../../contexts/NotificacionesContext';
import NotificationItem from './NotificationItem';
import styles from './NotificationPanel.module.css';

// ============================================================================
// PROPS
// ============================================================================

interface NotificationPanelProps {
  /** Ref al div raíz de NotificationBell — usado para detectar clicks externos */
  wrapperRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
}

// ============================================================================
// COMPONENTE
// ============================================================================

const NotificationPanel: React.FC<NotificationPanelProps> = memo(({ wrapperRef, onClose }) => {
  const { notificaciones, noLeidas, cargando, marcarTodasLeidas } = useNotificaciones();

  // Cerrar al hacer click fuera del wrapper (que incluye botón + panel)
  const handleOutsideClick = useCallback(
    (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        onClose();
      }
    },
    [wrapperRef, onClose]
  );

  // Cerrar al presionar Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleOutsideClick, handleKeyDown]);

  const handleMarcarTodas = useCallback(() => {
    marcarTodasLeidas();
  }, [marcarTodasLeidas]);

  // ============================================================================
  // RENDERIZADO
  // ============================================================================

  return (
    <div
      className={styles.panel}
      role="dialog"
      aria-label="Panel de notificaciones"
      aria-modal="false"
    >
      {/* Header */}
      <div className={styles.header}>
        <h3 className={styles['header-title']}>Notificaciones</h3>
        {noLeidas > 0 && (
          <button
            className={styles['mark-all-btn']}
            onClick={handleMarcarTodas}
            type="button"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Contenido */}
      <div className={styles.body}>
        {cargando ? (
          /* Estado cargando */
          <div className={styles['loading-state']} aria-label="Cargando notificaciones">
            <span className={styles.spinner} aria-hidden="true" />
            <span className={styles['loading-text']}>Cargando...</span>
          </div>
        ) : notificaciones.length === 0 ? (
          /* Estado vacío */
          <div className={styles['empty-state']}>
            <span className={`material-icons ${styles['empty-icon']}`}>notifications_none</span>
            <p className={styles['empty-text']}>Sin notificaciones</p>
          </div>
        ) : (
          /* Lista de notificaciones */
          <ul className={styles.list} role="list">
            {notificaciones.map((notificacion) => (
              <li key={notificacion.id_notificacion} className={styles['list-item']}>
                <NotificationItem notificacion={notificacion} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
});

NotificationPanel.displayName = 'NotificationPanel';

export default NotificationPanel;
```

- [ ] **Step 2: Actualizar `NotificationBell.tsx`**

Agrega `useRef` en el div raíz (wrapper), pasa el ref al panel, y elimina `data-notification-panel`.

```tsx
/**
 * Componente NotificationBell - Botón de campana con badge de conteo
 * Muestra el número de notificaciones no leídas y abre/cierra el panel al hacer click.
 * El wrapperRef apunta al div raíz que envuelve botón + panel, permitiendo
 * que NotificationPanel detecte clicks externos sin atributos custom en el DOM.
 */
import React, { memo, useCallback, useRef } from 'react';
import { useNotificaciones } from '../../contexts/NotificacionesContext';
import NotificationPanel from './NotificationPanel';
import styles from './NotificationBell.module.css';

// ============================================================================
// COMPONENTE
// ============================================================================

const NotificationBell: React.FC = memo(() => {
  const { noLeidas, panelAbierto, abrirPanel, cerrarPanel } = useNotificaciones();

  // Ref al div raíz — cubre tanto el botón como el panel desplegado.
  // Se pasa a NotificationPanel para detectar clicks fuera del componente completo.
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(() => {
    if (panelAbierto) {
      cerrarPanel();
    } else {
      abrirPanel();
    }
  }, [panelAbierto, abrirPanel, cerrarPanel]);

  const badgeLabel = noLeidas > 99 ? '99+' : String(noLeidas);
  const icono = noLeidas > 0 ? 'notifications_active' : 'notifications';

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <button
        className={styles.bell}
        onClick={handleToggle}
        aria-label={noLeidas > 0 ? `Notificaciones — ${noLeidas} sin leer` : 'Notificaciones'}
        aria-expanded={panelAbierto}
        aria-haspopup="dialog"
        type="button"
      >
        <span className="material-icons">{icono}</span>

        {/* Badge de conteo — solo visible cuando hay no leídas */}
        {noLeidas > 0 && (
          <span className={styles.badge} aria-hidden="true">
            {badgeLabel}
          </span>
        )}
      </button>

      {/* Panel de notificaciones — montado solo cuando está abierto */}
      {panelAbierto && <NotificationPanel wrapperRef={wrapperRef} onClose={cerrarPanel} />}
    </div>
  );
});

NotificationBell.displayName = 'NotificationBell';

export default NotificationBell;
```

- [ ] **Step 3: Verificar en el navegador**

  - Abrir la app en mobile o desktop con un cliente autenticado.
  - La campana abre y cierra el panel correctamente.
  - Click fuera del panel lo cierra.
  - Click en la campana mientras el panel está abierto lo cierra (toggle).
  - Presionar Escape lo cierra.
  - No hay errores en consola.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/notifications/NotificationBell.tsx
git add frontend/src/components/notifications/NotificationPanel.tsx
git commit -m "refactor(notifications): simplificar click-outside con wrapperRef directo"
```

---

## Chunk 2: Refactorizar `Navbar.tsx`

### Task 2: Renderizado condicional y refs para menú móvil

**Files:**
- Modify: `frontend/src/components/layout/Navbar/Navbar.tsx`

Reemplazar los dos contenedores siempre-en-DOM por renderizado condicional con `isMobile`.
`ControlButtons` pasa a renderizarse una sola vez. El click-outside del menú usa dos refs
en lugar de atributos `data-*` en el DOM.

- [ ] **Step 1: Reemplazar el contenido completo de `Navbar.tsx`**

```tsx
/**
 * Componente Navbar - Navegación principal de la aplicación
 * Renderiza un único layout según el viewport (desktop o mobile) usando useIsMobile,
 * evitando instancias duplicadas de componentes como NotificationBell o ControlButtons.
 */
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../../../assets/tecnocel.svg';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useCarrito } from '../../../contexts/CarritoContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { useIsMobile } from '../../../hooks/useIsMobile';
import ProductSearch from '../../product/ProductSearch';
import IconButton from '../../common/IconButton';
import NotificationBell from '../../notifications/NotificationBell';
import navbarStyle from './Navbar.module.css';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

/** Rutas de navegación principal */
const SECONDARY_NAV_ROUTES = [
  { path: '/productos', label: 'PRODUCTOS' },
  { path: '/ofertas', label: 'OFERTAS' },
  { path: '/marcas', label: 'MARCAS' },
  { path: '/contacto', label: 'CONTACTO' },
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, isCliente } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { estado } = useCarrito();
  const { showNotification } = useNotification();
  const isMobile = useIsMobile();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Refs para el click-outside del menú móvil:
  // menuBtnRef → span que envuelve el botón hamburguesa
  // menuRef    → div raíz del dropdown
  const menuBtnRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // CÁLCULOS
  // ============================================================================

  const cartItemCount = useMemo(
    () => estado?.items?.reduce((total, item) => total + item.cantidad, 0) || 0,
    [estado?.items]
  );

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /** Cierra el menú móvil. Se pasa como onClick a los enlaces del dropdown. */
  const handleLinkClick = useCallback(() => setIsMenuOpen(false), []);

  const toggleMobileMenu = useCallback(() => setIsMenuOpen((prev) => !prev), []);

  const handleAuthClick = useCallback(() => {
    navigate(isAuthenticated ? '/panel' : '/login');
    handleLinkClick();
  }, [isAuthenticated, navigate, handleLinkClick]);

  /**
   * Cierra el menú al hacer click fuera de él.
   * Solo activo cuando isMenuOpen === true para no agregar listeners innecesarios.
   */
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const isInsideMenu = menuRef.current?.contains(e.target as Node);
      const isInsideBtn = menuBtnRef.current?.contains(e.target as Node);
      if (!isInsideMenu && !isInsideBtn) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isMenuOpen]);

  // Cerrar menú al cambiar de viewport (ej: rotar dispositivo)
  useEffect(() => {
    if (!isMobile) setIsMenuOpen(false);
  }, [isMobile]);

  // ============================================================================
  // COMPONENTES INTERNOS
  // ============================================================================

  /**
   * Enlaces de navegación secundaria.
   * @param mobile - true para usar estilos del dropdown móvil
   */
  function SecondaryNavLinks({ mobile = false }: { mobile?: boolean }) {
    return (
      <div className={mobile ? navbarStyle.mobileNavLinks : navbarStyle.secondaryNavLinks}>
        {SECONDARY_NAV_ROUTES.map(({ path, label }) => (
          <Link
            key={path}
            to={path}
            className={`${mobile ? navbarStyle.mobileDropdownLink : navbarStyle.secondaryNavLink} ${
              location.pathname === path ? navbarStyle.active : ''
            }`}
            onClick={handleLinkClick}
          >
            {label}
          </Link>
        ))}
      </div>
    );
  }

  /** Botones de tema, notificaciones y carrito. Se monta una sola vez. */
  function ControlButtons() {
    return (
      <div className={navbarStyle.controlsGroup}>
        <IconButton
          icon={theme === 'light' ? 'dark_mode' : 'light_mode'}
          onClick={() => { toggleTheme(); handleLinkClick(); }}
          ariaLabel={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
          variant="ghost"
          size="sm"
          className={navbarStyle.themeToggle}
        />

        {/* Campana de notificaciones — solo para clientes */}
        {isCliente && <NotificationBell />}

        <IconButton
          icon="shopping_cart"
          onClick={() => {
            if (isCliente) {
              navigate('/carrito');
              handleLinkClick();
            } else if (isAuthenticated) {
              showNotification('Inicia sesión como cliente para acceder al carrito', 'info', 4000, {
                label: 'Ir a login',
                onClick: () => { navigate('/login'); handleLinkClick(); },
              });
            } else {
              navigate('/login');
              handleLinkClick();
            }
          }}
          ariaLabel="Carrito de compras"
          disabled={!isCliente}
          variant="ghost"
          size="sm"
          className={`${navbarStyle.cartButton} ${!isCliente ? navbarStyle.cartButtonDisabled : ''}`}
        >
          <span className={navbarStyle.cartBadge}>{cartItemCount}</span>
        </IconButton>
      </div>
    );
  }

  /**
   * Sección de autenticación.
   * @param mobile - true para usar estilos del dropdown móvil
   */
  function AuthSection({ mobile = false }: { mobile?: boolean }) {
    const baseClass = mobile ? navbarStyle.mobileAuthSection : navbarStyle.authButtonsGroup;

    if (isAuthenticated && user) {
      return (
        <div className={baseClass}>
          {mobile ? (
            <div className={navbarStyle.mobileUserProfile}>
              <button
                className={navbarStyle.mobileUserInfo}
                onClick={() => { handleAuthClick(); handleLinkClick(); }}
                aria-label="Ir al panel de usuario"
              >
                <span className="material-icons">account_circle</span>
                <span className={navbarStyle.mobileUserText}>
                  {'nombre' in user ? `${user.nombre} ${user.apellido}` : user.nombres}
                </span>
              </button>
            </div>
          ) : (
            <IconButton
              icon="account_circle"
              onClick={handleAuthClick}
              ariaLabel="Ir al panel de usuario"
              variant="ghost"
              size="sm"
              className={navbarStyle.authButton}
              children={
                <span className={navbarStyle.authButtonText}>
                  {'nombre' in user ? `${user.nombre} ${user.apellido}` : user.nombres}
                </span>
              }
            />
          )}
        </div>
      );
    }

    return (
      <div className={baseClass}>
        {mobile ? (
          <div className={navbarStyle.mobileAuthButtons}>
            <Link to="/login" className={navbarStyle.mobileAuthButton} onClick={handleLinkClick} aria-label="Iniciar sesión">
              <span className="material-icons">login</span>
              <span className={navbarStyle.mobileAuthText}>Ingresar</span>
            </Link>
            <Link to="/register" className={`${navbarStyle.mobileAuthButton} ${navbarStyle.mobileRegisterButton}`} onClick={handleLinkClick} aria-label="Crear cuenta">
              <span className="material-icons">person_add</span>
              <span className={navbarStyle.mobileAuthText}>Registro</span>
            </Link>
          </div>
        ) : (
          <IconButton
            icon="login"
            onClick={handleAuthClick}
            ariaLabel="Iniciar sesión"
            variant="ghost"
            size="sm"
            className={navbarStyle.authButton}
            children={<span className={navbarStyle.authButtonText}>Ingresar</span>}
          />
        )}
      </div>
    );
  }

  /**
   * Dropdown del menú móvil.
   * Recibe menuRef para que el click-outside en Navbar pueda detectar
   * si el click fue dentro del dropdown.
   * Nota: se usa `menuRef` (no `ref`) porque `ref` es palabra reservada en React/TypeScript.
   */
  function MobileMenu({ menuRef }: { menuRef: React.RefObject<HTMLDivElement> }) {
    return (
      <div
        ref={menuRef}
        className={`${navbarStyle.mobileDropdown} ${isMenuOpen ? navbarStyle.active : ''}`}
      >
        <div className={navbarStyle.mobileDropdownContent}>
          <AuthSection mobile={true} />
          <div className={navbarStyle.mobileSeparator} />
          <SecondaryNavLinks mobile={true} />

          {isAuthenticated && user && (
            <>
              <div className={navbarStyle.mobileSeparator} />
              <div className={navbarStyle.mobileLogoutSection}>
                <IconButton
                  icon="logout"
                  onClick={() => { logout(); handleLinkClick(); }}
                  ariaLabel="Cerrar sesión"
                  variant="ghost"
                  size="md"
                  className={navbarStyle.mobileLogoutButton}
                >
                  <span className={navbarStyle.mobileLogoutText}>Cerrar Sesión</span>
                </IconButton>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDERIZADO PRINCIPAL
  // ============================================================================
  //
  // IMPORTANTE: DesktopLayout, MobileLayout y MobileMenu se llaman como funciones
  // normales (no como JSX <DesktopLayout />) para evitar que React los trate como
  // nuevos tipos de componente en cada render, lo que causaría unmount/remount de
  // sus hijos con estado (ej: NotificationBell con polling).
  //
  // Regla: funciones internas con hijos stateful → llamar como función, no como JSX.

  return (
    <header className={`${navbarStyle.navbar} theme-transition`}>
      <nav className={navbarStyle.mainNavbar}>
        {isMobile ? (
          /* Layout mobile — fila: logo | búsqueda | controles + hamburguesa */
          <div className={navbarStyle.mobileRow}>
            <div className={navbarStyle.mobileBrandSection}>
              <Link to="/" className={navbarStyle.logoLink} onClick={handleLinkClick}>
                <img src={logo} alt="TecnoCel Logo" className={navbarStyle.logoImage} />
              </Link>
            </div>

            <div className={navbarStyle.mobileSearchSection}>
              <ProductSearch
                placeholder="Buscar productos, marcas y mas ..."
                showClearButton={true}
                showHistory={false}
                onSearch={handleLinkClick}
              />
            </div>

            <div className={navbarStyle.mobileControlsSection}>
              {/* ControlButtons() como función para evitar remount de NotificationBell */}
              {ControlButtons()}
              {/* span con ref para que el click-outside sepa que el botón es parte del menú */}
              <span ref={menuBtnRef}>
                <IconButton
                  icon={isMenuOpen ? 'close' : 'menu'}
                  onClick={toggleMobileMenu}
                  ariaLabel={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                  variant="ghost"
                  size="md"
                  className={navbarStyle.menuToggle}
                />
              </span>
            </div>
          </div>
        ) : (
          /* Layout desktop — grid de 3 columnas: logo+nav | búsqueda | controles */
          <div className={navbarStyle.desktopContainer}>
            <div className={navbarStyle.leftSection}>
              <div className={navbarStyle.brandSection}>
                <Link to="/" className={navbarStyle.logoLink} onClick={handleLinkClick}>
                  <img src={logo} alt="TecnoCel Logo" className={navbarStyle.logoImage} />
                </Link>
              </div>
              <div className={navbarStyle.leftNavigation}>
                {SecondaryNavLinks({})}
              </div>
            </div>

            <div className={navbarStyle.searchSection}>
              <ProductSearch
                placeholder="Buscar productos, marcas y mas ..."
                showClearButton={true}
                showHistory={true}
                onSearch={handleLinkClick}
              />
            </div>

            <div className={navbarStyle.controlsSection}>
              <div className={navbarStyle.allControls}>
                {/* ControlButtons() como función para evitar remount de NotificationBell */}
                {ControlButtons()}
                {AuthSection({})}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Dropdown solo existe en DOM cuando se está en mobile */}
      {isMobile && MobileMenu({ menuRef })}
    </header>
  );
};

export default Navbar;
```


- [ ] **Step 2: Verificar compilación TypeScript**

```bash
cd frontend && npm run build
```

Esperado: build exitoso sin errores de tipos.

- [ ] **Step 3: Verificar en navegador — desktop**

  - En pantalla ≥ 769px: se ve la barra completa con logo, links, búsqueda, controles.
  - No hay botón hamburguesa visible.
  - Las notificaciones y carrito funcionan.
  - En DevTools → Elements: NO existe `.mobileRow` ni `.mobileDropdown` en el DOM.

- [ ] **Step 4: Verificar en navegador — mobile**

  - En pantalla ≤ 768px (o DevTools responsive): se ve logo, búsqueda, controles y hamburguesa.
  - Al hacer click en hamburguesa, se abre el dropdown con links, auth y logout.
  - Click fuera del dropdown lo cierra.
  - Click en el propio botón hamburguesa lo cierra (toggle).
  - En DevTools → Elements: NO existe `.desktopContainer` en el DOM.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/layout/Navbar/Navbar.tsx
git commit -m "refactor(navbar): renderizado condicional con isMobile, elimina instancias duplicadas"
```

---

## Chunk 3: Limpiar `Navbar.module.css`

### Task 3: Eliminar CSS del layout dual y consolidar estilos mobile

**Files:**
- Modify: `frontend/src/components/layout/Navbar/Navbar.module.css`

Con el renderizado condicional, el CSS ya no necesita show/hide de contenedores.
Los estilos de `.mobileRow` y sus hijos pueden salir del bloque `@media (max-width: 768px)`
ya que esos elementos solo existen en el DOM cuando `isMobile` es `true`.

- [ ] **Step 1: Reemplazar el contenido completo de `Navbar.module.css`**

```css
/* ============================================================================
   NAVBAR — Silicon Precision
   Glass translúcido, links con subrayado animado, badge minimal.
   Layout condicional: DesktopLayout o MobileLayout, nunca ambos en el DOM.
   ============================================================================ */

.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-navbar);
  background: rgba(var(--background-primary-rgb), 0.88);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-color);
  font-family: var(--font-family-primary);
}

.mainNavbar { width: 100%; }

/* ============================================================================
   DESKTOP LAYOUT — grid de 3 columnas: logo+nav | búsqueda | controles
   ============================================================================ */

.desktopContainer {
  height: var(--navbar-height);
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--spacing-xl);
  padding: 0 var(--spacing-xl);
}

/* Brand + links izquierda */
.leftSection {
  display: flex;
  align-items: center;
  gap: var(--spacing-2xl);
}

.brandSection { display: flex; align-items: center; }

.logoLink {
  display: flex;
  align-items: center;
  text-decoration: none;
  opacity: 1;
  transition: opacity var(--transition-fast) var(--transition-curve);
}

.logoLink:hover { opacity: 0.75; }

.logoImage {
  height: 38px;
  border-radius: var(--border-radius-sm);
}

/* Nav links desktop */
.leftNavigation { display: flex; }

.secondaryNavLinks {
  display: flex;
  align-items: center;
}

.secondaryNavLink {
  position: relative;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: var(--font-size-xs);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 6px var(--spacing-md);
  transition: color var(--transition-fast) var(--transition-curve);
}

/* Subrayado animado en hover/active */
.secondaryNavLink::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: var(--spacing-md);
  right: var(--spacing-md);
  height: 1px;
  background: var(--color-primary);
  transform: scaleX(0);
  transition: transform var(--transition-fast) var(--transition-curve);
  transform-origin: center;
}

.secondaryNavLink:hover,
.secondaryNavLink.active { color: var(--color-primary); }

.secondaryNavLink:hover::after,
.secondaryNavLink.active::after { transform: scaleX(1); }

/* Búsqueda centrada */
.searchSection {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 480px;
  width: 100%;
  margin: 0 auto;
}

/* Controles + auth derecha */
.controlsSection {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.allControls,
.controlsGroup {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.authButtonsGroup {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding-left: var(--spacing-sm);
  border-left: 1px solid var(--border-color);
  margin-left: var(--spacing-xs);
}

.authButton {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-xs);
}

.authButton:hover { transform: translateY(-1px); }

.authButtonText {
  font-size: var(--font-size-xs);
  font-weight: 500;
  white-space: nowrap;
}

/* Badge del carrito */
.cartBadge {
  position: absolute;
  top: 0;
  right: 0;
  background: var(--color-error);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-full);
  line-height: 1;
  transform: translate(30%, -30%);
}

.cartButtonDisabled {
  opacity: 0.4;
  cursor: not-allowed !important;
  pointer-events: none;
}

/* ============================================================================
   MOBILE LAYOUT — fila: logo | búsqueda | controles + hamburguesa
   Solo existe en el DOM cuando isMobile === true (renderizado condicional).
   ============================================================================ */

.mobileRow {
  display: flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-md);
  gap: var(--spacing-sm);
  width: 100%;
  min-height: var(--navbar-height-mobile);
}

.mobileBrandSection { flex-shrink: 0; }

.mobileSearchSection {
  flex: 1;
  margin: 0 var(--spacing-sm);
}

.mobileControlsSection {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  flex-shrink: 0;
}

/* ============================================================================
   MENÚ DESPLEGABLE MÓVIL
   ============================================================================ */

.mobileDropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: var(--spacing-md);
  background: var(--background-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
  min-width: 260px;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-6px);
  transition: opacity var(--transition-fast) var(--transition-curve),
              visibility var(--transition-fast) var(--transition-curve),
              transform var(--transition-fast) var(--transition-curve);
  z-index: var(--z-dropdown);
  overflow: hidden;
}

.mobileDropdown.active {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.mobileDropdownContent { padding: var(--spacing-md); }

.mobileAuthSection { margin-bottom: var(--spacing-xs); }

.mobileUserProfile {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-xs);
}

.mobileUserInfo {
  display: flex;
  align-items: center;
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--background-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  color: var(--text-primary);
  cursor: pointer;
  gap: var(--spacing-sm);
  text-decoration: none;
  transition: border-color var(--transition-fast) var(--transition-curve);
}

.mobileUserInfo:hover { border-color: var(--color-primary); }

.mobileUserText {
  font-size: var(--font-size-sm);
  font-weight: 600;
  flex: 1;
}

.mobileAuthButtons {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.mobileAuthButton {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-sm);
  font-weight: 500;
  background: transparent;
  color: var(--text-primary);
  text-decoration: none;
  cursor: pointer;
  transition: border-color var(--transition-fast) var(--transition-curve),
              background var(--transition-fast) var(--transition-curve);
}

.mobileAuthButton:hover {
  border-color: var(--color-primary);
  background: rgba(var(--color-primary-rgb), 0.04);
}

.mobileAuthText,
.mobileLogoutText { flex: 1; }

.mobileRegisterButton {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.mobileRegisterButton:hover {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
  color: #fff;
}

.mobileLogoutButton {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  border: 1px solid var(--color-error);
  border-radius: var(--border-radius-full);
  color: var(--color-error);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  width: 100%;
  transition: background var(--transition-fast) var(--transition-curve);
}

.mobileLogoutButton:hover { background: rgba(var(--color-error-rgb), 0.06); }

.mobileLogoutSection { margin-top: var(--spacing-xs); }

.mobileSeparator {
  height: 1px;
  background: var(--border-color);
  margin: var(--spacing-sm) 0;
}

.mobileNavLinks {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mobileDropdownLink {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-sm) var(--spacing-md);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: var(--font-size-xs);
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-radius: var(--border-radius-sm);
  transition: color var(--transition-fast) var(--transition-curve),
              background var(--transition-fast) var(--transition-curve);
}

.mobileDropdownLink:hover,
.mobileDropdownLink.active {
  color: var(--color-primary);
  background: rgba(var(--color-primary-rgb), 0.06);
}

/* ============================================================================
   RESPONSIVE — ajustes de espaciado para pantallas intermedias
   ============================================================================ */

@media (max-width: 1024px) {
  .desktopContainer { gap: var(--spacing-lg); padding: 0 var(--spacing-lg); }
  .leftSection      { gap: var(--spacing-lg); }
  .searchSection    { max-width: 360px; }
}

@media (max-width: 480px) {
  .mobileRow          { padding: var(--spacing-xs) var(--spacing-sm); gap: var(--spacing-xs); }
  .logoImage          { height: 30px; }
  .mobileSearchSection { margin: 0 var(--spacing-xs); }
  .mobileDropdown     { right: var(--spacing-sm); min-width: 240px; }
}

@media (prefers-reduced-motion: reduce) {
  .mobileDropdown        { transition: none; }
  .secondaryNavLink::after { transition: none; }
}
```

> **Cambios vs CSS anterior:**
> - Eliminado: `.mobileContainer { display: none }`, `.menuToggle { display: none }` y el bloque `@media (max-width: 768px)` que los sobreescribía con `display: flex`.
> - Eliminado: clase `.mobileControlsGroup` (no usada en el nuevo JSX, la agrupa `.mobileControlsSection`).
> - Movido: `.mobileRow` y sus hijos salen del bloque `@media` — son parte del layout normal de mobile, no un override responsive.
> - Eliminado: bloque `@media (max-width: 768px)` completo (ya no hay nada que mostrar/ocultar).

- [ ] **Step 2: Verificar compilación**

```bash
cd frontend && npm run build
```

Esperado: sin errores ni warnings de CSS.

- [ ] **Step 3: Verificar visualmente ambos viewports**

  Desktop (≥ 769px):
  - Navbar con altura `--navbar-height`, 3 columnas, sin cambios visuales.

  Mobile (≤ 768px):
  - Fila con logo, búsqueda y controles, sin cambios visuales.
  - Dropdown abre con animación (opacity + translateY).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/layout/Navbar/Navbar.module.css
git commit -m "refactor(navbar): eliminar CSS dual show/hide, consolidar estilos mobile"
```
