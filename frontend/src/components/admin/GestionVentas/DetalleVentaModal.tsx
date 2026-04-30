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
import adminVentaService from '../../../services/adminVentaService';
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
        const data = await adminVentaService.obtenerDetalle(idVenta);
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
      await adminVentaService.descargarComprobante(detalle.id_venta, detalle.nro_venta);
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
      const result = await adminVentaService.enviarComprobante(detalle.id_venta);
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
      <div className="modalOverlayPremium" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="modalPremium">
          
          {/* Header Premium */}
          <div className="modalHeaderPremium">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.5px' }}>Documento de Venta</span>
              <h2 className="modalTitlePremium" style={{ fontSize: '24px', color: 'var(--color-primary)' }}>
                {detalle ? detalle.nro_venta : `Venta #${idVenta}`}
                {detalle && (
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                    <span className={`${styles.badge} ${getBadgeTipo(detalle.tipo_venta)}`} style={{ margin: 0 }}>
                      {adminVentaService.formatearTipoVenta(detalle.tipo_venta)}
                    </span>
                    <span className={`${styles.badge} ${getBadgeEstado(detalle.estado)}`} style={{ margin: 0 }}>
                      {adminVentaService.formatearEstado(detalle.estado)}
                    </span>
                  </div>
                )}
              </h2>
            </div>
            <button className="closeButtonPremium" onClick={onClose} title="Cerrar">
              <span className="material-icons">close</span>
            </button>
          </div>

          {/* Body Premium */}
          <div className="modalBodyPremium">
            {cargando ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <span className="material-icons" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>hourglass_empty</span>
                <p>Cargando información detallada de la venta...</p>
              </div>
            ) : !detalle ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--color-error)' }}>
                <span className="material-icons" style={{ fontSize: '48px', marginBottom: '16px' }}>error_outline</span>
                <p>No se pudo recuperar el detalle de la venta.</p>
              </div>
            ) : (
              <>
                {/* Contexto de la Transacción */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', marginBottom: '32px' }}>
                  
                  {/* Bloque Cliente */}
                  <div style={{ padding: '20px', background: 'var(--background-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <span className={styles.sectionTitlePremium} style={{ marginBottom: '12px' }}>Información del Cliente</span>
                    {detalle.cliente ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div className={styles.detalleRowPremium}>
                          <span className={styles.detalleLabelPremium}>Nombre</span>
                          <span className={styles.detalleValuePremium}>{detalle.cliente.nombre_cliente} {detalle.cliente.apellido_cliente}</span>
                        </div>
                        <div className={styles.detalleRowPremium}>
                          <span className={styles.detalleLabelPremium}>Correo</span>
                          <span className={styles.detalleValuePremium} style={{ color: 'var(--color-primary)' }}>{detalle.cliente.correo}</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', padding: '8px 0' }}>
                        <span className="material-icons" style={{ fontSize: '20px' }}>storefront</span>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>Venta de mostrador (Sin registro)</span>
                      </div>
                    )}
                  </div>

                  {/* Bloque Metadatos */}
                  <div style={{ padding: '20px', background: 'var(--background-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <span className={styles.sectionTitlePremium} style={{ marginBottom: '12px' }}>Datos de la Operación</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div className={styles.detalleRowPremium}>
                        <span className={styles.detalleLabelPremium}>Fecha / Hora</span>
                        <span className={styles.detalleValuePremium}>{formatFecha(detalle.fyh_creacion)}</span>
                      </div>
                      <div className={styles.detalleRowPremium}>
                        <span className={styles.detalleLabelPremium}>Método de Pago</span>
                        <span className={styles.detalleValuePremium}>{detalle.metodo_pago}</span>
                      </div>
                      <div className={styles.detalleRowPremium}>
                        <span className={styles.detalleLabelPremium}>Moneda</span>
                        <span className={styles.detalleValuePremium}>ARS ($)</span>
                      </div>
                      <div className={styles.detalleRowPremium} style={{ gap: '16px' }}>
                        <span className={styles.detalleLabelPremium}>Tipo de Entrega</span>
                        <span className={styles.detalleValuePremium} style={{ textAlign: 'right' }}>{detalle.envio?.tipo_entrega || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info de Cancelación si aplica */}
                {detalle.estado === 'cancelada' && detalle.cancelacion && (
                  <div style={{ marginBottom: '32px', padding: '20px', background: 'var(--color-error-100)', borderRadius: '12px', border: '1px solid var(--color-error-200)' }}>
                    <span className={styles.sectionTitlePremium} style={{ color: 'var(--color-error)', marginBottom: '12px' }}>Registro de Cancelación</span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: 'var(--color-error)', opacity: 0.8 }}>RESPONSABLE</p>
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{detalle.cancelacion.cancelado_por || 'Sistema'}</p>
                        <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>{formatFecha(detalle.cancelacion.fyh_cancelacion)}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, color: 'var(--color-error)', opacity: 0.8 }}>MOTIVO</p>
                        <p style={{ margin: 0, fontSize: '13.5px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                          "{detalle.cancelacion.motivo || 'No especificado'}"
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tabla de Productos */}
                <div style={{ marginBottom: '24px' }}>
                  <span className={styles.sectionTitlePremium} style={{ marginBottom: '16px' }}>Detalle de Productos ({detalle.items.length})</span>
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                    <table className={styles.table} style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Código</th>
                          <th style={{ textAlign: 'right' }}>Cant.</th>
                          <th style={{ textAlign: 'right' }}>P. Unit.</th>
                          <th style={{ textAlign: 'right' }}>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detalle.items.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ fontWeight: 600 }}>{item.nombre_producto}</td>
                            <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.codigo || '—'}</td>
                            <td style={{ textAlign: 'right' }}>{item.cantidad}</td>
                            <td style={{ textAlign: 'right' }}>{formatMonto(item.precio_unitario)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>{formatMonto(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Resumen Total */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ padding: '16px 24px', background: 'var(--background-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'inline-block' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total de la Venta</span>
                      <span style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-1px' }}>{formatMonto(total)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer Premium Organizado */}
          <div className="modalFooterPremium">
            {puedeCancelar && (
              <button 
                className="btnPremium btnDangerPremium" 
                onClick={() => setMostrarCancelacionModal(true)}
                style={{ marginRight: 'auto' }}
              >
                <span className="material-icons">cancel</span>
                Anular Venta
              </button>
            )}

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {puedeDescargarPdf && (
                <button 
                  className="btnPremium btnOutlinePremium" 
                  onClick={handleDescargar}
                  disabled={descargando}
                >
                  <span className="material-icons">{descargando ? 'hourglass_empty' : 'file_download'}</span>
                  Comprobante PDF
                </button>
              )}

              {puedeEnviarEmail && (
                <button 
                  className="btnPremium btnOutlinePremium" 
                  onClick={handleEnviarEmail}
                  disabled={enviando}
                >
                  <span className="material-icons">{enviando ? 'hourglass_empty' : 'email'}</span>
                  Enviar al Cliente
                </button>
              )}

              <button className="btnPremium btnSecondaryPremium" onClick={onClose} style={{ minWidth: '100px' }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Cancelación */}
      {mostrarCancelacionModal && detalle && (
        <CancelacionModal
          idVenta={detalle.id_venta}
          nroVenta={detalle.nro_venta}
          onClose={() => setMostrarCancelacionModal(false)}
          onCancelada={() => {
            setMostrarCancelacionModal(false);
            if (onCancelada) onCancelada();
            onClose(); // Cerrar también el detalle
          }}
        />
      )}
    </>
  );
};

export default DetalleVentaModal;
