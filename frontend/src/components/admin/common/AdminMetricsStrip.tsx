import AdminStatCard from './AdminStatCard';
import styles from './AdminMetricsStrip.module.css';

export interface AdminMetricsStripItem {
  icon: string;
  label: string;
  value: string | number;
  detail?: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
  variant?: 'default' | 'flush';
}

export interface AdminMetricsStripProps {
  items: AdminMetricsStripItem[];
  loading?: boolean;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
  itemClassName?: string;
}

const AdminMetricsStrip = ({
  items,
  loading = false,
  columns = 4,
  className = '',
  itemClassName = '',
}: AdminMetricsStripProps) => {
  const gridClassName = [
    styles.strip,
    styles[`columns${columns}`],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const skeletonCount = items.length > 0 ? items.length : columns;

  if (loading) {
    return (
      <div className={gridClassName}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div key={index} className={styles.skeletonCard} />
        ))}
      </div>
    );
  }

  return (
    <div className={gridClassName}>
      {items.map((item) => (
        <AdminStatCard
          key={`${item.label}-${item.icon}`}
          icon={item.icon}
          label={item.label}
          value={item.value}
          detail={item.detail}
          tone={item.tone}
          variant={item.variant ?? 'flush'}
          className={[styles.item, itemClassName].filter(Boolean).join(' ')}
        />
      ))}
    </div>
  );
};

export default AdminMetricsStrip;
