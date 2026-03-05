/**
 * Componente OfferCard — banner horizontal a todo ancho
 * Diseño Silicon Precision: accent bar izquierda, info editorial, badge de descuento circular
 */
import React, { memo } from 'react';
import type { Oferta } from '../../../types';
import styles from './OfferCard.module.css';

interface OfferCardProps {
  oferta: Oferta;
  productCount?: number;
  className?: string;
}

const OfferCard: React.FC<OfferCardProps> = memo(({ oferta, productCount = 0, className = '' }) => {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Fecha no disponible';
    }
  };

  const formatDiscount = () => {
    if (oferta.tipo_descuento === 'porcentaje') {
      return `${oferta.valor_descuento}%`;
    }
    return `$${oferta.valor_descuento}`;
  };

  const isActive = () => {
    const now = new Date();
    return now >= new Date(oferta.fecha_inicio) && now <= new Date(oferta.fecha_fin);
  };

  const getTimeRemaining = () => {
    const diff = new Date(oferta.fecha_fin).getTime() - Date.now();
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days} día${days > 1 ? 's' : ''} restantes`;
    if (hours > 0) return `${hours} hora${hours > 1 ? 's' : ''} restantes`;
    return 'Menos de 1 hora';
  };

  const active = isActive();
  const timeRemaining = getTimeRemaining();

  return (
    <div className={`${styles.offerCard} ${!active ? styles.inactive : ''} ${className}`}>
      {/* Accent bar lateral izquierda */}
      <div className={styles.accentBar} />

      <div className={styles.cardInner}>
        {/* ── Columna izquierda — info editorial ─────────────────── */}
        <div className={styles.cardLeft}>
          {/* Meta row: estado + fecha + tiempo */}
          <div className={styles.metaRow}>
            <span className={`${styles.statusBadge} ${active ? styles.activeBadge : styles.expiredBadge}`}>
              {active ? 'ACTIVA' : 'EXPIRADA'}
            </span>
            {active && timeRemaining && (
              <span className={styles.timeMeta}>
                <span className="material-icons">timer</span>
                {timeRemaining}
              </span>
            )}
          </div>

          {/* Título */}
          <h2 className={styles.offerTitle}>{oferta.nombre_oferta}</h2>

          {/* Descripción */}
          {oferta.descripcion && <p className={styles.offerDescription}>{oferta.descripcion}</p>}

          {/* Footer: productos + rango de fechas */}
          <div className={styles.footerMeta}>
            <span className={styles.productCount}>
              <span className="material-icons">inventory_2</span>
              {productCount} producto{productCount !== 1 ? 's' : ''} incluidos
            </span>
            <span className={styles.dateRange}>
              {formatDate(oferta.fecha_inicio)} — {formatDate(oferta.fecha_fin)}
            </span>
          </div>
        </div>

        {/* ── Columna derecha — badge circular de descuento ───────── */}
        <div className={styles.cardRight}>
          <div className={styles.discountBadge}>
            <span className={styles.discountValue}>{formatDiscount()}</span>
            <span className={styles.discountLabel}>OFF</span>
          </div>
        </div>
      </div>
    </div>
  );
});

OfferCard.displayName = 'OfferCard';
export default OfferCard;
