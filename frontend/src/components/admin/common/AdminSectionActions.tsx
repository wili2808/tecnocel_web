import type { ReactNode } from 'react';
import styles from './AdminSectionActions.module.css';

interface AdminSectionActionsProps {
  lead?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

const AdminSectionActions = ({ lead, actions, className = '' }: AdminSectionActionsProps) => (
  <div className={[styles.actionsBar, className].filter(Boolean).join(' ')}>
    {lead ? <div className={styles.lead}>{lead}</div> : <div />}
    {actions ? <div className={styles.actions}>{actions}</div> : null}
  </div>
);

export const AdminSectionLeadText = ({ children }: { children: ReactNode }) => (
  <p className={styles.leadText}>{children}</p>
);

export default AdminSectionActions;
