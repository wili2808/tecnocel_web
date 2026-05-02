import AdminSearch from './AdminSearch';
import styles from './AdminEntitySearchBar.module.css';

export interface AdminEntitySearchBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  searchLabel?: string;
  primaryActionLabel?: string;
  primaryActionIcon?: string;
  onPrimaryAction?: () => void;
  primaryActionDisabled?: boolean;
  primaryActionHidden?: boolean;
  className?: string;
}

const AdminEntitySearchBar = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  searchLabel = 'Búsqueda',
  primaryActionLabel,
  primaryActionIcon,
  onPrimaryAction,
  primaryActionDisabled = false,
  primaryActionHidden = false,
  className = '',
}: AdminEntitySearchBarProps) => {
  const hasPrimaryAction = !primaryActionHidden && primaryActionLabel && onPrimaryAction;

  return (
    <div className={[styles.searchBar, className].filter(Boolean).join(' ')}>
      <div className={styles.searchColumn}>
        <label className={styles.label}>{searchLabel}</label>
        <AdminSearch
          value={searchValue}
          placeholder={searchPlaceholder}
          onChange={onSearchChange}
        />
      </div>

      <div className={styles.actions}>
        {hasPrimaryAction ? (
          <button
            type="button"
            className={styles.primaryAction}
            onClick={onPrimaryAction}
            disabled={primaryActionDisabled}
          >
            {primaryActionIcon ? <span className="material-icons">{primaryActionIcon}</span> : null}
            <span>{primaryActionLabel}</span>
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default AdminEntitySearchBar;
