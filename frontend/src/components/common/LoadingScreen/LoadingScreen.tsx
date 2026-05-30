import React from 'react';
import styles from './LoadingScreen.module.css';

interface LoadingScreenProps {
  message?: string;
  fullPage?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Cargando...',
  fullPage = true,
}) => {
  const rootClass = fullPage ? styles.fullPage : styles.inline;

  return (
    <div className={rootClass} role="status" aria-busy="true" aria-live="polite">
      <div className={styles.inner}>
        <div className={styles.ring} />
        <div className={styles.brand}>
          <span className={styles.name}>TECNOCEL</span>
          <span className={styles.tagline}>Tecnología al mejor precio</span>
        </div>
        <div className={styles.loader}>
          <span className={styles.text}>{message}</span>
          <div className={styles.bar}>
            <div className={styles.fill} />
          </div>
        </div>
      </div>
    </div>
  );
};

LoadingScreen.displayName = 'LoadingScreen';

export default LoadingScreen;
