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
    <div className={`${styles.mainLayout} ${className || ''}`}>
      {!hideNav && <Navbar />}
      <main className={styles.mainContent}>
        <div className={styles.contentSection}>
          <Outlet />
        </div>
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
});

Layout.displayName = 'Layout';

export default Layout;
