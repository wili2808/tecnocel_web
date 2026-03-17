import React, { useState, useEffect } from 'react';
import styles from './GestionVentas.module.css';
import { useNotification } from '../../../contexts/NotificationContext';
import { envioAdminService } from '../../../services/envioAdminService';
import type { EnvioAdminListItem, EnvioAdminDetalle, EstadoEnvio } from '../../../types/envio';
import { ESTADO_ENVIO_LABELS, SIGUIENTE_ESTADO } from '../../../types/envio';

const ESTADO_COLORS: Record<EstadoEnvio, string> = {
  pendiente: styles.estadoPendiente,
  en_preparacion: styles.estadoEnPreparacion,
  en_camino: styles.estadoEnCamino,
  entregado: styles.estadoEntregado,
};

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const formatMoneda = (n: number, moneda = 'ARS') =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: moneda }).format(n);

const ESTADOS_ORDEN = ['pendiente', 'en_preparacion', 'en_camino', 'entregado'] as const;

const ESTADOS_CON_EMAIL = new Set(['en_camino', 'entregado']);

interface GestionEnviosModalProps {
  envio: EnvioAdminListItem;
  onClose: () => void;
  onActualizado: () => void;
}

const GestionEnviosModal: React.FC<GestionEnviosModalProps> = ({ envio, onClose, onActualizado }) => {
  const { showNotification } = useNotification();

  const [detalle, setDetalle] = useState<EnvioAdminDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [nroSeguimiento, setNroSeguimiento] = useState(envio.nro_seguimiento ?? '');
  const [confirmando, setConfirmando] = useState(false);

  const siguienteEstado = SIGUIENTE_ESTADO[envio.estado_envio];
  const esEntregado = envio.estado_envio === 'entregado';

  useEffect(() => {
    let cancelled = false;
    setCargando(true);
    envioAdminService.obtenerDetalle(envio.id_envio)
      .then(d => { if (!cancelled) setDetalle(d); })
      .catch(() => { if (!cancelled) showNotification('Error al cargar detalle del envío', 'error'); })
      .finally(() => { if (!cancelled) setCargando(false); });
    return () => { cancelled = true; };
  }, [envio.id_envio, showNotification]);

  const handleAvanzar = async () => {
    if (!siguienteEstado) return;
    if (siguienteEstado === 'en_camino' && !nroSeguimiento.trim()) {
      showNotification('El número de seguimiento es obligatorio para despachar el envío', 'warning');
      return;
    }
    setGuardando(true);
    try {
      await envioAdminService.actualizarEstado(envio.id_envio, {
        estado_envio: siguienteEstado,
        nro_seguimiento: nroSeguimiento.trim() || undefined,
      });
      showNotification(`Estado actualizado a "${ESTADO_ENVIO_LABELS[siguienteEstado]}"`, 'success');
      onActualizado();
    } catch {
      showNotification('Error al actualizar el estado del envío', 'error');
    } finally {
      setGuardando(false);
    }
  };

  const indiceActual = ESTADOS_ORDEN.indexOf(envio.estado_envio);

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.modal} ${styles.modalLarge}`}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            <span className="material-icons">local_shipping</span>
            Envío #{envio.nro_venta}
            <span className={`${styles.estadoBadge} ${ESTADO_COLORS[envio.estado_envio]}`}>
              {ESTADO_ENVIO_LABELS[envio.estado_envio]}
            </span>
          </h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Cerrar">
            <span className="material-icons" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {/* Stepper */}
          <div className={styles.envioStepper}>
            {ESTADOS_ORDEN.map((estado, idx) => {
              const completado = idx < indiceActual;
              const actual = idx === indiceActual;
              return (
                <React.Fragment key={estado}>
                  <div className={`${styles.stepperItem} ${actual ? styles.stepperActual : ''} ${completado ? styles.stepperCompletado : ''}`}>
                    <div className={styles.stepperCirculo}>
                      {completado
                        ? <span className="material-icons" style={{ fontSize: 14 }}>check</span>
                        : idx + 1}
                    </div>
                    <span className={styles.stepperLabel}>{ESTADO_ENVIO_LABELS[estado]}</span>
                  </div>
                  {idx < ESTADOS_ORDEN.length - 1 && (
                    <div className={`${styles.stepperConector} ${completado ? styles.stepperConectorCompletado : ''}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {cargando ? (
            <div className={styles.loadingMsg}>Cargando detalle...</div>
          ) : detalle ? (
            <>
              {/* Info del envío */}
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
                  <h3 className={styles.detalleSectionTitle}>Dirección de entrega</h3>
                  {detalle.envio_nombre_direccion && (
                    <div className={styles.detalleRow}>
                      <span className={styles.detalleRowLabel}>Alias</span>
                      <span className={styles.detalleRowValue}>{detalle.envio_nombre_direccion}</span>
                    </div>
                  )}
                  <div className={styles.detalleRow}>
                    <span className={styles.detalleRowLabel}>Dirección</span>
                    <span className={styles.detalleRowValue}>
                      {[detalle.envio_calle, detalle.envio_numero].filter(Boolean).join(' ') || '—'}
                      {detalle.envio_piso && `, Piso ${detalle.envio_piso}`}
                      {detalle.envio_departamento && ` Dto. ${detalle.envio_departamento}`}
                    </span>
                  </div>
                  {detalle.envio_barrio && (
                    <div className={styles.detalleRow}>
                      <span className={styles.detalleRowLabel}>Barrio</span>
                      <span className={styles.detalleRowValue}>{detalle.envio_barrio}</span>
                    </div>
                  )}
                  <div className={styles.detalleRow}>
                    <span className={styles.detalleRowLabel}>Ciudad</span>
                    <span className={styles.detalleRowValue}>
                      {[detalle.envio_ciudad, detalle.envio_provincia].filter(Boolean).join(', ') || '—'}
                      {detalle.envio_codigo_postal && ` (CP ${detalle.envio_codigo_postal})`}
                    </span>
                  </div>
                  {detalle.envio_referencia && (
                    <div className={styles.detalleRow}>
                      <span className={styles.detalleRowLabel}>Referencia</span>
                      <span className={styles.detalleRowValue}>{detalle.envio_referencia}</span>
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
                  {detalle.fyh_despacho && (
                    <div className={styles.detalleRow}>
                      <span className={styles.detalleRowLabel}>Despachado</span>
                      <span className={styles.detalleRowValue}>{formatFecha(detalle.fyh_despacho)}</span>
                    </div>
                  )}
                </div>

                <div className={styles.detalleSection}>
                  <h3 className={styles.detalleSectionTitle}>Seguimiento</h3>
                  <div className={styles.detalleRow}>
                    <span className={styles.detalleRowLabel}>Estado</span>
                    <span className={styles.detalleRowValue}>{ESTADO_ENVIO_LABELS[detalle.estado_envio]}</span>
                  </div>
                  <div className={styles.detalleRow}>
                    <span className={styles.detalleRowLabel}>Nro. seguimiento</span>
                    <span className={styles.detalleRowValue}>
                      {detalle.nro_seguimiento ?? <em className={styles.sinDatos}>Sin asignar</em>}
                    </span>
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
                      <td className={styles.textRight}>{formatMoneda(item.cantidad * item.precio_unitario, detalle.moneda)}</td>
                    </tr>
                  ))}
                  <tr className={styles.totalRow}>
                    <td colSpan={3}><strong>Total</strong></td>
                    <td className={styles.textRight}><strong>{formatMoneda(detalle.total_pagado, detalle.moneda)}</strong></td>
                  </tr>
                </tbody>
              </table>

              {/* Panel de gestión de estado */}
              {!esEntregado && siguienteEstado && (
                <div className={styles.envioAccionPanel}>
                  {!confirmando ? (
                    <button
                      className={styles.submitButton}
                      onClick={() => setConfirmando(true)}
                    >
                      <span className="material-icons" style={{ fontSize: 16 }}>arrow_forward</span>
                      Avanzar a "{ESTADO_ENVIO_LABELS[siguienteEstado]}"
                    </button>
                  ) : (
                    <div className={styles.envioConfirmar}>
                      <p className={styles.envioConfirmarTitulo}>
                        Confirmá el cambio de estado a <strong>"{ESTADO_ENVIO_LABELS[siguienteEstado]}"</strong>
                      </p>

                      {/* Campo nro_seguimiento obligatorio al despachar */}
                      {siguienteEstado === 'en_camino' && (
                        <div className={styles.formGroup}>
                          <label className={styles.label}>
                            Número de seguimiento <span className={styles.requerido}>*</span>
                          </label>
                          <input
                            type="text"
                            className={styles.input}
                            placeholder="Ej: AR123456789"
                            value={nroSeguimiento}
                            onChange={e => setNroSeguimiento(e.target.value)}
                            maxLength={100}
                          />
                        </div>
                      )}

                      {/* Aviso de email */}
                      {ESTADOS_CON_EMAIL.has(siguienteEstado) && detalle.email_cliente && (
                        <div className={styles.envioEmailAviso}>
                          <span className="material-icons" style={{ fontSize: 16 }}>email</span>
                          Se enviará un email de notificación a <strong>{detalle.email_cliente}</strong>
                        </div>
                      )}

                      <div className={styles.envioConfirmarBtns}>
                        <button
                          className={styles.cancelButton}
                          onClick={() => setConfirmando(false)}
                          disabled={guardando}
                        >
                          Cancelar
                        </button>
                        <button
                          className={styles.submitButton}
                          onClick={handleAvanzar}
                          disabled={guardando || (siguienteEstado === 'en_camino' && !nroSeguimiento.trim())}
                        >
                          {guardando ? 'Guardando...' : 'Confirmar'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className={styles.errorMsg}>No se pudo cargar el detalle del envío.</div>
          )}
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button className={styles.cancelButton} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default GestionEnviosModal;
