import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pdf } from '@react-pdf/renderer';
import { useNotification } from '../../../contexts/NotificationContext';
import { FacturaPDF } from './FacturaPDF';
import carritoService from '../../../services/carritoService';
import LoadingSpinner from '../../common/LoadingSpinner';
import styles from './MisCompras.module.css';

interface ItemVenta {
  nombre_producto: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface DireccionEnvio {
  calle: string;
  numero: string;
  piso: string | null;
  departamento: string | null;
  barrio: string;
  ciudad: string;
  provincia: string;
}

interface EnvioInfo {
  tipo_entrega: 'envio' | 'retiro_en_tienda';
  estado_envio: string;
  fyh_despacho: string | null;
  direccion_envio: DireccionEnvio | null;
}

interface Venta {
  id_venta: number;
  numero_venta: string;
  fecha_venta: string;
  total: number;
  estado: 'completada' | 'cancelada' | 'pendiente';
  metodo_pago: string | null;
  moneda: string;
  valor_dolar: number | null;
  estado_reembolso: 'sin_reembolso' | 'pendiente' | 'procesado' | 'rechazado' | null;
  envio: EnvioInfo | null;
  cancelacion: { motivo: string | null; fecha_cancelacion: string } | null;
  items: ItemVenta[];
}

const METODOS_PAGO: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  qr: 'QR',
};

const ESTADOS_REEMBOLSO: Record<string, string> = {
  pendiente: 'Reembolso pendiente',
  procesado: 'Reembolso procesado',
  rechazado: 'Reembolso rechazado',
};

function getBadgeEstado(estado: Venta['estado']): { clase: string; label: string } {
  switch (estado) {
    case 'completada':
      return { clase: styles.estadoCompletada, label: 'Completada' };
    case 'cancelada':
      return { clase: styles.estadoCancelada, label: 'Cancelada' };
    case 'pendiente':
      return { clase: styles.estadoPendiente, label: 'Pendiente' };
    default:
      return { clase: styles.estadoPendiente, label: estado };
  }
}

