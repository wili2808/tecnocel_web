import { useState, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../../../assets/logo2.svg';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSearch } from '../../../contexts/SearchContext';
import ProductSearch from '../../product/ProductSearch';
import navbarStyle from './Navbar.module.css';

// Rutas de navegación principales
const SECONDARY_NAV_ROUTES = [
    { path: '/productos', label: 'Categorías' },
    { path: '/ofertas', label: 'Ofertas' },
    { path: '/marcas', label: 'Marcas' },
];

// Componente base para botones con iconos - NUEVO
const IconButton = ({
    icon,
    onClick,
    ariaLabel,
    className = '',
    disabled = false,
    children
}: {
    icon: string;
    onClick?: () => void;
    ariaLabel: string;
    className?: string;
    disabled?: boolean;
    children?: React.ReactNode;
}) => (
    <button
        className={`${navbarStyle.iconButton} ${className}`}
        onClick={onClick}
        aria-label={ariaLabel}
        disabled={disabled}
    >
        <span className="material-icons">{icon}</span>
        {children}
    </button>
);

// Componente de navegación secundaria (optimizado)
const SecondaryNavLinks = ({ location, handleLinkClick, isMobile = false }: {
    location: any;
    handleLinkClick: () => void;
    isMobile?: boolean;
}) => (
    <div className={isMobile ? navbarStyle.mobileNavLinks : navbarStyle.secondaryNavLinks}>
        {SECONDARY_NAV_ROUTES.map(({ path, label }) => (
            <Link
                key={path}
                to={path}
                className={`${isMobile ? navbarStyle.mobileDropdownLink : navbarStyle.secondaryNavLink} ${location.pathname === path ? navbarStyle.active : ''
                    }`}
                onClick={handleLinkClick}
            >
                {label}
            </Link>
        ))}
    </div>
);

// Componente de controles consolidado (optimizado)
const ControlButtons = ({
    theme,
    toggleTheme,
    isAuthenticated,
    isMobile = false
}: {
    theme: string;
    toggleTheme: () => void;
    isAuthenticated: boolean;
    isMobile?: boolean;
}) => (
    <div className={isMobile ? navbarStyle.mobileControlsGroup : navbarStyle.controlsGroup}>
        <IconButton
            icon={theme === 'light' ? 'dark_mode' : 'light_mode'}
            onClick={toggleTheme}
            ariaLabel={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
            className={navbarStyle.themeToggle}
        />
        <IconButton
            icon="shopping_cart"
            ariaLabel="Carrito de compras"
            disabled={!isAuthenticated}
            className={`${navbarStyle.cartButton} ${!isAuthenticated ? navbarStyle.cartButtonDisabled : ''}`}
        >
            <span className={navbarStyle.cartBadge}>0</span>
        </IconButton>
    </div>
);

// Componente de autenticación consolidado (optimizado)
const AuthSection = ({
    isAuthenticated,
    user,
    handleAuthClick,
    handleLinkClick,
    isMobile = false
}: {
    isAuthenticated: boolean;
    user: any;
    handleAuthClick: () => void;
    handleLinkClick: () => void;
    isMobile?: boolean;
}) => {
    const baseClass = isMobile ? navbarStyle.mobileAuthSection : navbarStyle.authButtonsGroup;

    if (isAuthenticated && user) {
        return (
            <div className={baseClass}>
                {isMobile ? (
                    <div className={navbarStyle.mobileUserProfile}>
                        <div className={navbarStyle.mobileUserInfo}>
                            <span className="material-icons">account_circle</span>
                            <span className={navbarStyle.mobileUserText}>
                                {user.nombre_cliente} {user.apellido_cliente}
                            </span>
                        </div>
                    </div>
                ) : (
                    <button
                        className={navbarStyle.authButton}
                        onClick={handleAuthClick}
                        aria-label="Perfil de usuario"
                    >
                        <span className="material-icons">account_circle</span>
                        <span className={navbarStyle.authButtonText}>
                            {user.nombre_cliente} {user.apellido_cliente}
                        </span>
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className={baseClass}>
            {isMobile ? (
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
                <>
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
                </>
            )}
        </div>
    );
};

// Componente de menú móvil simplificado
const MobileMenu = ({
    isMenuOpen,
    location,
    handleLinkClick,
    isAuthenticated,
    user,
    handleAuthClick,
    theme,
    toggleTheme
}: {
    isMenuOpen: boolean;
    location: any;
    handleLinkClick: () => void;
    isAuthenticated: boolean;
    user: any;
    handleAuthClick: () => void;
    theme: string;
    toggleTheme: () => void;
}) => (
    <div className={`${navbarStyle.mobileDropdown} ${isMenuOpen ? navbarStyle.active : ''}`}>
        <div className={navbarStyle.mobileDropdownContent}>
            <AuthSection
                isAuthenticated={isAuthenticated}
                user={user}
                handleAuthClick={handleAuthClick}
                handleLinkClick={handleLinkClick}
                isMobile={true}
            />

            <div className={navbarStyle.mobileSeparator}></div>

            <SecondaryNavLinks
                location={location}
                handleLinkClick={handleLinkClick}
                isMobile={true}
            />

            <div className={navbarStyle.mobileSeparator}></div>

            <ControlButtons
                theme={theme}
                toggleTheme={toggleTheme}
                isAuthenticated={isAuthenticated}
                isMobile={true}
            />

            {isAuthenticated && user && (
                <>
                    <div className={navbarStyle.mobileSeparator}></div>
                    <div className={navbarStyle.mobileLogoutSection}>
                        <IconButton
                            icon="logout"
                            onClick={() => {
                                handleAuthClick();
                                handleLinkClick();
                            }}
                            ariaLabel="Cerrar sesión"
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

/**
 * Componente principal de navegación optimizado
 */
const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { navigateToProducts } = useSearch();

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Manejadores de eventos consolidados
    const handleLinkClick = useCallback(() => setIsMenuOpen(false), []);
    const handleAuthClick = useCallback(() => {
        if (isAuthenticated) {
            logout();
        } else {
            navigate('/login');
        }
    }, [isAuthenticated, logout, navigate]);
    const toggleMobileMenu = useCallback(() => setIsMenuOpen(prev => !prev), []);
    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        navigateToProducts();
        setIsMenuOpen(false);
    }, [navigateToProducts]);

    // Componente de búsqueda global memoizado
    const globalSearch = useMemo(() => (
        <div className={navbarStyle.searchContainer}>
            <form onSubmit={handleSearch} className={navbarStyle.searchForm}>
                <ProductSearch
                    placeholder="Buscar productos..."
                    showClearButton={true}
                    className={navbarStyle.productSearchWrapper}
                />
            </form>
        </div>
    ), [handleSearch]);

    return (
        <header className={`${navbarStyle.navbar} theme-transition`}>
            <nav className={navbarStyle.mainNavbar}>
                {/* Contenedor Desktop */}
                <div className={navbarStyle.desktopContainer}>
                    <div className={navbarStyle.leftSection}>
                        <div className={navbarStyle.brandSection}>
                            <Link to="/" className={navbarStyle.logoLink} onClick={handleLinkClick}>
                                <img src={logo} alt="TecnoCel Logo" className={navbarStyle.logoImage} />
                                <span className={navbarStyle.logoText}>TECNOCEL</span>
                            </Link>
                        </div>
                        <div className={navbarStyle.leftNavigation}>
                            <SecondaryNavLinks location={location} handleLinkClick={handleLinkClick} />
                        </div>
                    </div>

                    <div className={navbarStyle.searchSection}>
                        {globalSearch}
                    </div>

                    <div className={navbarStyle.controlsSection}>
                        <div className={navbarStyle.allControls}>
                            <ControlButtons
                                theme={theme}
                                toggleTheme={toggleTheme}
                                isAuthenticated={isAuthenticated}
                            />
                            <AuthSection
                                isAuthenticated={isAuthenticated}
                                user={user}
                                handleAuthClick={handleAuthClick}
                                handleLinkClick={handleLinkClick}
                            />
                            <IconButton
                                icon={isMenuOpen ? 'close' : 'menu'}
                                onClick={toggleMobileMenu}
                                ariaLabel="Abrir menú"
                                className={navbarStyle.menuToggle}
                            />
                        </div>
                    </div>
                </div>

                {/* Contenedor Mobile */}
                <div className={navbarStyle.mobileContainer}>
                    <div className={navbarStyle.mobileRow}>
                        <div className={navbarStyle.mobileBrandSection}>
                            <Link to="/" className={navbarStyle.logoLink} onClick={handleLinkClick}>
                                <img src={logo} alt="TecnoCel Logo" className={navbarStyle.logoImage} />
                            </Link>
                        </div>

                        <div className={navbarStyle.mobileSearchSection}>
                            {globalSearch}
                        </div>

                        <div className={navbarStyle.mobileControlsSection}>
                            <IconButton
                                icon="shopping_cart"
                                ariaLabel="Carrito de compras"
                                disabled={!isAuthenticated}
                                className={`${navbarStyle.cartButton} ${!isAuthenticated ? navbarStyle.cartButtonDisabled : ''}`}
                            >
                                <span className={navbarStyle.cartBadge}>0</span>
                            </IconButton>
                            <IconButton
                                icon={isMenuOpen ? 'close' : 'menu'}
                                onClick={toggleMobileMenu}
                                ariaLabel="Abrir menú"
                                className={navbarStyle.menuToggle}
                            />
                        </div>
                    </div>
                </div>
            </nav>

            <MobileMenu
                isMenuOpen={isMenuOpen}
                location={location}
                handleLinkClick={handleLinkClick}
                isAuthenticated={isAuthenticated}
                user={user}
                handleAuthClick={handleAuthClick}
                theme={theme}
                toggleTheme={toggleTheme}
            />
        </header>
    );
};

export default Navbar; 