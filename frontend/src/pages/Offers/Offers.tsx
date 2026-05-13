/**
 * Página Offers — rediseño PWA vertical
 * Cada oferta activa se muestra como un banner wide + los productos que le pertenecen
 * Las ofertas se presentan en secuencia vertical; al final van las expiradas en grid compacto
 */
import React, { useMemo } from 'react';
import { useOfertasPagination } from '../../hooks/useOfertasPagination';
import PageMeta from '../../components/common/PageMeta/PageMeta';
import OfferCard from '../../components/product/OfferCard';
import OfferProductCarousel from '../../components/product/OfferProductCarousel/OfferProductCarousel';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import type { Product } from '../../types';
import styles from './Offers.module.css';

const Offers: React.FC = () => {
  const {
    ofertas,
    productosEnOferta,
    loading,
    error,
    hasNextPage,
    loadMore,
    refreshOfertas,
    getOfertasCount,
    getProductosEnOfertaCount,
  } = useOfertasPagination({ itemsPerPage: 20 });

  // Agrupa productos por id_oferta — evita duplicados
  const productosPorOferta = useMemo(() => {
    const map = new Map<number, Product[]>();
    productosEnOferta.forEach((producto) => {
      producto.ofertas?.forEach((oferta: { id_oferta: number }) => {
        const list = map.get(oferta.id_oferta) ?? [];
        if (!list.find((p) => p.id_producto === producto.id_producto)) {
          list.push(producto);
          map.set(oferta.id_oferta, list);
        }
      });
    });
    return map;
  }, [productosEnOferta]);

  // Separa activas / expiradas
  const { ofertasActivas, ofertasExpiradas } = useMemo(() => {
    const now = new Date();
    return {
      ofertasActivas: ofertas.filter((o) => new Date(o.fecha_fin) >= now),
      ofertasExpiradas: ofertas.filter((o) => new Date(o.fecha_fin) < now),
    };
  }, [ofertas]);

  // ── Estados de carga / error ────────────────────────────────────────
  if (loading && ofertas.length === 0) {
    return (
      <div className={styles.offersPage}>
        <div className={styles.centeredState}>
          <LoadingSpinner size="lg" />
          <p className={styles.loadingText}>Cargando ofertas...</p>
        </div>
      </div>
    );
  }

  if (error && ofertas.length === 0) {
    return (
      <div className={styles.offersPage}>
        <div className={styles.centeredState}>
          <span className="material-icons">error_outline</span>
          <h3>No pudimos cargar las ofertas</h3>
          <p>{error}</p>
          <button onClick={refreshOfertas} className={styles.retryButton}>
            <span className="material-icons">refresh</span>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.offersPage}>
      <PageMeta
        title="Ofertas del día"
        description="Las mejores ofertas en celulares y tecnología. Descuentos reales en TecnoCel Argentina."
        url="/ofertas"
      />
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className={styles.pageHeader}>
        <div className={styles.headerInner}>
          <div className={styles.headerContent}>
            <p className={styles.eyebrow}>Promociones</p>
            <h1 className={styles.pageTitle}>Ofertas Especiales</h1>
            <p className={styles.pageSubtitle}>
              Descuentos exclusivos en tecnología seleccionada
            </p>
          </div>

          {getProductosEnOfertaCount() > 0 && (
            <div className={styles.statsCard}>
              <div className={styles.stat}>
                <span className={styles.statNumber}>{getOfertasCount()}</span>
                <span className={styles.statLabel}>Ofertas</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <span className={styles.statNumber}>{getProductosEnOfertaCount()}</span>
                <span className={styles.statLabel}>Productos</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className={styles.offersContainer}>

        {/* ── Sin ofertas ──────────────────────────────────────────── */}
        {ofertas.length === 0 && !loading && (
          <div className={styles.centeredState}>
            <span className="material-icons">local_offer</span>
            <h3>No hay ofertas disponibles</h3>
            <p>Vuelve pronto para ver nuestras promociones exclusivas.</p>
          </div>
        )}

        {/* ── Ofertas activas — banner + productos ─────────────────── */}
        {ofertasActivas.length > 0 && (
          <div className={styles.offersList}>
            {ofertasActivas.map((oferta, index) => {
              const productos = productosPorOferta.get(oferta.id_oferta) ?? [];
              return (
                <article
                  key={oferta.id_oferta}
                  className={styles.offerSection}
                  style={{ animationDelay: `${index * 0.07}s` }}
                >
                  <OfferCard oferta={oferta} productCount={productos.length} />

                  {productos.length > 0 && (
                    <OfferProductCarousel
                      productos={productos}
                      fechaFin={oferta.fecha_fin}
                    />
                  )}

                  {productos.length === 0 && !loading && (
                    <p className={styles.noProducts}>
                      Esta oferta aún no tiene productos asignados.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* ── Cargar más ───────────────────────────────────────────── */}
        {hasNextPage && (
          <div className={styles.loadMoreWrap}>
            <button
              onClick={loadMore}
              className={styles.loadMoreButton}
              disabled={loading}
            >
              {loading ? (
                <><LoadingSpinner size="sm" /><span>Cargando...</span></>
              ) : (
                <><span className="material-icons">expand_more</span><span>Cargar más</span></>
              )}
            </button>
          </div>
        )}

        {/* ── Ofertas expiradas ────────────────────────────────────── */}
        {ofertasExpiradas.length > 0 && (
          <section className={styles.expiredSection}>
            <div className={styles.expiredHeader}>
              <h2 className={styles.expiredTitle}>Ofertas anteriores</h2>
              <span className={styles.expiredBadge}>{ofertasExpiradas.length}</span>
            </div>
            <div className={styles.expiredGrid}>
              {ofertasExpiradas.map((oferta) => (
                <OfferCard
                  key={oferta.id_oferta}
                  oferta={oferta}
                  productCount={productosPorOferta.get(oferta.id_oferta)?.length ?? 0}
                />
              ))}
            </div>
          </section>
        )}

      </div>
    </div>
  );
};

Offers.displayName = 'Offers';
export default Offers;

