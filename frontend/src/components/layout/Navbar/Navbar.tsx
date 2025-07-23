import { useState, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../../../assets/logo2.svg';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSearch } from '../../../contexts/SearchContext';
import { useCarrito } from '../../../contexts/CarritoContext';
import ProductSearch from '../../product/ProductSearch';
import IconButton from '../../common/IconButton';
import navbarStyle from './Navbar.module.css';

// Rutas de navegación principales
const SECONDARY_NAV_ROUTES = [
    { path: '/productos', label: 'Categorías' },
    { path: '/ofertas', label: 'Ofertas' },
    { path: '/marcas', label: 'Marcas' },
];

/**
 * Componente principal de navegación refactorizado
 */
const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { navigateToProducts } = useSearch();
    const { estado } = useCarrito();

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Memoizar el contador del carrito para evitar re-renders innecesarios
    const cartItemCount = useMemo(() => {
        return estado?.items?.length || 0;
    }, [estado?.items?.length]);

    // Manejadores de eventos
    const handleLinkClick = useCallback(() => setIsMenuOpen(false), []);
    const toggleMobileMenu = useCallback(() => setIsMenuOpen(prev => !prev), []);
    const handleAuthClick = useCallback(() => {
        if (isAuthenticated) {
            navigate('/panel');
        } else {
            navigate('/login');
        }
        handleLinkClick();
    }, [isAuthenticated, navigate, handleLinkClick]);
    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        navigateToProducts();
        setIsMenuOpen(false);
    }, [navigateToProducts]);

    // Sección de navegación secundaria
    function SecondaryNavLinks({ isMobile = false }: { isMobile?: boolean }) {
        return (
            <div className={isMobile ? navbarStyle.mobileNavLinks : navbarStyle.secondaryNavLinks}>
                {SECONDARY_NAV_ROUTES.map(({ path, label }) => (
                    <Link
                        key={path}
                        to={path}
                        className={`${isMobile ? navbarStyle.mobileDropdownLink : navbarStyle.secondaryNavLink} ${location.pathname === path ? navbarStyle.active : ''}`}
                        onClick={handleLinkClick}
                    >
                        {label}
                    </Link>
                ))}
            </div>
        );
    }

    // Sección de controles (tema y carrito)
    function ControlButtons() {
        return (
            <div className={navbarStyle.controlsGroup}>
                <IconButton
                    icon={theme === 'light' ? 'dark_mode' : 'light_mode'}
                    onClick={() => {
                        toggleTheme();
                        handleLinkClick();
                    }}
                    ariaLabel={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
                    variant="ghost"
                    size="medium"
                    className={navbarStyle.themeToggle}
                />
                <IconButton
                    icon="shopping_cart"
                    onClick={() => {
                        if (isAuthenticated) {
                            navigate('/carrito');
                            handleLinkClick();
                        } else {
                            navigate('/login');
                            handleLinkClick();
                        }
                    }}
                    ariaLabel="Carrito de compras"
                    disabled={!isAuthenticated}
                    variant="ghost"
                    size="medium"
                    className={`${navbarStyle.cartButton} ${!isAuthenticated ? navbarStyle.cartButtonDisabled : ''}`}
                >
                    <span className={navbarStyle.cartBadge}>{cartItemCount}</span>
                </IconButton>
            </div>
        );
    }

    // Sección de autenticación
    function AuthSection({ isMobile = false }: { isMobile?: boolean }) {
        const baseClass = isMobile ? navbarStyle.mobileAuthSection : navbarStyle.authButtonsGroup;

        if (isAuthenticated && user) {
            return (
                <div className={baseClass}>
                    {isMobile ? (
                        <div className={navbarStyle.mobileUserProfile}>
                            <button
                                className={navbarStyle.mobileUserInfo}
                                onClick={() => {
                                    handleAuthClick();
                                    handleLinkClick();
                                }}
                                aria-label="Ir al panel de usuario"
                            >
                                <span className="material-icons">account_circle</span>
                                <span className={navbarStyle.mobileUserText}>
                                    {user.nombre_cliente} {user.apellido_cliente}
                                </span>
                            </button>
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
                            onClick={handleLinkClick}
                        >
                            <span className="material-icons">login</span>
                            <span className={navbarStyle.authButtonText}>Ingresar</span>
                        </Link>
                        <Link
                            to="/register"
                            className={`${navbarStyle.authButton} ${navbarStyle.registerButton}`}
                            aria-label="Crear cuenta"
                            onClick={handleLinkClick}
                        >
                            <span className="material-icons">person_add</span>
                            <span className={navbarStyle.authButtonText}>Registro</span>
                        </Link>
                    </>
                )}
            </div>
        );
    }

    // Menú móvil
    function MobileMenu() {
        return (
            <div className={`${navbarStyle.mobileDropdown} ${isMenuOpen ? navbarStyle.active : ''}`}>
                <div className={navbarStyle.mobileDropdownContent}>
                    <AuthSection isMobile={true} />

                    <div className={navbarStyle.mobileSeparator}></div>

                    <SecondaryNavLinks isMobile={true} />

                    {isAuthenticated && user && (
                        <>
                            <div className={navbarStyle.mobileSeparator}></div>
                            <div className={navbarStyle.mobileLogoutSection}>
                                <IconButton
                                    icon="logout"
                                    onClick={() => {
                                        logout();
                                        handleLinkClick();
                                    }}
                                    ariaLabel="Cerrar sesión"
                                    variant="ghost"
                                    size="medium"
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

    // Componente de búsqueda global memoizado
    const globalSearch = useMemo(() => (
        <div className={navbarStyle.searchSection}>
            <ProductSearch
                placeholder="Buscar productos..."
                showClearButton={true}
                onSearch={() => handleLinkClick()}
            />
        </div>
    ), [handleLinkClick]);

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
                            <SecondaryNavLinks />
                        </div>
                    </div>

                    <div className={navbarStyle.searchSection}>
                        {globalSearch}
                    </div>

                    <div className={navbarStyle.controlsSection}>
                        <div className={navbarStyle.allControls}>
                            <ControlButtons />
                            <AuthSection />
                            <IconButton
                                icon={isMenuOpen ? 'close' : 'menu'}
                                onClick={toggleMobileMenu}
                                ariaLabel="Abrir menú"
                                variant="ghost"
                                size="medium"
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
                            <ControlButtons />
                            {/* Icono de menú */}
                            <IconButton
                                icon={isMenuOpen ? 'close' : 'menu'}
                                onClick={toggleMobileMenu}
                                ariaLabel="Abrir menú"
                                variant="ghost"
                                size="medium"
                                className={navbarStyle.menuToggle}
                            />
                        </div>
                    </div>
                </div>
            </nav>

            <MobileMenu />
        </header>
    );
};

export default Navbar; 