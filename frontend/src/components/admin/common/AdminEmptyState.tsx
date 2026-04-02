import type { ReactNode } from 'react';
import AdminSurface from './AdminSurface';
import styles from './AdminEmptyState.module.css';

interface AdminEmptyStateProps {
  icon?: string;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: 'neutral' | 'warning' | 'danger';
  className?: string;
  children?: ReactNode;
}

const AdminEmptyState = ({
  icon = 'info',
  title,
  message,
  actionLabel,
  onAction,
  tone = 'neutral',
  className = '',
  children,
}: AdminEmptyStateProps) => (
  <AdminSurface className={className} tone="muted">
    <div className={styles.state}>
      <div className={`${styles.iconWrap} ${styles[tone]}`}>
        <span className="material-icons">{icon}</span>
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.message}>{message}</p>
      </div>
      {children}
      {actionLabel && onAction ? (
        <button className={styles.action} onClick={onAction}>
          <span className="material-icons">refresh</span>
          {actionLabel}
        </button>
      ) : null}
    </div>
  </AdminSurface>
);

export default AdminEmptyState;
