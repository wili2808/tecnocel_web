/**
 * Componente AdminPanel - Panel de administración completo con navegación lateral
 * Proporciona acceso a funcionalidades de gestión para administradores y empleados
 * Incluye CRUD de usuarios, gestión de clientes, productos y configuración del sistema
 * Control de acceso basado en roles (admin vs empleado)
 */
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { AdminUser } from '../../types/usuario';
import DashboardAdmin from '../../components/admin/DashboardAdmin/DashboardAdmin';
import GestionUsuarios from '../../components/admin/GestionUsuarios/GestionUsuarios';
import GestionClientes from '../../components/admin/GestionClientes/GestionClientes';
import GestionProductos from '../../components/admin/GestionProductos/GestionProductos';
import GestionOfertas from '../../components/admin/GestionOfertas/GestionOfertas';
import GestionVentas from '../../components/admin/GestionVentas/GestionVentas';
import Reportes from '../../components/admin/Reportes/Reportes';
import adminPanelStyles from './AdminPanel.module.css';
import { ROLES } from '../../constants/roles';

// ============================================================================
// CONFIGURACIÓN Y CONSTANTES
// ============================================================================

/**
 * Interfaz para opciones del menú
 * Incluye roles permitidos para control de acceso
 */
interface MenuOption {
  id: string;
  label: string;
  icon: string;
  /** IDs de roles permitidos (vacío = todos los del sistema) */
  allowedRoles?: number[];
}

/**
 * Opciones del menú del panel de administración
 * Cada opción incluye id, etiqueta, icono y roles permitidos por idRol
 * Si allowedRoles no se define, todos los usuarios del sistema pueden acceder
 */
const MENU_OPTIONS: MenuOption[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  {
    id: 'productos',
    label: 'Gestión de Productos',
    icon: 'inventory_2',
    allowedRoles: [ROLES.ADMIN, ROLES.GERENTE, ROLES.VENDEDOR],
  },
  { id: 'usuarios', label: 'Gestión de Usuarios', icon: 'group', allowedRoles: [ROLES.ADMIN, ROLES.GERENTE] },
  { id: 'clientes', label: 'Gestión de Clientes', icon: 'people' },
  { id: 'ofertas', label: 'Gestión de Ofertas', icon: 'local_offer', allowedRoles: [ROLES.ADMIN, ROLES.GERENTE] },
  { id: 'ventas', label: 'Gestión de Ventas', icon: 'receipt_long' },
  { id: 'reportes', label: 'Reportes', icon: 'assessment', allowedRoles: [ROLES.ADMIN, ROLES.GERENTE] },
];

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

/**
 * Componente de elemento del menú del panel
 * Renderiza cada opción del menú con estado activo y funcionalidad de click
 */
const MenuOptionItem = ({
  option,
  isActive,
  onClick,
}: {
  option: MenuOption;
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    className={`${adminPanelStyles.menuOption} ${isActive ? adminPanelStyles.activeOption : ''}`}
    onClick={onClick}
    aria-label={option.label}
  >
    <span className="material-icons">{option.icon}</span>
    <span className={adminPanelStyles.menuLabel}>{option.label}</span>
  </button>
);

// ============================================================================
// SECCIÓN DE CONTENIDO DINÁMICO
// ============================================================================

/**
 * Componente de contenido dinámico del panel
 * Renderiza diferentes secciones según la opción activa del menú
 */
const ContentSection = ({
  activeSection,
  onNavigate,
}: {
  activeSection: string;
  onNavigate: (section: string) => void;
}) => {
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardAdmin onNavigate={onNavigate} />;

      case 'productos':
        return <GestionProductos />;

      case 'usuarios':
        return <GestionUsuarios />;

      case 'clientes':
        return <GestionClientes />;

      case 'ofertas':
        return <GestionOfertas />;

      case 'ventas':
        return <GestionVentas />;

      case 'reportes':
        return <Reportes />;

      default:
        return (
          <div className={adminPanelStyles.contentSection}>
            <h2 className={adminPanelStyles.sectionTitle}>Bienvenido al Panel de Administración</h2>
            <p>Selecciona una opción del menú para comenzar.</p>
          </div>
        );
    }
  };

  return <div className={adminPanelStyles.contentArea}>{renderContent()}</div>;
};

// ============================================================================
// COMPONENTE PRINCIPAL - ADMINPANEL
// ============================================================================

