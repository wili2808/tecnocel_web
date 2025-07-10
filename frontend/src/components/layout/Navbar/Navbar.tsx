import { useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../../../assets/logo2.svg';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSearch } from '../../../contexts/SearchContext';
import navbarStyle from './Navbar.module.css';

// Rutas de navegación principales (para la barra secundaria)
const SECONDARY_NAV_ROUTES = [
    { path: '/productos', label: 'Categorías' },
    { path: '/ofertas', label: 'Ofertas' },
    { path: '/marcas', label: 'Marcas' },
];

/**
 * Componente principal de navegación
 * Renderiza la barra de navegación con búsqueda global y navegación secundaria
 */
const Navbar = () => {
    // Hooks
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { searchQuery, setSearchQuery, navigateToProducts, isSearching } = useSearch();

    // Estados locales
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Manejadores de eventos optimizados

    const handleLinkClick = useCallback(() => {
        setIsMenuOpen(false);
    }, []);

    const handleAuthClick = useCallback(() => {
        if (isAuthenticated) {
            logout();
        } else {
            navigate('/login');
        }
    }, [isAuthenticated, logout, navigate]);

    const toggleMobileMenu = useCallback(() => {
        setIsMenuOpen(prev => !prev);
    }, []);

    /**
     * Maneja la búsqueda global (envío del formulario)
     */
    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        navigateToProducts();
        setIsMenuOpen(false);
    }, [navigateToProducts]);

    /**
     * Maneja el cambio en el input de búsqueda
     */
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    }, [setSearchQuery]);

    /**
     * Renderiza los controles de autenticación según el estado del usuario
     */
    const renderAuthControls = useCallback(() => {
        if (isAuthenticated && user) {
            return (
                <div className={navbarStyle.authButtonsGroup}>
                    <button
                        className={navbarStyle.authButton}
                        onClick={handleAuthClick}
                        aria-label="Cerrar sesión"
                    >
                        <span className="material-icons">account_circle</span>
                        <span className={navbarStyle.authButtonText}>
                            {user.nombre_cliente} {user.apellido_cliente}
                        </span>
                    </button>
                </div>
            );
        }

        return (
            <div className={navbarStyle.authButtonsGroup}>
                <Link
                    to="/login"
                    className={navbarStyle.authButton}
                    aria-label="Iniciar sesión"
                >
                    <span className="material-icons">login</span>
                    <span className={navbarStyle.authButtonText}>Ingresar</span>
                </Link>
                <Link
                    to="/register"
                    className={`${navbarStyle.authButton} ${navbarStyle.registerButton}`}
                    aria-label="Crear cuenta"
                >
                    <span className="material-icons">person_add</span>
                    <span className={navbarStyle.authButtonText}>Registro</span>
                </Link>
            </div>
        );
    }, [isAuthenticated, user, handleAuthClick]);

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
                        placeholder="Buscar productos..."
                        className={`${navbarStyle.searchInput} ${isSearching ? navbarStyle.searching : ''}`}
                        aria-label="Búsqueda global"
                    />
                    <button
                        type="submit"
                        className={navbarStyle.searchButton}
                        aria-label="Buscar"
                        disabled={isSearching}
                    >
                        <span className="material-icons">
                            {isSearching ? 'hourglass_empty' : 'search'}
                        </span>
                    </button>
                </div>
            </form>
        </div>
    ), [searchQuery, handleSearch, handleSearchChange, isSearching]);

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