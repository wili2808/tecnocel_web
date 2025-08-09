import React, { useMemo } from 'react';
import { useOfertasPagination } from '../../hooks/useOfertasPagination';
import OffersGrid from '../../components/product/OffersGrid';
import OffersProductsSection from '../../components/product/OffersProductsSection';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './Offers.module.css';

/**
 * Configuración de notificaciones toast
 */
const TOAST_CONFIG = {
    position: "top-center" as const,
    autoClose: 3000,
    hideProgressBar: false,
    newestOnTop: true,
    closeOnClick: true,
    pauseOnFocusLoss: true,
    draggable: true,
    pauseOnHover: true,
    theme: "light" as const,
    "aria-label": "Notificaciones del sistema"
};

/**
 * Página de ofertas
 * Muestra todas las ofertas disponibles y productos en oferta
 * Ahora usa el contexto global de ofertas para mejor performance y cache
 */
const Offers: React.FC = () => {
    const {
        ofertas,
        productosEnOferta,
        loading,
        error,
        currentPage,
        totalItems,
        hasNextPage,
        loadMore,
        refreshOfertas,
        getOfertasCount,
        getProductosEnOfertaCount
    } = useOfertasPagination({ itemsPerPage: 20 });

    // Calcular cantidad de productos por oferta usando el contexto global
    const productCounts = useMemo(() => {
        const counts: Record<number, number> = {};

        // Contar productos por oferta usando datos del contexto
        productosEnOferta.forEach((producto: any) => {
            if (producto.ofertas) {
                producto.ofertas.forEach((oferta: any) => {
                    counts[oferta.id_oferta] = (counts[oferta.id_oferta] || 0) + 1;
                });
            }
        });

        return counts;
    }, [productosEnOferta]);

    return (
        <div className={styles.offersPage}>
            <ToastContainer {...TOAST_CONFIG} />

            <div className={styles.offersContainer}>
                {/* Header */}
                <header className={styles.pageHeader}>
                    <div className={styles.headerContent}>
                        <h1 className={styles.pageTitle}>
                            <span className="material-icons">local_offer</span>
                            Ofertas Especiales
                        </h1>
                        <p className={styles.pageSubtitle}>
                            Descubre nuestras mejores ofertas y aprovecha descuentos exclusivos en tecnología
                        </p>
                    </div>

                    {getProductosEnOfertaCount() > 0 && (
                        <div className={styles.statsCard}>
                            <div className={styles.stat}>
                                <span className={styles.statNumber}>{getOfertasCount()}</span>
                                <span className={styles.statLabel}>Ofertas</span>
                            </div>
                            <div className={styles.statDivider}></div>
                            <div className={styles.stat}>
                                <span className={styles.statNumber}>{getProductosEnOfertaCount()}</span>
                                <span className={styles.statLabel}>Productos</span>
                            </div>
                        </div>
                    )}
                </header>

                {/* Grid de ofertas */}
                <OffersGrid
                    ofertas={ofertas}
                    loading={loading}
                    error={error}
                    onRetry={refreshOfertas}
                    productCounts={productCounts}
                />

                {/* Productos en oferta */}
                <OffersProductsSection
                    products={productosEnOferta}
                    loading={loading}
                    error={error}
                    totalProducts={totalItems}
                    hasMore={hasNextPage}
                    onLoadMore={loadMore}
                    onRetry={refreshOfertas}
                />

                {/* Debug info - Solo en desarrollo */}
                {process.env.NODE_ENV === 'development' && (
                    <div className={styles.debugInfo}>
                        <h4>🧪 Debug Info (Contexto Global + Paginación)</h4>
                        <p>Total Ofertas: {getOfertasCount()}</p>
                        <p>Total Productos: {totalItems}</p>
                        <p>Página Actual: {currentPage}</p>
                        <p>Hay más páginas: {hasNextPage ? '✅ Sí' : '❌ No'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Offers; 