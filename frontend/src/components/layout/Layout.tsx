import React, { memo } from 'react';
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
  return (
    <div className={`${styles.mainLayout} theme-transition ${className || ''}`}>
      {!hideNav && <Navbar />}
      <main className={styles.mainContent}>
        <Outlet />
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
});

Layout.displayName = 'Layout';

export default Layout;
