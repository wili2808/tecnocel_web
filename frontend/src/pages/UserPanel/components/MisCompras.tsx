/**
 * Componente MisCompras - Muestra el historial de compras del usuario
 * Lista de ventas realizadas con detalles expandibles
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../../contexts/NotificationContext';
import { CarritoService } from '../../../services/carritoService';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import styles from './MisCompras.module.css';

interface ItemVenta {
    nombre_producto: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
}

interface Venta {
    id_venta: number;
    numero_venta: string;
    fecha_venta: string;
    total: number;
    estado: string;
    items: ItemVenta[];
}

const MisCompras = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [loading, setLoading] = useState(true);
    const [ventas, setVentas] = useState<Venta[]>([]);
    const [expandedVenta, setExpandedVenta] = useState<number | null>(null);

    useEffect(() => {
        cargarHistorial();
    }, []);

    const cargarHistorial = async () => {
        try {
            setLoading(true);
            const data = await CarritoService.obtenerHistorial();
            setVentas(data || []);
        } catch (error: any) {
            showNotification('Error al cargar historial de compras', 'error');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatearFecha = (fecha: string) => {
        return new Date(fecha).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatearPrecio = (precio: number) => {
        return `Bs. ${precio.toFixed(2)}`;
    };

    const toggleExpand = (idVenta: number) => {
        setExpandedVenta(expandedVenta === idVenta ? null : idVenta);
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <LoadingSpinner />
            </div>
        );
    }

    if (ventas.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Mis Compras</h2>
                    <p className={styles.subtitle}>Historial de compras realizadas</p>
                </div>

                <div className={styles.emptyState}>
                    <span className="material-icons">shopping_bag</span>
                    <h3>No hay compras registradas</h3>
                    <p>Cuando realices tu primera compra, aparecerá aquí</p>
                    <button
                        onClick={() => navigate('/productos')}
                        className={styles.btnPrimary}
                    >
                        <span className="material-icons">store</span>
                        Ver Productos
                    </button>
                </div>
            </div>
        );
    }

    // Calcular estadísticas
    const totalCompras = ventas.length;
    const totalGastado = ventas.reduce((sum, venta) => sum + venta.total, 0);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2 className={styles.title}>Mis Compras</h2>
                <p className={styles.subtitle}>{totalCompras} compra(s) realizadas</p>
            </div>

            {/* Estadísticas */}
            <div className={styles.stats}>
                <div className={styles.statCard}>
                    <span className="material-icons">shopping_cart</span>
                    <div>
                        <p className={styles.statValue}>{totalCompras}</p>
                        <p className={styles.statLabel}>Compras</p>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <span className="material-icons">payments</span>
                    <div>
                        <p className={styles.statValue}>{formatearPrecio(totalGastado)}</p>
                        <p className={styles.statLabel}>Total Gastado</p>
                    </div>
                </div>
            </div>

            {/* Lista de ventas */}
            <div className={styles.ventasList}>
                {ventas.map((venta) => (
                    <div key={venta.id_venta} className={styles.ventaCard}>
                        <div
                            className={styles.ventaHeader}
                            onClick={() => toggleExpand(venta.id_venta)}
                        >
                            <div className={styles.ventaInfo}>
                                <h3 className={styles.ventaNumero}>#{venta.numero_venta}</h3>
                                <p className={styles.ventaFecha}>
                                    {formatearFecha(venta.fecha_venta)}
                                </p>
                            </div>
                            <div className={styles.ventaTotal}>
                                <p className={styles.totalLabel}>Total</p>
                                <p className={styles.totalValue}>{formatearPrecio(venta.total)}</p>
                            </div>
                            <button className={styles.expandBtn}>
                                <span className="material-icons">
                                    {expandedVenta === venta.id_venta
                                        ? 'expand_less'
                                        : 'expand_more'}
                                </span>
                            </button>
                        </div>

                        {expandedVenta === venta.id_venta && (
                            <div className={styles.ventaDetails}>
                                <h4>Productos:</h4>
                                <div className={styles.itemsList}>
                                    {venta.items.map((item, idx) => (
                                        <div key={idx} className={styles.item}>
                                            <div className={styles.itemInfo}>
                                                <p className={styles.itemName}>
                                                    {item.nombre_producto}
                                                </p>
                                                <p className={styles.itemCantidad}>
                                                    Cantidad: {item.cantidad}
                                                </p>
                                            </div>
                                            <div className={styles.itemPrecios}>
                                                <p className={styles.itemPrecio}>
                                                    {formatearPrecio(item.precio_unitario)} c/u
                                                </p>
                                                <p className={styles.itemSubtotal}>
                                                    Subtotal: {formatearPrecio(item.subtotal)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MisCompras;
