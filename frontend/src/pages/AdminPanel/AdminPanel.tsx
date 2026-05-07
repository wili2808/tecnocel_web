import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PageMeta from '../../components/common/PageMeta/PageMeta';
import { MobileMenuDropdown } from '../../components/common/MobileMenuDropdown';
import DashboardAdmin from '../../components/admin/DashboardAdmin/DashboardAdmin';
import GestionUsuarios from '../../components/admin/GestionUsuarios/GestionUsuarios';
import GestionClientes from '../../components/admin/GestionClientes/GestionClientes';
import GestionProductos from '../../components/admin/GestionProductos/GestionProductos';
import GestionOfertas from '../../components/admin/GestionOfertas/GestionOfertas';
import GestionVentas from '../../components/admin/GestionVentas/GestionVentas';
import GestionCompras from '../../components/admin/GestionCompras/GestionCompras';
import Reportes from '../../components/admin/Reportes/Reportes';
import GestionPermisos from '../../components/admin/GestionPermisos/GestionPermisos';
import GestionMensajes from '../../components/admin/GestionMensajes/GestionMensajes';
import GestionConfiguracion from '../../components/admin/GestionConfiguracion/GestionConfiguracion';
import GestionComentarios from '../../components/admin/GestionComentarios/GestionComentarios';
import { MENU_PERMISOS, type MenuPermisoOption } from '../../constants/menuPermisos';
import adminPanelStyles from './AdminPanel.module.css';
import type { AdminUser } from '../../types/usuario';

const SECTION_DESCRIPTIONS: Record<string, string> = {
  dashboard: 'Resumen operativo del negocio, prioridades activas y alcance del rol actual.',
  usuarios: 'Usuarios internos, acceso al panel y administración de roles operativos.',
  clientes: 'Base de clientes registrados, seguimiento y edición administrativa.',
  productos: 'Catálogo, stock, marcas, categorías y estructura técnica de producto.',
  ventas: 'Ventas web y manuales, logística, retiros y configuración comercial.',
  ofertas: 'Promociones vigentes, programación comercial y control de campañas.',
  compras: 'Abastecimiento, proveedores y trazabilidad de compras activas.',
  reportes: 'Lectura analítica del rendimiento comercial y exportación de información.',
  permisos: 'Gobernanza de permisos y seguridad del sistema administrativo.',
  mensajes: 'Bandeja de entrada de consultas y mensajes desde el formulario de contacto.',
  comentarios: 'Moderación de opiniones, calificaciones y contenido visual de clientes.',
  configuracion: 'Ajustes globales de la plataforma, apariencia y preferencias técnicas.',
};

// --- COMPONENTES AUXILIARES ---

/**
 * Componente de elemento del menú del panel
 * Renderiza cada opción del menú con estado activo y funcionalidad de click
 */
const MenuOptionItem = ({
  option,
  isActive,
  onClick,
}: {
  option: MenuPermisoOption;
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

// --- SECCIÓN DE CONTENIDO DINÁMICO ---

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

      case 'compras':
        return <GestionCompras />;

      case 'ventas':
        return <GestionVentas />;

      case 'reportes':
        return <Reportes />;

      case 'permisos':
        return <GestionPermisos />;
      
      case 'mensajes':
        return <GestionMensajes />;
        
      case 'comentarios':
        return <GestionComentarios />;

      case 'configuracion':
        return <GestionConfiguracion />;

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

// --- COMPONENTE PRINCIPAL - ADMINPANEL ---

/**
 * Componente principal del panel de administración
 * Gestiona la autenticación, navegación y renderizado del panel completo
 * Incluye sidebar con menú filtrado por rol y área de contenido principal
 */
const AdminPanel = () => {
  // ============================================================================
  // HOOKS Y ESTADO
  // ============================================================================
  const { user, isSystemUser, logout, tienePermiso } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const filteredMenuOptions = useMemo(() => {
    return MENU_PERMISOS.filter((option) => {
      if (option.id === 'dashboard') return true;
      if (option.permisosRequeridos.length === 0) return true;

      return option.permisosRequeridos.every((permiso) => tienePermiso(permiso));
    });
  }, [tienePermiso]);

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

  // Obtener usuario del sistema
  const adminUser = user as AdminUser;

  // Obtener nombre y rol del usuario dinámicamente desde el backend
  const userName = adminUser.nombres;
  const userRole = adminUser.rolNombre || 'Usuario';
  const userInitials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? '')
    .join('');
  const activeMenuOption = filteredMenuOptions.find((option) => option.id === activeSection);
  const activeSectionLabel = activeMenuOption?.label || 'Panel de Administración';
  const activeSectionDescription =
    SECTION_DESCRIPTIONS[activeSection] || 'Módulo administrativo disponible según los permisos actuales.';

  // ============================================================================
  // RENDERIZADO PRINCIPAL DEL PANEL
  // ============================================================================

  return (
    <div className={`${adminPanelStyles.adminPanel} ${adminPanelStyles.themeAware}`}>
      <PageMeta title="Panel de administración" noIndex />
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
            <div className={adminPanelStyles.userInfoHeader}>
              <div className={adminPanelStyles.userAvatar}>
                <span>{userInitials || 'TC'}</span>
              </div>
              <div className={adminPanelStyles.userIdentity}>
                <div className={adminPanelStyles.userDetails}>
                  <h3 className={adminPanelStyles.userName}>{userName}</h3>
                  <span className={adminPanelStyles.userRole}>{userRole}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navegación principal del sidebar */}
          <nav className={adminPanelStyles.sidebarNav}>
            {/* Menú desplegable mobile — solo visible en ≤480px */}
            <MobileMenuDropdown
              options={filteredMenuOptions}
              activeOptionId={activeSection}
              onSelect={(id) => {
                setActiveSection(id);
                setIsMobileMenuOpen(false);
              }}
              isOpen={isMobileMenuOpen}
              onToggle={setIsMobileMenuOpen}
              showTriggerIcon={true}
              triggerAriaLabel="Abrir menú de administración"
              containerClassName={adminPanelStyles.mobileMenuWrapper}
            />

            {/* Opciones del menú principal — visible en desktop (>480px) */}
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

            {/* Sección de herramientas y sesión */}
            <div className={adminPanelStyles.logoutSection}>
              <button 
                className={`${adminPanelStyles.menuOption} ${activeSection === 'configuracion' ? adminPanelStyles.activeOption : ''}`} 
                onClick={() => setActiveSection('configuracion')}
                style={{ marginBottom: '8px', border: '1px solid var(--border-color)' }}
              >
                <span className="material-icons">settings</span>
                <span className={adminPanelStyles.menuLabel}>Configuración</span>
              </button>

              <button className={adminPanelStyles.logoutButton} onClick={handleLogout} aria-label="Cerrar sesión">
                <span className="material-icons">logout</span>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* Área de contenido principal del panel */}
        <main className={adminPanelStyles.mainContent}>
          <div className={adminPanelStyles.mainHeader}>
            <div className={adminPanelStyles.mainHeaderCopy}>
              <span className={adminPanelStyles.mainEyebrow}>Panel administrativo</span>
              <h1 className={adminPanelStyles.mainTitle}>{activeSectionLabel}</h1>
              <p className={adminPanelStyles.mainDescription}>{activeSectionDescription}</p>
            </div>
          </div>

          <ContentSection activeSection={activeSection} onNavigate={setActiveSection} />
        </main>
      </div>
    </div>
  );
};

AdminPanel.displayName = 'AdminPanel';

export default AdminPanel;
