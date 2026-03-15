import React, { memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './NotFound.module.css';

const NotFound: React.FC = memo(() => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <span className={styles.code}>404</span>
        <h1 className={styles.title}>Página no encontrada</h1>
        <p className={styles.description}>
          La página que buscás no existe o fue movida.
        </p>
        <div className={styles.actions}>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            Volver atrás
          </button>
          <Link to="/" className={styles.homeLink}>
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
});

export default NotFound;
