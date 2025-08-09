/**
 * Componente de prueba para verificar el contexto global de ofertas
 * Este componente se puede usar para testing y debugging
 */
import React from 'react';
import { useOfertasGlobal } from '../../../hooks/useOfertasGlobal';
import styles from './OfertasTest.module.css';

const OfertasTest: React.FC = () => {
    const {
        ofertas,
        productosEnOferta,
        ofertasActivas,
        ofertasExpiradas,
        loading,
        error,
        lastUpdated,
        getOfertasCount,
        getProductosEnOfertaCount,
        isCacheValid,
        refreshOfertas,
        clearOfertas,
        getEstadisticas,
        getOfertasProximasAExpirar
    } = useOfertasGlobal();

    const handleRefresh = () => {
        refreshOfertas();
    };

    const handleClear = () => {
        clearOfertas();
    };

    const formatDate = (timestamp: number | null) => {
        if (!timestamp) return 'Nunca';
        return new Date(timestamp).toLocaleString('es-AR');
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <h3>🔄 Cargando ofertas...</h3>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <h3>❌ Error: {error}</h3>
                <button onClick={handleRefresh} className={styles.button}>
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <h3>🧪 Test del Contexto Global de Ofertas</h3>

            <div className={styles.stats}>
                <div className={styles.stat}>
                    <span className={styles.statLabel}>Total Ofertas:</span>
                    <span className={styles.statValue}>{getOfertasCount()}</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statLabel}>Ofertas Activas:</span>
                    <span className={styles.statValue}>{ofertasActivas.length}</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statLabel}>Ofertas Expiradas:</span>
                    <span className={styles.statValue}>{ofertasExpiradas.length}</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statLabel}>Productos en Oferta:</span>
                    <span className={styles.statValue}>{getProductosEnOfertaCount()}</span>
                </div>
            </div>

            <div className={styles.cacheInfo}>
                <div className={styles.stat}>
                    <span className={styles.statLabel}>Cache Válido:</span>
                    <span className={`${styles.statValue} ${isCacheValid() ? styles.valid : styles.invalid}`}>
                        {isCacheValid() ? '✅ Sí' : '❌ No'}
                    </span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.statLabel}>Última Actualización:</span>
                    <span className={styles.statValue}>{formatDate(lastUpdated)}</span>
                </div>
            </div>

            <div className={styles.actions}>
                <button onClick={handleRefresh} className={styles.button}>
                    🔄 Refrescar Ofertas
                </button>
                <button onClick={handleClear} className={styles.button}>
                    🗑️ Limpiar Cache
                </button>
                <button
                    onClick={async () => {
                        try {
                            const stats = await getEstadisticas();
                            console.log('Estadísticas:', stats);
                            alert(`Estadísticas obtenidas: ${JSON.stringify(stats, null, 2)}`);
                        } catch (error) {
                            console.error('Error al obtener estadísticas:', error);
                        }
                    }}
                    className={styles.button}
                >
                    📊 Obtener Estadísticas
                </button>
                <button
                    onClick={async () => {
                        try {
                            const ofertasProximas = await getOfertasProximasAExpirar(7);
                            console.log('Ofertas próximas a expirar:', ofertasProximas);
                            alert(`${ofertasProximas.length} ofertas próximas a expirar`);
                        } catch (error) {
                            console.error('Error al obtener ofertas próximas:', error);
                        }
                    }}
                    className={styles.button}
                >
                    ⏰ Ofertas Próximas
                </button>
            </div>

            {ofertas.length > 0 && (
                <div className={styles.ofertasList}>
                    <h4>📋 Lista de Ofertas:</h4>
                    <div className={styles.ofertasGrid}>
                        {ofertas.slice(0, 5).map(oferta => (
                            <div key={oferta.id_oferta} className={styles.ofertaCard}>
                                <h5>{oferta.nombre_oferta}</h5>
                                <p>Descuento: {oferta.valor_descuento}{oferta.tipo_descuento === 'porcentaje' ? '%' : ' Bs'}</p>
                                <p>Estado: {oferta.activo ? '✅ Activa' : '❌ Inactiva'}</p>
                                <p>Válida hasta: {new Date(oferta.fecha_fin).toLocaleDateString('es-AR')}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {productosEnOferta.length > 0 && (
                <div className={styles.productosList}>
                    <h4>🛍️ Productos en Oferta (primeros 3):</h4>
                    <div className={styles.productosGrid}>
                        {productosEnOferta.slice(0, 3).map(producto => (
                            <div key={producto.id_producto} className={styles.productoCard}>
                                <h5>{producto.nombre}</h5>
                                <p>Precio: ${Number(producto.precio_venta).toLocaleString('es-AR')}</p>
                                <p>Stock: {producto.stock}</p>
                                <p>En oferta: {producto.en_oferta ? '✅ Sí' : '❌ No'}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OfertasTest;
