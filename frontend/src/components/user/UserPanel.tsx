import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/User.module.css';

interface UserPanelProps {
  onClose: () => void;
}

const UserPanel: React.FC<UserPanelProps> = ({ onClose }) => {
  const { user, logout } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string>('https://via.placeholder.com/150');

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={styles.userPanelContainer}>
      <div className={styles.modalContent}>
        <button onClick={onClose} className={styles.closeButton}>
          <span className="material-icons">close</span>
        </button>
        
        <div className={styles.modalHeader}>
          <h2>Perfil de Usuario</h2>
        </div>

        <div className={styles.avatarSection}>
          <div className={styles.avatarContainer}>
            <img src={avatarUrl} alt="Avatar de usuario" className={styles.avatar} />
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

        <div className={styles.userInfo}>
          <h3>{user?.nombre} {user?.apellido}</h3>
          <p>{user?.email}</p>
        </div>

        <div className={styles.options}>
          <button className={styles.option}>
            <span className="material-icons">settings</span>
            Configuración
          </button>
          <button className={styles.option}>
            <span className="material-icons">security</span>
            Seguridad
          </button>
          <button className={styles.option}>
            <span className="material-icons">notifications</span>
            Notificaciones
          </button>
          <button onClick={logout} className={`${styles.option} ${styles.logoutButton}`}>
            <span className="material-icons">logout</span>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserPanel;
