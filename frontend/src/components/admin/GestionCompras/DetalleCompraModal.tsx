import React, { memo, useCallback, useEffect, useState } from 'react';
import adminCompraService from '../../../services/adminCompraService';
import AnularCompraModal from './AnularCompraModal';
import type { CompraDetalle } from '../../../types';
import PremiumModal from '../../common/PremiumModal/PremiumModal';
import { formatUSD } from '../../../utils/formatPrecio';
import styles from './CompraModals.module.css';

interface DetalleCompraModalProps {
  idCompra: number;
  onClose: () => void;
  onAnulada?: () => void;
}

const DetalleCompraModal: React.FC<DetalleCompraModalProps> = memo(({ idCompra, onClose, onAnulada }) => {
  const [detalle, setDetalle] = useState<CompraDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mostrarAnularModal, setMostrarAnularModal] = useState(false);

  const cargarDetalle = useCallback(async () => {
    try {
      setCargando(true);
      setError(null);
      const response = await adminCompraService.obtenerDetalle(idCompra);
      setDetalle(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar detalle');
    } finally {
      setCargando(false);
    }
  }, [idCompra]);

  useEffect(() => {
    cargarDetalle();
  }, [cargarDetalle]);

  const canAnular = detalle?.estado === 'activa';
  const isActiva = detalle?.estado === 'activa';

  return (
    <PremiumModal
      isOpen={true}
      onClose={onClose}
      title={detalle ? detalle.nro_compra : 'Cargando...'}
      icon="inventory"
      maxWidth="850px"
      headerChildren={
        detalle && (
          <div className={styles.headerBadges}>
            <span className={`modalBadgePremium ${isActiva ? 'success' : 'error'}`}>
              {adminCompraService.formatearEstado(detalle.estado)}
            </span>
            <span className="modalBadgePremium neutral">
              <span className={`material-icons ${styles.calendarIcon}`}>calendar_today</span>
              {adminCompraService.formatearFecha(detalle.fecha_compra)}
            </span>
          </div>
        )
      }
    >
      {cargando ? (
        <div className="modalLoadingPremium">
          <span className="material-icons">hourglass_empty</span>
          <p>Cargando información de la compra...</p>
        </div>
      ) : error || !detalle ? (
        <div className="modalBodyPremium text-center" style={{ padding: '40px' }}>
          <span className="material-icons text-error mb-4" style={{ fontSize: '48px' }}>error_outline</span>
          <p className="text-error font-bold">{error || 'No se encontró la compra'}</p>
          <button className="btnPremium btnSecondaryPremium mt-5" onClick={onClose}>
            Cerrar
          </button>
        </div>
      ) : (
        <>
          <div className="modalBodyPremium">
            {/* Contexto de la Transacción */}

            {/* Grid de Información de Contexto */}
            <div className="modalGrid2Premium mb-6">
              <div className="modalFormGroupPremium">
                <label className="modalFormLabelPremium">Proveedor</label>
                <div className="modalInfoBoxPremium">
                  <div className={styles.providerInfo}>
                    <p className="text-sm font-bold text-primary mb-0">{detalle.nombre_proveedor}</p>
                    {detalle.empresa_proveedor && <p className="text-xxs text-secondary mt-1 mb-0">{detalle.empresa_proveedor}</p>}
                  </div>
                </div>
              </div>
              <div className="modalFormGroupPremium">
                <label className="modalFormLabelPremium">Comprobante y Registro</label>
                <div className="modalInfoBoxPremium">
                  <div className={styles.infoGrid}>
                    <div>
                      <p className="text-xxs text-secondary uppercase font-bold mb-0">Factura</p>
                      <p className="text-sm font-bold mb-0">{detalle.comprobante}</p>
                    </div>
                    <div>
                      <p className="text-xxs text-secondary uppercase font-bold mb-0">Operador</p>
                      <p className="text-sm font-bold mb-0">{detalle.nombre_usuario}</p>
                    </div>
                  </div>
                </div>
              </div>

              {detalle.observaciones && (
                <div className="modalFormGroupFullPremium">
                  <label className="modalFormLabelPremium">Observaciones</label>
                  <p className={`text-sm text-secondary italic mb-0 ${styles.observacionesBox}`}>
                    "{detalle.observaciones}"
                  </p>
                </div>
              )}

              {detalle.motivo_anulacion && detalle.estado === 'anulada' && (
                <div className="modalFormGroupFullPremium">
                  <div className="modalAlertErrorPremium">
                    <span className="material-icons">warning</span>
                    <div>
                      <p className="font-bold mb-1">Motivo de Anulación</p>
                      <p className="font-normal">{detalle.motivo_anulacion}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tabla de Productos */}
            <div className="mt-6">
              <span className="modalSectionTitlePremium">Detalle de Productos ({detalle.items?.length || 0})</span>
              <div className="modalTableContainerPremium mt-3">
                <table className={`modalTablePremium ${styles.productosTable}`}>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Código</th>
                      <th className="text-right">Cant.</th>
                      <th className="text-right">P. Unit.</th>
                      <th className="text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalle.items?.map((item) => (
                      <tr key={item.id_detalle_compra}>
                        <td className="font-bold">{item.nombre_producto}</td>
                        <td className="font-mono text-xxs text-secondary">
                          {item.codigo_producto || '—'}
                        </td>
                        <td className="text-right font-bold">{item.cantidad}</td>
                        <td className="text-right text-secondary">
                          {formatUSD(item.precio_unitario)}
                        </td>
                        <td className="text-right font-bold text-primary">
                          {formatUSD(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Resumen de Total */}
            <div className={styles.totalContainer}>
              <div className={`modalTotalBoxPremium ml-auto ${styles.totalBox}`}>
                <span className="modalTotalLabelPremium uppercase">Total de la Compra (USD)</span>
                <span className="modalTotalValuePremium">
                  {formatUSD(parseFloat(detalle.precio_total))}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Premium */}
          <div className="modalFooterPremium">
            {canAnular && (
              <button 
                className="btnPremium btnDangerPremium mr-auto"
                onClick={() => setMostrarAnularModal(true)}
              >
                <span className="material-icons">block</span>
                Anular Compra
              </button>
            )}
            <button className="btnPremium btnPrimaryPremium" onClick={onClose} style={{ minWidth: '100px' }}>
              Cerrar
            </button>
          </div>
        </>
      )}

      {mostrarAnularModal && detalle && (
        <AnularCompraModal
          idCompra={detalle.id_compra}
          nroCompra={detalle.nro_compra}
          onClose={() => setMostrarAnularModal(false)}
          onAnulada={() => {
            setMostrarAnularModal(false);
            if (onAnulada) onAnulada();
            onClose(); // Cerrar también el detalle
          }}
        />
      )}
    </PremiumModal>
  );
});

DetalleCompraModal.displayName = 'DetalleCompraModal';

export default DetalleCompraModal;
