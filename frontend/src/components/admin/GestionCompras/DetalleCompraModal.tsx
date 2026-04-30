import React, { memo, useCallback, useEffect, useState } from 'react';
import adminCompraService from '../../../services/adminCompraService';
import styles from './GestionCompras.module.css';
import type { CompraDetalle } from '../../../types';

interface DetalleCompraModalProps {
  idCompra: number;
  onClose: () => void;
  onAnularClick?: (idCompra: number, nroCompra: string) => void;
}

const DetalleCompraModal: React.FC<DetalleCompraModalProps> = memo(({ idCompra, onClose, onAnularClick }) => {
  const [detalle, setDetalle] = useState<CompraDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (cargando) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalPremium} style={{ maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
           <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
             <span className="material-icons" style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>hourglass_empty</span>
             <p>Cargando información de la compra...</p>
           </div>
        </div>
      </div>
    );
  }

  if (error || !detalle) {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.modalPremium} onClick={(e) => e.stopPropagation()}>
          <div className={styles.modalHeaderPremium}>
            <h2 className={styles.modalTitlePremium}>
              <span className="material-icons">error</span>
              Error al cargar
            </h2>
            <button className={styles.closeButtonPremium} onClick={onClose}>
              <span className="material-icons">close</span>
            </button>
          </div>
          <div className={styles.modalBodyPremium} style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: 'var(--color-error)' }}>{error || 'No se encontró la compra'}</p>
          </div>
        </div>
      </div>
    );
  }

  const canAnular = detalle.estado === 'activa' && !!onAnularClick;
  const isActiva = detalle.estado === 'activa';
  
  // Clases dinámicas basadas en estado
  const statusBadgeClass = isActiva ? styles.stockNormal : styles.stockAgotado;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalPremium} style={{ maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header Premium con Info de Documento */}
        <div className={styles.modalHeaderPremium} style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span className={styles.sectionTitlePremium} style={{ margin: 0 }}>Documento de Compra</span>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-primary)', margin: 0 }}>
              {detalle.nro_compra}
            </h2>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <span className={`${styles.stockBadge} ${statusBadgeClass}`}>
                {adminCompraService.formatearEstado(detalle.estado)}
              </span>
              <span className={styles.stockBadge} style={{ background: 'var(--background-neutral)', color: 'var(--text-secondary)' }}>
                {adminCompraService.formatearFecha(detalle.fecha_compra)}
              </span>
            </div>
          </div>
          <button className={styles.closeButtonPremium} onClick={onClose} style={{ alignSelf: 'flex-start' }}>
            <span className="material-icons">close</span>
          </button>
        </div>

        {/* Body Premium */}
        <div className={styles.modalBodyPremium}>
          
          {/* Grid de Información de Contexto */}
          <div className={styles.formGrid} style={{ marginBottom: '32px' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabelPremium}>Proveedor</label>
              <div style={{ padding: '12px', background: 'var(--background-secondary)', borderRadius: '8px', borderLeft: '3px solid var(--color-primary)' }}>
                <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{detalle.nombre_proveedor}</p>
                {detalle.empresa_proveedor && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>{detalle.empresa_proveedor}</p>}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabelPremium}>Comprobante y Registro</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Nro. Factura</p>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{detalle.comprobante}</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Operador</p>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{detalle.nombre_usuario}</p>
                </div>
              </div>
            </div>

            {detalle.observaciones && (
              <div className={styles.formGroupFull}>
                <label className={styles.formLabelPremium}>Observaciones</label>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--background-neutral)', padding: '10px', borderRadius: '6px', margin: 0, fontStyle: 'italic' }}>
                  "{detalle.observaciones}"
                </p>
              </div>
            )}

            {detalle.motivo_anulacion && detalle.estado === 'anulada' && (
              <div className={styles.formGroupFull}>
                <label className={styles.formLabelPremium} style={{ color: 'var(--color-error)' }}>⚠️ Motivo de Anulación</label>
                <div style={{ padding: '12px', background: 'var(--color-error-100)', border: '1px solid var(--color-error)', borderRadius: '8px', color: 'var(--color-error)', fontSize: '13px', fontWeight: 600 }}>
                  {detalle.motivo_anulacion}
                </div>
              </div>
            )}
          </div>

          {/* Tabla de Productos */}
          <div>
            <span className={styles.sectionTitlePremium}>Detalle de Productos ({detalle.items?.length || 0})</span>
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', marginTop: '12px' }}>
              <table className={styles.table} style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th style={{ width: '120px' }}>Código</th>
                    <th>Producto</th>
                    <th className={styles.textRight}>Cant.</th>
                    <th className={styles.textRight}>P. Unit.</th>
                    <th className={styles.textRight}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {detalle.items?.map((item) => (
                    <tr key={item.id_detalle_compra}>
                      <td style={{ fontFamily: 'var(--font-family-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {item.codigo_producto || '—'}
                      </td>
                      <td style={{ fontWeight: 600 }}>{item.nombre_producto}</td>
                      <td className={styles.textRight} style={{ fontWeight: 700 }}>{item.cantidad}</td>
                      <td className={styles.textRight} style={{ color: 'var(--text-secondary)' }}>
                        ${item.precio_unitario.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={styles.textRight} style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                        ${item.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumen de Total */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <div style={{ padding: '16px 24px', background: 'var(--background-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', minWidth: '250px', textAlign: 'right' }}>
              <span className={styles.sectionTitlePremium} style={{ marginBottom: '4px' }}>Total de la Compra</span>
              <p style={{ fontSize: '32px', fontWeight: 900, color: 'var(--color-primary)', margin: 0 }}>
                {adminCompraService.formatearTotal(detalle.precio_total)}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Premium */}
        <div className={styles.modalFooterPremium}>
          <button className={`${styles.btnPremium} ${styles.btnSecondaryPremium}`} onClick={onClose} style={{ flex: canAnular ? '1' : 'none', minWidth: '120px' }}>
            Cerrar
          </button>
          {canAnular && (
            <button 
              className={styles.btnPremium} 
              style={{ background: 'var(--color-error)', color: 'white', flex: 1 }}
              onClick={() => onAnularClick?.(detalle.id_compra, detalle.nro_compra)}
            >
              <span className="material-icons">block</span>
              Anular Compra
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

DetalleCompraModal.displayName = 'DetalleCompraModal';

export default DetalleCompraModal;
