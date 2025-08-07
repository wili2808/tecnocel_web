import React from 'react';
import type { Oferta } from '../../../types/product';
import styles from './OfferCard.module.css';

interface OfferCardProps {
    oferta: Oferta;
    productCount?: number;
    className?: string;
}

const OfferCard: React.FC<OfferCardProps> = ({
    oferta,
    productCount = 0,
    className = ''
}) => {
    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('es-AR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch {
            return 'Fecha no disponible';
        }
    };

    const formatDiscount = () => {
        if (oferta.tipo_descuento === 'porcentaje') {
            return `${oferta.valor_descuento}% OFF`;
        } else {
            return `$${oferta.valor_descuento} OFF`;
        }
    };

    const isActive = () => {
        const now = new Date();
        const inicio = new Date(oferta.fecha_inicio);
        const fin = new Date(oferta.fecha_fin);
        return now >= inicio && now <= fin;
    };

    const getTimeRemaining = () => {
        const now = new Date();
        const fin = new Date(oferta.fecha_fin);
        const diff = fin.getTime() - now.getTime();

        if (diff <= 0) return 'Expirada';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (days > 0) {
            return `${days} día${days > 1 ? 's' : ''}`;
        } else if (hours > 0) {
            return `${hours} hora${hours > 1 ? 's' : ''}`;
        } else {
            return 'Menos de 1 hora';
        }
    };

    const active = isActive();
    const timeRemaining = getTimeRemaining();

    return (
        <div className={`${styles.offerCard} ${!active ? styles.inactive : ''} ${className}`}>
            {/* Badge de descuento */}
            <div className={styles.discountBadge}>
                <span className={styles.discountText}>{formatDiscount()}</span>
            </div>

            {/* Estado de la oferta */}
            <div className={`${styles.statusBadge} ${active ? styles.active : styles.expired}`}>
                <span className="material-icons">
                    {active ? 'local_fire_department' : 'schedule'}
                </span>
                <span>{active ? 'Activa' : 'Expirada'}</span>
            </div>

            {/* Contenido principal */}
            <div className={styles.cardContent}>
                <h3 className={styles.offerTitle}>{oferta.nombre_oferta}</h3>

                {oferta.descripcion && (
                    <p className={styles.offerDescription}>{oferta.descripcion}</p>
                )}

                {/* Información de productos */}
                <div className={styles.productInfo}>
                    <span className="material-icons">inventory_2</span>
                    <span className={styles.productCount}>
                        {productCount} producto{productCount !== 1 ? 's' : ''} en oferta
                    </span>
                </div>

                {/* Período de validez */}
                <div className={styles.dateInfo}>
                    <div className={styles.dateRange}>
                        <span className="material-icons">event</span>
                        <span className={styles.dateText}>
                            {formatDate(oferta.fecha_inicio)} - {formatDate(oferta.fecha_fin)}
                        </span>
                    </div>

                    {active && (
                        <div className={styles.timeRemaining}>
                            <span className="material-icons">timer</span>
                            <span className={styles.timeText}>
                                Quedan {timeRemaining}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer con acción */}
            <div className={styles.cardFooter}>
                <button
                    className={`${styles.viewButton} ${!active ? styles.disabled : ''}`}
                    disabled={!active}
                >
                    <span className="material-icons">visibility</span>
                    Ver productos
                </button>
            </div>
        </div>
    );
};

export default OfferCard;