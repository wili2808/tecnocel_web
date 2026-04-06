import React from 'react';
import type { EstadisticasComentarios } from '../../../services/commentService';
import styles from './CommentStats.module.css';

interface CommentStatsProps {
  estadisticas: EstadisticasComentarios;
  className?: string;
}

const CommentStats: React.FC<CommentStatsProps> = ({ estadisticas, className = '' }) => {
  const {
    total_comentarios,
    total_calificaciones,
    calificacion_promedio,
    distribucion_calificaciones,
    total_imagenes,
  } = estadisticas;

  // Calcular porcentajes para la distribución
  const calcularPorcentaje = (cantidad: number): number => {
    if (total_calificaciones === 0) return 0;
    return Math.round((cantidad / total_calificaciones) * 100);
  };

  const renderStarDistribution = () => {
    return [5, 4, 3, 2, 1].map((stars) => {
      const cantidad = distribucion_calificaciones[stars as keyof typeof distribucion_calificaciones];
      const porcentaje = calcularPorcentaje(cantidad);

      return (
        <div key={stars} className={styles.starRow}>
          <div className={styles.starLabel}>
            <span className="material-icons">star</span>
            <span>{stars}</span>
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${porcentaje}%` }}></div>
          </div>
          <div className={styles.starCount}>
            <span>{cantidad}</span>
            <span className={styles.percentage}>({porcentaje}%)</span>
          </div>
        </div>
      );
    });
  };

  const renderOverallRating = () => {
    const fullStars = Math.floor(calificacion_promedio);
    const hasHalfStar = calificacion_promedio % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className={styles.overallRating}>
        <div className={styles.ratingNumber}>{calificacion_promedio.toFixed(1)}</div>
        <div className={styles.ratingStars}>
          {/* Estrellas llenas */}
          {Array(fullStars)
            .fill(0)
            .map((_, index) => (
              <span key={`full-${index}`} className={`material-icons ${styles.starFull}`}>
                star
              </span>
            ))}

          {/* Media estrella */}
          {hasHalfStar && <span className={`material-icons ${styles.starHalf}`}>star_half</span>}

          {/* Estrellas vacías */}
          {Array(emptyStars)
            .fill(0)
            .map((_, index) => (
              <span key={`empty-${index}`} className={`material-icons ${styles.starEmpty}`}>
                star_border
              </span>
            ))}
        </div>
        <div className={styles.ratingText}>
          Basado en {total_calificaciones} calificacion{total_calificaciones !== 1 ? 'es' : ''}
        </div>
      </div>
    );
  };

  return (
    <div className={`${styles.commentStats} ${className}`}>
      {/* Resumen general */}
      <div className={styles.statsHeader}>
        <h4 className={styles.statsTitle}>Opiniones de clientes</h4>
        <div className={styles.statsMetrics}>
          <div className={styles.metric}>
            <span className={styles.metricNumber}>{total_comentarios}</span>
            <span className={styles.metricLabel}>Comentario{total_comentarios !== 1 ? 's' : ''}</span>
          </div>
          {total_imagenes > 0 && (
            <div className={styles.metric}>
              <span className={styles.metricNumber}>{total_imagenes}</span>
              <span className={styles.metricLabel}>Imagen{total_imagenes !== 1 ? 'es' : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* Calificación promedio */}
      {total_calificaciones > 0 && (
        <div className={styles.statsContent}>
          <div className={styles.overallSection}>{renderOverallRating()}</div>

          {/* Distribución de estrellas */}
          <div className={styles.distributionSection}>
            <h5 className={styles.distributionTitle}>Distribución de calificaciones</h5>
            <div className={styles.starDistribution}>{renderStarDistribution()}</div>
          </div>
        </div>
      )}

      {/* Estado sin calificaciones */}
      {total_calificaciones === 0 && total_comentarios > 0 && (
        <div className={styles.noRatings}>
          <span className="material-icons">info</span>
          <p>Este producto tiene comentarios pero aún no ha recibido calificaciones.</p>
        </div>
      )}
    </div>
  );
};

export default CommentStats;
