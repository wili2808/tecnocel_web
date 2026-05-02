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
      maxWidth="1000px"
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
      <div className="modalBodyPremium p-0">
        {cargando ? (
          <div className="modalLoadingPremium">
            <span className="material-icons">hourglass_empty</span>
            <p>Cargando detalles del retiro...</p>
          </div>
        ) : detalle ? (
          <div className="p-xl">
            <div className="modalGrid2Premium mb-6">
              
              {/* Card Cliente */}
              <div className={styles.infoCard}>
                <h4 className="modalSectionTitlePremium">Información del Cliente</h4>
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

              {/* Card Operación */}
              <div className={styles.infoCard}>
                <h4 className="modalSectionTitlePremium">Datos de la Operación</h4>
                <div className="flex flex-col gap-sm mt-2">
                  <div className="modalInfoBoxPremium">
                    <div className="flex flex-col w-full">
                      <span className="text-xxs text-secondary uppercase font-bold">Fecha de la Venta</span>
                      <span className="text-sm font-bold">{formatFecha(detalle.fyh_venta)}</span>
                    </div>
                  </div>
                  <div className="modalInfoBoxPremium">
                    <div className="flex flex-col w-full">
                      <span className="text-xxs text-secondary uppercase font-bold">Total Pagado</span>
                      <span className="text-lg font-bold text-primary">{formatMoneda(detalle.total_pagado, detalle.moneda)}</span>
                    </div>
                  </div>
                  <div className="modalInfoBoxPremium">
                    <div className="flex flex-col w-full">
                      <span className="text-xxs text-secondary uppercase font-bold">Método de Pago</span>
                      <span className="text-sm font-bold" style={{ textTransform: 'capitalize' }}>{detalle.metodo_pago}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Productos */}
            <div className="mb-6">
              <h4 className="modalSectionTitlePremium">Productos del pedido</h4>
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
          </div>
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
