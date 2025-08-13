/**
 * Página de demostración del componente Button
 * Muestra todas las variantes, tamaños y funcionalidades disponibles
 * Accesible desde /button-demo en el navegador
 */
import React from 'react';
import ButtonDemo from '../../components/common/Button/ButtonDemo';
import styles from './ButtonDemo.module.css';

const ButtonDemoPage: React.FC = () => {
  return (
    <div className={styles.pageContainer}>
      {/* Header de la página */}
      <header className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>
            🎨 Sistema de Botones - TecnoCel Web
          </h1>
          <p className={styles.pageSubtitle}>
            Componente universal para toda la aplicación con 9 variantes y 5 tamaños
          </p>
          <div className={styles.headerActions}>
            <ButtonDemo />
          </div>
        </div>
      </header>
    </div>
  );
};

export default ButtonDemoPage;
