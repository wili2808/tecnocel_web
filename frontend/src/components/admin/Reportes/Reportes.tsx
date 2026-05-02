import React, { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './Reportes.module.css';
import controlStyles from '../common/AdminControlStyles.module.css';
import { reporteService } from '../../../services/reporteService';
import {
  AdminEmptyState,
  AdminEntitySearchBar,
  AdminFilterPanel,
  AdminMetricsStrip,
  AdminDataTable,
} from '../common';
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

import type { ColumnDef, SortingState, PaginationState } from '@tanstack/react-table';

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
  const [searchTerm, setSearchTerm] = useState('');

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
    setSearchTerm(''); // Limpiar búsqueda al cambiar pestaña
  }, []);

  const handleFiltroChange = useCallback((campo: keyof FiltrosReporte, valor: string) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }, []);

  const handleLimpiarFiltros = useCallback(() => {
    setFiltros({ ...getDefaultDates(), agrupacion: 'dia' });
    setSearchTerm('');
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

  const activeKpiItems = useMemo(() => {
    switch (activeTab) {
      case 'ventas':
        if (!ventasData) return null;
        return [
          {
            icon: 'receipt_long',
            label: 'Total ventas',
            value: formatNumber(ventasData.resumen.total_ventas),
            detail: `ARS: ${ventasData.resumen.ventas_ars} | USD: ${ventasData.resumen.ventas_usd}`,
          },
          {
            icon: 'payments',
            label: 'Ingresos ARS',
            value: formatCurrency(ventasData.resumen.ingresos_ars),
            detail: formatUSD(ventasData.resumen.ingresos_usd),
            tone: 'success' as const,
          },
          {
            icon: 'confirmation_number',
            label: 'Ticket promedio',
            value: formatCurrency(ventasData.resumen.ticket_promedio),
          },
          {
            icon: 'credit_card',
            label: 'Metodo mas usado',
            value: ventasData.resumen.metodo_mas_usado,
          },
        ];
      case 'vendedores':
        if (!vendedoresData) return null;
        return [
          {
            icon: 'group',
            label: 'Vendedores activos',
            value: formatNumber(vendedoresData.resumen.total_vendedores_activos),
            detail: 'en el periodo',
          },
          {
            icon: 'point_of_sale',
            label: 'Total ventas',
            value: formatNumber(vendedoresData.resumen.total_ventas_periodo),
            detail: 'ventas en el periodo',
          },
          {
            icon: 'trending_up',
            label: 'Top ingresos',
            value: vendedoresData.resumen.vendedor_top_ingresos,
          },
          {
            icon: 'leaderboard',
            label: 'Top volumen',
            value: vendedoresData.resumen.vendedor_top_ventas,
          },
        ];
      case 'productos':
        if (!productosData) return null;
        return [
          {
            icon: 'category',
            label: 'Productos vendidos',
            value: formatNumber(productosData.resumen.productos_distintos_vendidos),
            detail: 'productos distintos',
          },
          {
            icon: 'inventory',
            label: 'Unidades totales',
            value: formatNumber(productosData.resumen.unidades_totales),
          },
          {
            icon: 'attach_money',
            label: 'Ingreso total',
            value: formatCurrency(productosData.resumen.ingreso_total_productos),
          },
        ];
      case 'clientes':
        if (!clientesData) return null;
        return [
          {
            icon: 'person_add',
            label: 'Clientes nuevos',
            value: formatNumber(clientesData.resumen.clientes_nuevos_periodo),
            detail: 'en el periodo',
          },
          {
            icon: 'shopping_bag',
            label: 'Con compras',
            value: formatNumber(clientesData.resumen.clientes_con_compras),
            detail: 'clientes activos',
          },
          {
            icon: 'groups',
            label: 'Total registrados',
            value: formatNumber(clientesData.resumen.clientes_totales),
          },
        ];
      case 'cancelaciones':
        if (!cancelacionesData) return null;
        return [
          {
            icon: 'cancel',
            label: 'Total cancelaciones',
            value: formatNumber(cancelacionesData.resumen.total_cancelaciones),
            tone: 'danger' as const,
          },
          {
            icon: 'money_off',
            label: 'Monto cancelado',
            value: formatCurrency(cancelacionesData.resumen.monto_ars),
            detail: formatUSD(cancelacionesData.resumen.monto_usd),
            tone: 'danger' as const,
          },
          {
            icon: 'percent',
            label: 'Tasa de cancelacion',
            value: `${cancelacionesData.resumen.tasa_cancelacion}%`,
            detail: 'del total de ventas',
            tone: 'warning' as const,
          },
        ];
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
      {activeKpiItems ? (
        <AdminMetricsStrip
          items={activeKpiItems}
          columns={activeKpiItems.length === 3 ? 3 : 4}
          className={styles.kpiGrid}
          itemClassName={styles.kpiCard}
        />
      ) : null}

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

      {/* Filtros - Usando Sistema Global */}
      <AdminFilterPanel>
        <AdminFilterPanel.Row variant="top">
          <AdminFilterPanel.Group>
            <AdminFilterPanel.Label>Fecha inicio</AdminFilterPanel.Label>
              <input
                type="date"
                className={controlStyles.field}
                value={filtros.fecha_inicio || ''}
                onChange={(e) => handleFiltroChange('fecha_inicio', e.target.value)}
              />
          </AdminFilterPanel.Group>
          <AdminFilterPanel.Group>
            <AdminFilterPanel.Label>Fecha fin</AdminFilterPanel.Label>
              <input
                type="date"
                className={controlStyles.field}
                value={filtros.fecha_fin || ''}
                onChange={(e) => handleFiltroChange('fecha_fin', e.target.value)}
              />
          </AdminFilterPanel.Group>
          {activeTab === 'ventas' && (
            <AdminFilterPanel.Group>
              <AdminFilterPanel.Label>Agrupación</AdminFilterPanel.Label>
                <select
                  className={controlStyles.field}
                  value={filtros.agrupacion || 'dia'}
                  onChange={(e) => handleFiltroChange('agrupacion', e.target.value)}
                >
                  <option value="dia">Por día</option>
                  <option value="semana">Por semana</option>
                  <option value="mes">Por mes</option>
                </select>
            </AdminFilterPanel.Group>
          )}
        </AdminFilterPanel.Row>

        <AdminFilterPanel.Row variant="bottom">
          <AdminFilterPanel.Grow>
            <AdminEntitySearchBar
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              searchLabel="Búsqueda rápida"
              searchPlaceholder="Filtrar en los resultados..."
              primaryActionLabel={exporting ? 'Exportando...' : 'Exportar CSV'}
              primaryActionIcon="download"
              onPrimaryAction={handleExportar}
              primaryActionDisabled={exporting || loading || !puedeExportar}
            />
          </AdminFilterPanel.Grow>
          <AdminFilterPanel.Actions>
            <button className={controlStyles.secondaryButton} onClick={handleLimpiarFiltros} disabled={loading}>
              <span className="material-icons">backspace</span>
              <span>Limpiar</span>
            </button>
          </AdminFilterPanel.Actions>
        </AdminFilterPanel.Row>
      </AdminFilterPanel>

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
          {activeTab === 'ventas' && ventasData && <ReporteVentasTab data={ventasData} searchTerm={searchTerm} />}
          {activeTab === 'vendedores' && vendedoresData && <ReporteVendedoresTab data={vendedoresData} searchTerm={searchTerm} />}
          {activeTab === 'productos' && productosData && <ReporteProductosTab data={productosData} searchTerm={searchTerm} />}
          {activeTab === 'clientes' && clientesData && <ReporteClientesTab data={clientesData} searchTerm={searchTerm} />}
          {activeTab === 'cancelaciones' && cancelacionesData && <ReporteCancelacionesTab data={cancelacionesData} searchTerm={searchTerm} />}
        </>
      )}
    </div>
  );
});

