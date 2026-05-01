import React, { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './Reportes.module.css';
import { reporteService } from '../../../services/reporteService';
import { AdminEmptyState, AdminSectionActions, AdminStatCard, AdminSurface, AdminPagination } from '../common';
import type {
  ReporteTab,
  FiltrosReporte,
  FiltrosReporteVentas,
  ReporteVentasResponse,
  ReporteProductosResponse,
  ReporteClientesResponse,
  ReporteCancelacionesResponse,
  ReporteVendedoresResponse,
} from '../../../types/reporte';

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import type { ColumnDef, SortingState, PaginationState } from '@tanstack/react-table';

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

interface TabConfig {
  id: ReporteTab;
  label: string;
  icon: string;
}

const TABS: TabConfig[] = [
  { id: 'ventas', label: 'Ventas', icon: 'point_of_sale' },
  { id: 'vendedores', label: 'Vendedores', icon: 'group' },
  { id: 'productos', label: 'Productos', icon: 'inventory_2' },
  { id: 'clientes', label: 'Clientes', icon: 'people' },
  { id: 'cancelaciones', label: 'Cancelaciones', icon: 'cancel' },
];

// HELPERS

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('es-AR').format(value);
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatUSD = (value: number | null): string => {
  if (value === null || value === undefined) return 'N/D';
  return `$ ${new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
};

// Helper para renderizar monto con badge de moneda (JSX)
const MontoConBadge: React.FC<{ valor: string; moneda: 'ARS' | 'USD' }> = ({ valor, moneda }) => (
  <span className={styles.montoBadgeWrapper}>
    <span>{valor}</span>
    <span className={`${styles.montoBadge} ${moneda === 'USD' ? styles.montoBadgeUsd : styles.montoBadgeArs}`}>
      {moneda}
    </span>
  </span>
);

const toLocalDateInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const getDefaultDates = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    fecha_inicio: toLocalDateInput(firstDay),
    fecha_fin: toLocalDateInput(now),
  };
};

// Componente Drag & Drop para las cabeceras de todas las tablas
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

// COMPONENTE PRINCIPAL

const Reportes: React.FC = memo(() => {
  const { tienePermiso } = useAuth();
  const puedeVer = tienePermiso('ver_reportes');
  const puedeExportar = tienePermiso('exportar_reportes');

  const [activeTab, setActiveTab] = useState<ReporteTab>('ventas');
  const [filtros, setFiltros] = useState<FiltrosReporte>({
    ...getDefaultDates(),
    agrupacion: 'dia',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Datos de cada reporte
  const [ventasData, setVentasData] = useState<ReporteVentasResponse | null>(null);
  const [productosData, setProductosData] = useState<ReporteProductosResponse | null>(null);
  const [clientesData, setClientesData] = useState<ReporteClientesResponse | null>(null);
  const [cancelacionesData, setCancelacionesData] = useState<ReporteCancelacionesResponse | null>(null);
  const [vendedoresData, setVendedoresData] = useState<ReporteVendedoresResponse | null>(null);

  // Cargar datos según pestaña activa
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      switch (activeTab) {
        case 'ventas': {
          const filtrosVentas: FiltrosReporteVentas = {
            ...filtros,
          };
          const data = await reporteService.obtenerReporteVentas(filtrosVentas);
          setVentasData(data);
          break;
        }
        case 'vendedores': {
          const data = await reporteService.obtenerReporteVendedores(filtros);
          setVendedoresData(data);
          break;
        }
        case 'productos': {
          const data = await reporteService.obtenerReporteProductos(filtros);
          setProductosData(data);
          break;
        }
        case 'clientes': {
          const data = await reporteService.obtenerReporteClientes(filtros);
          setClientesData(data);
          break;
        }
        case 'cancelaciones': {
          const data = await reporteService.obtenerReporteCancelaciones(filtros);
          setCancelacionesData(data);
          break;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar el reporte');
    } finally {
      setLoading(false);
    }
  }, [activeTab, filtros]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleTabChange = useCallback((tab: ReporteTab) => {
    setActiveTab(tab);
  }, []);

  const handleFiltroChange = useCallback((campo: keyof FiltrosReporte, valor: string) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }, []);

  const handleLimpiarFiltros = useCallback(() => {
    setFiltros({ ...getDefaultDates(), agrupacion: 'dia' });
  }, []);

  const handleExportar = useCallback(async () => {
    setExporting(true);
    try {
      await reporteService.exportarCSV(activeTab, filtros);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al exportar');
    } finally {
      setExporting(false);
    }
  }, [activeTab, filtros]);

  const activeKpiStrip = useMemo(() => {
    switch (activeTab) {
      case 'ventas':
        if (!ventasData) return null;
        return (
          <div className={styles.kpiGrid}>
            <AdminStatCard
              icon="receipt_long"
              label="Total ventas"
              value={formatNumber(ventasData.resumen.total_ventas)}
              detail={`ARS: ${ventasData.resumen.ventas_ars} | USD: ${ventasData.resumen.ventas_usd}`}
              variant="flush"
              className={styles.kpiCard}
            />
            <AdminStatCard
              icon="payments"
              label="Ingresos ARS"
              value={formatCurrency(ventasData.resumen.ingresos_ars)}
              detail={formatUSD(ventasData.resumen.ingresos_usd)}
              tone="success"
              variant="flush"
              className={styles.kpiCard}
            />
            <AdminStatCard
              icon="confirmation_number"
              label="Ticket promedio"
              value={formatCurrency(ventasData.resumen.ticket_promedio)}
              variant="flush"
              className={styles.kpiCard}
            />
            <AdminStatCard
              icon="credit_card"
              label="Metodo mas usado"
              value={ventasData.resumen.metodo_mas_usado}
              variant="flush"
              className={styles.kpiCard}
            />
          </div>
        );
      case 'vendedores':
        if (!vendedoresData) return null;
        return (
          <div className={styles.kpiGrid}>
            <AdminStatCard
              icon="group"
              label="Vendedores activos"
              value={formatNumber(vendedoresData.resumen.total_vendedores_activos)}
              detail="en el periodo"
              variant="flush"
              className={styles.kpiCard}
            />
            <AdminStatCard
              icon="point_of_sale"
              label="Total ventas"
              value={formatNumber(vendedoresData.resumen.total_ventas_periodo)}
              detail="ventas en el periodo"
              variant="flush"
              className={styles.kpiCard}
            />
            <AdminStatCard
              icon="trending_up"
              label="Top ingresos"
              value={vendedoresData.resumen.vendedor_top_ingresos}
              variant="flush"
              className={styles.kpiCard}
            />
            <AdminStatCard
              icon="leaderboard"
              label="Top volumen"
              value={vendedoresData.resumen.vendedor_top_ventas}
              variant="flush"
              className={styles.kpiCard}
            />
          </div>
        );
      case 'productos':
        if (!productosData) return null;
        return (
          <div className={styles.kpiGrid}>
            <AdminStatCard
              icon="category"
              label="Productos vendidos"
              value={formatNumber(productosData.resumen.productos_distintos_vendidos)}
              detail="productos distintos"
              variant="flush"
              className={styles.kpiCard}
            />
            <AdminStatCard
              icon="inventory"
              label="Unidades totales"
              value={formatNumber(productosData.resumen.unidades_totales)}
              variant="flush"
              className={styles.kpiCard}
            />
            <AdminStatCard
              icon="attach_money"
              label="Ingreso total"
              value={formatCurrency(productosData.resumen.ingreso_total_productos)}
              variant="flush"
              className={styles.kpiCard}
            />
          </div>
        );
      case 'clientes':
        if (!clientesData) return null;
        return (
          <div className={styles.kpiGrid} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <AdminStatCard
              icon="person_add"
              label="Clientes nuevos"
              value={formatNumber(clientesData.resumen.clientes_nuevos_periodo)}
              detail="en el periodo"
              variant="flush"
              className={styles.kpiCard}
            />
            <AdminStatCard
              icon="shopping_bag"
              label="Con compras"
              value={formatNumber(clientesData.resumen.clientes_con_compras)}
              detail="clientes activos"
              variant="flush"
              className={styles.kpiCard}
            />
            <AdminStatCard
              icon="groups"
              label="Total registrados"
              value={formatNumber(clientesData.resumen.clientes_totales)}
              variant="flush"
              className={styles.kpiCard}
            />
          </div>
        );
      case 'cancelaciones':
        if (!cancelacionesData) return null;
        return (
          <div className={styles.kpiGrid} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <AdminStatCard
              icon="cancel"
              label="Total cancelaciones"
              value={formatNumber(cancelacionesData.resumen.total_cancelaciones)}
              tone="danger"
              variant="flush"
              className={styles.kpiCard}
            />
            <AdminStatCard
              icon="money_off"
              label="Monto cancelado"
              value={formatCurrency(cancelacionesData.resumen.monto_ars)}
              detail={formatUSD(cancelacionesData.resumen.monto_usd)}
              tone="danger"
              variant="flush"
              className={styles.kpiCard}
            />
            <AdminStatCard
              icon="percent"
              label="Tasa de cancelacion"
              value={`${cancelacionesData.resumen.tasa_cancelacion}%`}
              detail="del total de ventas"
              tone="warning"
              variant="flush"
              className={styles.kpiCard}
            />
          </div>
        );
      default:
        return null;
    }
  }, [activeTab, ventasData, vendedoresData, productosData, clientesData, cancelacionesData]);

  if (!puedeVer) {
    return (
      <div className={styles.container}>
        <AdminEmptyState
          icon="lock"
          title="Sin acceso a reportes"
          message="Tu rol actual no tiene permisos para consultar reportes analíticos ni exportaciones."
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
            className={styles.exportButton}
            onClick={handleExportar}
            disabled={exporting || loading || !puedeExportar}
            title={!puedeExportar ? 'Sin permisos para exportar reportes' : undefined}
          >
            <span className="material-icons">download</span>
            {exporting ? 'Exportando...' : 'Exportar CSV'}
          </button>
        }
      />

      {activeKpiStrip}

      {/* Tabs */}
      <div className={styles.tabBar}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            onClick={() => handleTabChange(tab.id)}
          >
            <span className="material-icons">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filtros */}
      <AdminSurface className={styles.filterShell} tone="muted">
        <div className={styles.filterBar}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Fecha inicio</label>
            <input
              type="date"
              className={styles.filterInput}
              value={filtros.fecha_inicio || ''}
              onChange={(e) => handleFiltroChange('fecha_inicio', e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Fecha fin</label>
            <input
              type="date"
              className={styles.filterInput}
              value={filtros.fecha_fin || ''}
              onChange={(e) => handleFiltroChange('fecha_fin', e.target.value)}
            />
          </div>
          {activeTab === 'ventas' && (
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Agrupacion</label>
              <select
                className={styles.filterSelect}
                value={filtros.agrupacion || 'dia'}
                onChange={(e) => handleFiltroChange('agrupacion', e.target.value)}
              >
                <option value="dia">Por dia</option>
                <option value="semana">Por semana</option>
                <option value="mes">Por mes</option>
              </select>
            </div>
          )}
          <div className={styles.filterActions}>
            <button className={styles.filterButton} onClick={cargarDatos}>
              <span className="material-icons">search</span>
              Filtrar
            </button>
            <button className={styles.clearButton} onClick={handleLimpiarFiltros}>
              <span className="material-icons">clear</span>
              Limpiar
            </button>
          </div>
        </div>
      </AdminSurface>

      {/* Estado de carga/error */}
      {loading && (
        <AdminEmptyState
          icon="hourglass_empty"
          title="Cargando reporte"
          message="Estamos preparando la vista analítica del periodo seleccionado."
          className={styles.stateBlock}
        />
      )}

      {error && !loading && (
        <AdminEmptyState
          icon="error_outline"
          title="No pudimos cargar el reporte"
          message={error}
          actionLabel="Reintentar"
          onAction={cargarDatos}
          tone="danger"
          className={styles.stateBlock}
        />
      )}

      {/* Contenido del reporte */}
      {!loading && !error && (
        <>
          {activeTab === 'ventas' && ventasData && <ReporteVentasTab data={ventasData} />}
          {activeTab === 'vendedores' && vendedoresData && <ReporteVendedoresTab data={vendedoresData} />}
          {activeTab === 'productos' && productosData && <ReporteProductosTab data={productosData} />}
          {activeTab === 'clientes' && clientesData && <ReporteClientesTab data={clientesData} />}
          {activeTab === 'cancelaciones' && cancelacionesData && <ReporteCancelacionesTab data={cancelacionesData} />}
        </>
      )}
    </div>
  );
});

// SUB-COMPONENTE: REPORTE DE VENTAS

const ReporteVentasTab: React.FC<{ data: ReporteVentasResponse }> = memo(({ data }) => {
  const { datos } = data;
  const [sorting, setSorting] = useState<SortingState>([{ id: 'periodo', desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [columnOrder, setColumnOrder] = useState<string[]>(['periodo', 'ventas', 'ingresos_ars', 'ingresos_usd', 'ticket_promedio']);

  const columns = useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: 'periodo', id: 'periodo', header: 'Periodo' },
    {
      accessorKey: 'ventas',
      id: 'ventas',
      header: () => <div className={styles.textRight}>Ventas</div>,
      cell: info => <div className={`${styles.textRight} ${styles.monoCell}`}>{formatNumber(info.getValue() as number)}</div>
    },
    {
      accessorKey: 'ingresos_ars',
      id: 'ingresos_ars',
      header: () => <div className={styles.textRight}>Ingresos ARS</div>,
      cell: info => (
        <div className={`${styles.textRight} ${styles.monoCell}`}>
          <MontoConBadge valor={formatCurrency(info.getValue() as number)} moneda="ARS" />
        </div>
      )
    },
    {
      accessorKey: 'ingresos_usd',
      id: 'ingresos_usd',
      header: () => <div className={styles.textRight}>Equiv. USD</div>,
      enableSorting: false,
      cell: info => (
        <div className={`${styles.textRight} ${styles.monoCell}`}>
          <MontoConBadge valor={formatUSD(info.getValue() as number)} moneda="USD" />
        </div>
      )
    },
    {
      accessorKey: 'ticket_promedio',
      id: 'ticket_promedio',
      header: () => <div className={styles.textRight}>Ticket Promedio</div>,
      cell: info => (
        <div className={`${styles.textRight} ${styles.monoCell}`}>
          <MontoConBadge valor={formatCurrency(info.getValue() as number)} moneda="ARS" />
        </div>
      )
    }
  ], []);

  const table = useReactTable({
    data: datos,
    columns,
    state: { sorting, pagination, columnOrder },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor));
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setColumnOrder((order) => arrayMove(order, order.indexOf(active.id as string), order.indexOf(over.id as string)));
    }
  };

  return (
    <div className={styles.tableWrapper}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <table className={styles.table}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                  {headerGroup.headers.map(header => (
                    <DraggableTableHeader key={header.id} header={header} />
                  ))}
                </SortableContext>
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr><td colSpan={5} className={styles.emptyMessage}>No hay datos para el periodo seleccionado</td></tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </DndContext>
      <AdminPagination
        total={datos.length}
        limit={pagination.pageSize}
        offset={pagination.pageIndex * pagination.pageSize}
        onPageChange={(newOffset) => {
          setPagination(prev => ({
            ...prev,
            pageIndex: Math.floor(newOffset / prev.pageSize)
          }));
        }}
        itemLabel="registros"
      />
    </div>
  );
});

// SUB-COMPONENTE: REPORTE DE VENDEDORES

const ReporteVendedoresTab: React.FC<{ data: ReporteVendedoresResponse }> = memo(({ data }) => {
  const { datos } = data;
  const [sorting, setSorting] = useState<SortingState>([{ id: 'ventas', desc: true }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [columnOrder, setColumnOrder] = useState<string[]>(['nombre', 'ventas', 'ingresos_ars', 'ingresos_usd', 'ticket_promedio', 'porcentaje_ventas']);

  const columns = useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: 'nombre', id: 'nombre', header: 'Vendedor', cell: info => <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>{info.getValue() as string}</span> },
    {
      accessorKey: 'ventas',
      id: 'ventas',
      header: () => <div className={styles.textRight}>Ventas</div>,
      cell: info => <div className={`${styles.textRight} ${styles.monoCell}`}>{formatNumber(info.getValue() as number)}</div>
    },
    {
      accessorKey: 'ingresos_ars',
      id: 'ingresos_ars',
      header: () => <div className={styles.textRight}>Ingresos ARS</div>,
      cell: info => <div className={`${styles.textRight} ${styles.monoCell}`}><MontoConBadge valor={formatCurrency(info.getValue() as number)} moneda="ARS" /></div>
    },
    {
      accessorKey: 'ingresos_usd',
      id: 'ingresos_usd',
      header: () => <div className={styles.textRight}>Equiv. USD</div>,
      enableSorting: false,
      cell: info => <div className={`${styles.textRight} ${styles.monoCell}`}><MontoConBadge valor={formatUSD(info.getValue() as number)} moneda="USD" /></div>
    },
    {
      accessorKey: 'ticket_promedio',
      id: 'ticket_promedio',
      header: () => <div className={styles.textRight}>Ticket Promedio</div>,
      cell: info => <div className={`${styles.textRight} ${styles.monoCell}`}><MontoConBadge valor={formatCurrency(info.getValue() as number)} moneda="ARS" /></div>
    },
    {
      accessorKey: 'porcentaje_ventas',
      id: 'porcentaje_ventas',
      header: () => <div className={styles.textRight}>% del Total</div>,
      cell: info => {
        const val = info.getValue() as number;
        return (
          <div className={`${styles.textRight} ${styles.monoCell}`}>
            <span style={{ fontFamily: 'var(--font-family-mono)', fontWeight: 600, color: val > 50 ? 'var(--color-primary)' : 'var(--text-primary)' }}>
              {val}%
            </span>
          </div>
        );
      }
    }
  ], []);

  const table = useReactTable({
    data: datos,
    columns,
    state: { sorting, pagination, columnOrder },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor));
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setColumnOrder((order) => arrayMove(order, order.indexOf(active.id as string), order.indexOf(over.id as string)));
    }
  };

  return (
    <div className={styles.tableWrapper}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <table className={styles.table}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                  {headerGroup.headers.map(header => (
                    <DraggableTableHeader key={header.id} header={header} />
                  ))}
                </SortableContext>
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr><td colSpan={6} className={styles.emptyMessage}>No hay datos para el periodo seleccionado</td></tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </DndContext>
      <AdminPagination
        total={datos.length}
        limit={pagination.pageSize}
        offset={pagination.pageIndex * pagination.pageSize}
        onPageChange={(newOffset) => {
          setPagination(prev => ({
            ...prev,
            pageIndex: Math.floor(newOffset / prev.pageSize)
          }));
        }}
        itemLabel="vendedores"
      />
    </div>
  );
});

// SUB-COMPONENTE: REPORTE DE PRODUCTOS

const ReporteProductosTab: React.FC<{ data: ReporteProductosResponse }> = memo(({ data }) => {
  const { mas_vendidos } = data;
  const [sorting, setSorting] = useState<SortingState>([{ id: 'unidades_vendidas', desc: true }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [columnOrder, setColumnOrder] = useState<string[]>(['nombre', 'codigo', 'categoria', 'marca', 'unidades_vendidas', 'ingreso_total', 'precio_venta_actual', 'stock_actual']);

  const columns = useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: 'nombre', id: 'nombre', header: 'Producto', cell: info => <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>{info.getValue() as string}</span> },
    { accessorKey: 'codigo', id: 'codigo', header: 'Codigo', enableSorting: false, cell: info => <span className={styles.monoCell}>{info.getValue() as string}</span> },
    { accessorKey: 'categoria', id: 'categoria', header: 'Categoria' },
    { accessorKey: 'marca', id: 'marca', header: 'Marca' },
    {
      accessorKey: 'unidades_vendidas',
      id: 'unidades_vendidas',
      header: () => <div className={styles.textRight}>Uds. Vendidas</div>,
      cell: info => <div className={`${styles.textRight} ${styles.monoCell}`}>{formatNumber(info.getValue() as number)}</div>
    },
    {
      accessorKey: 'ingreso_total',
      id: 'ingreso_total',
      header: () => <div className={styles.textRight}>Ingreso</div>,
      cell: info => <div className={`${styles.textRight} ${styles.monoCell}`}><MontoConBadge valor={formatCurrency(info.getValue() as number)} moneda="ARS" /></div>
    },
    {
      accessorKey: 'precio_venta_actual',
      id: 'precio_venta_actual',
      header: () => <div className={styles.textRight}>Precio Actual</div>,
      cell: info => <div className={`${styles.textRight} ${styles.monoCell}`}><MontoConBadge valor={formatCurrency(info.getValue() as number)} moneda="USD" /></div>
    },
    {
      accessorKey: 'stock_actual',
      id: 'stock_actual',
      header: () => <div className={styles.textRight}>Stock</div>,
      cell: info => <div className={`${styles.textRight} ${styles.monoCell}`}>{info.getValue() as number}</div>
    }
  ], []);

  const table = useReactTable({
    data: mas_vendidos,
    columns,
    state: { sorting, pagination, columnOrder },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor));
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setColumnOrder((order) => arrayMove(order, order.indexOf(active.id as string), order.indexOf(over.id as string)));
    }
  };

  return (
    <div className={styles.tableWrapper}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <table className={styles.table}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                  {headerGroup.headers.map(header => (
                    <DraggableTableHeader key={header.id} header={header} />
                  ))}
                </SortableContext>
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr><td colSpan={8} className={styles.emptyMessage}>No hay datos para el periodo seleccionado</td></tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </DndContext>
      <AdminPagination
        total={mas_vendidos.length}
        limit={pagination.pageSize}
        offset={pagination.pageIndex * pagination.pageSize}
        onPageChange={(newOffset) => {
          setPagination(prev => ({
            ...prev,
            pageIndex: Math.floor(newOffset / prev.pageSize)
          }));
        }}
        itemLabel="productos"
      />
    </div>
  );
});

// SUB-COMPONENTE: REPORTE DE CLIENTES

const ReporteClientesTab: React.FC<{ data: ReporteClientesResponse }> = memo(({ data }) => {
  const { top_clientes } = data;
  const [sorting, setSorting] = useState<SortingState>([{ id: 'monto_ars', desc: true }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [columnOrder, setColumnOrder] = useState<string[]>(['nombre', 'email', 'total_compras', 'monto_ars', 'monto_usd', 'ultima_compra']);

  const columns = useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: 'nombre', id: 'nombre', header: 'Cliente', cell: info => <span style={{ fontWeight: 'var(--font-weight-semibold)' }}>{info.getValue() as string}</span> },
    { accessorKey: 'email', id: 'email', header: 'Email' },
    {
      accessorKey: 'total_compras',
      id: 'total_compras',
      header: () => <div className={styles.textRight}>Compras</div>,
      cell: info => <div className={`${styles.textRight} ${styles.monoCell}`}>{formatNumber(info.getValue() as number)}</div>
    },
    {
      accessorKey: 'monto_ars',
      id: 'monto_ars',
      header: () => <div className={styles.textRight}>Monto ARS</div>,
      cell: info => <div className={`${styles.textRight} ${styles.monoCell}`}><MontoConBadge valor={formatCurrency(info.getValue() as number)} moneda="ARS" /></div>
    },
    {
      accessorKey: 'monto_usd',
      id: 'monto_usd',
      header: () => <div className={styles.textRight}>Equiv. USD</div>,
      enableSorting: false,
      cell: info => <div className={`${styles.textRight} ${styles.monoCell}`}><MontoConBadge valor={formatUSD(info.getValue() as number)} moneda="USD" /></div>
    },
    {
      accessorKey: 'ultima_compra',
      id: 'ultima_compra',
      header: 'Ultima Compra',
      cell: info => formatDate(info.getValue() as string)
    }
  ], []);

  const table = useReactTable({
    data: top_clientes,
    columns,
    state: { sorting, pagination, columnOrder },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor));
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setColumnOrder((order) => arrayMove(order, order.indexOf(active.id as string), order.indexOf(over.id as string)));
    }
  };

  return (
    <div className={styles.tableWrapper}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <table className={styles.table}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                  {headerGroup.headers.map(header => (
                    <DraggableTableHeader key={header.id} header={header} />
                  ))}
                </SortableContext>
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr><td colSpan={6} className={styles.emptyMessage}>No hay datos para el periodo seleccionado</td></tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </DndContext>
      <AdminPagination
        total={top_clientes.length}
        limit={pagination.pageSize}
        offset={pagination.pageIndex * pagination.pageSize}
        onPageChange={(newOffset) => {
          setPagination(prev => ({
            ...prev,
            pageIndex: Math.floor(newOffset / prev.pageSize)
          }));
        }}
        itemLabel="clientes"
      />
    </div>
  );
});

// SUB-COMPONENTE: REPORTE DE CANCELACIONES

const ReporteCancelacionesTab: React.FC<{ data: ReporteCancelacionesResponse }> = memo(({ data }) => {
  const { datos } = data;
  const [sorting, setSorting] = useState<SortingState>([{ id: 'fecha_cancelacion', desc: true }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [columnOrder, setColumnOrder] = useState<string[]>(['nro_venta', 'fecha_cancelacion', 'monto_ars', 'monto_usd', 'motivo', 'cancelado_por']);

  const columns = useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: 'nro_venta', id: 'nro_venta', header: 'Nro Venta', cell: info => <span className={styles.monoCell} style={{ color: 'var(--color-primary)' }}>{info.getValue() as string}</span> },
    { accessorKey: 'fecha_cancelacion', id: 'fecha_cancelacion', header: 'Fecha', cell: info => formatDate(info.getValue() as string) },
    {
      accessorKey: 'monto_ars',
      id: 'monto_ars',
      header: () => <div className={styles.textRight}>Monto ARS</div>,
      cell: info => <div className={`${styles.textRight} ${styles.monoCell}`}><MontoConBadge valor={formatCurrency(info.getValue() as number)} moneda="ARS" /></div>
    },
    {
      accessorKey: 'monto_usd',
      id: 'monto_usd',
      header: () => <div className={styles.textRight}>Equiv. USD</div>,
      enableSorting: false,
      cell: info => <div className={`${styles.textRight} ${styles.monoCell}`}><MontoConBadge valor={formatUSD(info.getValue() as number)} moneda="USD" /></div>
    },
    { accessorKey: 'motivo', id: 'motivo', header: 'Motivo' },
    { accessorKey: 'cancelado_por', id: 'cancelado_por', header: 'Cancelado por' }
  ], []);

  const table = useReactTable({
    data: datos,
    columns,
    state: { sorting, pagination, columnOrder },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor));
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setColumnOrder((order) => arrayMove(order, order.indexOf(active.id as string), order.indexOf(over.id as string)));
    }
  };

  return (
    <div className={styles.tableWrapper}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <table className={styles.table}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                  {headerGroup.headers.map(header => (
                    <DraggableTableHeader key={header.id} header={header} />
                  ))}
                </SortableContext>
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr><td colSpan={6} className={styles.emptyMessage}>No hay cancelaciones en el periodo seleccionado</td></tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </DndContext>
      <AdminPagination
        total={datos.length}
        limit={pagination.pageSize}
        offset={pagination.pageIndex * pagination.pageSize}
        onPageChange={(newOffset) => {
          setPagination(prev => ({
            ...prev,
            pageIndex: Math.floor(newOffset / prev.pageSize)
          }));
        }}
        itemLabel="cancelaciones"
      />
    </div>
  );
});

export default Reportes;
