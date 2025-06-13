/**
 * Componente Navbar - Barra de navegación principal de la aplicación
 * Maneja la navegación, autenticación y cambio de tema
 * Implementa un diseño responsive con menú móvil
 */
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../assets/logo2.svg';
import AuthPanel from '../user/AuthPanel';
import { useAuth } from '../../contexts/AuthContext';
import UserPanel from '../user/UserPanel';
import { useTheme } from '../../contexts/ThemeContext';
import navbarStyle from '../../styles/Navbar.module.css';

// Rutas de navegación principales
const NAV_ROUTES = [
  { path: '/productos', label: 'Productos' },
  { path: '/egresados', label: 'Egresados' },
  { path: '/deportes', label: 'Deportivos' },
  { path: '/sublimacion', label: 'Sublimación' },
  { path: '/bordados', label: 'Bordados' },
  { path: '/ubicacion', label: 'Ubicación' }
];

/**
 * Componente principal de navegación
 * Renderiza la barra de navegación con sus diferentes secciones
 */
const Navbar = () => {
  // Hooks
  const location = useLocation();
  const { user, isAuthenticated, subscribeToAuthChanges } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Estados locales
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);

  // Valores derivados
  const avatarUrl = user?.avatarUrl || 'https://via.placeholder.com/150';

  /**
   * Efecto para manejar cambios en el estado de autenticación
   */
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((newUser) => {
      // Solo actualizar el estado si el usuario ha cambiado
      if (newUser !== user) {
        if (newUser) {
          setIsAuthModalOpen(false);
          setIsUserPanelOpen(false);
        } else {
          setIsUserPanelOpen(false);
          setIsAuthModalOpen(false);
        }
      }
    });

    return () => unsubscribe();
  }, [subscribeToAuthChanges, user]);

  // Manejadores de eventos
  const handleAuthModalClose = () => setIsAuthModalOpen(false);
  const handleUserPanelClose = () => setIsUserPanelOpen(false);
  const handleLoginSuccess = () => {
    setIsAuthModalOpen(false);
    setIsMenuOpen(false);
  };
  const handleLinkClick = () => setIsMenuOpen(false);
  const toggleUserPanel = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsUserPanelOpen(prev => !prev);
  };

  /**
   * Renderiza los controles de autenticación según el estado del usuario
   */
  const renderAuthControls = () => {
    if (isAuthenticated && user) {
      return (
        <>
          <button
            className={navbarStyle.authButton}
            onClick={toggleUserPanel}
            aria-label="Abrir panel de usuario"
          >
            <img src={avatarUrl} alt="Avatar de usuario" className={navbarStyle.avatar} />
          </button>
          {isUserPanelOpen && <UserPanel onClose={handleUserPanelClose} />}
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
            onClose={handleAuthModalClose}
          />
        )}
      </>
    );
  };

  /**
   * Renderiza los enlaces de navegación
   */
  const renderNavLinks = () => (
    <div className={`${navbarStyle.navLinks} ${isMenuOpen ? navbarStyle.active : ''}`}>
      {NAV_ROUTES.map(({ path, label }) => (
        <Link
          key={path}
          to={path}
          className={`${navbarStyle.navLink} ${location.pathname === path ? navbarStyle.active : ''}`}
          onClick={handleLinkClick}
        >
          {label}
        </Link>
      ))}
    </div>
  );

  /**
   * Renderiza el botón de cambio de tema
   */
  const renderThemeToggle = () => (
    <button 
      className={navbarStyle.themeToggle}
      onClick={toggleTheme}
      aria-label={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
    >
      <span className="material-icons">
        {theme === 'light' ? 'dark_mode' : 'light_mode'}
      </span>
    </button>
  );

  /**
   * Renderiza el botón de menú móvil
   */
  const renderMenuToggle = () => (
    <button
      className={navbarStyle.menuToggle}
      onClick={() => setIsMenuOpen(!isMenuOpen)}
      aria-expanded={isMenuOpen}
      aria-label="Toggle navigation menu"
    >
      <span className="material-icons">{isMenuOpen ? 'close' : 'menu'}</span>
    </button>
  );

  return (
    <nav className={`${navbarStyle.navbar} theme-transition`}>
      <div className={navbarStyle.navContainer}>
        {/* Sección 1: Logo y Título */}
        <div className={navbarStyle.brandSection}>
            <Link to="/" className={navbarStyle.logoLink} onClick={handleLinkClick}>
            <img src={logo} alt="TecnoCel Logo" className={navbarStyle.logoImage} />
            <span className={navbarStyle.logoText}>TECNOCEL</span>
          </Link>
        </div>

        {/* Sección 2: Navegación */}
        <div className={`${navbarStyle.navigationSection} ${isMenuOpen ? navbarStyle.active : ''}`}>
          {renderNavLinks()}
        </div>

        {/* Sección 3: Controles de Usuario */}
        <div className={navbarStyle.controlsGroup}>
          <div className={navbarStyle.controlsSection}>
            {renderMenuToggle()}
            {renderThemeToggle()}
            {renderAuthControls()}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
