/**
 * Componente Navbar - Navegación principal de la aplicación
 * Proporciona navegación global, búsqueda de productos, controles de tema y autenticación
 * Incluye diseño responsive con menú móvil y navegación desktop
 * Maneja estados de autenticación, carrito y tema de la aplicación
 */
import { useState, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logo from '../../../assets/logo2.svg';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useCarrito } from '../../../contexts/CarritoContext';
import ProductSearch from '../../product/ProductSearch';
import IconButton from '../../common/IconButton';
import navbarStyle from './Navbar.module.css';

// ============================================================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================================================

/**
 * Rutas de navegación secundaria disponibles en la aplicación
 * Define las páginas principales accesibles desde el navbar
 */
const SECONDARY_NAV_ROUTES = [
    { path: '/productos', label: 'Productos' },
    { path: '/ofertas', label: 'Ofertas' },
    { path: '/marcas', label: 'Marcas' },
    { path: '/contacto', label: 'Contacto' },
    { path: '/button-demo', label: '🎨 Botones' },
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const Navbar: React.FC = () => {
    // ============================================================================
    // HOOKS Y CONTEXTOS
    // ============================================================================
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { estado } = useCarrito();

    // ============================================================================
    // ESTADOS LOCALES
    // ============================================================================
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // ============================================================================
    // CÁLCULOS MEMOIZADOS
    // ============================================================================
    
    /**
     * Contador total de items en el carrito - MEMOIZADO
     * Calcula la suma de todas las cantidades para evitar re-renders innecesarios
     */
    const cartItemCount = useMemo(() => {
        return estado?.items?.reduce((total, item) => total + item.cantidad, 0) || 0;
    }, [estado?.items]);

    // ============================================================================
    // MANEJADORES DE EVENTOS
    // ============================================================================
    
    /**
     * Cerrar menú móvil al hacer clic en un enlace
     * Mejora la UX en dispositivos móviles
     */
    const handleLinkClick = useCallback(() => setIsMenuOpen(false), []);
    
    /**
     * Alternar estado del menú móvil
     * Controla la visibilidad del dropdown en dispositivos móviles
     */
    const toggleMobileMenu = useCallback(() => setIsMenuOpen(prev => !prev), []);
    
    /**
     * Manejar clic en botón de autenticación
     * Navega al panel de usuario si está autenticado, o al login si no
     */
    const handleAuthClick = useCallback(() => {
        if (isAuthenticated) {
            navigate('/panel');
        } else {
            navigate('/login');
        }
        handleLinkClick();
    }, [isAuthenticated, navigate, handleLinkClick]);

    // ============================================================================
    // COMPONENTES INTERNOS
    // ============================================================================
    
    /**
     * Enlaces de navegación secundaria
     * Renderiza los enlaces principales de la aplicación
     * 
     * @param isMobile - Si se debe renderizar en versión móvil
     */
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

    /**
     * Botones de control (tema y carrito)
     * Maneja la funcionalidad de cambio de tema y acceso al carrito
     */
    function ControlButtons() {
        return (
            <div className={navbarStyle.controlsGroup}>
                {/* Botón de cambio de tema */}
                <IconButton
                    icon={theme === 'light' ? 'dark_mode' : 'light_mode'}
                    onClick={() => {
                        toggleTheme();
                        handleLinkClick();
                    }}
                    ariaLabel={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
                    variant="ghost"
                    size="sm"
                    className={navbarStyle.themeToggle}
                />
                
                {/* Botón del carrito de compras */}
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
                    size="sm"
                    className={`${navbarStyle.cartButton} ${!isAuthenticated ? navbarStyle.cartButtonDisabled : ''}`}
                >
                    <span className={navbarStyle.cartBadge}>{cartItemCount}</span>
                </IconButton>
            </div>
        );
    }

    /**
     * Sección de autenticación del usuario
     * Muestra botones de login/registro o perfil del usuario autenticado
     * 
     * @param isMobile - Si se debe renderizar en versión móvil
     */
    function AuthSection({ isMobile = false }: { isMobile?: boolean }) {
        const baseClass = isMobile ? navbarStyle.mobileAuthSection : navbarStyle.authButtonsGroup;

        if (isAuthenticated && user) {
            return (
                <div className={baseClass}>
                    {isMobile ? (
                        /* Versión móvil del perfil de usuario */
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
                        /* Versión desktop del perfil de usuario */
                        <IconButton
                            icon="account_circle"
                            onClick={handleAuthClick}
                            ariaLabel="Ir al panel de usuario"
                            variant="ghost"
                            size="sm"
                            className={navbarStyle.authButton}
                            children={<span className={navbarStyle.authButtonText}>
                                {user.nombre_cliente} {user.apellido_cliente}
                            </span>}
                        />
                    )}
                </div>
            );
        }

        return (
            <div className={baseClass}>
                {isMobile ? (
                    /* Versión móvil de botones de autenticación */
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
                    /* Versión desktop de botones de autenticación */
                    <>
                        <IconButton
                            icon="login"
                            onClick={handleAuthClick}
                            ariaLabel="Iniciar sesión"
                            variant="ghost"
                            size="sm"
                            className={navbarStyle.authButton}
                            children={<span className={navbarStyle.authButtonText}>Ingresar</span>}
                        />
                    </>
                )}
            </div>
        );
    }

    /**
     * Menú desplegable para dispositivos móviles
     * Contiene todas las opciones de navegación en formato vertical
     */
    function MobileMenu() {
        return (
            <div className={`${navbarStyle.mobileDropdown} ${isMenuOpen ? navbarStyle.active : ''}`}>
                <div className={navbarStyle.mobileDropdownContent}>
                    {/* Sección de autenticación móvil */}
                    <AuthSection isMobile={true} />

                    <div className={navbarStyle.mobileSeparator}></div>

                    {/* Enlaces de navegación móvil */}
                    <SecondaryNavLinks isMobile={true} />

                    {/* Botón de logout para usuarios autenticados */}
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
    // COMPONENTES MEMOIZADOS
    // ============================================================================
    
    /**
     * Componente de búsqueda global memoizado
     * Evita re-renders innecesarios del componente de búsqueda
     */
    const globalSearch = useMemo(() => (
        <div className={navbarStyle.searchSection}>
            <ProductSearch
                placeholder="Buscar productos, marcas y mas ..."
                showClearButton={true}
                onSearch={() => handleLinkClick()}
            />
        </div>
    ), [handleLinkClick]);

    // ============================================================================
    // RENDERIZADO PRINCIPAL
    // ============================================================================
    
    return (
        <header className={`${navbarStyle.navbar} theme-transition`}>
            <nav className={navbarStyle.mainNavbar}>
                {/* Contenedor Desktop - Navegación para pantallas grandes */}
                <div className={navbarStyle.desktopContainer}>
                    <div className={navbarStyle.leftSection}>
                        {/* Sección de marca y logo */}
                        <div className={navbarStyle.brandSection}>
                            <Link to="/" className={navbarStyle.logoLink} onClick={handleLinkClick}>
                                <img src={logo} alt="TecnoCel Logo" className={navbarStyle.logoImage} />
                                <span className={navbarStyle.logoText}>TECNOCEL</span>
                            </Link>
                        </div>
                        
                        {/* Navegación secundaria izquierda */}
                        <div className={navbarStyle.leftNavigation}>
                            <SecondaryNavLinks />
                        </div>
                    </div>

                    {/* Sección de búsqueda central */}
                    <div className={navbarStyle.searchSection}>
                        {globalSearch}
                    </div>

                    {/* Sección de controles y autenticación derecha */}
                    <div className={navbarStyle.controlsSection}>
                        <div className={navbarStyle.allControls}>
                            <ControlButtons />
                            <AuthSection />
                            
                            {/* Botón de menú móvil (oculto en desktop) */}
                            <IconButton
                                icon={isMenuOpen ? 'close' : 'menu'}
                                onClick={toggleMobileMenu}
                                ariaLabel="Abrir menú"
                                variant="ghost"
                                size="md"
                                className={navbarStyle.menuToggle}
                            />
                        </div>
                    </div>
                </div>

                {/* Contenedor Mobile - Navegación para dispositivos móviles */}
                <div className={navbarStyle.mobileContainer}>
                    <div className={navbarStyle.mobileRow}>
                        {/* Logo en versión móvil */}
                        <div className={navbarStyle.mobileBrandSection}>
                            <Link to="/" className={navbarStyle.logoLink} onClick={handleLinkClick}>
                                <img src={logo} alt="TecnoCel Logo" className={navbarStyle.logoImage} />
                            </Link>
                        </div>

                        {/* Búsqueda móvil */}
                        <div className={navbarStyle.mobileSearchSection}>
                            {globalSearch}
                        </div>

                        {/* Controles móviles */}
                        <div className={navbarStyle.mobileControlsSection}>
                            <ControlButtons />
                            
                            {/* Botón de menú móvil */}
                            <IconButton
                                icon={isMenuOpen ? 'close' : 'menu'}
                                onClick={toggleMobileMenu}
                                ariaLabel="Abrir menú"
                                variant="ghost"
                                size="md"
                                className={navbarStyle.menuToggle}
                            />
                        </div>
                    </div>
                </div>
            </nav>

            {/* Menú desplegable móvil */}
            <MobileMenu />
        </header>
    );
};

export default Navbar; 