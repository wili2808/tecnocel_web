import type { ElementType, ReactNode } from 'react';
import styles from './AdminSurface.module.css';

interface AdminSurfaceProps {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  padded?: boolean;
  tone?: 'default' | 'muted' | 'inset';
}

const AdminSurface = ({
  as: Component = 'section',
  children,
  className = '',
  padded = true,
  tone = 'default',
}: AdminSurfaceProps) => {
  const toneClass = tone === 'muted' ? styles.muted : tone === 'inset' ? styles.inset : '';

  return (
    <Component
      className={[
        styles.surface,
        padded ? styles.padded : '',
        toneClass,
        className,
      ].filter(Boolean).join(' ')}
    >
      {children}
    </Component>
  );
};

export default AdminSurface;
