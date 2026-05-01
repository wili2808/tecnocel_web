import React, { useState, useEffect } from 'react';
import envioAdminService from '../../../services/envioAdminService';
import { useNotification } from '../../../contexts/NotificationContext';
import { ESTADO_ENVIO_LABELS } from '../../../types/envio';
import type { EnvioAdminListItem, EnvioAdminDetalle } from '../../../types/envio';
import PremiumModal from '../../common/PremiumModal/PremiumModal';

import styles from './GestionRetirosModal.module.css';

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
    <PremiumModal
      isOpen={true}
      onClose={onClose}
      title={`Retiro en tienda #${retiro.nro_venta}`}
      icon="store"
      maxWidth="900px"
      headerChildren={
        <span
          className={`modalBadgePremium ${retiro.estado_envio === 'entregado' ? 'success' : 'neutral'} ${styles.headerBadge}`}
        >
          {(retiro.estado_envio as string) === 'no_aplica'
            ? ESTADO_ENVIO_LABELS.pendiente
            : ESTADO_ENVIO_LABELS[retiro.estado_envio]}
        </span>
      }
    >
      <div className="modalBodyPremium">
        {cargando ? (
          <div className="modalLoadingPremium">
            <span className="material-icons">hourglass_empty</span>
            <p>Cargando detalles del retiro...</p>
          </div>
        ) : detalle ? (
          <>
            <div className="modalSplitLayoutPremium modalSplitEqualPremium mb-3">
              
              {/* Card Cliente */}
              <div className={`${styles.cardContainer} ${styles.infoCard}`}>
                <span className={styles.sectionTitleWithDivider}>Información del Cliente</span>
                <div className="flex flex-col gap-xs mt-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-secondary font-bold">Nombre</span>
                    <span className="font-bold text-right ml-2">{detalle.nombre_cliente ?? '—'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-secondary font-bold">Email</span>
                    <span className="font-bold text-primary text-right ml-2" style={{ wordBreak: 'break-all' }}>{detalle.email_cliente ?? '—'}</span>
                  </div>
                  {detalle.envio_telefono_contacto && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-secondary font-bold">Teléfono</span>
                      <span className="font-bold text-right ml-2">{detalle.envio_telefono_contacto}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Operación */}
              <div className={`${styles.cardContainer} ${styles.infoCard}`}>
                <span className={styles.sectionTitleWithDivider}>Datos de la Operación</span>
                <div className="flex flex-col gap-xs mt-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-secondary font-bold">Fecha Venta</span>
                    <span className="font-bold text-right ml-2">{formatFecha(detalle.fyh_venta)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-secondary font-bold">Total Pagado</span>
                    <span className="font-bold text-primary text-right ml-2">{formatMoneda(detalle.total_pagado, detalle.moneda)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-secondary font-bold">Método Pago</span>
                    <span className="font-bold text-right ml-2" style={{ textTransform: 'capitalize' }}>{detalle.metodo_pago}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Productos */}
            <div className="mb-4">
              <span className={styles.sectionTitleWithDivider}>Productos del pedido</span>
              <div className="modalTableWrapperPremium mt-md">
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

            {/* Panel de acción */}
            {!esEntregado && (
              <div className={styles.managementPanel}>
                {!confirmando ? (
                  <button className={`btnPremium btnPrimaryPremium ${styles.fullWidthBtn}`} onClick={() => setConfirmando(true)}>
                    <span className="material-icons">check_circle</span>
                    Marcar como Entregado
                  </button>
                ) : (
                  <div className="animate-fade-in">
                    <p className={styles.managementTitle}>
                      ¿Confirmás que el cliente retiró el pedido <span className="text-primary">#{retiro.nro_venta}</span>?
                    </p>
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
                        onClick={handleMarcarEntregado} 
                        disabled={guardando}
                      >
                        {guardando ? 'Guardando...' : 'Confirmar Entrega'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="modalLoadingPremium" style={{ color: 'var(--color-error)' }}>
            <span className="material-icons" style={{ animation: 'none' }}>error_outline</span>
            <p>No se pudo cargar el detalle del retiro.</p>
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

export default GestionRetirosModal;
