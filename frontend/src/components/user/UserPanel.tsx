/**
 * Componente UserPanel - Panel de usuario
 * Muestra la información del usuario y opciones de configuración
 */
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/User.module.css';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface UserPanelProps {
  onClose: () => void;
}

// Definición de tipos para las opciones del menú
type MenuAction = (() => void) | 'logout';

interface MenuOption {
  icon: string;
  label: string;
  action: MenuAction;
  isLogout?: boolean;
}

// Opciones del menú de usuario
const MENU_OPTIONS: MenuOption[] = [
  { icon: 'settings', label: 'Configuración', action: () => console.log('Configuración') },
  { icon: 'security', label: 'Seguridad', action: () => console.log('Seguridad') },
  { icon: 'notifications', label: 'Notificaciones', action: () => console.log('Notificaciones') },
  { icon: 'logout', label: 'Cerrar Sesión', action: 'logout', isLogout: true }
];

const UserPanel: React.FC<UserPanelProps> = ({ onClose }) => {
  // Hooks
  const { user, logout } = useAuth();
  useEscapeKey(onClose);

  // Manejadores de eventos
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // TODO: Implementar lógica de actualización de avatar
        console.log('Avatar actualizado:', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMenuOptionClick = (action: MenuAction) => {
    if (action === 'logout') {
      logout();
      onClose();
    } else {
      action();
    }
  };

  // Componentes de renderizado
  const renderAvatarSection = () => (
    <div className={styles.avatarSection}>
      <div className={styles.avatarContainer}>
        <img 
          src={user?.avatarUrl || 'https://via.placeholder.com/150'} 
          alt="Avatar de usuario" 
          className={styles.avatar} 
        />
        <label htmlFor="avatar-upload" className={styles.avatarUpload}>
          <span className="material-icons">photo_camera</span>
        </label>
        <input
          type="file"
          id="avatar-upload"
          accept="image/*"
          onChange={handleAvatarChange}
          className={styles.hiddenInput}
        />
      </div>
    </div>
  );

  const renderUserInfo = () => (
    <div className={styles.userInfo}>
      <h3>{user?.nombre} {user?.apellido}</h3>
      <p>{user?.email}</p>
    </div>
  );

  const renderMenuOptions = () => (
    <div className={styles.options}>
      {MENU_OPTIONS.map((option, index) => (
        <button
          key={index}
          className={`${styles.option} ${option.isLogout ? styles.logoutButton : ''}`}
          onClick={() => handleMenuOptionClick(option.action)}
        >
          <span className="material-icons">{option.icon}</span>
          {option.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className={styles.userPanelContainer}>
      <div className={styles.modalContent}>
        <button onClick={onClose} className={styles.closeButton} aria-label="Cerrar panel">
          <span className="material-icons">close</span>
        </button>
        
        <div className={styles.modalHeader}>
          <h2>Perfil de Usuario</h2>
        </div>

        {renderAvatarSection()}
        {renderUserInfo()}
        {renderMenuOptions()}
      </div>
    </div>
  );
};

export default UserPanel;
