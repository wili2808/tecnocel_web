import React, { memo, useEffect, useState } from 'react';
import type { CompraDetalle } from '../../../types';
import { compraAdminService } from '../../../services/compraAdminService';
import styles from './GestionCompras.module.css';

interface DetalleCompraModalProps {
  idCompra: number;
  onClose: () => void;
  onAnularClick?: (idCompra: number, nroCompra: string) => void;
  userRole?: 'admin' | 'gerente' | 'vendedor';
}

const DetalleCompraModal: React.FC<DetalleCompraModalProps> = memo(
  ({ idCompra, onClose, onAnularClick, userRole }) => {
    const [detalle, setDetalle] = useState<CompraDetalle | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      cargarDetalle();
    }, [idCompra]);

    const cargarDetalle = async () => {
      try {
        setCargando(true);
        setError(null);
        const response = await compraAdminService.obtenerDetalle(idCompra);
        setDetalle(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar detalle');
      } finally {
        setCargando(false);
      }
    };

    if (cargando) {
      return (
        <div className={styles.modalOverlay} onClick={onClose}>
          <div className={`${styles.modalContent} ${styles.detalleCompraModal}`} onClick={(e) => e.stopPropagation()}>
            <div style={{ color: 'var(--text-secondary)', padding: '40px', textAlign: 'center' }}>Cargando...</div>
          </div>
        </div>
      );
    }

    if (error || !detalle) {
      return (
        <div className={styles.modalOverlay} onClick={onClose}>
          <div className={`${styles.modalContent} ${styles.detalleCompraModal}`} onClick={(e) => e.stopPropagation()}>
            <p style={{ color: 'var(--color-error)', margin: '32px', textAlign: 'center' }}>
              {error || 'No se encontró la compra'}
            </p>
          </div>
        </div>
      );
    }

    const canAnular = detalle.estado === 'activa' && (userRole === 'admin' || userRole === 'gerente');
    const isActiva = detalle.estado === 'activa';
    const estadoBg = isActiva ? '#dcfce7' : '#fee2e2';
    const estadoColor = isActiva ? '#166534' : '#991b1b';

    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={`${styles.modalContent} ${styles.detalleCompraModal}`} onClick={(e) => e.stopPropagation()}>
          {/* Encabezado - Documento */}
          <div className={styles.modalHeader} style={{ padding: '28px 28px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Documento de Compra
                </p>
                <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-primary)', margin: '0 0 12px', fontFamily: 'var(--font-family-primary)' }}>
                  {detalle.nro_compra}
                </h2>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    backgroundColor: estadoBg,
                    color: estadoColor,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  {compraAdminService.formatearEstado(detalle.estado)}
                </span>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--background-secondary)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body */}
          <div className={styles.modalBody}>
            {/* SECCIÓN: Contexto de Transacción */}
            <div style={{ marginBottom: '28px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Contexto
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 6px', fontWeight: 500 }}>Proveedor</p>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-primary)', margin: 0 }}>
                    {detalle.nombre_proveedor}
                  </p>
                  {detalle.empresa_proveedor && (
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '3px 0 0' }}>
                      {detalle.empresa_proveedor}
                    </p>
                  )}
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 6px', fontWeight: 500 }}>Registrado por</p>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    {detalle.nombre_usuario}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 6px', fontWeight: 500 }}>Fecha</p>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    {compraAdminService.formatearFecha(detalle.fecha_compra)}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 6px', fontWeight: 500 }}>Comprobante</p>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    {detalle.comprobante}
                  </p>
                </div>
              </div>
              {detalle.observaciones && (
                <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 6px', fontWeight: 500 }}>Observaciones</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0, lineHeight: '1.5' }}>
                    {detalle.observaciones}
                  </p>
                </div>
              )}
              {detalle.motivo_anulacion && detalle.estado === 'anulada' && (
                <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 6px', fontWeight: 500 }}>
                    ⚠️ Motivo de Anulación
                  </p>
                  <p style={{ fontSize: '13px', color: '#991b1b', margin: 0, lineHeight: '1.5', fontWeight: 500 }}>
                    {detalle.motivo_anulacion}
                  </p>
                </div>
              )}
            </div>

            {/* SECCIÓN: Items */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Productos ({detalle.items?.length || 0})
              </h3>

              {detalle.items && detalle.items.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--background-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Código
                        </th>
                        <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Producto
                        </th>
                        <th style={{ padding: '10px', textAlign: 'right', fontWeight: 600, fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Cant.
                        </th>
                        <th style={{ padding: '10px', textAlign: 'right', fontWeight: 600, fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          P. Unit.
                        </th>
                        <th style={{ padding: '10px', textAlign: 'right', fontWeight: 600, fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detalle.items.map((item) => (
                        <tr key={item.id_detalle_compra} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--background-primary)' }}>
                          <td style={{ padding: '12px 10px', color: 'var(--text-secondary)', fontSize: '12px', fontFamily: 'monospace' }}>
                            {item.codigo_producto || '—'}
                          </td>
                          <td style={{ padding: '12px 10px', color: 'var(--text-primary)', fontWeight: 500 }}>
                            {item.nombre_producto}
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 500 }}>
                            {item.cantidad}
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                            ${item.precio_unitario.toFixed(2)}
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 600 }}>
                            ${item.subtotal.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px', fontSize: '13px' }}>
                  Sin productos
                </p>
              )}
            </div>

            {/* SECCIÓN: Total - Destacado */}
            <div
              style={{
                padding: '20px',
                background: 'var(--background-secondary)',
                borderRadius: '8px',
                textAlign: 'right',
                borderLeft: '4px solid var(--color-primary)'
              }}
            >
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Monto Total
              </p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
                {compraAdminService.formatearTotal(detalle.precio_total)}
              </p>
            </div>
          </div>

          {/* Footer - Acciones */}
          <div className={styles.modalFooter}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px 16px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--background-primary)',
                color: 'var(--text-primary)',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-family-primary)',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--background-secondary)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--background-primary)')}
            >
              Cerrar
            </button>
            {canAnular && (
              <button
                onClick={() => onAnularClick?.(detalle.id_compra, detalle.nro_compra)}
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-family-primary)',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ef4444')}
              >
                Anular Compra
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

DetalleCompraModal.displayName = 'DetalleCompraModal';

export default DetalleCompraModal;
