import React, { useState, useEffect } from 'react';
import envioAdminService from '../../../services/envioAdminService';
import { useNotification } from '../../../contexts/NotificationContext';
import { ESTADO_ENVIO_LABELS } from '../../../types/envio';
import styles from './GestionVentas.module.css';
import type { EnvioAdminListItem, EnvioAdminDetalle } from '../../../types/envio';

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatMoneda = (n: number, moneda = 'ARS') =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda }).format(n);

interface GestionRetirosModalProps {
  retiro: EnvioAdminListItem;
  onClose: () => void;
  onEntregado: () => void;
}

const GestionRetirosModal: React.FC<GestionRetirosModalProps> = ({ retiro, onClose, onEntregado }) => {
  const { showNotification } = useNotification();

  const [detalle, setDetalle] = useState<EnvioAdminDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const esEntregado = retiro.estado_envio === 'entregado';

  useEffect(() => {
    let cancelled = false;
    setCargando(true);
    envioAdminService
      .obtenerDetalle(retiro.id_envio)
      .then((d) => {
        if (!cancelled) setDetalle(d);
      })
      .catch(() => {
        if (!cancelled) showNotification('Error al cargar detalle del retiro', 'error');
      })
      .finally(() => {
        if (!cancelled) setCargando(false);
      });
    return () => {
      cancelled = true;
    };
  }, [retiro.id_envio, showNotification]);

  const handleMarcarEntregado = async () => {
    setGuardando(true);
    try {
      await envioAdminService.actualizarEstado(retiro.id_envio, { estado_envio: 'entregado' });
      showNotification('Retiro marcado como entregado', 'success');
      onEntregado();
    } catch {
      showNotification('Error al marcar como entregado', 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.modal} ${styles.modalLarge}`}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <span className="material-icons">store</span>
            Retiro en tienda #{retiro.nro_venta}
            <span
              className={`${styles.estadoBadge} ${retiro.estado_envio === 'entregado' ? styles.estadoEntregado : styles.estadoPendiente}`}
            >
              {(retiro.estado_envio as string) === 'no_aplica'
                ? ESTADO_ENVIO_LABELS.pendiente
                : ESTADO_ENVIO_LABELS[retiro.estado_envio]}
            </span>
          </h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Cerrar">
            <span className="material-icons" style={{ fontSize: 18 }}>
              close
            </span>
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {cargando ? (
            <div className={styles.loadingMsg}>Cargando detalle...</div>
          ) : detalle ? (
            <>
              {/* Info del cliente y venta */}
              <div className={styles.detalleGrid}>
                <div className={styles.detalleSection}>
                  <h3 className={styles.detalleSectionTitle}>Cliente</h3>
                  <div className={styles.detalleRow}>
                    <span className={styles.detalleRowLabel}>Nombre</span>
                    <span className={styles.detalleRowValue}>{detalle.nombre_cliente ?? '—'}</span>
                  </div>
                  <div className={styles.detalleRow}>
                    <span className={styles.detalleRowLabel}>Email</span>
                    <span className={styles.detalleRowValue}>{detalle.email_cliente ?? '—'}</span>
                  </div>
                  {detalle.envio_telefono_contacto && (
                    <div className={styles.detalleRow}>
                      <span className={styles.detalleRowLabel}>Teléfono</span>
                      <span className={styles.detalleRowValue}>{detalle.envio_telefono_contacto}</span>
                    </div>
                  )}
                </div>

                <div className={styles.detalleSection}>
                  <h3 className={styles.detalleSectionTitle}>Datos de la venta</h3>
                  <div className={styles.detalleRow}>
                    <span className={styles.detalleRowLabel}>Fecha</span>
                    <span className={styles.detalleRowValue}>{formatFecha(detalle.fyh_venta)}</span>
                  </div>
                  <div className={styles.detalleRow}>
                    <span className={styles.detalleRowLabel}>Total</span>
                    <span className={styles.detalleRowValue}>{formatMoneda(detalle.total_pagado, detalle.moneda)}</span>
                  </div>
                  <div className={styles.detalleRow}>
                    <span className={styles.detalleRowLabel}>Pago</span>
                    <span className={styles.detalleRowValue}>{detalle.metodo_pago}</span>
                  </div>
                </div>
              </div>

              {/* Productos */}
              <h4 className={styles.itemsTitle}>Productos del pedido</h4>
              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className={styles.textRight}>Cant.</th>
                    <th className={styles.textRight}>Precio unit.</th>
                    <th className={styles.textRight}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {detalle.items.map((item, i) => (
                    <tr key={i}>
                      <td>{item.nombre_producto}</td>
                      <td className={styles.textRight}>{item.cantidad}</td>
                      <td className={styles.textRight}>{formatMoneda(item.precio_unitario, detalle.moneda)}</td>
                      <td className={styles.textRight}>
                        {formatMoneda(item.cantidad * item.precio_unitario, detalle.moneda)}
                      </td>
                    </tr>
                  ))}
                  <tr className={styles.totalRow}>
                    <td colSpan={3}>
                      <strong>Total</strong>
                    </td>
                    <td className={styles.textRight}>
                      <strong>{formatMoneda(detalle.total_pagado, detalle.moneda)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Panel de acción */}
              {!esEntregado && (
                <div className={styles.envioAccionPanel}>
                  {!confirmando ? (
                    <button className={styles.submitButton} onClick={() => setConfirmando(true)}>
                      <span className="material-icons" style={{ fontSize: 16 }}>
                        check_circle
                      </span>
                      Marcar como Entregado
                    </button>
                  ) : (
                    <div className={styles.envioConfirmar}>
                      <p className={styles.envioConfirmarTitulo}>
                        ¿Confirmás que el cliente retiró el pedido <strong>#{retiro.nro_venta}</strong>?
                      </p>
                      <div className={styles.envioConfirmarBtns}>
                        <button
                          className={styles.cancelButton}
                          onClick={() => setConfirmando(false)}
                          disabled={guardando}
                        >
                          Cancelar
                        </button>
                        <button className={styles.submitButton} onClick={handleMarcarEntregado} disabled={guardando}>
                          {guardando ? 'Guardando...' : 'Confirmar entrega'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className={styles.errorMsg}>No se pudo cargar el detalle del retiro.</div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default GestionRetirosModal;
