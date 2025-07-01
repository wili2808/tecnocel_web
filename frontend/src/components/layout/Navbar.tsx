import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo2.svg';
import AuthPanel from '../user/AuthPanel';
import { useAuth } from '../../contexts/AuthContext';
import UserPanel from '../user/UserPanel';
import { useTheme } from '../../contexts/ThemeContext';
import navbarStyle from '../../styles/Navbar.module.css';

// Rutas de navegación principales (para la barra secundaria)
const SECONDARY_NAV_ROUTES = [
  { path: '/productos', label: 'Categorías' },
  { path: '/ofertas', label: 'Ofertas' },
  { path: '/marcas', label: 'Marcas' },
];

// Enlaces adicionales para menú móvil
const MOBILE_ADDITIONAL_ROUTES = [
  { path: '/ubicacion', label: 'Ubicación', icon: 'location_on' },
  { path: '/contacto', label: 'Contacto', icon: 'contact_mail' }
];

/**
 * Componente principal de navegación
 * Renderiza la barra de navegación con búsqueda global y navegación secundaria
 */
const Navbar = () => {
  // Hooks
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, subscribeToAuthChanges } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Estados locales
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Cierra todos los modales y menús
   */
  const closeAllModals = useCallback(() => {
    setIsAuthModalOpen(false);
    setIsUserPanelOpen(false);
    setIsMenuOpen(false);
  }, []);

  /**
   * Efecto optimizado para manejar cambios en el estado de autenticación
   */
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((newUser) => {
      if (newUser) {
        // Usuario autenticado - cerrar modal de auth
        setIsAuthModalOpen(false);
      } else {
        // Usuario desautenticado - cerrar panel de usuario
        setIsUserPanelOpen(false);
      }
    });

    return unsubscribe;
  }, [subscribeToAuthChanges]);

  // Manejadores de eventos optimizados
  const handleLoginSuccess = useCallback(() => {
    closeAllModals();
  }, [closeAllModals]);

  const handleLinkClick = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const toggleUserPanel = useCallback(() => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsUserPanelOpen(prev => !prev);
  }, [isAuthenticated]);

  const toggleMobileMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  /**
   * Maneja la búsqueda global
   */
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/productos?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsMenuOpen(false);
    }
  }, [searchQuery, navigate]);

  /**
   * Maneja el cambio en el input de búsqueda
   */
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  /**
   * Renderiza los controles de autenticación según el estado del usuario
   */
  const renderAuthControls = useCallback(() => {
    if (isAuthenticated && user) {
      const avatarUrl = user.avatarUrl || 'https://via.placeholder.com/150';

      return (
        <>
          <button
            className={navbarStyle.authButton}
            onClick={toggleUserPanel}
            aria-label="Abrir panel de usuario"
          >
            <img src={avatarUrl} alt="Avatar de usuario" className={navbarStyle.avatar} />
          </button>
          {isUserPanelOpen && <UserPanel onClose={() => setIsUserPanelOpen(false)} />}
        </>
      );
    }

    return (
      <>
        <button
          className={navbarStyle.authButton}
          onClick={() => setIsAuthModalOpen(true)}
          aria-label="Iniciar sesión"
        >
          <span className="material-icons">person</span>
        </button>
        {isAuthModalOpen && (
          <AuthPanel
            onLoginSuccess={handleLoginSuccess}
            onClose={() => setIsAuthModalOpen(false)}
          />
        )}
      </>
    );
  }, [isAuthenticated, user, isUserPanelOpen, isAuthModalOpen, toggleUserPanel, handleLoginSuccess]);

  /**
   * Renderiza la barra de búsqueda global
   */
  const renderGlobalSearch = useCallback(() => (
    <div className={navbarStyle.searchContainer}>
      <form onSubmit={handleSearch} className={navbarStyle.searchForm}>
        <div className={navbarStyle.searchInputGroup}>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Buscar..."
            className={navbarStyle.searchInput}
            aria-label="Búsqueda global"
          />
          <button
            type="submit"
            className={navbarStyle.searchButton}
            aria-label="Buscar"
          >
            <span className="material-icons">search</span>
          </button>
        </div>
      </form>
    </div>
  ), [searchQuery, handleSearch, handleSearchChange]);

  /**
   * Renderiza los enlaces de la navegación secundaria
   */
  const renderSecondaryNavLinks = useCallback(() => (
    <div className={navbarStyle.secondaryNavLinks}>
      {SECONDARY_NAV_ROUTES.map(({ path, label }) => (
        <Link
          key={path}
          to={path}
          className={`${navbarStyle.secondaryNavLink} ${location.pathname === path ? navbarStyle.active : ''}`}
          onClick={handleLinkClick}
        >
          {label}
        </Link>
      ))}
    </div>
  ), [location.pathname, handleLinkClick]);

  /**
   * Renderiza el menú móvil simplificado
   */
  const renderMobileMenu = useCallback(() => (
    <div className={`${navbarStyle.mobileDropdown} ${isMenuOpen ? navbarStyle.active : ''}`}>
      <div className={navbarStyle.mobileDropdownContent}>
        {SECONDARY_NAV_ROUTES.map(({ path, label }) => (
          <Link
            key={path}
            to={path}
            className={`${navbarStyle.mobileDropdownLink} ${location.pathname === path ? navbarStyle.active : ''}`}
            onClick={handleLinkClick}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  ), [isMenuOpen, location.pathname, handleLinkClick]);

  /**
   * Renderiza el botón de cambio de tema
   */
  const renderThemeToggle = useCallback(() => (
    <button
      className={navbarStyle.themeToggle}
      onClick={toggleTheme}
      aria-label={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
    >
      <span className="material-icons">
        {theme === 'light' ? 'dark_mode' : 'light_mode'}
      </span>
    </button>
  ), [theme, toggleTheme]);

  /**
   * Renderiza el botón de menú móvil
   */
  const renderMenuToggle = useCallback(() => (
    <button
      className={navbarStyle.menuToggle}
      onClick={toggleMobileMenu}
      aria-expanded={isMenuOpen}
      aria-label="Toggle navigation menu"
    >
      <span className="material-icons">{isMenuOpen ? 'close' : 'menu'}</span>
    </button>
  ), [isMenuOpen, toggleMobileMenu]);

  /**
   * Renderiza el botón de carrito (placeholder)
   */
  const renderCartButton = useCallback(() => (
    <button
      className={navbarStyle.cartButton}
      aria-label="Carrito de compras"
    >
      <span className="material-icons">shopping_cart</span>
      <span className={navbarStyle.cartBadge}>0</span>
    </button>
  ), []);

  return (
    <header className={`${navbarStyle.navbar} theme-transition`}>
      {/* Barra principal */}
      <nav className={navbarStyle.mainNavbar}>
        {/* Contenedor Desktop */}
        <div className={navbarStyle.desktopContainer}>
          {/* Sección izquierda: Logo + Categorías (Desktop) */}
          <div className={navbarStyle.leftSection}>
            <div className={navbarStyle.brandSection}>
              <Link to="/" className={navbarStyle.logoLink} onClick={handleLinkClick}>
                <img src={logo} alt="TecnoCel Logo" className={navbarStyle.logoImage} />
                <span className={navbarStyle.logoText}>TECNOCEL</span>
              </Link>
            </div>

            {/* Navegación secundaria al lado del logo (Solo Desktop) */}
            <div className={navbarStyle.leftNavigation}>
              {renderSecondaryNavLinks()}
            </div>
          </div>

          {/* Búsqueda Global (Centro en Desktop) */}
          <div className={navbarStyle.searchSection}>
            {renderGlobalSearch()}
          </div>

          {/* Controles de Usuario (Derecha) */}
          <div className={navbarStyle.controlsSection}>
            <div className={navbarStyle.allControls}>
              {renderThemeToggle()}
              {renderAuthControls()}
              {renderCartButton()}
              {renderMenuToggle()}
            </div>
          </div>
        </div>

        {/* Contenedor Mobile - Dos filas */}
        <div className={navbarStyle.mobileContainer}>
          {/* Primera fila: Logo centrado + Menú en esquina */}
          <div className={navbarStyle.mobileTopRow}>
            <div className={navbarStyle.mobileBrandSection}>
              <Link to="/" className={navbarStyle.logoLink} onClick={handleLinkClick}>
                <img src={logo} alt="TecnoCel Logo" className={navbarStyle.logoImage} />
                <span className={navbarStyle.logoText}>TECNOCEL</span>
              </Link>
            </div>

            {/* Botón de menú en la esquina superior derecha */}
            <div className={navbarStyle.mobileTopControls}>
              {renderMenuToggle()}
            </div>
          </div>

          {/* Segunda fila: Búsqueda y controles */}
          <div className={navbarStyle.mobileBottomRow}>
            {/* Búsqueda */}
            <div className={navbarStyle.mobileSearchSection}>
              {renderGlobalSearch()}
            </div>

            {/* Controles */}
            <div className={navbarStyle.mobileControlsSection}>
              {renderThemeToggle()}
              {renderAuthControls()}
              {renderCartButton()}
            </div>
          </div>
        </div>
      </nav>

      {/* Menú móvil desplegable */}
      {renderMobileMenu()}
    </header>
  );
};

export default Navbar;
