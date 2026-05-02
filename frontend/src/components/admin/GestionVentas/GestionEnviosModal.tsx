import React, { useState, useEffect } from 'react';
import envioAdminService from '../../../services/envioAdminService';
import { useNotification } from '../../../contexts/NotificationContext';
import { ESTADO_ENVIO_LABELS, SIGUIENTE_ESTADO } from '../../../types/envio';
import type { EnvioAdminListItem, EnvioAdminDetalle, EstadoEnvio } from '../../../types/envio';
import Input from '../../common/Input/Input';
import PremiumModal from '../../common/PremiumModal/PremiumModal';
import styles from './VentaModals.module.css';

const ESTADO_BADGES: Record<EstadoEnvio, string> = {
  pendiente: 'neutral',
  en_preparacion: 'primary',
  en_camino: 'primary',
  entregado: 'success',
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
    <PremiumModal
      isOpen={true}
      onClose={onClose}
      title={`Envío #${envio.nro_venta}`}
      icon="local_shipping"
      maxWidth="1000px"
      headerChildren={
        <span className={`modalBadgePremium ${ESTADO_BADGES[envio.estado_envio]} ${styles.headerBadge}`}>
          {ESTADO_ENVIO_LABELS[envio.estado_envio]}
        </span>
      }
    >
      <div className="modalBodyPremium p-0">
        {cargando ? (
          <div className="modalLoadingPremium">
            <span className="material-icons">hourglass_empty</span>
            <p>Cargando detalles del envío...</p>
          </div>
        ) : detalle ? (
          <div className="p-xl">
            {/* Stepper Premium */}
            <div className={`stepperPremium ${styles.stepper}`}>
              {ESTADOS_ORDEN.map((estado, idx) => {
                const completado = idx < indiceActual;
                const actual = idx === indiceActual;
                return (
                  <React.Fragment key={idx}>
                    <div className={`stepItemPremium ${actual ? 'stepActivePremium' : ''} ${completado ? 'stepCompletedPremium' : ''}`}>
                      <div className="stepCirclePremium">
                        {completado ? <span className="material-icons" style={{ fontSize: '16px' }}>check</span> : idx + 1}
                      </div>
                      <span className="stepLabelPremium">{ESTADO_ENVIO_LABELS[estado]}</span>
                    </div>
                    {idx < ESTADOS_ORDEN.length - 1 && (
                      <div className={`stepLinePremium ${idx < indiceActual ? 'stepLineActivePremium' : ''}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            <div className="modalGrid2Premium mb-6">
              
              {/* Información de Contacto */}
              <div className={styles.infoCard}>
                <h4 className={styles.sectionTitle}>Contacto del Cliente</h4>
                <div className="flex flex-col gap-sm mt-2">
                  <div className="modalInfoBoxPremium">
                    <div className="flex flex-col w-full">
                      <span className="text-xxs text-secondary uppercase font-bold">Nombre Completo</span>
                      <span className="text-sm font-bold">{detalle.nombre_cliente ?? '—'}</span>
                    </div>
                  </div>
                  <div className="modalInfoBoxPremium">
                    <div className="flex flex-col w-full">
                      <span className="text-xxs text-secondary uppercase font-bold">Email de Contacto</span>
                      <span className="text-sm font-bold text-primary" style={{ wordBreak: 'break-all' }}>{detalle.email_cliente ?? '—'}</span>
                    </div>
                  </div>
                  {detalle.envio_telefono_contacto && (
                    <div className="modalInfoBoxPremium">
                      <div className="flex flex-col w-full">
                        <span className="text-xxs text-secondary uppercase font-bold">Teléfono</span>
                        <span className="text-sm font-bold">{detalle.envio_telefono_contacto}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Información de Entrega */}
              <div className={styles.infoCard}>
                <h4 className={styles.sectionTitle}>Dirección de Entrega</h4>
                <div className="flex flex-col gap-sm mt-2">
                  <div className="modalInfoBoxPremium">
                    <div className="flex flex-col w-full">
                      <span className="text-xxs text-secondary uppercase font-bold">Calle y Número</span>
                      <span className="text-sm font-bold">
                        {[detalle.envio_calle, detalle.envio_numero].filter(Boolean).join(' ') || '—'}
                        {detalle.envio_piso && `, Piso ${detalle.envio_piso}`}
                        {detalle.envio_departamento && ` Dto. ${detalle.envio_departamento}`}
                      </span>
                    </div>
                  </div>
                  <div className="modalInfoBoxPremium">
                    <div className="flex flex-col w-full">
                      <span className="text-xxs text-secondary uppercase font-bold">Ciudad y Provincia</span>
                      <span className="text-sm font-bold">
                        {[detalle.envio_ciudad, detalle.envio_provincia].filter(Boolean).join(', ') || '—'}
                      </span>
                    </div>
                  </div>
                  {detalle.envio_referencia && (
                    <div className="modalInfoBoxPremium">
                      <div className="flex flex-col w-full">
                        <span className="text-xxs text-secondary uppercase font-bold">Referencia / Observaciones</span>
                        <span className="text-sm italic opacity-80">"{detalle.envio_referencia}"</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Información Venta */}
              <div className={styles.infoCard}>
                <h4 className={styles.sectionTitle}>Detalles de la Venta</h4>
                <div className="flex flex-col gap-sm mt-2">
                  <div className="modalInfoBoxPremium">
                    <div className="grid grid-cols-2 w-full gap-md">
                      <div>
                        <span className="text-xxs text-secondary uppercase font-bold">Fecha Venta</span>
                        <p className="text-sm font-bold m-0">{formatFecha(detalle.fyh_venta)}</p>
                      </div>
                      <div>
                        <span className="text-xxs text-secondary uppercase font-bold">Método Pago</span>
                        <p className="text-sm font-bold m-0" style={{ textTransform: 'capitalize' }}>{detalle.metodo_pago}</p>
                      </div>
                    </div>
                  </div>
                  <div className="modalInfoBoxPremium">
                    <div className="flex flex-col w-full">
                      <span className="text-xxs text-secondary uppercase font-bold">Total Pagado</span>
                      <span className="text-lg font-bold text-primary">{formatMoneda(detalle.total_pagado, detalle.moneda)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Información Seguimiento */}
              <div className={styles.infoCard}>
                <h4 className={styles.sectionTitle}>Seguimiento y Logística</h4>
                <div className="flex flex-col gap-sm mt-2">
                  <div className="modalInfoBoxPremium">
                    <div className="flex flex-col w-full">
                      <span className="text-xxs text-secondary uppercase font-bold">Nro. de Seguimiento</span>
                      <span className="text-sm font-bold">
                        {detalle.nro_seguimiento ?? <em className="opacity-50 font-normal">Pendiente de despacho</em>}
                      </span>
                    </div>
                  </div>
                  {detalle.fyh_despacho && (
                    <div className="modalInfoBoxPremium">
                      <div className="flex flex-col w-full">
                        <span className="text-xxs text-secondary uppercase font-bold">Fecha de Despacho</span>
                        <span className="text-sm font-bold">{formatFecha(detalle.fyh_despacho)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Productos */}
            <div className="mb-6">
              <h4 className={styles.sectionTitle}>Productos del pedido</h4>
              <div className="modalTableWrapperPremium mt-2">
                <table className="modalTablePremium">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th style={{ textAlign: 'right' }}>Cant.</th>
                      <th style={{ textAlign: 'right' }}>Precio unit.</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalle.items.map((item, i) => (
                      <tr key={i}>
                        <td className="font-bold">{item.nombre_producto}</td>
                        <td style={{ textAlign: 'right' }}>{item.cantidad}</td>
                        <td style={{ textAlign: 'right' }}>{formatMoneda(item.precio_unitario, detalle.moneda)}</td>
                        <td className="text-right font-bold text-primary">
                          {formatMoneda(item.cantidad * item.precio_unitario, detalle.moneda)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Panel de gestión de estado */}
            {!esEntregado && siguienteEstado && (
              <div className={styles.managementPanel}>
                {!confirmando ? (
                  <button className={`btnPremium btnPrimaryPremium ${styles.fullWidthBtn}`} onClick={() => setConfirmando(true)}>
                    <span className="material-icons">arrow_forward</span>
                    Avanzar a "{ESTADO_ENVIO_LABELS[siguienteEstado]}"
                  </button>
                ) : (
                  <div className="animate-fade-in">
                    <p className={styles.managementTitle}>
                      Confirmar cambio de estado a <span className="text-primary">"{ESTADO_ENVIO_LABELS[siguienteEstado]}"</span>
                    </p>

                    {siguienteEstado === 'en_camino' && (
                      <div className="mb-4">
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
                      </div>
                    )}

                    {ESTADOS_CON_EMAIL.has(siguienteEstado) && detalle.email_cliente && (
                      <div className={styles.infoAlert}>
                        <span className="material-icons">email</span>
                        <p className="m-0 text-xs">Se enviará un email de notificación a <strong>{detalle.email_cliente}</strong></p>
                      </div>
                    )}

                    <div className={styles.actionButtons}>
                      <button
                        className={`btnPremium btnSecondaryPremium ${styles.flex1}`}
                        onClick={() => setConfirmando(false)}
                        disabled={guardando}
                      >
                        Cancelar
                      </button>
                      <button
                        className={`btnPremium btnPrimaryPremium ${styles.flex1}`}
                        onClick={handleAvanzar}
                        disabled={guardando || (siguienteEstado === 'en_camino' && !nroSeguimiento.trim())}
                      >
                        {guardando ? 'Guardando...' : 'Confirmar Cambio'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="modalLoadingPremium" style={{ color: 'var(--color-error)' }}>
            <span className="material-icons" style={{ animation: 'none' }}>error_outline</span>
            <p>No se pudo cargar el detalle del envío.</p>
          </div>
        )}
      </div>

      <div className="modalFooterPremium">
        <button className="btnPremium btnSecondaryPremium" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </PremiumModal>
  );
};

export default GestionEnviosModal;
