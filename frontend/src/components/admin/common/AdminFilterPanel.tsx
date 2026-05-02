import type { HTMLAttributes, LabelHTMLAttributes, ReactNode } from 'react';
import AdminSurface from './AdminSurface';
import styles from './AdminFilterPanel.module.css';

export interface AdminFilterPanelProps {
  children: ReactNode;
  className?: string;
}

interface AdminFilterPanelRowProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'top' | 'bottom';
}

interface AdminFilterPanelGroupProps extends HTMLAttributes<HTMLDivElement> {
  minWidth?: 'sm' | 'md' | 'lg';
}

type AdminFilterPanelGrowProps = HTMLAttributes<HTMLDivElement>;
type AdminFilterPanelActionsProps = HTMLAttributes<HTMLDivElement>;
type AdminFilterPanelLabelProps = LabelHTMLAttributes<HTMLLabelElement>;

const AdminFilterPanelRow = ({
  variant = 'top',
  className = '',
  ...props
}: AdminFilterPanelRowProps) => (
  <div
    className={[
      styles.row,
      variant === 'bottom' ? styles.rowBottom : styles.rowTop,
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...props}
  />
);

const AdminFilterPanelGroup = ({
  minWidth = 'md',
  className = '',
  ...props
}: AdminFilterPanelGroupProps) => (
  <div
    className={[styles.group, styles[`minWidth${minWidth.toUpperCase()}`], className]
      .filter(Boolean)
      .join(' ')}
    {...props}
  />
);

const AdminFilterPanelGrow = ({ className = '', ...props }: AdminFilterPanelGrowProps) => (
  <div className={[styles.grow, className].filter(Boolean).join(' ')} {...props} />
);

const AdminFilterPanelActions = ({ className = '', ...props }: AdminFilterPanelActionsProps) => (
  <div className={[styles.actions, className].filter(Boolean).join(' ')} {...props} />
);

const AdminFilterPanelLabel = ({ className = '', ...props }: AdminFilterPanelLabelProps) => (
  <label className={[styles.label, className].filter(Boolean).join(' ')} {...props} />
);

interface AdminFilterPanelComponent extends React.FC<AdminFilterPanelProps> {
  Row: typeof AdminFilterPanelRow;
  Group: typeof AdminFilterPanelGroup;
  Grow: typeof AdminFilterPanelGrow;
  Actions: typeof AdminFilterPanelActions;
  Label: typeof AdminFilterPanelLabel;
}

const AdminFilterPanel = (({ children, className = '' }: AdminFilterPanelProps) => (
  <AdminSurface className={[styles.panel, className].filter(Boolean).join(' ')} tone="muted">
    <div className={styles.content}>{children}</div>
  </AdminSurface>
)) as AdminFilterPanelComponent;

AdminFilterPanel.Row = AdminFilterPanelRow;
AdminFilterPanel.Group = AdminFilterPanelGroup;
AdminFilterPanel.Grow = AdminFilterPanelGrow;
AdminFilterPanel.Actions = AdminFilterPanelActions;
AdminFilterPanel.Label = AdminFilterPanelLabel;

export default AdminFilterPanel;
