/**
 * @file DetalleVentaModal.tsx
 *
 * Modal para ver el detalle completo de una venta.
 * Muestra información del cliente, metadatos de la venta, tabla de items,
 * y (si está cancelada) los datos de cancelación con motivo y responsable.
 * El botón "Cancelar Venta" se muestra a admin (rol 1) y vendedor (rol 3)
 * cuando el estado es 'completada'. Abre CancelacionModal para pedir el motivo.
 */

import React, { useEffect, useState } from 'react';
import styles from './GestionVentas.module.css';
import CancelacionModal from './CancelacionModal';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { ventaAdminService } from '../../../services/ventaAdminService';
import type { VentaDetalle } from '../../../types/venta';

interface DetalleVentaModalProps {
  idVenta: number;
  onClose: () => void;
  /** Llamado después de cancelar exitosamente, para que el padre refresque la tabla */
  onCancelada?: () => void;
}

const DetalleVentaModal: React.FC<DetalleVentaModalProps> = ({ idVenta, onClose, onCancelada }) => {
  const { tienePermiso } = useAuth();
  const { showNotification } = useNotification();

  const puedeDescargarPdf = tienePermiso('descargar_pdf_venta');
  const puedeEnviarEmail = tienePermiso('enviar_email_venta');

  const [detalle, setDetalle] = useState<VentaDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [mostrarCancelacionModal, setMostrarCancelacionModal] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // ── Cargar detalle ─────────────────────────────────────────────────────────

  useEffect(() => {
    let activo = true;

    const cargar = async () => {
      setCargando(true);
      try {
        const data = await ventaAdminService.obtenerDetalle(idVenta);
        if (activo) setDetalle(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al cargar el detalle';
        if (activo) showNotification(message, 'error');
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargar();
    return () => {
      activo = false;
    };
  }, [idVenta, showNotification]);

  // ── Cerrar con Escape ──────────────────────────────────────────────────────

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !mostrarCancelacionModal) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, mostrarCancelacionModal]);

  // ── Acciones de comprobante ────────────────────────────────────────────────

  const handleDescargar = async () => {
    if (!detalle) return;
    if (!puedeDescargarPdf) {
      showNotification('No tienes permisos para descargar el comprobante', 'error');
      return;
    }
    setDescargando(true);
    try {
      await ventaAdminService.descargarComprobante(detalle.id_venta, detalle.nro_venta);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al descargar el comprobante';
      showNotification(message, 'error');
    } finally {
      setDescargando(false);
    }
  };

  const handleEnviarEmail = async () => {
    if (!detalle) return;
    if (!puedeEnviarEmail) {
      showNotification('No tienes permisos para enviar el comprobante', 'error');
      return;
    }
    setEnviando(true);
    try {
      const result = await ventaAdminService.enviarComprobante(detalle.id_venta);
      showNotification(result.mensaje, 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al enviar el comprobante';
      showNotification(message, 'error');
    } finally {
      setEnviando(false);
    }
  };

  // ── Helpers de formato ─────────────────────────────────────────────────────

  const formatFecha = (iso: string) =>
    new Date(iso).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatMonto = (n: number) =>
    `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getBadgeEstado = (estado: VentaDetalle['estado']) => {
    const map: Record<string, string> = {
      completada: styles.badgeCompletada,
      cancelada: styles.badgeCancelada,
      pendiente: styles.badgePendiente,
    };
    return map[estado] || '';
  };

  const getBadgeTipo = (tipo: VentaDetalle['tipo_venta']) => (tipo === 'web' ? styles.badgeWeb : styles.badgeManual);

  // ── Render ─────────────────────────────────────────────────────────────────

  const total = detalle?.items.reduce((s, i) => s + i.subtotal, 0) ?? 0;
  const puedeCancelar = tienePermiso('cancelar_venta') && detalle?.estado === 'completada';

  return (
    <>
      <div
        className={styles.modalOverlay}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className={styles.modal}>
          {/* Encabezado */}
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>
              <span className="material-icons">receipt_long</span>
              {detalle ? detalle.nro_venta : `Venta #${idVenta}`}
              {detalle && (
                <span className={styles.modalHeaderBadges}>
                  <span className={`${styles.badge} ${getBadgeTipo(detalle.tipo_venta)}`}>
                    {ventaAdminService.formatearTipoVenta(detalle.tipo_venta)}
                  </span>
                  <span className={`${styles.badge} ${getBadgeEstado(detalle.estado)}`}>
                    {ventaAdminService.formatearEstado(detalle.estado)}
                  </span>
                </span>
              )}
            </h2>
            <button className={styles.closeButton} onClick={onClose} title="Cerrar">
              <span className="material-icons">close</span>
            </button>
          </div>

          {/* Cuerpo */}
          <div className={styles.modalBody}>
            {cargando ? (
              <div className={styles.loading}>
                <span className="material-icons">hourglass_empty</span>
                Cargando detalle...
              </div>
            ) : !detalle ? (
              <div className={styles.error}>
                <span className="material-icons">error_outline</span>
                No se pudo cargar el detalle de la venta.
              </div>
            ) : (
              <>
                {/* Grilla info */}
                <div className={styles.detalleGrid}>
                  {/* Columna izq: cliente */}
                  <div className={styles.detalleSection}>
                    <p className={styles.detalleSectionTitle}>Cliente</p>
                    {detalle.cliente ? (
                      <>
                        <div className={styles.detalleRow}>
                          <span className={styles.detalleRowLabel}>Nombre</span>
                          <span className={styles.detalleRowValue}>
                            {detalle.cliente.nombre_cliente} {detalle.cliente.apellido_cliente}
                          </span>
                        </div>
                        <div className={styles.detalleRow}>
                          <span className={styles.detalleRowLabel}>Correo</span>
                          <span className={styles.detalleRowValue}>{detalle.cliente.correo}</span>
                        </div>
                      </>
                    ) : (
                      <div className={styles.detalleRow}>
                        <span className={styles.detalleRowLabel}>—</span>
                        <span className={`${styles.detalleRowValue} ${styles.sinCliente}`}>
                          Venta de mostrador (sin cliente registrado)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Columna der: metadatos */}
                  <div className={styles.detalleSection}>
                    <p className={styles.detalleSectionTitle}>Datos de la venta</p>
                    <div className={styles.detalleRow}>
                      <span className={styles.detalleRowLabel}>Fecha</span>
                      <span className={styles.detalleRowValue}>{formatFecha(detalle.fyh_creacion)}</span>
                    </div>
                    <div className={styles.detalleRow}>
                      <span className={styles.detalleRowLabel}>Método pago</span>
                      <span className={styles.detalleRowValue}>
                        {ventaAdminService.formatearMetodoPago(detalle.metodo_pago)}
                      </span>
                    </div>
                    <div className={styles.detalleRow}>
                      <span className={styles.detalleRowLabel}>Moneda</span>
                      <span className={styles.detalleRowValue}>{detalle.moneda || 'ARS'}</span>
                    </div>
                    {detalle.envio?.fyh_despacho && (
                      <div className={styles.detalleRow}>
                        <span className={styles.detalleRowLabel}>Despachado</span>
                        <span className={styles.detalleRowValue}>{formatFecha(detalle.envio.fyh_despacho)}</span>
                      </div>
                    )}
                    {detalle.envio && (
                      <div className={styles.detalleRow}>
                        <span className={styles.detalleRowLabel}>Entrega</span>
                        <span className={styles.detalleRowValue}>
                          {detalle.envio.tipo_entrega === 'envio' ? 'Envío a domicilio' : 'Retiro en tienda'}
                        </span>
                      </div>
                    )}
                    {detalle.estado_reembolso && (
                      <div className={styles.detalleRow}>
                        <span className={styles.detalleRowLabel}>Reembolso</span>
                        <span className={styles.detalleRowValue} style={{ textTransform: 'capitalize' }}>
                          {detalle.estado_reembolso.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                    {detalle.vendedor && (
                      <div className={styles.detalleRow}>
                        <span className={styles.detalleRowLabel}>Vendedor</span>
                        <span className={styles.detalleRowValue}>{detalle.vendedor.nombres}</span>
                      </div>
                    )}
                    {detalle.observaciones && (
                      <div className={styles.detalleRow}>
                        <span className={styles.detalleRowLabel}>Observaciones</span>
                        <span className={`${styles.detalleRowValue} ${styles.detalleObservaciones}`}>
                          {detalle.observaciones}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sección de cancelación (solo si fue cancelada) */}
                {detalle.estado === 'cancelada' && detalle.cancelacion && (
                  <div className={styles.contenedorDetalleCancelacion}>
                    <p className={styles.tituloCancelacion}>
                      <span className="material-icons" style={{ fontSize: '18px' }}>
                        cancel
                      </span>
                      Cancelación
                    </p>
                    <div className={styles.detalleRow}>
                      <span className={styles.detalleRowLabel}>Cancelado el</span>
                      <span className={styles.detalleRowValue}>{formatFecha(detalle.cancelacion.fyh_cancelacion)}</span>
                    </div>
                    {detalle.cancelacion.cancelado_por && (
                      <div className={styles.detalleRow}>
                        <span className={styles.detalleRowLabel}>Por</span>
                        <span className={styles.detalleRowValue}>{detalle.cancelacion.cancelado_por}</span>
                      </div>
                    )}
                    {detalle.cancelacion.motivo && (
                      <div className={styles.detalleRow}>
                        <span className={styles.detalleRowLabel}>Motivo</span>
                        <span className={`${styles.detalleRowValue} ${styles.detalleObservaciones}`}>
                          {detalle.cancelacion.motivo}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Tabla de items */}
                <p className={styles.itemsTitle}>Productos ({detalle.items.length})</p>
                <table className={styles.itemsTable}>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Código</th>
                      <th className={styles.textRight}>Cant.</th>
                      <th className={styles.textRight}>Precio unit.</th>
                      <th className={styles.textRight}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalle.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.nombre_producto}</td>
                        <td>{item.codigo || '—'}</td>
                        <td className={styles.textRight}>{item.cantidad}</td>
                        <td className={styles.textRight}>{formatMonto(item.precio_unitario)}</td>
                        <td className={styles.textRight}>{formatMonto(item.subtotal)}</td>
                      </tr>
                    ))}
                    <tr className={styles.totalRow}>
                      <td colSpan={4}>Total</td>
                      <td className={styles.textRight}>{formatMonto(total)}</td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}
          </div>

          {/* Pie */}
          <div className={`${styles.modalFooter} ${puedeCancelar ? styles.modalFooterLeft : ''}`}>
            <button 
              className={styles.dangerButton} 
              onClick={() => setMostrarCancelacionModal(true)}
              disabled={!puedeCancelar || detalle?.estado === 'cancelada'}
              title={!puedeCancelar ? 'Sin permisos para cancelar ventas' : detalle?.estado === 'cancelada' ? 'La venta ya está cancelada' : 'Cancelar venta'}
            >
              <span className="material-icons">cancel</span>
              Cancelar Venta
            </button>
            <div className={styles.modalFooterActions}>
              {detalle && !cargando && (
                <>
                  <button
                    className={styles.comprobanteButton}
                    onClick={handleDescargar}
                    disabled={descargando || detalle.estado === 'cancelada' || !puedeDescargarPdf}
                    title={!puedeDescargarPdf ? 'Sin permisos para descargar PDF' : detalle.estado === 'cancelada' ? 'No se puede descargar PDF de una venta cancelada' : 'Descargar comprobante en PDF'}
                  >
                    <span className="material-icons">
                      {descargando ? 'hourglass_empty' : 'download'}
                    </span>
                    {descargando ? 'Descargando...' : 'Descargar PDF'}
                  </button>
                  {detalle.cliente?.correo && (
                    <button
                      className={styles.comprobanteButton}
                      onClick={handleEnviarEmail}
                      disabled={enviando || detalle.estado === 'cancelada' || !puedeEnviarEmail}
                      title={!puedeEnviarEmail ? 'Sin permisos para enviar email' : detalle.estado === 'cancelada' ? 'No se puede enviar email de una venta cancelada' : `Enviar comprobante a ${detalle.cliente.correo}`}
                    >
                      <span className="material-icons">
                        {enviando ? 'hourglass_empty' : 'email'}
                      </span>
                      {enviando ? 'Enviando...' : 'Enviar email'}
                    </button>
                  )}
                </>
              )}
              <button className={styles.cancelButton} onClick={onClose}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de cancelación con motivo */}
      {mostrarCancelacionModal && detalle && (
        <CancelacionModal
          idVenta={detalle.id_venta}
          nroVenta={detalle.nro_venta}
          onClose={() => setMostrarCancelacionModal(false)}
          onCancelada={() => {
            setMostrarCancelacionModal(false);
            onCancelada?.();
            onClose();
          }}
        />
      )}
    </>
  );
};

export default DetalleVentaModal;
