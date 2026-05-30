import React from 'react';
import styles from './LoadingScreen.module.css';

type LoadingVariant = 'full' | 'page' | 'inline';

interface LoadingScreenProps {
  message?: string;
  fullPage?: boolean;
  variant?: LoadingVariant;
}

const variantClass: Record<LoadingVariant, string> = {
  full: 'fullPage',
  page: 'page',
  inline: 'inline',
};

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Cargando...',
  fullPage = true,
  variant,
}) => {
  const resolvedVariant: LoadingVariant =
    variant ?? (fullPage ? 'full' : 'inline');
  const rootClass = styles[variantClass[resolvedVariant]];

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
