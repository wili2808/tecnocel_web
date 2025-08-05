import React from 'react';
import styles from './CommentFilters.module.css';

interface CommentFiltersProps {
    orden: 'recientes' | 'antiguos' | 'mejor_calificacion' | 'peor_calificacion';
    onOrdenChange: (orden: 'recientes' | 'antiguos' | 'mejor_calificacion' | 'peor_calificacion') => void;
    totalComentarios: number;
    className?: string;
}

const CommentFilters: React.FC<CommentFiltersProps> = ({
    orden,
    onOrdenChange,
    totalComentarios,
    className = ''
}) => {
    const opciones = [
        { value: 'recientes' as const, label: 'Más recientes', icon: 'schedule' },
        { value: 'antiguos' as const, label: 'Más antiguos', icon: 'history' },
        { value: 'mejor_calificacion' as const, label: 'Mejor calificación', icon: 'star' },
        { value: 'peor_calificacion' as const, label: 'Peor calificación', icon: 'star_border' }
    ];

    return (
        <div className={`${styles.commentFilters} ${className}`}>
            <div className={styles.filtersHeader}>
                <div className={styles.totalCount}>
                    <span className="material-icons">comment</span>
                    <span>{totalComentarios} comentario{totalComentarios !== 1 ? 's' : ''}</span>
                </div>

                <div className={styles.orderSection}>
                    <label className={styles.orderLabel}>
                        <span className="material-icons">sort</span>
                        Ordenar por:
                    </label>
                    <div className={styles.orderOptions}>
                        {opciones.map((opcion) => (
                            <button
                                key={opcion.value}
                                className={`${styles.orderButton} ${orden === opcion.value ? styles.active : ''}`}
                                onClick={() => onOrdenChange(opcion.value)}
                                type="button"
                            >
                                <span className="material-icons">{opcion.icon}</span>
                                <span className={styles.orderText}>{opcion.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Separador visual */}
            <div className={styles.separator}></div>
        </div>
    );
};

export default CommentFilters;