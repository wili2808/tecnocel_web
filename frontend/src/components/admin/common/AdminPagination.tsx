import React from 'react';
import styles from './AdminPagination.module.css';

interface AdminPaginationProps {
  total: number;
  limit: number;
  offset: number;
  itemLabel?: string;
  onPageChange: (newOffset: number) => void;
  className?: string;
}

const AdminPagination: React.FC<AdminPaginationProps> = ({
  total,
  limit,
  offset,
  itemLabel = 'registros',
  onPageChange,
  className = '',
}) => {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  if (total <= limit) return null;

  return (
    <div className={`${styles.pagination} ${className}`}>
      <span className={styles.info}>
        Mostrando {Math.min(limit, total - offset)} de {total} {itemLabel}
      </span>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.btn}
          onClick={() => onPageChange(Math.max(0, offset - limit))}
          disabled={offset === 0}
          title="Página anterior"
        >
          <span className="material-icons">chevron_left</span>
          <span>Anterior</span>
        </button>
        <span className={styles.pageInfo}>
          Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
        </span>
        <button
          type="button"
          className={styles.btn}
          onClick={() => onPageChange(offset + limit)}
          disabled={offset + limit >= total}
          title="Siguiente página"
        >
          <span>Siguiente</span>
          <span className="material-icons">chevron_right</span>
        </button>
      </div>
    </div>
  );
};

export default AdminPagination;
