/**
 * Componente AdminPanel - Panel de administración completo con navegación lateral
 * Proporciona acceso a funcionalidades de gestión para administradores y empleados
 * Incluye CRUD de usuarios, gestión de clientes, productos y configuración del sistema
 * Control de acceso basado en roles (admin vs empleado)
 */
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import DashboardAdmin from '../../components/admin/DashboardAdmin/DashboardAdmin';
import GestionUsuarios from '../../components/admin/GestionUsuarios/GestionUsuarios';
import GestionClientes from '../../components/admin/GestionClientes/GestionClientes';
import GestionProductos from '../../components/admin/GestionProductos/GestionProductos';
import GestionOfertas from '../../components/admin/GestionOfertas/GestionOfertas';
import adminPanelStyles from './AdminPanel.module.css';

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
  roles: ('admin' | 'empleado')[];
}

/**
 * Opciones del menú del panel de administración
 * Cada opción incluye id, etiqueta, icono y roles permitidos
 */
const MENU_OPTIONS: MenuOption[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', roles: ['admin', 'empleado'] },
  { id: 'productos', label: 'Gestión de Productos', icon: 'inventory_2', roles: ['admin', 'empleado'] },
  { id: 'usuarios', label: 'Gestión de Usuarios', icon: 'group', roles: ['admin', 'empleado'] },
  { id: 'clientes', label: 'Gestión de Clientes', icon: 'people', roles: ['admin', 'empleado'] },
  { id: 'ofertas', label: 'Gestión de Ofertas', icon: 'local_offer', roles: ['admin', 'empleado'] },
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
  onClick
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
  onNavigate
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

      default:
        return (
          <div className={adminPanelStyles.contentSection}>
            <h2 className={adminPanelStyles.sectionTitle}>Bienvenido al Panel de Administración</h2>
            <p>Selecciona una opción del menú para comenzar.</p>
          </div>
        );
    }
  };

  return (
    <div className={adminPanelStyles.contentArea}>
      {renderContent()}
    </div>
  );
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
  const { user, isAdmin, isEmpleado, logout } = useAuth();
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

  // Verificar si el usuario está autenticado y tiene permisos
  if (!user || (!isAdmin && !isEmpleado)) {
    return (
      <div className={adminPanelStyles.adminPanel}>
        <div className={adminPanelStyles.container}>
          <div className={adminPanelStyles.contentSection}>
            <h2 className={adminPanelStyles.sectionTitle}>Acceso Denegado</h2>
            <p>Debes iniciar sesión como administrador o empleado para acceder al panel de administración.</p>
            <button
              onClick={() => navigate('/admin-login')}
              className={adminPanelStyles.retryButton}
            >
              <span className="material-icons">login</span>
              Ir al Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filtrar opciones del menú según el rol del usuario
  const filteredMenuOptions = MENU_OPTIONS.filter(option => {
    const userRole = isAdmin ? 'admin' : 'empleado';
    return option.roles.includes(userRole);
  });

  // Obtener nombre del usuario según el tipo
  const userName = 'nombres' in user ? user.nombres : `${user.nombre} ${user.apellido}`;
  const userRole = isAdmin ? 'Administrador' : 'Empleado';

  // ============================================================================
  // RENDERIZADO PRINCIPAL DEL PANEL
  // ============================================================================

  return (
    <div className={`${adminPanelStyles.adminPanel} ${adminPanelStyles.themeAware}`}>
      <div className={adminPanelStyles.container}>
        {/* Sidebar del panel con navegación e información del usuario */}
        <aside className={adminPanelStyles.sidebar}>
          {/* Encabezado del sidebar con botón de retorno */}
          <div className={adminPanelStyles.sidebarHeader}>
            <button
              className={adminPanelStyles.backButton}
              onClick={handleBackToHome}
              aria-label="Volver al inicio"
            >
              <span className="material-icons">arrow_back</span>
              <span>Volver al inicio</span>
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
              {filteredMenuOptions.map(option => (
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
              <button
                className={adminPanelStyles.logoutButton}
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
        <main className={adminPanelStyles.mainContent}>
          <ContentSection activeSection={activeSection} onNavigate={setActiveSection} />
        </main>
      </div>
    </div>
  );
};

AdminPanel.displayName = 'AdminPanel';

export default AdminPanel;
