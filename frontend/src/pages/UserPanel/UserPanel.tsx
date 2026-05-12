import React, { useState, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MobileMenuDropdown } from '../../components/common/MobileMenuDropdown';
import InformacionPersonal from '../../components/user/InformacionPersonal';
import DatosCuenta from '../../components/user/DatosCuenta';
import Seguridad from '../../components/user/Seguridad';
import MisCompras from '../../components/user/MisCompras';
import Favoritos from '../../components/user/Favoritos';
import Direcciones from '../../components/user/Direcciones';
import Soporte from '../../components/user/Soporte';
import PageMeta from '../../components/common/PageMeta/PageMeta';
import styles from './UserPanel.module.css';
import type { Cliente } from '../../types/cliente';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const MENU_OPTIONS = [
  { id: 'profile', label: 'Información Personal', icon: 'person' },
  { id: 'account', label: 'Datos de Cuenta', icon: 'account_circle' },
  { id: 'security', label: 'Seguridad', icon: 'security' },
  { id: 'purchases', label: 'Mis Compras', icon: 'shopping_bag' },
  { id: 'favorites', label: 'Favoritos', icon: 'favorite' },
  { id: 'addresses', label: 'Direcciones', icon: 'location_on' },
  { id: 'support', label: 'Soporte', icon: 'help' },
] as const;

type SectionId = (typeof MENU_OPTIONS)[number]['id'];

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

const MenuOption = memo(({
  option,
  isActive,
  onClick,
}: {
  option: (typeof MENU_OPTIONS)[number];
  isActive: boolean;
  onClick: () => void;
}) => (
  <button
    className={`${styles.menuOption} ${isActive ? styles.activeOption : ''}`}
    onClick={onClick}
    aria-label={option.label}
    aria-current={isActive ? 'page' : undefined}
  >
    <span className="material-icons">{option.icon}</span>
    <span className={styles.menuLabel}>{option.label}</span>
  </button>
));

MenuOption.displayName = 'MenuOption';

const ContentSection = memo(({ activeSection }: { activeSection: SectionId }) => {
  const renderContent = () => {
    switch (activeSection) {
      case 'profile': return <InformacionPersonal />;
      case 'account': return <DatosCuenta />;
      case 'security': return <Seguridad />;
      case 'purchases': return <MisCompras />;
      case 'favorites': return <Favoritos />;
      case 'addresses': return <Direcciones />;
      case 'support': return <Soporte />;
      default: return null;
    }
  };

  return <div className={styles.contentArea}>{renderContent()}</div>;
});

ContentSection.displayName = 'ContentSection';

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const UserPanel: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeSection, setActiveSection] = useState<SectionId>(
    (location.state as { tab?: SectionId } | null)?.tab || 'profile'
  );
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) {
    return (
      <div className={styles.userPanel}>
        <div className={styles.container}>
          <div className={styles.mainContent}>
            <div className={styles.contentArea} style={{ textAlign: 'center', padding: '2rem' }}>
              <h2>Acceso Denegado</h2>
              <p>Debes iniciar sesión para acceder al panel de usuario.</p>
              <button onClick={() => navigate('/login')} className={styles.logoutButton} style={{ margin: '1rem auto', width: 'auto' }}>
                <span className="material-icons">login</span>
                Ir al Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const cliente = user as Cliente;

  return (
    <div className={styles.userPanel}>
      <PageMeta title="Mi cuenta" noIndex />
      <div className={styles.container}>
        {/* SIDEBAR */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <button className={styles.backButton} onClick={() => navigate('/')}>
              <span className="material-icons">arrow_back</span>
              <span>Volver al inicio</span>
            </button>
          </div>

          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              <span className={styles.avatarInitials}>
                {(cliente.nombre?.[0] || '').toUpperCase()}
                {(cliente.apellido?.[0] || '').toUpperCase()}
              </span>
            </div>
            <div className={styles.userDetails}>
              <h3 className={styles.userName}>{cliente.nombre} {cliente.apellido}</h3>
              <p className={styles.userRole}>Cliente</p>
            </div>
          </div>

          <nav className={styles.sidebarNav}>
            {/* Desktop Menu */}
            <div className={styles.menuOptions}>
              {MENU_OPTIONS.map((option) => (
                <MenuOption
                  key={option.id}
                  option={option}
                  isActive={activeSection === option.id}
                  onClick={() => setActiveSection(option.id)}
                />
              ))}
            </div>

            {/* Mobile Menu */}
            <div className={styles.mobileMenuWrapper}>
              <MobileMenuDropdown
                options={[...MENU_OPTIONS]}
                activeOptionId={activeSection}
                onSelect={(id) => setActiveSection(id as SectionId)}
                isOpen={isMobileMenuOpen}
                onToggle={setIsMobileMenuOpen}
                showTriggerIcon={true}
              />
            </div>

            <div className={styles.logoutSection}>
              <button className={styles.logoutButton} onClick={() => { logout(); navigate('/'); }}>
                <span className="material-icons">logout</span>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className={styles.mainContent}>
          <ContentSection activeSection={activeSection} />
        </main>
      </div>
    </div>
  );
};

UserPanel.displayName = 'UserPanel';

export default UserPanel;