/**
 * Componente principal del panel de administración
 * Gestiona la autenticación, navegación y renderizado del panel completo
 * Incluye sidebar con menú filtrado por rol y área de contenido principal
 */
const AdminPanel = () => {
  // ============================================================================
  // HOOKS Y ESTADO
  // ============================================================================
  const { user, isSystemUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');

  // ============================================================================
  // FUNCIONES DE NAVEGACIÓN Y AUTENTICACIÓN
  // ============================================================================

  /**
   * Cierra la sesión del usuario y redirige al login de admin
   */
  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  /**
   * Navega de vuelta a la página principal
   */
  const handleBackToHome = () => {
    navigate('/');
  };

  // ============================================================================
  // VERIFICACIÓN DE AUTENTICACIÓN Y AUTORIZACIÓN
  // ============================================================================

  // Verificar si el usuario está autenticado y es usuario del sistema
  if (!user || !isSystemUser) {
    return (
      <div className={adminPanelStyles.adminPanel}>
        <div className={adminPanelStyles.container}>
          <div className={adminPanelStyles.contentSection}>
            <h2 className={adminPanelStyles.sectionTitle}>Acceso Denegado</h2>
            <p>Debes iniciar sesión como usuario del sistema para acceder al panel de administración.</p>
            <button onClick={() => navigate('/admin-login')} className={adminPanelStyles.retryButton}>
              <span className="material-icons">login</span>
              Ir al Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Obtener idRol del usuario del sistema
  const adminUser = user as AdminUser;
  const userIdRol = adminUser.idRol;

  // Filtrar opciones del menú según el idRol del usuario
  const filteredMenuOptions = MENU_OPTIONS.filter((option) => {
    if (!option.allowedRoles) return true;
    return option.allowedRoles.includes(userIdRol);
  });

  // Obtener nombre y rol del usuario dinámicamente desde el backend
  const userName = adminUser.nombres;
  const userRole = adminUser.rolNombre || 'Usuario';

  // ============================================================================
  // RENDERIZADO PRINCIPAL DEL PANEL
  // ============================================================================

  return (
    <div className={`${adminPanelStyles.adminPanel} ${adminPanelStyles.themeAware}`}>
      <div className={adminPanelStyles.container}>
        {/* Sidebar del panel con navegación e información del usuario */}
        <aside className={adminPanelStyles.sidebar}>
          {/* Encabezado del sidebar con marca y botón de retorno */}
          <div className={adminPanelStyles.sidebarHeader}>
            <div className={adminPanelStyles.sidebarBrand}>
              <span className={`material-icons ${adminPanelStyles.brandIcon}`}>admin_panel_settings</span>
              <div className={adminPanelStyles.brandText}>
                <span className={adminPanelStyles.brandName}>TecnoCel</span>
                <span className={adminPanelStyles.brandSub}>Admin</span>
              </div>
            </div>
            <button className={adminPanelStyles.backButton} onClick={handleBackToHome} aria-label="Ir a la tienda">
              <span className="material-icons">store</span>
              <span>Ir a la tienda</span>
            </button>
          </div>

          {/* Información del usuario autenticado */}
          <div className={adminPanelStyles.userInfo}>
            <div className={adminPanelStyles.userAvatar}>
              <span className="material-icons">admin_panel_settings</span>
            </div>
            <div className={adminPanelStyles.userDetails}>
              <h3 className={adminPanelStyles.userName}>{userName}</h3>
              <span className={adminPanelStyles.userRole}>{userRole}</span>
            </div>
          </div>

          {/* Navegación principal del sidebar */}
          <nav className={adminPanelStyles.sidebarNav}>
            {/* Opciones del menú filtradas por rol */}
            <div className={adminPanelStyles.menuOptions}>
              {filteredMenuOptions.map((option) => (
                <MenuOptionItem
                  key={option.id}
                  option={option}
                  isActive={activeSection === option.id}
                  onClick={() => setActiveSection(option.id)}
                />
              ))}
            </div>

            {/* Sección de cierre de sesión */}
            <div className={adminPanelStyles.logoutSection}>
              <button className={adminPanelStyles.logoutButton} onClick={handleLogout} aria-label="Cerrar sesión">
                <span className="material-icons">logout</span>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Área de contenido principal del panel */}
        <main className={adminPanelStyles.mainContent}>
          <ContentSection activeSection={activeSection} onNavigate={setActiveSection} />
        </main>
      </div>
    </div>
  );
};

AdminPanel.displayName = 'AdminPanel';

export default AdminPanel;
