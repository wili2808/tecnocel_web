import React, { memo, useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import styles from '../../styles/Layout.module.css';

interface LayoutProps {
  className?: string;
  hideNav?: boolean;
  hideFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = memo(({
  className,
  hideNav = false,
  hideFooter = false
}) => {
  const spacerRef = useRef<HTMLDivElement>(null);

  // Efecto para calcular y aplicar la altura real del navbar
  useEffect(() => {
    const updateNavbarHeight = () => {
      const navbarElement = document.querySelector('header[class*="navbar"]') as HTMLElement;
      if (navbarElement && spacerRef.current) {
        const height = navbarElement.offsetHeight;
        spacerRef.current.style.height = `${height}px`;
      }
    };

    // Calcular altura inicial con un pequeño delay para asegurar que el DOM esté listo
    const timer = setTimeout(updateNavbarHeight, 50);

    // Recalcular en resize para responsive
    const handleResize = () => {
      setTimeout(updateNavbarHeight, 100);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [hideNav]);

  return (
    <div className={`${styles.mainLayout} theme-transition ${className || ''}`}>
      {!hideNav && <Navbar />}
      {!hideNav && (
        <div
          ref={spacerRef}
          className={styles.navbarSpacer}
        />
      )}
      <main>
        <Outlet />
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
});

Layout.displayName = 'Layout';

export default Layout;
