import React from 'react';
import OfferCard from '../OfferCard';
import LoadingSpinner from '../../common/LoadingSpinner';
import type { Oferta } from '../../../types/product';
import styles from './OffersGrid.module.css';

interface OffersGridProps {
    ofertas: Oferta[];
    loading: boolean;
    error: string | null;
    onRetry?: () => void;
    productCounts?: Record<number, number>;
}

const OffersGrid: React.FC<OffersGridProps> = ({
    ofertas,
    loading,
    error,
    onRetry,
    productCounts = {}
}) => {
    if (loading && ofertas.length === 0) {
        return (
            <div className={styles.loadingContainer}>
                <LoadingSpinner size="lg" />
                <p className={styles.loadingText}>Cargando ofertas...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <div className={styles.errorContent}>
                    <span className="material-icons">error_outline</span>
                    <h3>Error al cargar ofertas</h3>
                    <p>{error}</p>
                    {onRetry && (
                        <button onClick={onRetry} className={styles.retryButton}>
                            <span className="material-icons">refresh</span>
                            Reintentar
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (ofertas.length === 0) {
        return (
            <div className={styles.emptyContainer}>
                <div className={styles.emptyContent}>
                    <span className="material-icons">local_offer</span>
                    <h3>No hay ofertas disponibles</h3>
                    <p>En este momento no tenemos ofertas activas. ¡Vuelve pronto para ver nuestras promociones!</p>
                </div>
            </div>
        );
    }

    // Separar ofertas activas y expiradas
    const now = new Date();
    const ofertasActivas = ofertas.filter(oferta => {
        const fin = new Date(oferta.fecha_fin);
        return fin >= now;
    });

    const ofertasExpiradas = ofertas.filter(oferta => {
        const fin = new Date(oferta.fecha_fin);
        return fin < now;
    });

    return (
        <div className={styles.offersGrid}>
            {/* Ofertas activas */}
            {ofertasActivas.length > 0 && (
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            <span className="material-icons">local_fire_department</span>
                            Ofertas Activas
                        </h2>
                        <span className={styles.badge}>{ofertasActivas.length}</span>
                    </div>

                    <div className={styles.grid}>
                        {ofertasActivas.map((oferta) => (
                            <OfferCard
                                key={oferta.id_oferta}
                                oferta={oferta}
                                productCount={productCounts[oferta.id_oferta] || 0}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Ofertas expiradas */}
            {ofertasExpiradas.length > 0 && (
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            <span className="material-icons">schedule</span>
                            Ofertas Expiradas
                        </h2>
                        <span className={styles.badge}>{ofertasExpiradas.length}</span>
                    </div>

                    <div className={styles.grid}>
                        {ofertasExpiradas.map((oferta) => (
                            <OfferCard
                                key={oferta.id_oferta}
                                oferta={oferta}
                                productCount={productCounts[oferta.id_oferta] || 0}
                            />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default OffersGrid;