import React, { useState, useEffect } from 'react';
import envioAdminService from '../../../services/envioAdminService';
import { useNotification } from '../../../contexts/NotificationContext';
import { ESTADO_ENVIO_LABELS, SIGUIENTE_ESTADO } from '../../../types/envio';
import styles from './GestionVentas.module.css';
import type { EnvioAdminListItem, EnvioAdminDetalle, EstadoEnvio } from '../../../types/envio';
import Input from '../../common/Input/Input';

const ESTADO_COLORS: Record<EstadoEnvio, string> = {
  pendiente: styles.estadoPendiente,
  en_preparacion: styles.estadoEnPreparacion,
  en_camino: styles.estadoEnCamino,
  entregado: styles.estadoEntregado,
};

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
    envioAdminService
      .obtenerDetalle(envio.id_envio)
      .then((d) => {
        if (!cancelled) setDetalle(d);
      })
      .catch(() => {
        if (!cancelled) showNotification('Error al cargar detalle del envío', 'error');
      })
      .finally(() => {
        if (!cancelled) setCargando(false);
      });
    return () => {
      cancelled = true;
    };
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
    <div className="modalOverlayPremium" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modalPremium" style={{ maxWidth: '850px' }}>
        {/* Header Premium */}
        <div className="modalHeaderPremium">
          <h2 className="modalTitlePremium">
            <span className="material-icons">local_shipping</span>
            Envío #{envio.nro_venta}
            <span className={`${styles.estadoBadge} ${ESTADO_COLORS[envio.estado_envio]}`}>
              {ESTADO_ENVIO_LABELS[envio.estado_envio]}
            </span>
          </h2>
          <button className="closeButtonPremium" onClick={onClose} aria-label="Cerrar">
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Body Premium */}
        <div className="modalBodyPremium">
          {/* Stepper */}
          <div className={styles.envioStepper}>
            {ESTADOS_ORDEN.map((estado, idx) => {
              const completado = idx < indiceActual;
              const actual = idx === indiceActual;
              return (
                <React.Fragment key={estado}>
                  <div
                    className={`${styles.stepperItem} ${actual ? styles.stepperActual : ''} ${completado ? styles.stepperCompletado : ''}`}
                  >
                    <div className={styles.stepperCirculo}>
                      {completado ? (
                        <span className="material-icons" style={{ fontSize: 14 }}>
                          check
                        </span>
                      ) : (
                        idx + 1
                      )}
                    </div>
                    <span className={styles.stepperLabel}>{ESTADO_ENVIO_LABELS[estado]}</span>
                  </div>
                  {idx < ESTADOS_ORDEN.length - 1 && (
                    <div
                      className={`${styles.stepperConector} ${completado ? styles.stepperConectorCompletado : ''}`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {cargando ? (
            <div className={styles.loadingMsg}>Cargando detalle...</div>
          ) : detalle ? (
              <>
              {/* Detalle Premium Organizado */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                
                {/* Card Cliente */}
                <div style={{ padding: '20px', background: 'var(--background-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <span className={styles.sectionTitlePremium}>Información del Cliente</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                    <div className={styles.detalleRowPremium}>
                      <span className={styles.detalleLabelPremium}>Nombre</span>
                      <span className={styles.detalleValuePremium}>{detalle.nombre_cliente ?? '—'}</span>
                    </div>
                    <div className={styles.detalleRowPremium}>
                      <span className={styles.detalleLabelPremium}>Email</span>
                      <span className={styles.detalleValuePremium} style={{ color: 'var(--color-primary)' }}>{detalle.email_cliente ?? '—'}</span>
                    </div>
                    {detalle.envio_telefono_contacto && (
                      <div className={styles.detalleRowPremium}>
                        <span className={styles.detalleLabelPremium}>Teléfono</span>
                        <span className={styles.detalleValuePremium}>{detalle.envio_telefono_contacto}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Entrega */}
                <div style={{ padding: '20px', background: 'var(--background-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <span className={styles.sectionTitlePremium}>Dirección de Entrega</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                    <div className={styles.detalleRowPremium}>
                      <span className={styles.detalleLabelPremium}>Ubicación</span>
                      <span className={styles.detalleValuePremium}>
                        {[detalle.envio_calle, detalle.envio_numero].filter(Boolean).join(' ') || '—'}
                        {detalle.envio_piso && `, Piso ${detalle.envio_piso}`}
                        {detalle.envio_departamento && ` Dto. ${detalle.envio_departamento}`}
                      </span>
                    </div>
                    <div className={styles.detalleRowPremium}>
                      <span className={styles.detalleLabelPremium}>Ciudad/Prov.</span>
                      <span className={styles.detalleValuePremium}>
                        {[detalle.envio_ciudad, detalle.envio_provincia].filter(Boolean).join(', ') || '—'}
                      </span>
                    </div>
                    {detalle.envio_referencia && (
                      <div className={styles.detalleRowPremium}>
                        <span className={styles.detalleLabelPremium}>Referencia</span>
                        <span className={styles.detalleValuePremium} style={{ fontSize: '12px', fontStyle: 'italic' }}>"{detalle.envio_referencia}"</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Operación */}
                <div style={{ padding: '20px', background: 'var(--background-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <span className={styles.sectionTitlePremium}>Datos de la Operación</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                    <div className={styles.detalleRowPremium}>
                      <span className={styles.detalleLabelPremium}>Fecha Venta</span>
                      <span className={styles.detalleValuePremium}>{formatFecha(detalle.fyh_venta)}</span>
                    </div>
                    <div className={styles.detalleRowPremium}>
                      <span className={styles.detalleLabelPremium}>Total Pagado</span>
                      <span className={styles.detalleValuePremium} style={{ color: 'var(--color-primary)', fontWeight: 800 }}>{formatMoneda(detalle.total_pagado, detalle.moneda)}</span>
                    </div>
                    <div className={styles.detalleRowPremium}>
                      <span className={styles.detalleLabelPremium}>Método Pago</span>
                      <span className={styles.detalleValuePremium}>{detalle.metodo_pago}</span>
                    </div>
                  </div>
                </div>

                {/* Card Seguimiento */}
                <div style={{ padding: '20px', background: 'var(--background-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                  <span className={styles.sectionTitlePremium}>Estado y Seguimiento</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                    <div className={styles.detalleRowPremium}>
                      <span className={styles.detalleLabelPremium}>Estado Envío</span>
                      <span className={styles.detalleValuePremium}>{ESTADO_ENVIO_LABELS[detalle.estado_envio]}</span>
                    </div>
                    <div className={styles.detalleRowPremium}>
                      <span className={styles.detalleLabelPremium}>Nro. Seguimiento</span>
                      <span className={styles.detalleValuePremium}>
                        {detalle.nro_seguimiento ?? <em style={{ opacity: 0.5, fontWeight: 400 }}>Sin asignar</em>}
                      </span>
                    </div>
                    {detalle.fyh_despacho && (
                      <div className={styles.detalleRowPremium}>
                        <span className={styles.detalleLabelPremium}>Fecha Despacho</span>
                        <span className={styles.detalleValuePremium}>{formatFecha(detalle.fyh_despacho)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Productos */}
              <h4 className={styles.sectionTitlePremium} style={{ marginTop: '24px' }}>Productos del pedido</h4>
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

                  {/* Panel de gestión de estado */}
                  {!esEntregado && siguienteEstado && (
                    <div className={styles.envioAccionPanel}>
                      {!confirmando ? (
                        <button className="btnPremium btnPrimaryPremium" onClick={() => setConfirmando(true)}>
                          <span className="material-icons" style={{ fontSize: 18 }}>
                            arrow_forward
                          </span>
                          Avanzar a "{ESTADO_ENVIO_LABELS[siguienteEstado]}"
                        </button>
                      ) : (
                        <div className={styles.envioConfirmar}>
                          <p className={styles.envioConfirmarTitulo}>
                            Confirmá el cambio de estado a <strong>"{ESTADO_ENVIO_LABELS[siguienteEstado]}"</strong>
                          </p>
    
                          {/* Campo nro_seguimiento obligatorio al despachar */}
                          {siguienteEstado === 'en_camino' && (
                            <Input
                              id="nroSeguimiento"
                              name="nroSeguimiento"
                              label="Número de seguimiento"
                              value={nroSeguimiento}
                              onChange={(e) => setNroSeguimiento(e.target.value)}
                              placeholder="Ej: AR123456789"
                              maxLength={100}
                              required
                              disabled={guardando}
                            />
                          )}
    
                          {/* Aviso de email */}
                          {ESTADOS_CON_EMAIL.has(siguienteEstado) && detalle.email_cliente && (
                            <div className={styles.envioEmailAviso}>
                              <span className="material-icons" style={{ fontSize: 16 }}>
                                email
                              </span>
                              Se enviará un email de notificación a <strong>{detalle.email_cliente}</strong>
                            </div>
                          )}
    
                          <div className={styles.envioConfirmarBtns}>
                            <button
                              className="btnPremium btnSecondaryPremium"
                              onClick={() => setConfirmando(false)}
                              disabled={guardando}
                            >
                              Cancelar
                            </button>
                            <button
                              className="btnPremium btnPrimaryPremium"
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

        {/* Footer Premium */}
        <div className="modalFooterPremium">
          <button className="btnPremium btnSecondaryPremium" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default GestionEnviosModal;
