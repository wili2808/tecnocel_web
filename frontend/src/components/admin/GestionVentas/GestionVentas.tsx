import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import DetalleVentaModal from './DetalleVentaModal';
import RegistrarVentaModal from './RegistrarVentaModal';
import CancelacionModal from './CancelacionModal';
import GestionEnvios from './GestionEnvios';
import GestionRetiros from './GestionRetiros';
import adminVentaService from '../../../services/adminVentaService';
import envioAdminService from '../../../services/envioAdminService';
import usuarioService from '../../../services/usuarioService';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { AdminEmptyState, AdminSectionActions, AdminStatCard, AdminSearch, AdminPagination } from '../common';
import styles from './GestionVentas.module.css';
import type { VentaListItem, EstadisticasVentas, FiltrosVentasAdmin } from '../../../types/venta';

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ── Tipos internos ───────────────────────────────────────────────────────────

const LIMIT = 10;

// ── Utilidades ────────────────────────────────────────────────────────────────

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatMonto = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatIngreso = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${formatMonto(n)}`;
};

const badgeEstado = (estado: string) => {
  const map: Record<string, string> = {
    completada: styles.badgeCompletada,
    cancelada: styles.badgeCancelada,
    pendiente: styles.badgePendiente,
  };
  return `${styles.badge} ${map[estado] || ''}`;
};

const badgeTipo = (tipo: string) =>
  `${styles.badge} ${tipo === 'web' ? styles.badgeWeb : styles.badgeManual}`;

const DraggableTableHeader = ({ header, className }: { header: any; className?: string }) => {
  const { attributes, isDragging, listeners, setNodeRef, transform } = useSortable({
    id: header.column.id,
  });

  const style: React.CSSProperties = {
    opacity: isDragging ? 0.8 : 1,
    position: 'relative',
    transform: CSS.Translate.toString(transform),
    transition: 'width transform 0.2s ease-in-out',
    whiteSpace: 'nowrap',
    width: header.column.getSize(),
    zIndex: isDragging ? 1 : 0,
    cursor: 'default',
  };

  const isSorted = header.column.getIsSorted();
  const sortIcon = isSorted ? (isSorted === 'desc' ? 'arrow_downward' : 'arrow_upward') : 'unfold_more';
  const canSort = header.column.getCanSort();

  return (
    <th ref={setNodeRef} style={style} className={className || styles.sortableHeader}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span 
          {...attributes} 
          {...listeners} 
          className="material-icons" 
          style={{ fontSize: '16px', color: '#aaa', cursor: 'grab' }}
          title="Arrastrar para mover columna"
        >
          drag_indicator
        </span>
        <div 
          style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px', cursor: canSort ? 'pointer' : 'default' }}
          onClick={header.column.getToggleSortingHandler()}
        >
          <span className={styles.sortableHeaderContent}>
            {flexRender(header.column.columnDef.header, header.getContext())}
            {canSort && (
              <span className={`material-icons ${styles.sortIcon} ${isSorted ? styles.sortIconActive : ''}`}>
                {sortIcon}
              </span>
            )}
          </span>
        </div>
      </div>
    </th>
  );
};

// ── Componente ────────────────────────────────────────────────────────────────

const GestionVentas: React.FC = () => {
  const { tienePermiso } = useAuth();
  const puedeVer = tienePermiso('ver_ventas');
  const puedeVerEnvios = tienePermiso('ver_envios');
  const puedeGestionarEnvios = tienePermiso('gestionar_envios');
  const puedeVerRetiros = tienePermiso('ver_retiros');
  const puedeGestionarRetiros = tienePermiso('gestionar_retiros');
  const puedeCrear = tienePermiso('crear_venta');
  const puedeVerConfiguracion = tienePermiso('ver_configuracion');
  const puedeEditarConfiguracion = tienePermiso('editar_configuracion');
  const { showNotification } = useNotification();

  // ── Estado de datos ────────────────────────────────────────────────────────
  const [ventas, setVentas] = useState<VentaListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<EstadisticasVentas | null>(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoStats, setCargandoStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Estado de filtros ──────────────────────────────────────────────────────
  const [filtros, setFiltros] = useState<FiltrosVentasAdmin>({});
  const [vendedores, setVendedores] = useState<{ id_usuario: number; nombres: string }[]>([]);

  // ── Paginación y ordenación TanStack ───────────────────────────────────────
  const [offset, setOffset] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'fecha', desc: true }]);
  
  const [columnOrder, setColumnOrder] = useState<string[]>([
    'nro_venta', 'fecha', 'vendedor', 'cliente', 'items', 'total_pagado', 'metodo', 'tipo', 'estado'
  ]);

  const pagination = useMemo<PaginationState>(() => ({
    pageIndex: Math.floor(offset / LIMIT),
    pageSize: LIMIT,
  }), [offset]);

  const setPagination = useCallback((updater: any) => {
    const nextPagination = typeof updater === 'function' ? updater(pagination) : updater;
    setOffset(nextPagination.pageIndex * LIMIT);
  }, [pagination]);

  // ── Cotización USD ─────────────────────────────────────────────────────────
  const [tipoCambio, setTipoCambio] = useState<number>(1200);
  const [tipoCambioFecha, setTipoCambioFecha] = useState<string | null>(null);
  const [editandoCambio, setEditandoCambio] = useState(false);
  const [tipoCambioInput, setTipoCambioInput] = useState('');
  const [guardandoCambio, setGuardandoCambio] = useState(false);

  // ── Tabs ───────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'ventas' | 'envios' | 'retiros'>('ventas');
  const [enviosPendientes, setEnviosPendientes] = useState(0);
  const [retirosPendientes, setRetirosPendientes] = useState(0);

  // ── Modales ────────────────────────────────────────────────────────────────
  const [idDetalleAbierto, setIdDetalleAbierto] = useState<number | null>(null);
  const [mostrarRegistrar, setMostrarRegistrar] = useState(false);
  const [cancelacionModal, setCancelacionModal] = useState<{ id: number; nro: string } | null>(null);

  // ── Guards de carga ────────────────────────────────────────────────────────
  const cargandoRef = useRef(false);

  // ── Cargar tipo de cambio ──────────────────────────────────────────────────
  const cargarTipoCambio = useCallback(async () => {
    try {
      const data = await adminVentaService.getTipoCambio();
      setTipoCambio(data.valor);
      setTipoCambioFecha(data.fyh_actualizacion);
    } catch {
      /* no crítico */
    }
  }, []);

  // ── Cargar vendedores ───────────────────────────────────────────────────────
  const cargarVendedores = useCallback(async () => {
    try {
      const data = await usuarioService.listarUsuarios(100, 0);
      setVendedores(data.usuarios || []);
    } catch {
      /* no crítico */
    }
  }, []);

  // ── Cargar conteo inicial de retiros pendientes ────────────────────────────
  const cargarRetirosPendientes = useCallback(async () => {
    try {
      const r = await envioAdminService.listarRetiros({ estado_envio: 'pendiente', limit: 1, offset: 0 });
      setRetirosPendientes(r.total);
    } catch {
      /* no crítico */
    }
  }, []);

  // ── Guardar tipo de cambio ─────────────────────────────────────────────────
  const guardarCambio = async () => {
    const valor = parseFloat(tipoCambioInput);
    if (isNaN(valor) || valor < 1) {
      showNotification('Ingrese un valor válido mayor a 0', 'warning');
      return;
    }
    setGuardandoCambio(true);
    try {
      await adminVentaService.updateTipoCambio(valor);
      setTipoCambio(valor);
      setTipoCambioFecha(new Date().toISOString());
      setEditandoCambio(false);
      showNotification('Cotización actualizada correctamente', 'success');
    } catch (err: any) {
      showNotification(err.message || 'Error al actualizar cotización', 'error');
    } finally {
      setGuardandoCambio(false);
    }
  };

  // ── Cargar estadísticas ────────────────────────────────────────────────────
  const cargarStats = useCallback(async () => {
    setCargandoStats(true);
    try {
      const data = await adminVentaService.obtenerEstadisticas();
      setStats(data);
    } catch {
      // no es crítico, se puede omitir
    } finally {
      setCargandoStats(false);
    }
  }, []);

  // ── Cargar ventas ──────────────────────────────────────────────────────────
  const cargarVentas = useCallback(
    async (f: FiltrosVentasAdmin, off: number) => {
      if (cargandoRef.current) return;
      cargandoRef.current = true;
      setCargando(true);
      setError(null);
      try {
        const res = await adminVentaService.listarVentas(f, LIMIT, off);
        setVentas(res.ventas);
        setTotal(res.total);
      } catch (err: any) {
        setError(err.message || 'Error al obtener ventas');
        showNotification(err.message || 'Error al obtener ventas', 'error');
      } finally {
        setCargando(false);
        cargandoRef.current = false;
      }
    },
    [showNotification],
  );

  // ── Carga inicial ──────────────────────────────────────────────────────────
  // ── Cargar conteo inicial de envíos pendientes ──────────────────────────
  const cargarEnviosPendientes = useCallback(async () => {
    try {
      const r = await envioAdminService.listarEnvios({ estado_envio: 'pendiente', limit: 1, offset: 0 });
      setEnviosPendientes(r.total);
    } catch {
      /* no crítico */
    }
  }, []);

  useEffect(() => {
    cargarStats();
    cargarTipoCambio();
    cargarVendedores();
    if (puedeVerEnvios) {
      cargarEnviosPendientes();
    }
    if (puedeVerRetiros) {
      cargarRetirosPendientes();
    }
  }, [
    cargarStats,
    cargarTipoCambio,
    cargarVendedores,
    cargarRetirosPendientes,
    cargarEnviosPendientes,
    puedeVerEnvios,
    puedeVerRetiros,
  ]);

  useEffect(() => {
    cargarVentas(filtros, offset);
  }, [cargarVentas, filtros, offset]);

  // ── Limpiar filtros ────────────────────────────────────────────────────────
  const limpiarFiltros = () => {
    setFiltros({});
    setOffset(0);
  };

  // ── Refresh tras acciones ──────────────────────────────────────────────────
  const refreshTodo = () => {
    cargarVentas(filtros, offset);
    cargarStats();
  };

  // === Columnas TanStack ===
  const columns = useMemo<ColumnDef<VentaListItem>[]>(() => [
    {
      accessorKey: 'nro_venta',
      id: 'nro_venta',
      header: 'N° Venta',
      enableSorting: true,
      cell: info => <span className={styles.nroVenta}>{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'fyh_creacion',
      id: 'fecha',
      header: 'Fecha',
      enableSorting: true,
      cell: info => formatFecha(info.getValue() as string),
    },
    {
      accessorKey: 'nombre_vendedor',
      id: 'vendedor',
      header: 'Vendedor',
      enableSorting: false,
      cell: info => info.getValue() ? (
        <span className={styles.vendedorNombre}>{info.getValue() as string}</span>
      ) : (
        <span className={styles.sinVendedor}>—</span>
      ),
    },
    {
      accessorKey: 'nombre_cliente',
      id: 'cliente',
      header: 'Cliente',
      enableSorting: true,
      cell: info => info.getValue() ? (
        <span className={styles.clienteNombre}>{info.getValue() as string}</span>
      ) : (
        <span className={styles.sinCliente}>Mostrador</span>
      ),
    },
    {
      accessorKey: 'cantidad_items',
      id: 'items',
      header: 'Items',
      enableSorting: false,
      cell: info => info.getValue() as number,
    },
    {
      accessorKey: 'total_pagado',
      id: 'total_pagado',
      header: 'Total',
      enableSorting: true,
      cell: info => {
        const venta = info.row.original;
        return (
          <div className={styles.textRight}>
            <span className={styles.totalCell}>
              ${formatMonto(venta.total_pagado)}
              <span
                style={{
                  marginLeft: '6px',
                  fontSize: '0.75rem',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  backgroundColor: venta.moneda === 'USD' ? '#dbeafe' : '#cffafe',
                  color: venta.moneda === 'USD' ? '#1e40af' : '#0369a1',
                  fontWeight: '500',
                }}
              >
                {venta.moneda === 'USD' ? 'USD' : 'ARS'}
              </span>
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'metodo_pago',
      id: 'metodo',
      header: 'Método',
      enableSorting: false,
      cell: info => adminVentaService.formatearMetodoPago(info.getValue() as string),
    },
    {
      accessorKey: 'tipo_venta',
      id: 'tipo',
      header: 'Tipo',
      enableSorting: false,
      cell: info => (
        <span className={badgeTipo(info.getValue() as string)}>
          {adminVentaService.formatearTipoVenta(info.getValue() as string)}
        </span>
      ),
    },
    {
      accessorKey: 'estado',
      id: 'estado',
      header: 'Estado',
      enableSorting: true,
      cell: info => (
        <span className={badgeEstado(info.getValue() as string)}>
          {adminVentaService.formatearEstado(info.getValue() as string)}
        </span>
      ),
    },
  ], []);

  const table = useReactTable({
    data: ventas,
    columns,
    pageCount: Math.ceil(total / LIMIT),
    state: {
      pagination,
      sorting,
      columnOrder,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnOrderChange: setColumnOrder,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setColumnOrder((order) => {
        const oldIndex = order.indexOf(active.id as string);
        const newIndex = order.indexOf(over.id as string);
        return arrayMove(order, oldIndex, newIndex);
      });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!puedeVer) {
    return (
      <div className={styles.container}>
        <AdminEmptyState
          icon="lock"
          title="Sin acceso a ventas"
          message="Tu rol actual no tiene permisos para consultar ventas, envíos ni retiros desde este módulo."
          tone="warning"
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <AdminSectionActions
        lead={null}
        actions={
          <button
            className={styles.crearButton}
            onClick={() => setMostrarRegistrar(true)}
            disabled={!puedeCrear}
            title={!puedeCrear ? 'Sin permisos para registrar ventas' : undefined}
          >
            <span className="material-icons">add</span>
            Registrar Venta
          </button>
        }
      />

      <div className={styles.statsBar}>
        {cargandoStats ? (
          <>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={styles.statsLoading} />
            ))}
          </>
        ) : (
          <>
            <AdminStatCard
              icon="today"
              label="Ventas hoy"
              value={stats?.ventas_hoy ?? 0}
              variant="flush"
              className={styles.statCard}
            />
            <AdminStatCard
              icon="date_range"
              label="Esta semana"
              value={stats?.ventas_semana ?? 0}
              variant="flush"
              className={styles.statCard}
            />
            <AdminStatCard
              icon="calendar_month"
              label="Este mes"
              value={stats?.ventas_mes ?? 0}
              variant="flush"
              className={styles.statCard}
            />
            <AdminStatCard
              icon="payments"
              label="Ingresos del mes"
              value={formatIngreso(stats?.ingresos_mes ?? 0)}
              detail={stats ? `$${formatMonto(stats.ingresos_mes)}` : '—'}
              tone="success"
              variant="flush"
              className={styles.statCard}
            />
          </>
        )}
      </div>

      {/* Tabs */}
      <div className={styles.tabsBar}>
        <button
          className={`${styles.tab} ${activeTab === 'ventas' ? styles.tabActivo : ''}`}
          onClick={() => setActiveTab('ventas')}
        >
          <span className="material-icons">receipt_long</span>
          Ventas
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'envios' ? styles.tabActivo : ''}`}
          onClick={() => setActiveTab('envios')}
          disabled={!puedeVerEnvios}
          title={!puedeVerEnvios ? 'Sin permisos para ver envíos' : undefined}
        >
          <span className="material-icons">local_shipping</span>
          Envíos a domicilio
          {puedeVerEnvios && enviosPendientes > 0 && <span className={styles.tabBadge}>{enviosPendientes}</span>}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'retiros' ? styles.tabActivo : ''}`}
          onClick={() => setActiveTab('retiros')}
          disabled={!puedeVerRetiros}
          title={!puedeVerRetiros ? 'Sin permisos para ver retiros' : undefined}
        >
          <span className="material-icons">store</span>
          Retiro en tienda
          {puedeVerRetiros && retirosPendientes > 0 && <span className={styles.tabBadge}>{retirosPendientes}</span>}
        </button>
      </div>

      {activeTab === 'envios' && puedeVerEnvios && (
        <GestionEnvios onPendientesChange={setEnviosPendientes} puedeGestionar={puedeGestionarEnvios} />
      )}

      {activeTab === 'retiros' && puedeVerRetiros && (
        <GestionRetiros onPendientesChange={setRetirosPendientes} puedeGestionar={puedeGestionarRetiros} />
      )}

      {activeTab === 'ventas' && (
        <>
          {/* Cotización del dólar */}
          {puedeVerConfiguracion && (
            <div className={styles.cotizacionCard}>
              <div className={styles.cotizacionHeader}>
                <span className="material-icons">attach_money</span>
                <span className={styles.cotizacionTitle}>Cotización USD</span>
                {tipoCambioFecha && (
                  <span className={styles.cotizacionFecha}>
                    Actualizada:{' '}
                    {new Date(tipoCambioFecha).toLocaleString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>

              {editandoCambio ? (
                <div className={styles.cotizacionEdit}>
                  <span className={styles.cotizacionPrefix}>1 USD =</span>
                  <input
                    type="number"
                    min={1}
                    step={0.01}
                    className={styles.cotizacionInput}
                    value={tipoCambioInput}
                    onChange={(e) => setTipoCambioInput(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') guardarCambio();
                      if (e.key === 'Escape') setEditandoCambio(false);
                    }}
                  />
                  <span className={styles.cotizacionSuffix}>ARS</span>
                  <button className={styles.cotizacionSave} onClick={guardarCambio} disabled={guardandoCambio}>
                    <span className="material-icons">{guardandoCambio ? 'hourglass_empty' : 'check'}</span>
                  </button>
                  <button className={styles.cotizacionCancel} onClick={() => setEditandoCambio(false)}>
                    <span className="material-icons">close</span>
                  </button>
                </div>
              ) : (
                <div className={styles.cotizacionDisplay}>
                  <span className={styles.cotizacionValor}>
                    1 USD = {tipoCambio.toLocaleString('es-AR', { minimumFractionDigits: 2 })} ARS
                  </span>
                  <button
                    className={styles.cotizacionEditBtn}
                    onClick={() => {
                      setTipoCambioInput(tipoCambio.toString());
                      setEditandoCambio(true);
                    }}
                    disabled={!puedeEditarConfiguracion}
                    title={
                      !puedeEditarConfiguracion ? 'Sin permisos para modificar configuración' : 'Modificar cotización'
                    }
                  >
                    <span className="material-icons">edit</span>
                    Modificar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Barra de filtros */}
          <div className={styles.filterBar}>
            {/* Fila 1: fechas, estado, tipo, método de pago */}
            <div className={styles.filterRow}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Desde</label>
                <input
                  type="date"
                  className={styles.filterInput}
                  value={filtros.fecha_inicio || ''}
                  onChange={(e) => setFiltros((prev) => ({ ...prev, fecha_inicio: e.target.value || undefined }))}
                />
              </div>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Hasta</label>
                <input
                  type="date"
                  className={styles.filterInput}
                  value={filtros.fecha_fin || ''}
                  onChange={(e) => setFiltros((prev) => ({ ...prev, fecha_fin: e.target.value || undefined }))}
                />
              </div>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Tipo</label>
                <select
                  className={styles.filterSelect}
                  value={filtros.tipo_venta || ''}
                  onChange={(e) =>
                    setFiltros((prev) => ({ ...prev, tipo_venta: e.target.value as FiltrosVentasAdmin['tipo_venta'] }))
                  }
                >
                  <option value="">Todos</option>
                  <option value="web">Web</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Vendedor</label>
                <select
                  className={styles.filterSelect}
                  value={filtros.id_vendedor || ''}
                  onChange={(e) =>
                    setFiltros((prev) => ({ ...prev, id_vendedor: e.target.value ? parseInt(e.target.value) : '' }))
                  }
                >
                  <option value="">Todos</option>
                  {vendedores.map((v) => (
                    <option key={v.id_usuario} value={v.id_usuario}>
                      {v.nombres}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Estado</label>
                <select
                  className={styles.filterSelect}
                  value={filtros.estado || ''}
                  onChange={(e) =>
                    setFiltros((prev) => ({ ...prev, estado: e.target.value as FiltrosVentasAdmin['estado'] }))
                  }
                >
                  <option value="">Todos</option>
                  <option value="completada">Completada</option>
                  <option value="cancelada">Cancelada</option>
                  <option value="pendiente">Pendiente</option>
                </select>
              </div>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Método pago</label>
                <select
                  className={styles.filterSelect}
                  value={filtros.metodo_pago || ''}
                  onChange={(e) =>
                    setFiltros((prev) => ({
                      ...prev,
                      metodo_pago: e.target.value as FiltrosVentasAdmin['metodo_pago'],
                    }))
                  }
                >
                  <option value="">Todos</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="qr">QR</option>
                </select>
              </div>
            </div>

            {/* Fila 2: búsqueda + acciones */}
            <div className={styles.filterRow}>
              <div className={`${styles.filterGroup} ${styles.filterGroupWide}`}>
                <label className={styles.filterLabel}>Búsqueda</label>
                <AdminSearch
                  value={filtros.search || ''}
                  placeholder="N° venta, cliente..."
                  onChange={(val) => {
                    setFiltros((prev) => ({ ...prev, search: val || undefined }));
                    setOffset(0);
                  }}
                />
              </div>
              <div className={styles.filterActions}>
                <button className={styles.clearButton} onClick={limpiarFiltros}>
                  <span className="material-icons">clear</span>
                  Limpiar
                </button>
              </div>
            </div>
          </div>

          {/* Tabla */}
          {cargando ? (
            <AdminEmptyState
              icon="hourglass_empty"
              title="Cargando ventas"
              message="Estamos preparando el listado y las estadísticas operativas de ventas."
              className={styles.loadingState}
            />
          ) : error ? (
            <AdminEmptyState
              icon="error_outline"
              title="No pudimos cargar las ventas"
              message={error}
              actionLabel="Reintentar"
              onAction={() => cargarVentas(filtros, offset)}
              tone="danger"
              className={styles.errorState}
            />
          ) : (
            <>
              <div className={styles.tableWrapper}>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <table className={styles.table}>
                    <thead>
                      {table.getHeaderGroups().map(headerGroup => (
                        <tr key={headerGroup.id}>
                          <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                            {headerGroup.headers.map(header => (
                              <DraggableTableHeader 
                                key={header.id} 
                                header={header} 
                              />
                            ))}
                          </SortableContext>
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {table.getRowModel().rows.length === 0 ? (
                        <tr>
                          <td colSpan={10} className={styles.emptyMessage}>
                            No hay ventas que coincidan con los filtros aplicados
                          </td>
                        </tr>
                      ) : (
                        table.getRowModel().rows.map((row) => (
                          <tr 
                            key={row.id}
                            onClick={() => setIdDetalleAbierto(row.original.id_venta)}
                            className={styles.clickableRow}
                          >
                            {row.getVisibleCells().map(cell => (
                              <td key={cell.id}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </DndContext>
              </div>
              <AdminPagination
                total={total}
                limit={LIMIT}
                offset={offset}
                onPageChange={setOffset}
                itemLabel="ventas"
              />

            </>
          )}

          {/* Modal detalle */}
          {idDetalleAbierto !== null && (
            <DetalleVentaModal
              idVenta={idDetalleAbierto}
              onClose={() => setIdDetalleAbierto(null)}
              onCancelada={refreshTodo}
            />
          )}

          {/* Modal registrar venta */}
          {mostrarRegistrar && (
            <RegistrarVentaModal
              onClose={() => setMostrarRegistrar(false)}
              onRegistrada={refreshTodo}
              tipoCambioUsd={tipoCambio}
            />
          )}

          {/* Modal cancelar venta (desde tabla) */}
          {cancelacionModal && (
            <CancelacionModal
              idVenta={cancelacionModal.id}
              nroVenta={cancelacionModal.nro}
              onClose={() => setCancelacionModal(null)}
              onCancelada={() => {
                setCancelacionModal(null);
                refreshTodo();
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default GestionVentas;