const MisCompras = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [expandedVenta, setExpandedVenta] = useState<number | null>(null);
  const [descargandoPDF, setDescargandoPDF] = useState<number | null>(null);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    cargarHistorial();
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  const cargarHistorial = async () => {
    try {
      setLoading(true);
      const data = await carritoService.obtenerHistorial();
      setVentas(data || []);
    } catch (error: any) {
      showNotification('Error al cargar historial de compras', 'error');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatearPrecio = (precio: number, moneda = 'ARS') =>
    `${moneda} ${precio.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const toggleExpand = (idVenta: number) => {
    setExpandedVenta(expandedVenta === idVenta ? null : idVenta);
  };

  const handleDescargarPDF = async (venta: Venta) => {
    setDescargandoPDF(venta.id_venta);
    try {
      const detalle = await carritoService.obtenerDetalleVenta(venta.id_venta);
      const blob = await pdf(<FacturaPDF venta={detalle} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura-${venta.numero_venta}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showNotification('Error al generar la factura', 'error');
    } finally {
      setDescargandoPDF(null);
    }
  };

  const formatearDireccion = (dir: DireccionEnvio) => {
    const linea1 = `${dir.calle} ${dir.numero}${dir.piso ? `, Piso ${dir.piso}` : ''}${dir.departamento ? ` Dpto. ${dir.departamento}` : ''}`;
    const linea2 = `${dir.barrio}, ${dir.ciudad}, ${dir.provincia}`;
    return { linea1, linea2 };
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
          <button onClick={() => navigate('/productos')} className={styles.btnPrimary}>
            <span className="material-icons">store</span>
            Ver Productos
          </button>
        </div>
      </div>
    );
  }

  const totalCompras = ventas.length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Mis Compras</h2>
        <p className={styles.subtitle}>{totalCompras} compra(s) realizadas</p>
      </div>

      {/* Lista de ventas */}
      <div className={styles.ventasList}>
        {ventas.map((venta) => {
          const badge = getBadgeEstado(venta.estado);
          return (
            <div key={venta.id_venta} className={styles.ventaCard}>
              <div className={styles.ventaHeader} onClick={() => toggleExpand(venta.id_venta)}>
                <div className={styles.ventaInfo}>
                  <div className={styles.ventaNumeroRow}>
                    <h3 className={styles.ventaNumero}>#{venta.numero_venta}</h3>
                    <span className={`${styles.estadoBadge} ${badge.clase}`}>{badge.label}</span>
                  </div>
                  <p className={styles.ventaFecha}>{formatearFecha(venta.fecha_venta)}</p>
                  {venta.metodo_pago && (
                    <p className={styles.ventaMetodo}>
                      <span className="material-icons">payment</span>
                      {METODOS_PAGO[venta.metodo_pago] || venta.metodo_pago}
                    </p>
                  )}
                </div>
                <div className={styles.ventaTotal}>
                  <p className={styles.totalLabel}>Total</p>
                  <p className={styles.totalValue}>{formatearPrecio(venta.total, venta.moneda)}</p>
                </div>
                <div className={styles.ventaActions}>
                  <button
                    className={styles.pdfBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDescargarPDF(venta);
                    }}
                    disabled={descargandoPDF === venta.id_venta}
                    title="Descargar factura PDF"
                  >
                    <span className="material-icons">
                      {descargandoPDF === venta.id_venta ? 'hourglass_empty' : 'picture_as_pdf'}
                    </span>
                  </button>
                  <button className={styles.expandBtn}>
                    <span className="material-icons">
                      {expandedVenta === venta.id_venta ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                </div>
              </div>

              {expandedVenta === venta.id_venta && (
                <div className={styles.ventaDetails}>
                  {/* Productos */}
                  <h4>Productos:</h4>
                  <div className={styles.itemsList}>
                    {venta.items.map((item, idx) => (
                      <div key={idx} className={styles.item}>
                        <div className={styles.itemInfo}>
                          <p className={styles.itemName}>{item.nombre_producto}</p>
                          <p className={styles.itemCantidad}>Cantidad: {item.cantidad}</p>
                        </div>
                        <div className={styles.itemPrecios}>
                          <p className={styles.itemPrecio}>{formatearPrecio(item.precio_unitario, venta.moneda)} c/u</p>
                          <p className={styles.itemSubtotal}>
                            Subtotal: {formatearPrecio(item.subtotal, venta.moneda)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Tipo de entrega */}
                  {venta.envio && (
                    <div className={styles.entregaInfo}>
                      <span className="material-icons">
                        {venta.envio.tipo_entrega === 'envio' ? 'local_shipping' : 'store'}
                      </span>
                      <span>{venta.envio.tipo_entrega === 'envio' ? 'Envío a domicilio' : 'Retiro en tienda'}</span>
                    </div>
                  )}

                  {/* Dirección de envío */}
                  {venta.envio?.tipo_entrega === 'envio' &&
                    venta.envio.direccion_envio &&
                    (() => {
                      const { linea1, linea2 } = formatearDireccion(venta.envio.direccion_envio);
                      return (
                        <div className={styles.direccionBox}>
                          <p className={styles.direccionLinea}>{linea1}</p>
                          <p className={styles.direccionLinea}>{linea2}</p>
                        </div>
                      );
                    })()}

                  {/* Fecha de despacho */}
                  {venta.envio?.fyh_despacho && (
                    <div className={styles.despachoRow}>
                      <span className="material-icons">local_shipping</span>
                      <span>Despachado el: {formatearFecha(venta.envio.fyh_despacho)}</span>
                    </div>
                  )}

                  {/* Estado de reembolso */}
                  {venta.estado_reembolso && venta.estado_reembolso !== 'sin_reembolso' && (
                    <div className={styles.reembolsoRow}>
                      <span className="material-icons">currency_exchange</span>
                      <span>{ESTADOS_REEMBOLSO[venta.estado_reembolso] || venta.estado_reembolso}</span>
                    </div>
                  )}

                  {/* Sección de cancelación */}
                  {venta.estado === 'cancelada' && venta.cancelacion && (
                    <div className={styles.cancelacionBox}>
                      <p className={styles.cancelacionTitulo}>
                        <span className="material-icons">cancel</span>
                        Pedido cancelado
                      </p>
                      <p className={styles.cancelacionFecha}>
                        Fecha: {formatearFecha(venta.cancelacion.fecha_cancelacion)}
                      </p>
                      {venta.cancelacion.motivo && (
                        <p className={styles.cancelacionMotivo}>Motivo: {venta.cancelacion.motivo}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MisCompras;
