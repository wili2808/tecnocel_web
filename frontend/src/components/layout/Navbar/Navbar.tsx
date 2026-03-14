/**
 * Componente Navbar - Navegación principal de la aplicación
 * Renderiza un único layout según el viewport (desktop o mobile) usando useIsMobile,
 * evitando instancias duplicadas de componentes como NotificationBell o ControlButtons.
 *
 * Los render helpers (ControlButtons, AuthSection, etc.) se invocan como funciones
 * normales en lugar de JSX para evitar que React los trate como nuevos tipos de
 * componente en cada render, lo que causaría unmount/remount de hijos con estado.
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
   * Cierra el menú al hacer click fuera del botón hamburguesa y del dropdown.
   * El listener solo existe mientras el menú está abierto.
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

  // Cerrar menú al pasar a desktop (ej: rotar dispositivo)
  useEffect(() => {
    if (!isMobile) setIsMenuOpen(false);
  }, [isMobile]);

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================
  // Estos helpers se invocan como funciones ({ControlButtons()}) no como JSX
  // (<ControlButtons />) para evitar remount de hijos con estado en cada render.

  /** Links de navegación principal */
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

  /** Botones de tema, notificaciones y carrito — instancia única */
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

        {/* Campana de notificaciones — solo para clientes autenticados */}
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

  /** Sección de login/registro o perfil del usuario autenticado */
  function AuthSection({ mobile = false }: { mobile?: boolean }) {
    const baseClass = mobile ? navbarStyle.mobileAuthSection : navbarStyle.authButtonsGroup;

    if (isAuthenticated && user) {
      return (
        <div className={baseClass}>
          {mobile ? (
            <div className={navbarStyle.mobileUserProfile}>
              <button
                className={navbarStyle.mobileUserInfo}
                onClick={handleAuthClick}
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
            <Link
              to="/login"
              className={navbarStyle.mobileAuthButton}
              onClick={handleLinkClick}
              aria-label="Iniciar sesión"
            >
              <span className="material-icons">login</span>
              <span className={navbarStyle.mobileAuthText}>Ingresar</span>
            </Link>
            <Link
              to="/register"
              className={`${navbarStyle.mobileAuthButton} ${navbarStyle.mobileRegisterButton}`}
              onClick={handleLinkClick}
              aria-label="Crear cuenta"
            >
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
   * Recibe menuRef para que el useEffect de click-outside pueda detectar
   * si el click fue dentro del dropdown.
   */
  function MobileMenu({ menuRef: ref }: { menuRef: React.RefObject<HTMLDivElement> }) {
    return (
      <div
        ref={ref}
        className={`${navbarStyle.mobileDropdown} ${isMenuOpen ? navbarStyle.active : ''}`}
      >
        <div className={navbarStyle.mobileDropdownContent}>
          {AuthSection({ mobile: true })}
          <div className={navbarStyle.mobileSeparator} />
          {SecondaryNavLinks({ mobile: true })}

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
              {ControlButtons()}
              {/* span con ref para que el click-outside identifique el botón como parte del menú */}
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
                {ControlButtons()}
                {AuthSection({})}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Dropdown — solo existe en el DOM cuando se está en mobile */}
      {isMobile && MobileMenu({ menuRef })}
    </header>
  );
};

export default Navbar;
