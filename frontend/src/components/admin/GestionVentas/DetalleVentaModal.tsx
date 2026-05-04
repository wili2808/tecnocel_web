import React, { useEffect, useState } from 'react';
import CancelacionModal from './CancelacionModal';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import adminVentaService from '../../../services/adminVentaService';
import type { VentaDetalle, VentaDetalleItem } from '../../../types/venta';
import PremiumModal from '../../common/PremiumModal/PremiumModal';
import { AdminDataTable } from '../common';
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table';
import styles from './VentaModals.module.css';

interface DetalleVentaModalProps {
  idVenta: number;
  onClose: () => void;
  /** Llamado después de cancelar exitosamente, para que el padre refresque la tabla */
  onCancelada?: () => void;
}

const DetalleVentaModal: React.FC<DetalleVentaModalProps> = ({ idVenta, onClose, onCancelada }) => {
  const { tienePermiso } = useAuth();
  const { showNotification } = useNotification();

  const puedeDescargarPdf = tienePermiso('descargar_pdf_venta');
  const puedeEnviarEmail = tienePermiso('enviar_email_venta');

  const [detalle, setDetalle] = useState<VentaDetalle | null>(null);
  const [cargando, setCargando] = useState(true);
  const [mostrarCancelacionModal, setMostrarCancelacionModal] = useState(false);
  const [descargando, setDescargando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // ── Estados para AdminDataTable ────────────────────────────────────
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 5 });
  const [columnOrder, setColumnOrder] = useState<string[]>([
    'nombre', 'codigo', 'cantidad', 'precio_unitario', 'subtotal'
  ]);

  // ── Cargar detalle ─────────────────────────────────────────────────────────

  useEffect(() => {
    let activo = true;

    const cargar = async () => {
      setCargando(true);
      try {
        const data = await adminVentaService.obtenerDetalle(idVenta);
        if (activo) setDetalle(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al cargar el detalle';
        if (activo) showNotification(message, 'error');
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargar();
    return () => {
      activo = false;
    };
  }, [idVenta, showNotification]);

  // ── Acciones de comprobante ────────────────────────────────────────────────

  const handleDescargar = async () => {
    if (!detalle) return;
    if (!puedeDescargarPdf) {
      showNotification('No tienes permisos para descargar el comprobante', 'error');
      return;
    }
    setDescargando(true);
    try {
      await adminVentaService.descargarComprobante(detalle.id_venta, detalle.nro_venta);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al descargar el comprobante';
      showNotification(message, 'error');
    } finally {
      setDescargando(false);
    }
  };

  const handleEnviarEmail = async () => {
    if (!detalle) return;
    if (!puedeEnviarEmail) {
      showNotification('No tienes permisos para enviar el comprobante', 'error');
      return;
    }
    setEnviando(true);
    try {
      const result = await adminVentaService.enviarComprobante(detalle.id_venta);
      showNotification(result.mensaje, 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al enviar el comprobante';
      showNotification(message, 'error');
    } finally {
      setEnviando(false);
    }
  };

  // ── Helpers de formato ─────────────────────────────────────────────────────

  const formatFecha = (iso: string) =>
    new Date(iso).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatMonto = (n: number) =>
    `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getBadgeEstado = (estado: VentaDetalle['estado']) => {
    const map: Record<string, string> = {
      completada: 'success',
      cancelada: 'error',
      pendiente: 'neutral',
    };
    return map[estado] || 'neutral';
  };

  const getBadgeTipo = (tipo: VentaDetalle['tipo_venta']) => (tipo === 'web' ? 'primary' : 'neutral');

  // ── Columnas para AdminDataTable ───────────────────────────────────
  const columns = React.useMemo<ColumnDef<VentaDetalleItem>[]>(() => [
    {
      accessorKey: 'nombre_producto',
      id: 'nombre',
      header: 'Producto',
      cell: (info) => <span className="font-bold">{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'codigo',
      id: 'codigo',
      header: 'Código',
      cell: (info) => <span className="text-xxs text-secondary">{info.getValue() as string || '—'}</span>,
    },
    {
      accessorKey: 'cantidad',
      id: 'cantidad',
      header: () => <div className="text-right">Cant.</div>,
      cell: (info) => <div className="text-right">{info.getValue() as number}</div>,
    },
    {
      accessorKey: 'precio_unitario',
      id: 'precio_unitario',
      header: () => <div className="text-right">P. Unit.</div>,
      cell: (info) => <div className="text-right">{formatMonto(info.getValue() as number)}</div>,
    },
    {
      accessorKey: 'subtotal',
      id: 'subtotal',
      header: () => <div className="text-right">Subtotal</div>,
      cell: (info) => (
        <div className="text-right font-bold text-primary">
          {formatMonto(info.getValue() as number)}
        </div>
      ),
    },
  ], []);

  // ── Render ─────────────────────────────────────────────────────────────────

  const total = detalle?.items.reduce((s, i) => s + i.subtotal, 0) ?? 0;
  const puedeCancelar = tienePermiso('cancelar_venta') && detalle?.estado === 'completada';

  return (
    <>
      <PremiumModal
        isOpen={true}
        onClose={onClose}
        title={detalle ? detalle.nro_venta : `Venta #${idVenta}`}
        icon="receipt_long"
        maxWidth="900px"
        headerChildren={
          detalle && (
            <div className={styles.headerBadges}>
              <span className={`modalBadgePremium ${getBadgeTipo(detalle.tipo_venta)}`}>
                {adminVentaService.formatearTipoVenta(detalle.tipo_venta)}
              </span>
              <span className={`modalBadgePremium ${getBadgeEstado(detalle.estado)}`}>
                {adminVentaService.formatearEstado(detalle.estado)}
              </span>
            </div>
          )
        }
      >
        <div className="modalBodyPremium">
          {cargando ? (
            <div className="modalLoadingPremium">
              <span className="material-icons">hourglass_empty</span>
              <p>Cargando información detallada de la venta...</p>
            </div>
          ) : !detalle ? (
            <div className="modalLoadingPremium" style={{ color: 'var(--color-error)' }}>
              <span className="material-icons" style={{ animation: 'none' }}>error_outline</span>
              <p>No se pudo recuperar el detalle de la venta.</p>
            </div>
          ) : (
            <div className={styles.container}>
              {/* Contexto de la Transacción */}
              <div className="modalGrid2Premium mb-6">
                
                {/* Bloque Cliente */}
                <div className={styles.infoCard}>
                  <span className="modalSectionTitlePremium">Información del Cliente</span>
                  {detalle.cliente ? (
                    <div className="flex flex-col gap-xs mt-2">
                      <div className="modalInfoBoxPremium">
                        <div className="flex flex-col w-full">
                          <span className="text-xxs text-secondary uppercase font-bold">Nombre</span>
                          <span className="text-sm font-bold">{detalle.cliente.nombre_cliente} {detalle.cliente.apellido_cliente}</span>
                        </div>
                      </div>
                      <div className="modalInfoBoxPremium">
                        <div className="flex flex-col w-full">
                          <span className="text-xxs text-secondary uppercase font-bold">Correo Electrónico</span>
                          <span className="text-sm font-bold text-primary" style={{ wordBreak: 'break-all' }}>{detalle.cliente.correo}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="modalAlertWarningPremium mt-2">
                      <span className="material-icons">storefront</span>
                      <span className="font-bold">Venta de mostrador (Sin registro)</span>
                    </div>
                  )}
                </div>

                <div className={styles.infoCard}>
                  <span className="modalSectionTitlePremium">Datos de la Operación</span>
                  <div className="flex flex-col gap-xs mt-2">
                    <div className="modalInfoBoxPremium">
                      <div className="flex flex-col w-full">
                        <span className="text-xxs text-secondary uppercase font-bold">Fecha y Hora</span>
                        <span className="text-sm font-bold">{formatFecha(detalle.fyh_creacion)}</span>
                      </div>
                    </div>
                    
                    <div className="modalInfoBoxPremium">
                      <div className="grid grid-cols-2 w-full gap-md">
                        <div>
                          <span className="text-xxs text-secondary uppercase font-bold">Método Pago</span>
                          <p className="text-sm font-bold m-0" style={{ textTransform: 'capitalize' }}>{detalle.metodo_pago}</p>
                        </div>
                        <div>
                          <span className="text-xxs text-secondary uppercase font-bold">Entrega</span>
                          <p className="text-sm font-bold m-0">{detalle.envio?.tipo_entrega || '—'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info de Cancelación si aplica */}
              {detalle.estado === 'cancelada' && detalle.cancelacion && (
                <div className="modalAlertErrorPremium mb-4 p-lg" style={{ display: 'block' }}>
                  <span className="modalSectionTitlePremium" style={{ color: 'var(--color-error)', borderColor: 'rgba(var(--color-error-rgb), 0.2)' }}>Registro de Cancelación</span>
                  <div className="modalFormGridPremium mt-4">
                    <div>
                      <p className="m-0 text-xxs font-bold opacity-70 uppercase mb-1">Responsable</p>
                      <p className="m-0 text-sm font-bold">{detalle.cancelacion.cancelado_por || 'Sistema'}</p>
                      <p className="m-0 text-xxs opacity-70">{formatFecha(detalle.cancelacion.fyh_cancelacion)}</p>
                    </div>
                    <div>
                      <p className="m-0 text-xxs font-bold opacity-70 uppercase mb-1">Motivo</p>
                      <p className="m-0 text-sm italic">"{detalle.cancelacion.motivo || 'No especificado'}"</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabla de Productos */}
              <div className="mb-4">
                <span className="modalSectionTitlePremium">Detalle de Productos ({detalle.items.length})</span>
                <div className="mt-2">
                  <AdminDataTable
                    data={detalle.items}
                    columns={columns}
                    sorting={sorting}
                    onSortingChange={setSorting}
                    columnOrder={columnOrder}
                    onColumnOrderChange={setColumnOrder}
                    pagination={pagination}
                    onPaginationChange={setPagination}
                    totalItems={detalle.items.length}
                    itemLabel="productos"
                    manualPagination={false}
                    emptyMessage="No hay productos en esta venta"
                  />
                </div>
              </div>

              {/* Resumen Total */}
              <div className="flex mt-6">
                <div className="modalTotalBoxPremium ml-auto" style={{ minWidth: '220px' }}>
                  <span className="modalTotalLabelPremium">Total de la Venta</span>
                  <span className="modalTotalValuePremium">{formatMonto(total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modalFooterPremium">
          {puedeCancelar && (
            <button 
              className="btnPremium btnDangerPremium mr-auto" 
              onClick={() => setMostrarCancelacionModal(true)}
            >
              <span className="material-icons">cancel</span>
              Anular Venta
            </button>
          )}

          <div className={`${styles.actionsContainer} flex gap-md`}>
            {puedeDescargarPdf && (
              <button 
                className="btnPremium btnSecondaryPremium" 
                onClick={handleDescargar}
                disabled={descargando}
                title="Descargar Comprobante PDF"
              >
                <span className="material-icons">{descargando ? 'hourglass_empty' : 'file_download'}</span>
                <span>PDF</span>
              </button>
            )}

            {puedeEnviarEmail && (
              <button 
                className="btnPremium btnSecondaryPremium" 
                onClick={handleEnviarEmail}
                disabled={enviando}
                title="Enviar Comprobante por Email"
              >
                <span className="material-icons">{enviando ? 'hourglass_empty' : 'email'}</span>
                <span>Enviar</span>
              </button>
            )}

            <button className="btnPremium btnPrimaryPremium" onClick={onClose} style={{ minWidth: '100px' }}>
              Cerrar
            </button>
          </div>
        </div>
      </PremiumModal>

      {/* Modal de Cancelación */}
      {mostrarCancelacionModal && detalle && (
        <CancelacionModal
          idVenta={detalle.id_venta}
          nroVenta={detalle.nro_venta}
          onClose={() => setMostrarCancelacionModal(false)}
          onCancelada={() => {
            setMostrarCancelacionModal(false);
            if (onCancelada) onCancelada();
            onClose(); // Cerrar también el detalle
          }}
        />
      )}
    </>
  );
};

export default DetalleVentaModal;
