import { memo } from 'react';
import AdminSurface from './AdminSurface';
import styles from './AdminLoading.module.css';

export type AdminLoadingVariant = 'panel' | 'page' | 'compact' | 'overlay';

interface AdminLoadingProps {
  /** Título breve visible en panel/página y overlay */
  title?: string;
  /** Descripción opcional (omitir en overlay si se prefiere solo título) */
  message?: string;
  variant?: AdminLoadingVariant;
  className?: string;
  /** Etiqueta accesible; por defecto se arma desde título y mensaje */
  'aria-label'?: string;
  /** Ocultar franjas skeleton (solo variantes panel y page) */
  hideSkeleton?: boolean;
}

const AdminLoadingInner = memo(
  ({
    title,
    message,
    variant,
    hideSkeleton,
  }: Pick<AdminLoadingProps, 'title' | 'message' | 'variant' | 'hideSkeleton'>) => {
    const showSkeleton =
      !hideSkeleton && (variant === 'panel' || variant === 'page');
    const showBlockText = variant !== 'compact' && Boolean(title || message);

    return (
      <>
        <div className={styles.spinner}>
          <div className={styles.ring} />
        </div>
        {variant === 'compact' ? (
          <p className={styles.compactLabel}>{title || message || 'Cargando…'}</p>
        ) : showBlockText ? (
          <div className={styles.textBlock}>
            {title ? <h3 className={styles.title}>{title}</h3> : null}
            {message ? <p className={styles.message}>{message}</p> : null}
          </div>
        ) : null}
        {showSkeleton ? (
          <div className={styles.skeletonRail} aria-hidden>
            <div className={styles.skeletonBar} />
            <div className={styles.skeletonBar} />
            <div className={styles.skeletonBar} />
          </div>
        ) : null}
      </>
    );
  }
);

AdminLoadingInner.displayName = 'AdminLoadingInner';

/**
 * Estado de carga unificado para el panel administrativo.
 * Variantes: panel (bloque principal), página (área alta centrada), compact (Suspense / filas), overlay (sobre tabla).
 */
const AdminLoading = memo(
  ({
    title,
    message,
    variant = 'panel',
    className = '',
    'aria-label': ariaLabelProp,
    hideSkeleton,
  }: AdminLoadingProps) => {
    const defaultAria =
      [title, message].filter(Boolean).join('. ') || 'Cargando contenido';
    const ariaLabel = ariaLabelProp ?? defaultAria;

    if (variant === 'overlay') {
      return (
        <div
          className={`${styles.overlay} ${className}`.trim()}
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label={ariaLabel}
        >
          <AdminLoadingInner
            title={title ?? 'Cargando datos'}
            message={message}
            variant={variant}
            hideSkeleton
          />
        </div>
      );
    }

    if (variant === 'compact') {
      return (
        <div
          className={[styles.wrapCompact, styles.wrapPanel, className].filter(Boolean).join(' ')}
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label={ariaLabel}
        >
          <AdminLoadingInner
            title={title}
            message={message ?? 'Un momento…'}
            variant={variant}
            hideSkeleton
          />
        </div>
      );
    }

    const inner = (
      <div className={styles.surfaceInner}>
        <AdminLoadingInner title={title} message={message} variant={variant} hideSkeleton={hideSkeleton} />
      </div>
    );

    const surfaceClass =
      variant === 'page'
        ? [styles.wrapPanel, styles.wrapPage, className].filter(Boolean).join(' ')
        : [styles.wrapPanel, className].filter(Boolean).join(' ');

    return (
      <AdminSurface tone="muted" className={surfaceClass}>
        <div role="status" aria-live="polite" aria-busy="true" aria-label={ariaLabel}>
          {inner}
        </div>
      </AdminSurface>
    );
  }
);

AdminLoading.displayName = 'AdminLoading';

export default AdminLoading;
