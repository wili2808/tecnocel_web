/**
 * Página Offers - Página principal de ofertas especiales
 * Muestra todas las ofertas disponibles y productos en oferta con paginación
 * Incluye funcionalidades para estadísticas, grid de ofertas y productos en oferta
 * Utiliza useOfertasPagination para gestión de datos paginados y contexto global
 */
import React, { useMemo } from 'react';
import { useOfertasPagination } from '../../hooks/useOfertasPagination';
import OffersGrid from '../../components/product/OffersGrid';
import OffersProductsSection from '../../components/product/OffersProductsSection';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './Offers.module.css';

// ============================================================================
// CONFIGURACIÓN DE NOTIFICACIONES
// ============================================================================

/**
 * Configuración de notificaciones toast
 * Define posición, duración y comportamiento de las notificaciones del sistema
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

const Offers: React.FC = () => {
    // ============================================================================
    // HOOKS Y CONTEXTOS
    // ============================================================================

    const {
        ofertas,
        productosEnOferta,
        loading,
        error,
        totalItems,
        hasNextPage,
        loadMore,
        refreshOfertas,
        getOfertasCount,
        getProductosEnOfertaCount
    } = useOfertasPagination({ itemsPerPage: 20 });

    // ============================================================================
    // PROCESAMIENTO DE DATOS
    // ============================================================================

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

    // ============================================================================
    // RENDERIZADO
    // ============================================================================

    return (
        <div className={styles.offersPage}>
            {/* Contenedor de notificaciones toast */}
            <ToastContainer {...TOAST_CONFIG} />

            <div className={styles.offersContainer}>
                {/* Header de la página con título y estadísticas */}
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

                    {/* Tarjeta de estadísticas con conteo de ofertas y productos */}
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

                {/* Grid de ofertas con separación por estado */}
                <OffersGrid
                    ofertas={ofertas}
                    loading={loading}
                    error={error}
                    onRetry={refreshOfertas}
                    productCounts={productCounts}
                />

                {/* Sección de productos en oferta con paginación */}
                <OffersProductsSection
                    products={productosEnOferta}
                    loading={loading}
                    error={error}
                    totalProducts={totalItems}
                    hasMore={hasNextPage}
                    onLoadMore={loadMore}
                    onRetry={refreshOfertas}
                />
            </div>
        </div>
    );
};

Offers.displayName = 'Offers';

export default Offers; 