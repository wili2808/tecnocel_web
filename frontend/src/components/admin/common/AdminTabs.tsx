import React, { memo } from 'react';
import styles from './AdminTabs.module.css';

export interface AdminTabConfig {
  id: string;
  label: string;
  icon?: string;
  badge?: React.ReactNode;
}

interface AdminTabsProps {
  tabs: AdminTabConfig[];
  activeTab: string;
  onChange: (id: any) => void;
  className?: string;
  hasMarginTop?: boolean;
}

/**
 * Componente AdminTabs - Barra de navegación por pestañas estandarizada
 * Soporta iconos, etiquetas y badges opcionales.
 */
const AdminTabs: React.FC<AdminTabsProps> = memo(({
  tabs,
  activeTab,
  onChange,
  className = '',
  hasMarginTop = false
}) => {
  return (
    <div className={`${styles.tabsBar} ${hasMarginTop ? styles.marginTop : ''} ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabActive : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon && <span className="material-icons">{tab.icon}</span>}
          <span>{tab.label}</span>
          {tab.badge && (
            <span className={styles.badge}>
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
});

export default AdminTabs;
