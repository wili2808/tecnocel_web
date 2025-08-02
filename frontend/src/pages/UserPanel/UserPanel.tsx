import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import userPanelStyles from './UserPanel.module.css';

// Definir las opciones del menú del panel
const MENU_OPTIONS = [
    { id: 'profile', label: 'Información Personal', icon: 'person' },
    { id: 'account', label: 'Datos de Cuenta', icon: 'account_circle' },
    { id: 'security', label: 'Seguridad', icon: 'security' },
    { id: 'purchases', label: 'Mis Compras', icon: 'shopping_bag' },
    { id: 'favorites', label: 'Favoritos', icon: 'favorite' },
    { id: 'addresses', label: 'Direcciones', icon: 'location_on' },
    { id: 'support', label: 'Soporte', icon: 'help' },
];

// Componente de elemento del menú
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

// Componente de contenido dinámico
const ContentSection = ({ activeSection, user }: { activeSection: string; user: any }) => {
    const renderContent = () => {
        switch (activeSection) {
            case 'profile':
                return (
                    <div className={userPanelStyles.contentSection}>
                        <h2 className={userPanelStyles.sectionTitle}>Información Personal</h2>
                        <div className={userPanelStyles.profileInfo}>
                            <div className={userPanelStyles.profileCard}>
                                <div className={userPanelStyles.profileHeader}>
                                    <span className="material-icons">account_circle</span>
                                    <h3>{user?.nombre_cliente} {user?.apellido_cliente}</h3>
                                </div>
                                <div className={userPanelStyles.profileDetails}>
                                    <p><strong>Email:</strong> {user?.email_cliente}</p>
                                    <p><strong>Teléfono:</strong> {user?.celular_cliente || 'No especificado'}</p>
                                    <p><strong>Fecha de registro:</strong> {user?.fecha_registro ? new Date(user.fecha_registro).toLocaleDateString() : 'No disponible'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'account':
                return (
                    <div className={userPanelStyles.contentSection}>
                        <h2 className={userPanelStyles.sectionTitle}>Datos de Cuenta</h2>
                        <div className={userPanelStyles.accountInfo}>
                            <p>Configuración de cuenta en desarrollo...</p>
                        </div>
                    </div>
                );
            case 'security':
                return (
                    <div className={userPanelStyles.contentSection}>
                        <h2 className={userPanelStyles.sectionTitle}>Seguridad</h2>
                        <div className={userPanelStyles.securityInfo}>
                            <p>Configuración de seguridad en desarrollo...</p>
                        </div>
                    </div>
                );
            case 'purchases':
                return (
                    <div className={userPanelStyles.contentSection}>
                        <h2 className={userPanelStyles.sectionTitle}>Mis Compras</h2>
                        <div className={userPanelStyles.purchasesInfo}>
                            <p>Historial de compras en desarrollo...</p>
                        </div>
                    </div>
                );

            case 'favorites':
                return (
                    <div className={userPanelStyles.contentSection}>
                        <h2 className={userPanelStyles.sectionTitle}>Favoritos</h2>
                        <div className={userPanelStyles.favoritesInfo}>
                            <p>Lista de favoritos en desarrollo...</p>
                        </div>
                    </div>
                );
            case 'addresses':
                return (
                    <div className={userPanelStyles.contentSection}>
                        <h2 className={userPanelStyles.sectionTitle}>Direcciones</h2>
                        <div className={userPanelStyles.addressesInfo}>
                            <p>Gestión de direcciones en desarrollo...</p>
                        </div>
                    </div>
                );
            case 'support':
                return (
                    <div className={userPanelStyles.contentSection}>
                        <h2 className={userPanelStyles.sectionTitle}>Soporte</h2>
                        <div className={userPanelStyles.supportInfo}>
                            <p>Centro de soporte en desarrollo...</p>
                        </div>
                    </div>
                );
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

/**
 * Componente principal del panel de usuario
 */
const UserPanel = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('profile');

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleBackToHome = () => {
        navigate('/');
    };

    return (
        <div className={`${userPanelStyles.userPanel} ${userPanelStyles.themeAware}`}>
            <div className={userPanelStyles.container}>
                {/* Sidebar del panel */}
                <aside className={userPanelStyles.sidebar}>
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

                    <div className={userPanelStyles.userInfo}>
                        <div className={userPanelStyles.userAvatar}>
                            <span className="material-icons">account_circle</span>
                        </div>
                        <div className={userPanelStyles.userDetails}>
                            <h3 className={userPanelStyles.userName}>
                                {user?.nombre_cliente} {user?.apellido_cliente}
                            </h3>
                        </div>
                    </div>

                    <nav className={userPanelStyles.sidebarNav}>
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

                {/* Área de contenido principal */}
                <main className={userPanelStyles.mainContent}>
                    <ContentSection activeSection={activeSection} user={user} />
                </main>
            </div>
        </div>
    );
};

export default UserPanel; 