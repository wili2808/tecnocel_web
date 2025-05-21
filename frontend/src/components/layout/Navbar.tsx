/**
 * Componente Navbar - Barra de navegación principal de la aplicación
 * Maneja la navegación, autenticación y cambio de tema
 */
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo2.svg';
import navbarStyle from '../../styles/Navbar.module.css';
import { useTheme } from '../../contexts/ThemeContext';
import AuthPanel from '../user/AuthPanel';
import UserPanel from '../user/UserPanel';

const Navbar = () => {
  // Estados para controlar la visibilidad de diferentes paneles
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);

  // Hooks para obtener información de la ubicación actual y el usuario
  const location = useLocation();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  // URL del avatar del usuario o imagen por defecto
  const avatarUrl = user?.avatarUrl || 'https://via.placeholder.com/150';

  /**
   * Cierra el menú de navegación al hacer clic en un enlace
   */
  const handleLinkClick = () => {
    setIsMenuOpen(false);
  };

  /**
   * Maneja el cierre del modal de autenticación después de un inicio de sesión exitoso
   */
  const handleLoginSuccess = () => {
    setIsAuthModalOpen(false);
    handleLinkClick();
  };

  return (
    <nav className={`${navbarStyle.navbar} theme-transition`}>
      <div className={`container ${navbarStyle.navContainer}`}>
        {/* Logo y nombre de la empresa */}
        <Link to="/" className={navbarStyle.logoLink} onClick={handleLinkClick}>
          <img src={logo} alt="MAC WIL Logo" className={navbarStyle.logoImage} />
          <span className={navbarStyle.logoText}>Mac-Wil</span>
        </Link>

        {/* Botón para alternar el menú en dispositivos móviles */}
        <button
          className={navbarStyle.menuToggle}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation menu"
        >
          <span className="material-icons">
            {isMenuOpen ? 'close' : 'menu'}
          </span>
        </button>

        {/* Enlaces de navegación principales */}
        <div className={`${navbarStyle.navLinks} ${isMenuOpen ? navbarStyle.active : ''}`}>
          <Link to="/uniformes-escolares" className={`${navbarStyle.navLink} ${location.pathname === '/uniformes-escolares' ? navbarStyle.active : ''}`} onClick={handleLinkClick}>Escolares</Link>
          <Link to="/egresados" className={`${navbarStyle.navLink} ${location.pathname === '/egresados' ? navbarStyle.active : ''}`} onClick={handleLinkClick}>Egresados</Link>
          <Link to="/deportes" className={`${navbarStyle.navLink} ${location.pathname === '/deportes' ? navbarStyle.active : ''}`} onClick={handleLinkClick}>Deportivos</Link>
          <Link to="/sublimacion" className={`${navbarStyle.navLink} ${location.pathname === '/sublimacion' ? navbarStyle.active : ''}`} onClick={handleLinkClick}>Sublimación</Link>
          <Link to="/bordados" className={`${navbarStyle.navLink} ${location.pathname === '/bordados' ? navbarStyle.active : ''}`} onClick={handleLinkClick}>Bordados</Link>
          <Link to="/ubicacion" className={`${navbarStyle.navLink} ${location.pathname === '/ubicacion' ? navbarStyle.active : ''}`} onClick={handleLinkClick}>Ubicación</Link>

          {/* Panel de control de usuario y tema */}
          <div className={navbarStyle.navControls}>
            {user ? (
              // Panel de usuario cuando el usuario está autenticado
              <>
                <button
                  className={navbarStyle.authButton}
                  onClick={() => setIsUserPanelOpen(true)}
                  aria-label="Abrir panel de usuario"
                >
                  <img
                    src={avatarUrl}
                    alt="Avatar de usuario"
                    className={navbarStyle.avatar}
                  />
                </button>
                {isUserPanelOpen && (
                  <UserPanel onClose={() => setIsUserPanelOpen(false)} />
                )}
              </>
            ) : (
              // Panel de autenticación cuando el usuario no está autenticado
              <>
                <button
                  className={navbarStyle.authButton}
                  onClick={() => setIsAuthModalOpen(true)}
                  aria-label="Iniciar sesión"
                >
                  <span className="material-icons" style={{ fontSize: '24px' }}>person</span>
                </button>
                {isAuthModalOpen && (
                  <AuthPanel 
                    onLoginSuccess={handleLoginSuccess}
                    onClose={() => setIsAuthModalOpen(false)}
                  />
                )}
              </>
            )}
            {/* Botón para alternar entre tema claro y oscuro */}
            <button 
              className={navbarStyle.themeToggle}
              onClick={toggleTheme}
              aria-label={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
            >
              <span className="material-icons">
                {theme === 'light' ? 'dark_mode' : 'light_mode'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
