import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { pdf } from '@react-pdf/renderer';
import { LazyMotion, domAnimation, m, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNotification } from '../../../contexts/NotificationContext';
import { FacturaPDF } from './FacturaPDF';
import carritoService from '../../../services/carritoService';
import LoadingSpinner from '../../common/LoadingSpinner';
import styles from './MisCompras.module.css';

interface ItemVenta {
  id_producto: number | null;
  nombre_producto: string;
  imagen_url: string | null;
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
  fecha_despacho: string | null;
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

const ESTADOS_ENVIO_ORDER: Record<string, number> = {
  pendiente: 0,
  en_preparacion: 1,
  en_camino: 2,
  entregado: 3,
};

const timelineSteps = [
  { key: 'pendiente', label: 'Pendiente' },
  { key: 'en_preparacion', label: 'Preparación' },
  { key: 'en_camino', label: 'Envío' },
  { key: 'entregado', label: 'Entregado' },
];

const DEFAULT_IMG = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHJ4PSI0IiBmaWxsPSIjZTVlN2ViIi8+PHBhdGggZD0iTTE0IDI2VjE0bDEyIDZMMTQgMjZ6IiBmaWxsPSIjOWNhM2FmIi8+PC9zdmc+';

const IMG_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

const MisCompras = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [expandedVenta, setExpandedVenta] = useState<number | null>(null);
  const [descargandoPDF, setDescargandoPDF] = useState<number | null>(null);
  const shouldReduceMotion = useReducedMotion();

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
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
    cargarHistorial();
  }, []);

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

  const getImgUrl = (url: string | null) => {
    if (!url) return DEFAULT_IMG;
    if (url.startsWith('http')) return url;
    return `${IMG_BASE}${url}`;
  };

  const totalGastado = ventas
    .filter(v => v.estado !== 'cancelada')
    .reduce((sum, v) => sum + v.total, 0);

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

  const motionProps = shouldReduceMotion ? {
    initial: false as const,
    animate: true as const,
  } : {};

  return (
    <LazyMotion features={domAnimation}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Mis Compras</h2>
          <p className={styles.subtitle}>{totalCompras} compra(s) realizadas</p>
        </div>

        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className="material-icons">shopping_bag</span>
            <div>
              <p className={styles.statValue}>{totalCompras}</p>
              <p className={styles.statLabel}>Total de compras</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className="material-icons">payments</span>
            <div>
              <p className={styles.statValue}>{formatearPrecio(totalGastado)}</p>
              <p className={styles.statLabel}>Total gastado</p>
            </div>
          </div>
        </div>

        <m.div
          className={styles.ventasList}
          variants={shouldReduceMotion ? undefined : {
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.08 }
            }
          }}
          initial={shouldReduceMotion ? false : 'hidden'}
          animate={shouldReduceMotion ? undefined : 'visible'}
          {...motionProps}
        >
          <AnimatePresence mode="popLayout">
            {ventas.map((venta) => {
              const badge = getBadgeEstado(venta.estado);
              return (
                <m.div
                  key={venta.id_venta}
                  className={styles.ventaCard}
                  variants={shouldReduceMotion ? undefined : {
                    hidden: { opacity: 0, y: 16, scale: 0.98 },
                    visible: {
                      opacity: 1, y: 0, scale: 1,
                      transition: { type: 'spring', stiffness: 280, damping: 22 }
                    },
                    exit: {
                      opacity: 0, y: -12, scale: 0.97,
                      transition: { duration: 0.2, ease: 'easeIn' }
                    }
                  }}
                  layout
                >
                  <div className={styles.ventaHeader} onClick={() => toggleExpand(venta.id_venta)}>
                    <div className={styles.ventaHeaderLeft}>
                      <div className={styles.ventaNumeroRow}>
                        <h3 className={styles.ventaNumero}>#{venta.numero_venta}</h3>
                        <span className={`${styles.estadoBadge} ${badge.clase}`}>{badge.label}</span>
                      </div>
                      <p className={styles.ventaFecha}>
                        <span className="material-icons">calendar_today</span>
                        {formatearFecha(venta.fecha_venta)}
                      </p>
                      <p className={styles.ventaItemsCount}>
                        <span className="material-icons">inventory_2</span>
                        {venta.items.length} producto(s)
                      </p>
                      {venta.metodo_pago && (
                        <span className={styles.pagoBadge}>
                          <span className="material-icons">payment</span>
                          {METODOS_PAGO[venta.metodo_pago] || venta.metodo_pago}
                        </span>
                      )}
                    </div>
                    <div className={styles.ventaHeaderRight}>
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
                        <m.button
                          className={styles.expandBtn}
                          animate={shouldReduceMotion ? {} : { rotate: expandedVenta === venta.id_venta ? 180 : 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                        >
                          <span className="material-icons">expand_more</span>
                        </m.button>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedVenta === venta.id_venta && (
                      <m.div
                        className={styles.ventaDetails}
                        initial={shouldReduceMotion ? false : { opacity: 0, height: 0 }}
                        animate={shouldReduceMotion ? undefined : { opacity: 1, height: 'auto' }}
                        exit={shouldReduceMotion ? undefined : { opacity: 0, height: 0 }}
                        transition={{ duration: 0.28, ease: 'easeInOut' }}
                        style={shouldReduceMotion ? {} : { overflow: 'hidden' }}
                      >
                        {/* Productos */}
                        <h4 className={styles.detailsTitle}>
                          <span className="material-icons">inventory_2</span>
                          Productos
                        </h4>
                        <div className={styles.itemsList}>
                          {venta.items.map((item, idx) => (
                            <Link
                              key={idx}
                              to={item.id_producto ? `/productos/${item.id_producto}` : '#'}
                              className={styles.itemLink}
                              onClick={(e) => item.id_producto === null && e.preventDefault()}
                            >
                              <div className={styles.item}>
                                <div className={styles.itemThumb}>
                                  <img
                                    src={getImgUrl(item.imagen_url)}
                                    alt={item.nombre_producto}
                                    loading="lazy"
                                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMG; }}
                                  />
                                </div>
                                <div className={styles.itemInfo}>
                                  <p className={styles.itemName}>{item.nombre_producto}</p>
                                  <p className={styles.itemMeta}>
                                    Cantidad: {item.cantidad} &middot; {formatearPrecio(item.precio_unitario, venta.moneda)} c/u
                                  </p>
                                </div>
                                <div className={styles.itemSubtotal}>
                                  {formatearPrecio(item.subtotal, venta.moneda)}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>

                        {/* Timeline de entrega / Estado del retiro */}
                        {venta.envio && venta.estado !== 'cancelada' && (() => {
                          const esEnvio = venta.envio!.tipo_entrega === 'envio';
                          const estadoEnvio = venta.envio!.estado_envio;

                          if (esEnvio) {
                            return (
                              <div className={styles.timelineSection}>
                                <h4 className={styles.detailsTitle}>
                                  <span className="material-icons">local_shipping</span>
                                  Estado del envío
                                </h4>
                                <div className={styles.timeline}>
                                  {timelineSteps.map((step, idx) => {
                                    const currentOrder = ESTADOS_ENVIO_ORDER[estadoEnvio] ?? -1;
                                    const stepOrder = ESTADOS_ENVIO_ORDER[step.key] ?? -1;
                                    const isCompleted = currentOrder >= stepOrder;
                                    const isCurrent = step.key === estadoEnvio;
                                    return (
                                      <div key={step.key} className={`${styles.timelineStep} ${isCompleted ? styles.timelineCompleted : ''} ${isCurrent ? styles.timelineCurrent : ''}`}>
                                        <div className={styles.timelineDot}>
                                          {isCompleted ? (
                                            <span className="material-icons">check_circle</span>
                                          ) : (
                                            <span className="material-icons">radio_button_unchecked</span>
                                          )}
                                        </div>
                                        <span className={styles.timelineLabel}>{step.label}</span>
                                        {idx < timelineSteps.length - 1 && (
                                          <div className={`${styles.timelineConnector} ${isCompleted ? styles.timelineConnectorActive : ''}`} />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          }

                          const entregado = estadoEnvio === 'entregado';

                          return (
                            <div className={`${styles.retiroCard} ${entregado ? styles.retiroEntregado : styles.retiroListo}`}>
                              <span className="material-icons">{entregado ? 'check_circle' : 'storefront'}</span>
                              <div>
                                <h4 className={styles.retiroTitle}>Retiro en el local</h4>
                                <p className={styles.retiroMsg}>
                                  {entregado ? '¡Compra entregada! Gracias por tu compra.' : 'Tu pedido está listo para retirar. Te esperamos en el local.'}
                                </p>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Dirección de envío */}
                        {venta.envio?.tipo_entrega === 'envio' && venta.envio.direccion_envio && (
                          <div className={styles.infoBlock}>
                            <h4 className={styles.detailsTitle}>
                              <span className="material-icons">location_on</span>
                              Dirección de envío
                            </h4>
                            <div className={styles.direccionBox}>
                              {(() => {
                                const { linea1, linea2 } = formatearDireccion(venta.envio!.direccion_envio!);
                                return (
                                  <>
                                    <p className={styles.direccionLinea}>{linea1}</p>
                                    <p className={styles.direccionLinea}>{linea2}</p>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        )}

                        {/* Fecha de despacho */}
                        {venta.envio?.fecha_despacho && (
                          <div className={styles.infoRow}>
                            <span className="material-icons">check_circle</span>
                            <span>Despachado el: {formatearFecha(venta.envio.fecha_despacho)}</span>
                          </div>
                        )}

                        {/* Reembolso */}
                        {venta.estado_reembolso && venta.estado_reembolso !== 'sin_reembolso' && (
                          <div className={`${styles.infoRow} ${styles.reembolsoRow}`}>
                            <span className="material-icons">currency_exchange</span>
                            <span>{ESTADOS_REEMBOLSO[venta.estado_reembolso] || venta.estado_reembolso}</span>
                          </div>
                        )}

                        {/* Cancelación */}
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
                      </m.div>
                    )}
                  </AnimatePresence>
                </m.div>
              );
            })}
          </AnimatePresence>
        </m.div>
      </div>
    </LazyMotion>
  );
};

export default MisCompras;
