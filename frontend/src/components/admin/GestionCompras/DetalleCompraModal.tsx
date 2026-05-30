import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import adminCompraService from '../../../services/adminCompraService';
import AnularCompraModal from './AnularCompraModal';
import type { CompraDetalle, CompraItem } from '../../../types';
import PremiumModal from '../../common/PremiumModal/PremiumModal';
import { AdminDataTable } from '../common';
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table';
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

  // === Estados para AdminDataTable ===
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [columnOrder, setColumnOrder] = useState<string[]>([
    'producto', 'codigo', 'cantidad', 'precio', 'subtotal'
  ]);

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

  // === Columnas para la tabla de items ===
  const columns = useMemo<ColumnDef<CompraItem>[]>(() => [
    {
      accessorKey: 'nombre_producto',
      id: 'producto',
      header: 'Producto',
      cell: info => <span style={{ fontWeight: 600 }}>{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'codigo_producto',
      id: 'codigo',
      header: 'Código',
      cell: info => <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{(info.getValue() as string) || '—'}</span>,
    },
    {
      accessorKey: 'cantidad',
      id: 'cantidad',
      header: () => <div style={{ textAlign: 'right', width: '100%' }}>Cant.</div>,
      cell: info => <div style={{ textAlign: 'right', fontWeight: 600 }}>{info.getValue() as number}</div>,
    },
    {
      accessorKey: 'precio_unitario',
      id: 'precio',
      header: () => <div style={{ textAlign: 'right', width: '100%' }}>P. Unit.</div>,
      cell: info => <div style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>{formatUSD(info.getValue() as number)}</div>,
    },
    {
      accessorKey: 'subtotal',
      id: 'subtotal',
      header: () => <div style={{ textAlign: 'right', width: '100%' }}>Subtotal</div>,
      cell: info => <div style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)' }}>{formatUSD(info.getValue() as number)}</div>,
    },
  ], []);

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
              <div className="mt-3">
                <AdminDataTable
                  data={detalle.items || []}
                  columns={columns}
                  sorting={sorting}
                  onSortingChange={setSorting}
                  columnOrder={columnOrder}
                  onColumnOrderChange={setColumnOrder}
                  pagination={pagination}
                  onPaginationChange={setPagination}
                  totalItems={detalle.items?.length || 0}
                  itemLabel="productos"
                  isLoading={cargando}
                  manualPagination={false}
                  emptyMessage="No hay productos en esta compra"
                />
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
