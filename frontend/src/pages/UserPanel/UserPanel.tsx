/**
 * Componente UserPanel - Panel de usuario completo con navegación lateral
 * Proporciona acceso a todas las funcionalidades del usuario autenticado
 * Incluye gestión de perfil, favoritos, compras y configuración de cuenta
 * Utiliza múltiples hooks y contextos para funcionalidad completa
 */
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { Cliente } from '../../types/cliente';
import { useNavigate, useLocation } from 'react-router-dom';
import DatosCuenta from '../../components/user/DatosCuenta';
import InformacionPersonal from '../../components/user/InformacionPersonal';
import Seguridad from '../../components/user/Seguridad';
import MisCompras from '../../components/user/MisCompras';
import Direcciones from '../../components/user/Direcciones';
import Soporte from '../../components/user/Soporte';
import Favoritos from '../../components/user/Favoritos';
import userPanelStyles from './UserPanel.module.css';

// ============================================================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================================================

/**
 * Opciones del menú del panel de usuario
 * Cada opción incluye id, etiqueta e icono de Material Design
 */
const MENU_OPTIONS = [
    { id: 'profile', label: 'Información Personal', icon: 'person' },
    { id: 'account', label: 'Datos de Cuenta', icon: 'account_circle' },
    { id: 'security', label: 'Seguridad', icon: 'security' },
    { id: 'purchases', label: 'Mis Compras', icon: 'shopping_bag' },
    { id: 'favorites', label: 'Favoritos', icon: 'favorite' },
    { id: 'addresses', label: 'Direcciones', icon: 'location_on' },
    { id: 'support', label: 'Soporte', icon: 'help' },
];

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

/**
 * Componente de elemento del menú del panel
 * Renderiza cada opción del menú con estado activo y funcionalidad de click
 */
const MenuOption = ({
    option,
    isActive,
    onClick
}: {
    option: typeof MENU_OPTIONS[0];
    isActive: boolean;
    onClick: () => void;
}) => (
    <button
        className={`${userPanelStyles.menuOption} ${isActive ? userPanelStyles.activeOption : ''}`}
        onClick={onClick}
        aria-label={option.label}
    >
        <span className="material-icons">{option.icon}</span>
        <span className={userPanelStyles.menuLabel}>{option.label}</span>
    </button>
);

// ============================================================================
// SECCIÓN DE CONTENIDO DINÁMICO
// ============================================================================

/**
 * Componente de contenido dinámico del panel
 * Renderiza diferentes secciones según la opción activa del menú
 * Cada sección tiene su propia lógica y presentación
 */
const ContentSection = ({ activeSection }: { activeSection: string }) => {
    /**
     * Renderiza el contenido específico de cada sección del panel
     * Utiliza switch statement para manejar múltiples opciones de menú
     */
    const renderContent = () => {
        switch (activeSection) {
            case 'profile':
                return <InformacionPersonal />;

            case 'account':
                return <DatosCuenta />;

            case 'security':
                return <Seguridad />;
            case 'purchases':
                return <MisCompras />;
            case 'favorites':
                return <Favoritos />;
            case 'addresses':
                return <Direcciones />;
            case 'support':
                return <Soporte />;
            default:
                return (
                    <div className={userPanelStyles.contentSection}>
                        <h2 className={userPanelStyles.sectionTitle}>Bienvenido</h2>
                        <p>Selecciona una opción del menú para comenzar.</p>
                    </div>
                );
        }
    };

    return (
        <div className={userPanelStyles.contentArea}>
            {renderContent()}
        </div>
    );
};

// ============================================================================
// COMPONENTE PRINCIPAL - USERPANEL
// ============================================================================

/**
 * Componente principal del panel de usuario
 * Gestiona la autenticación, navegación y renderizado del panel completo
 * Incluye sidebar con menú y área de contenido principal
 */
const UserPanel = () => {
    // ============================================================================
    // HOOKS Y ESTADO
    // ============================================================================
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeSection, setActiveSection] = useState(
        (location.state as { tab?: string } | null)?.tab || 'profile'
    );

    // ============================================================================
    // FUNCIONES DE NAVEGACIÓN Y AUTENTICACIÓN
    // ============================================================================

    /**
     * Cierra la sesión del usuario y redirige al inicio
     */
    const handleLogout = () => {
        logout();
        navigate('/');
    };

    /**
     * Navega de vuelta a la página principal
     */
    const handleBackToHome = () => {
        navigate('/');
    };

    // ============================================================================
    // VERIFICACIÓN DE AUTENTICACIÓN
    // ============================================================================

    // Verificar si el usuario está autenticado antes de mostrar el panel
    if (!user) {
        return (
            <div className={userPanelStyles.userPanel}>
                <div className={userPanelStyles.container}>
                    <div className={userPanelStyles.contentSection}>
                        <h2 className={userPanelStyles.sectionTitle}>Acceso Denegado</h2>
                        <p>Debes iniciar sesión para acceder al panel de usuario.</p>
                        <button
                            onClick={() => navigate('/login')}
                            className={userPanelStyles.retryButton}
                        >
                            <span className="material-icons">login</span>
                            Ir al Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ============================================================================
    // RENDERIZADO PRINCIPAL DEL PANEL
    // ============================================================================

    return (
        <div className={`${userPanelStyles.userPanel} ${userPanelStyles.themeAware}`}>
            <div className={userPanelStyles.container}>
                {/* Sidebar del panel con navegación y información del usuario */}
                <aside className={userPanelStyles.sidebar}>
                    {/* Encabezado del sidebar con botón de retorno */}
                    <div className={userPanelStyles.sidebarHeader}>
                        <button
                            className={userPanelStyles.backButton}
                            onClick={handleBackToHome}
                            aria-label="Volver al inicio"
                        >
                            <span className="material-icons">arrow_back</span>
                            <span>Volver al inicio</span>
                        </button>
                    </div>

                    {/* Información del usuario autenticado */}
                    <div className={userPanelStyles.userInfo}>
                        <div className={userPanelStyles.userAvatar}>
                            <span className="material-icons">account_circle</span>
                        </div>
                        <div className={userPanelStyles.userDetails}>
                            <h3 className={userPanelStyles.userName}>
                                {(user as Cliente).nombre} {(user as Cliente).apellido}
                            </h3>
                        </div>
                    </div>

                    {/* Navegación principal del sidebar */}
                    <nav className={userPanelStyles.sidebarNav}>
                        {/* Opciones del menú principal */}
                        <div className={userPanelStyles.menuOptions}>
                            {MENU_OPTIONS.map(option => (
                                <MenuOption
                                    key={option.id}
                                    option={option}
                                    isActive={activeSection === option.id}
                                    onClick={() => setActiveSection(option.id)}
                                />
                            ))}
                        </div>

                        {/* Sección de cierre de sesión */}
                        <div className={userPanelStyles.logoutSection}>
                            <button
                                className={userPanelStyles.logoutButton}
                                onClick={handleLogout}
                                aria-label="Cerrar sesión"
                            >
                                <span className="material-icons">logout</span>
                                <span>Cerrar Sesión</span>
                            </button>
                        </div>
                    </nav>
                </aside>

                {/* Área de contenido principal del panel */}
                <main className={userPanelStyles.mainContent}>
                    <ContentSection activeSection={activeSection} />
                </main>
            </div>
        </div>
    );
};

UserPanel.displayName = 'UserPanel';

export default UserPanel; 