// SUB-COMPONENTE: REPORTE DE VENTAS

const ReporteVentasTab: React.FC<{ data: ReporteVentasResponse; searchTerm: string }> = memo(({ data, searchTerm }) => {
  const { datos } = data;
  
  const filteredData = useMemo(() => {
    if (!searchTerm) return datos;
    const term = searchTerm.toLowerCase();
    return datos.filter(item => 
      item.periodo.toLowerCase().includes(term)
    );
  }, [datos, searchTerm]);

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

  return (
    <AdminDataTable
      data={filteredData}
      columns={columns}
      sorting={sorting}
      onSortingChange={setSorting}
      columnOrder={columnOrder}
      onColumnOrderChange={setColumnOrder}
      pagination={pagination}
      onPaginationChange={setPagination}
      totalItems={filteredData.length}
      itemLabel="registros"
      isLoading={false}
      manualPagination={false}
      emptyMessage="No hay datos para el periodo seleccionado"
    />
  );
});

// SUB-COMPONENTE: REPORTE DE VENDEDORES

const ReporteVendedoresTab: React.FC<{ data: ReporteVendedoresResponse; searchTerm: string }> = memo(({ data, searchTerm }) => {
  const { datos } = data;

  const filteredData = useMemo(() => {
    if (!searchTerm) return datos;
    const term = searchTerm.toLowerCase();
    return datos.filter(item => 
      item.nombre.toLowerCase().includes(term)
    );
  }, [datos, searchTerm]);

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

  return (
    <AdminDataTable
      data={filteredData}
      columns={columns}
      sorting={sorting}
      onSortingChange={setSorting}
      columnOrder={columnOrder}
      onColumnOrderChange={setColumnOrder}
      pagination={pagination}
      onPaginationChange={setPagination}
      totalItems={filteredData.length}
      itemLabel="vendedores"
      isLoading={false}
      manualPagination={false}
      emptyMessage="No hay datos para el periodo seleccionado"
    />
  );
});

