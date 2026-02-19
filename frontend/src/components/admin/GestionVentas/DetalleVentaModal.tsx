/**
 * @file DetalleVentaModal.tsx
 *
 * Modal para ver el detalle completo de una venta.
 * Muestra información del cliente, metadatos de la venta y tabla de items.
 * El botón "Cancelar Venta" solo se muestra a admin (rol 1) y si estado === 'completada'.
 */

import React, { useEffect, useState, useRef } from 'react';
import styles from './GestionVentas.module.css';
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
  const { isAdmin } = useAuth();
  const { showNotification } = useNotification();

  const [detalle, setDetalle] = useState<VentaDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [cancelando, setCancelando] = useState(false);
  const cancelandoRef = useRef(false);

  // ── Cargar detalle ─────────────────────────────────────────────────────────

  useEffect(() => {
    let activo = true;

    const cargar = async () => {
      setCargando(true);
      try {
        const data = await ventaAdminService.obtenerDetalle(idVenta);
        if (activo) setDetalle(data);
      } catch (err: any) {
        if (activo) showNotification(err.message || 'Error al cargar el detalle', 'error');
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargar();
    return () => { activo = false; };
  }, [idVenta]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cerrar con Escape ──────────────────────────────────────────────────────

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // ── Cancelar venta ─────────────────────────────────────────────────────────

  const handleCancelar = async () => {
    if (cancelandoRef.current) return;
    if (!window.confirm('¿Está seguro de cancelar esta venta? Se restaurará el stock de los productos.')) return;

    cancelandoRef.current = true;
    setCancelando(true);
    try {
      await ventaAdminService.cancelarVenta(idVenta);
      showNotification('Venta cancelada exitosamente', 'success');
      onCancelada?.();
      onClose();
    } catch (err: any) {
      showNotification(err.message || 'Error al cancelar la venta', 'error');
      cancelandoRef.current = false;
      setCancelando(false);
    }
  };

  // ── Helpers de formato ─────────────────────────────────────────────────────

  const formatFecha = (iso: string) =>
    new Date(iso).toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

  const formatMonto = (n: number) =>
    `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getBadgeEstado = (estado: VentaDetalle['estado']) => {
    const map: Record<string, string> = {
      completada: styles.badgeCompletada,
      cancelada:  styles.badgeCancelada,
      pendiente:  styles.badgePendiente
    };
    return map[estado] || '';
  };

  const getBadgeTipo = (tipo: VentaDetalle['tipo_venta']) =>
    tipo === 'web' ? styles.badgeWeb : styles.badgeManual;

  // ── Render ─────────────────────────────────────────────────────────────────

  const total = detalle?.items.reduce((s, i) => s + i.subtotal, 0) ?? 0;

  return (
    <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
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
        <div className={`${styles.modalFooter} ${isAdmin && detalle?.estado === 'completada' ? styles.modalFooterLeft : ''}`}>
          {isAdmin && detalle?.estado === 'completada' && (
            <button
              className={styles.dangerButton}
              onClick={handleCancelar}
              disabled={cancelando}
            >
              <span className="material-icons">cancel</span>
              {cancelando ? 'Cancelando...' : 'Cancelar Venta'}
            </button>
          )}
          <button className={styles.cancelButton} onClick={onClose}>
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};

export default DetalleVentaModal;
