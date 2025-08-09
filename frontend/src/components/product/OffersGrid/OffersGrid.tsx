import React, { useMemo } from 'react';
import OfferCard from '../OfferCard';
import LoadingSpinner from '../../common/LoadingSpinner';
import { useOfertasGlobal } from '../../../hooks/useOfertasGlobal';
import type { Oferta } from '../../../types/product';
import styles from './OffersGrid.module.css';

interface OffersGridProps {
    ofertas?: Oferta[]; // Ahora opcional, usa contexto global si no se proporciona
    loading?: boolean; // Opcional, usa contexto global si no se proporciona
    error?: string | null; // Opcional, usa contexto global si no se proporciona
    onRetry?: () => void;
    productCounts?: Record<number, number>;
    useGlobalContext?: boolean; // Nueva prop para controlar si usar contexto global
}

const OffersGrid: React.FC<OffersGridProps> = ({
    ofertas: propsOfertas,
    loading: propsLoading,
    error: propsError,
    onRetry,
    productCounts = {},
    useGlobalContext = true // Por defecto usar contexto global
}) => {
    // Usar contexto global si está habilitado y no se proporcionan props
    const {
        ofertas: contextOfertas,
        ofertasActivas,
        ofertasExpiradas,
        loading: contextLoading,
        error: contextError,
        refreshOfertas
    } = useOfertasGlobal();

    // Determinar qué datos usar
    const ofertas = useGlobalContext ? contextOfertas : (propsOfertas || []);
    const loading = useGlobalContext ? contextLoading : (propsLoading ?? false);
    const error = useGlobalContext ? contextError : propsError;
    const handleRetry = useGlobalContext ? refreshOfertas : onRetry;

    // Memoizar las ofertas activas y expiradas para evitar recálculos
    const { ofertasActivasFiltered, ofertasExpiradasFiltered } = useMemo(() => {
        if (useGlobalContext) {
            // Usar datos ya filtrados del contexto global
            return {
                ofertasActivasFiltered: ofertasActivas,
                ofertasExpiradasFiltered: ofertasExpiradas
            };
        } else {
            // Filtrado manual (fallback para compatibilidad)
            const now = new Date();
            const activas = ofertas.filter(oferta => {
                const fin = new Date(oferta.fecha_fin);
                return fin >= now;
            });
            const expiradas = ofertas.filter(oferta => {
                const fin = new Date(oferta.fecha_fin);
                return fin < now;
            });
            return {
                ofertasActivasFiltered: activas,
                ofertasExpiradasFiltered: expiradas
            };
        }
    }, [useGlobalContext, ofertas, ofertasActivas, ofertasExpiradas]);

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
                    {handleRetry && (
                        <button onClick={handleRetry} className={styles.retryButton}>
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

    return (
        <div className={styles.offersGrid}>
            {/* Ofertas activas */}
            {ofertasActivasFiltered.length > 0 && (
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            <span className="material-icons">local_fire_department</span>
                            Ofertas Activas
                        </h2>
                        <span className={styles.badge}>{ofertasActivasFiltered.length}</span>
                    </div>

                    <div className={styles.grid}>
                        {ofertasActivasFiltered.map((oferta) => (
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
            {ofertasExpiradasFiltered.length > 0 && (
                <section className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            <span className="material-icons">schedule</span>
                            Ofertas Expiradas
                        </h2>
                        <span className={styles.badge}>{ofertasExpiradasFiltered.length}</span>
                    </div>

                    <div className={styles.grid}>
                        {ofertasExpiradasFiltered.map((oferta) => (
                            <OfferCard
                                key={oferta.id_oferta}
                                oferta={oferta}
                                productCount={productCounts[oferta.id_oferta] || 0}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Debug info - Solo en desarrollo */}
            {process.env.NODE_ENV === 'development' && useGlobalContext && (
                <div className={styles.debugInfo}>
                    <h4>🧪 Debug Info (OffersGrid)</h4>
                    <p>Usando Contexto Global: {useGlobalContext ? '✅ Sí' : '❌ No'}</p>
                    <p>Total Ofertas: {ofertas.length}</p>
                    <p>Ofertas Activas: {ofertasActivasFiltered.length}</p>
                    <p>Ofertas Expiradas: {ofertasExpiradasFiltered.length}</p>
                </div>
            )}
        </div>
    );
};

export default OffersGrid;