/**
 * Página Offers - Página principal de ofertas especiales
 * Muestra todas las ofertas disponibles y productos en oferta con paginación
 * Incluye funcionalidades para estadísticas, grid de ofertas y productos en oferta
 * Utiliza useOfertasPagination para gestión de datos paginados y contexto global
 */
import React, { useMemo, useState } from 'react';
import { useOfertasPagination } from '../../hooks/useOfertasPagination';
import OffersGrid from '../../components/product/OffersGrid';
import OffersProductsSection from '../../components/product/OffersProductsSection';
import ProductsOfferFilter, { type ProductOfferFilter } from '../../components/product/ProductsOfferFilter';
import styles from './Offers.module.css';

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
    // ESTADO LOCAL
    // ============================================================================

    // Estado del filtro de productos por oferta
    const [productOfferFilter, setProductOfferFilter] = useState<ProductOfferFilter>('todas');

    // ============================================================================
    // PROCESAMIENTO DE DATOS
    // ============================================================================

    // Calcular cantidad de productos por oferta usando el contexto global
    const productCounts = useMemo(() => {
        const counts: Record<number, number> = {};

        // Contar productos por oferta usando datos del contexto
        // IMPORTANTE: Solo contar la primera oferta de cada producto para evitar duplicaciones
        productosEnOferta.forEach((producto: any) => {
            if (producto.ofertas && producto.ofertas.length > 0) {
                // Solo contar la primera oferta activa del producto
                const ofertaActiva = producto.ofertas[0];
                counts[ofertaActiva.id_oferta] = (counts[ofertaActiva.id_oferta] || 0) + 1;
            }
        });

        return counts;
    }, [productosEnOferta]);

    // Filtrar productos por oferta seleccionada
    const productosFiltrados = useMemo(() => {
        let filtered = [...productosEnOferta];

        // Aplicar filtro por oferta
        if (productOfferFilter !== 'todas') {
            filtered = filtered.filter(producto => {
                // Verificar si el producto tiene la oferta seleccionada
                return producto.ofertas?.some(oferta => oferta.id_oferta === productOfferFilter);
            });
        }

        return filtered;
    }, [productosEnOferta, productOfferFilter]);

    // ============================================================================
    // RENDERIZADO
    // ============================================================================

    return (
        <div className={styles.offersPage}>
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
                    products={productosFiltrados}
                    loading={loading}
                    error={error}
                    totalProducts={productosEnOferta.length}
                    hasMore={hasNextPage}
                    onLoadMore={loadMore}
                    onRetry={refreshOfertas}
                    useGlobalContext={false}
                    filterControls={
                        !loading && ofertas.length > 0 ? (
                            <ProductsOfferFilter
                                currentFilter={productOfferFilter}
                                ofertas={ofertas}
                                onFilterChange={setProductOfferFilter}
                                disabled={loading}
                            />
                        ) : undefined
                    }
                />
            </div>
        </div>
    );
};

Offers.displayName = 'Offers';

export default Offers; 