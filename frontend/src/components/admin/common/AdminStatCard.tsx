import styles from './AdminStatCard.module.css';

interface AdminStatCardProps {
  icon: string;
  label: string;
  value: string | number;
  detail?: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
  variant?: 'default' | 'flush';
  className?: string;
}

const AdminStatCard = ({
  icon,
  label,
  value,
  detail,
  tone = 'neutral',
  variant = 'default',
  className = '',
}: AdminStatCardProps) => (
  <article
    className={[styles.card, styles[tone], variant === 'flush' ? styles.flush : '', className]
      .filter(Boolean)
      .join(' ')}
  >
    <div className={styles.header}>
      <span className="material-icons">{icon}</span>
      <span>{label}</span>
    </div>
    <div className={styles.value}>{value}</div>
    {detail ? <div className={styles.detail}>{detail}</div> : null}
  </article>
);

export default AdminStatCard;