// SUB-COMPONENTE: REPORTE DE PRODUCTOS

const ReporteProductosTab: React.FC<{ data: ReporteProductosResponse; searchTerm: string }> = memo(({ data, searchTerm }) => {
  const { mas_vendidos } = data;

  const filteredData = useMemo(() => {
    if (!searchTerm) return mas_vendidos;
    const term = searchTerm.toLowerCase();
    return mas_vendidos.filter(item => 
      item.nombre.toLowerCase().includes(term) ||
      item.codigo.toLowerCase().includes(term) ||
      item.categoria.toLowerCase().includes(term) ||
      item.marca.toLowerCase().includes(term)
    );
  }, [mas_vendidos, searchTerm]);

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

  return (
    <AdminDataTable
      data={filteredData}
      columns={columns}
      sorting={sorting}
      onSortingChange={setSorting}
      columnOrder={columnOrder}
      onColumnOrderChange={setColumnOrder}
      pagination={pagination}
      onPaginationChange={setPagination}
      totalItems={filteredData.length}
      itemLabel="productos"
      isLoading={false}
      manualPagination={false}
      emptyMessage="No hay productos vendidos en este periodo"
    />
  );
});

// SUB-COMPONENTE: REPORTE DE CLIENTES

const ReporteClientesTab: React.FC<{ data: ReporteClientesResponse; searchTerm: string }> = memo(({ data, searchTerm }) => {
  const { top_clientes } = data;

  const filteredData = useMemo(() => {
    if (!searchTerm) return top_clientes;
    const term = searchTerm.toLowerCase();
    return top_clientes.filter(item => 
      item.nombre.toLowerCase().includes(term) ||
      item.email.toLowerCase().includes(term)
    );
  }, [top_clientes, searchTerm]);

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

  return (
    <AdminDataTable
      data={filteredData}
      columns={columns}
      sorting={sorting}
      onSortingChange={setSorting}
      columnOrder={columnOrder}
      onColumnOrderChange={setColumnOrder}
      pagination={pagination}
      onPaginationChange={setPagination}
      totalItems={filteredData.length}
      itemLabel="clientes"
      isLoading={false}
      manualPagination={false}
      emptyMessage="No hay clientes registrados con compras en este periodo"
    />
  );
});

// SUB-COMPONENTE: REPORTE DE CANCELACIONES

const ReporteCancelacionesTab: React.FC<{ data: ReporteCancelacionesResponse; searchTerm: string }> = memo(({ data, searchTerm }) => {
  const { datos } = data;

  const filteredData = useMemo(() => {
    if (!searchTerm) return datos;
    const term = searchTerm.toLowerCase();
    return datos.filter(item => 
      item.nro_venta.toLowerCase().includes(term) ||
      item.motivo.toLowerCase().includes(term) ||
      item.cancelado_por.toLowerCase().includes(term)
    );
  }, [datos, searchTerm]);

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

  return (
    <AdminDataTable
      data={filteredData}
      columns={columns}
      sorting={sorting}
      onSortingChange={setSorting}
      columnOrder={columnOrder}
      onColumnOrderChange={setColumnOrder}
      pagination={pagination}
      onPaginationChange={setPagination}
      totalItems={filteredData.length}
      itemLabel="cancelaciones"
      isLoading={false}
      manualPagination={false}
      emptyMessage="No hay cancelaciones en el periodo seleccionado"
    />
  );
});

export default Reportes;
