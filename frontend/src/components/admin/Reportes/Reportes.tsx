import React, { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import styles from './Reportes.module.css';
import { reporteService } from '../../../services/reporteService';
import { AdminEmptyState, AdminSectionActions, AdminStatCard, AdminSurface } from '../common';
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

// ============================================================================
// TIPOS INTERNOS
// ============================================================================

interface TabConfig {
  id: ReporteTab;
  label: string;
  icon: string;
}

type SortDirReporte = 'asc' | 'desc';
type VentasSortKey = 'periodo' | 'ventas' | 'ingresos_ars' | 'ticket_promedio';
type ProductosSortKey = 'nombre' | 'categoria' | 'marca' | 'unidades' | 'ingreso' | 'precio' | 'stock';
type ProductosStockSortKey = 'nombre' | 'stock_actual' | 'stock_minimo';
type ClientesSortKey = 'nombre' | 'email' | 'compras' | 'monto' | 'ultima_compra';
type CancelacionesSortKey = 'nro_venta' | 'fecha' | 'monto' | 'motivo' | 'cancelado_por';
type VendedoresSortKey = 'nombre' | 'ventas' | 'ingresos_ars' | 'ticket_promedio' | 'porcentaje';

const TABS: TabConfig[] = [
  { id: 'ventas', label: 'Ventas', icon: 'point_of_sale' },
  { id: 'vendedores', label: 'Vendedores', icon: 'group' },
  { id: 'productos', label: 'Productos', icon: 'inventory_2' },
  { id: 'clientes', label: 'Clientes', icon: 'people' },
  { id: 'cancelaciones', label: 'Cancelaciones', icon: 'cancel' },
];

// ============================================================================
// HELPERS
// ============================================================================

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
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
    <span>{valor}</span>
    <span
      style={{
        fontSize: '0.65rem',
        padding: '2px 5px',
        borderRadius: '2px',
        backgroundColor: moneda === 'USD' ? '#dbeafe' : '#cffafe',
        color: moneda === 'USD' ? '#1e40af' : '#0369a1',
        fontWeight: '600',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
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

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

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

// ============================================================================
// SUB-COMPONENTE: REPORTE DE VENTAS
// ============================================================================

const ReporteVentasTab: React.FC<{ data: ReporteVentasResponse }> = memo(({ data }) => {
  const { datos } = data;
  const [sortKey, setSortKey] = useState<VentasSortKey>('periodo');
  const [sortDir, setSortDir] = useState<SortDirReporte>('asc');

  const handleSort = (key: VentasSortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const getSortIcon = (key: VentasSortKey) => {
    if (sortKey !== key) return 'unfold_more';
    return sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward';
  };

  const sortedDatos = useMemo(() => {
    const sorted = [...datos];
    sorted.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortKey) {
        case 'periodo':
          valA = a.periodo.toLowerCase();
          valB = b.periodo.toLowerCase();
          break;
        case 'ventas':
          valA = a.ventas;
          valB = b.ventas;
          break;
        case 'ingresos_ars':
          valA = a.ingresos_ars;
          valB = b.ingresos_ars;
          break;
        case 'ticket_promedio':
          valA = a.ticket_promedio;
          valB = b.ticket_promedio;
          break;
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [datos, sortKey, sortDir]);

  return (
    <>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.sortableHeader} onClick={() => handleSort('periodo')}>
                <span className={styles.sortableHeaderContent}>
                  Periodo
                  <span
                    className={`material-icons ${styles.sortIcon} ${sortKey === 'periodo' ? styles.sortIconActive : ''}`}
                  >
                    {getSortIcon('periodo')}
                  </span>
                </span>
              </th>
              <th className={`${styles.sortableHeader} ${styles.textRight}`} onClick={() => handleSort('ventas')}>
                <span className={styles.sortableHeaderContent}>
                  Ventas
                  <span
                    className={`material-icons ${styles.sortIcon} ${sortKey === 'ventas' ? styles.sortIconActive : ''}`}
                  >
                    {getSortIcon('ventas')}
                  </span>
                </span>
              </th>
              <th className={`${styles.sortableHeader} ${styles.textRight}`} onClick={() => handleSort('ingresos_ars')}>
                <span className={styles.sortableHeaderContent}>
                  Ingresos ARS
                  <span
                    className={`material-icons ${styles.sortIcon} ${sortKey === 'ingresos_ars' ? styles.sortIconActive : ''}`}
                  >
                    {getSortIcon('ingresos_ars')}
                  </span>
                </span>
              </th>
              <th className={styles.textRight}>Equiv. USD</th>
              <th
                className={`${styles.sortableHeader} ${styles.textRight}`}
                onClick={() => handleSort('ticket_promedio')}
              >
                <span className={styles.sortableHeaderContent}>
                  Ticket Promedio
                  <span
                    className={`material-icons ${styles.sortIcon} ${sortKey === 'ticket_promedio' ? styles.sortIconActive : ''}`}
                  >
                    {getSortIcon('ticket_promedio')}
                  </span>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedDatos.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyMessage}>
                  No hay datos para el periodo seleccionado
                </td>
              </tr>
            ) : (
              sortedDatos.map((row, i) => (
                <tr key={i}>
                  <td>{row.periodo}</td>
                  <td className={`${styles.textRight} ${styles.monoCell}`}>{formatNumber(row.ventas)}</td>
                  <td className={`${styles.textRight} ${styles.monoCell}`}>
                    <MontoConBadge valor={formatCurrency(row.ingresos_ars)} moneda="ARS" />
                  </td>
                  <td className={`${styles.textRight} ${styles.monoCell}`}>
                    <MontoConBadge valor={formatUSD(row.ingresos_usd)} moneda="USD" />
                  </td>
                  <td className={`${styles.textRight} ${styles.monoCell}`}>
                    <MontoConBadge valor={formatCurrency(row.ticket_promedio)} moneda="ARS" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
});

// ============================================================================
// SUB-COMPONENTE: REPORTE DE VENDEDORES
// ============================================================================

const ReporteVendedoresTab: React.FC<{ data: ReporteVendedoresResponse }> = memo(({ data }) => {
  const { datos } = data;
  const [sortKey, setSortKey] = useState<VendedoresSortKey>('ventas');
  const [sortDir, setSortDir] = useState<SortDirReporte>('desc');

  const handleSort = (key: VendedoresSortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const getSortIcon = (key: VendedoresSortKey) => {
    if (sortKey !== key) return 'unfold_more';
    return sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward';
  };

  const sortedDatos = useMemo(() => {
    const sorted = [...datos];
    sorted.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortKey) {
        case 'nombre':
          valA = a.nombre.toLowerCase();
          valB = b.nombre.toLowerCase();
          break;
        case 'ventas':
          valA = a.ventas;
          valB = b.ventas;
          break;
        case 'ingresos_ars':
          valA = a.ingresos_ars;
          valB = b.ingresos_ars;
          break;
        case 'ticket_promedio':
          valA = a.ticket_promedio;
          valB = b.ticket_promedio;
          break;
        case 'porcentaje':
          valA = a.porcentaje_ventas;
          valB = b.porcentaje_ventas;
          break;
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [datos, sortKey, sortDir]);

  return (
    <>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.sortableHeader} onClick={() => handleSort('nombre')}>
                <span className={styles.sortableHeaderContent}>
                  Vendedor
                  <span
                    className={`material-icons ${styles.sortIcon} ${sortKey === 'nombre' ? styles.sortIconActive : ''}`}
                  >
                    {getSortIcon('nombre')}
                  </span>
                </span>
              </th>
              <th className={`${styles.sortableHeader} ${styles.textRight}`} onClick={() => handleSort('ventas')}>
                <span className={styles.sortableHeaderContent}>
                  Ventas
                  <span
                    className={`material-icons ${styles.sortIcon} ${sortKey === 'ventas' ? styles.sortIconActive : ''}`}
                  >
                    {getSortIcon('ventas')}
                  </span>
                </span>
              </th>
              <th className={`${styles.sortableHeader} ${styles.textRight}`} onClick={() => handleSort('ingresos_ars')}>
                <span className={styles.sortableHeaderContent}>
                  Ingresos ARS
                  <span
                    className={`material-icons ${styles.sortIcon} ${sortKey === 'ingresos_ars' ? styles.sortIconActive : ''}`}
                  >
                    {getSortIcon('ingresos_ars')}
                  </span>
                </span>
              </th>
              <th className={styles.textRight}>Equiv. USD</th>
              <th
                className={`${styles.sortableHeader} ${styles.textRight}`}
                onClick={() => handleSort('ticket_promedio')}
              >
                <span className={styles.sortableHeaderContent}>
                  Ticket Promedio
                  <span
                    className={`material-icons ${styles.sortIcon} ${sortKey === 'ticket_promedio' ? styles.sortIconActive : ''}`}
                  >
                    {getSortIcon('ticket_promedio')}
                  </span>
                </span>
              </th>
              <th className={`${styles.sortableHeader} ${styles.textRight}`} onClick={() => handleSort('porcentaje')}>
                <span className={styles.sortableHeaderContent}>
                  % del Total
                  <span
                    className={`material-icons ${styles.sortIcon} ${sortKey === 'porcentaje' ? styles.sortIconActive : ''}`}
                  >
                    {getSortIcon('porcentaje')}
                  </span>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedDatos.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyMessage}>
                  No hay datos para el periodo seleccionado
                </td>
              </tr>
            ) : (
              sortedDatos.map((row) => (
                <tr key={row.id_vendedor}>
                  <td style={{ fontWeight: 'var(--font-weight-semibold)' }}>{row.nombre}</td>
                  <td className={`${styles.textRight} ${styles.monoCell}`}>{formatNumber(row.ventas)}</td>
                  <td className={`${styles.textRight} ${styles.monoCell}`}>
                    <MontoConBadge valor={formatCurrency(row.ingresos_ars)} moneda="ARS" />
                  </td>
                  <td className={`${styles.textRight} ${styles.monoCell}`}>
                    <MontoConBadge valor={formatUSD(row.ingresos_usd)} moneda="USD" />
                  </td>
                  <td className={`${styles.textRight} ${styles.monoCell}`}>
                    <MontoConBadge valor={formatCurrency(row.ticket_promedio)} moneda="ARS" />
                  </td>
                  <td className={`${styles.textRight} ${styles.monoCell}`}>
                    <span
                      style={{
                        fontFamily: 'var(--font-family-mono)',
                        fontWeight: 600,
                        color: row.porcentaje_ventas > 50 ? 'var(--color-primary)' : 'var(--text-primary)',
                      }}
                    >
                      {row.porcentaje_ventas}%
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
});

// ============================================================================
// SUB-COMPONENTE: REPORTE DE PRODUCTOS
// ============================================================================

const ReporteProductosTab: React.FC<{ data: ReporteProductosResponse }> = memo(({ data }) => {
  const { mas_vendidos } = data;
  const [sortKeyVendidos, setSortKeyVendidos] = useState<ProductosSortKey>('unidades');
  const [sortDirVendidos, setSortDirVendidos] = useState<SortDirReporte>('desc');

  const handleSortVendidos = (key: ProductosSortKey) => {
    if (sortKeyVendidos === key) {
      setSortDirVendidos((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKeyVendidos(key);
      setSortDirVendidos('desc');
    }
  };

  const getSortIconVendidos = (key: ProductosSortKey) => {
    if (sortKeyVendidos !== key) return 'unfold_more';
    return sortDirVendidos === 'asc' ? 'arrow_upward' : 'arrow_downward';
  };


  const sortedVendidos = useMemo(() => {
    const sorted = [...mas_vendidos];
    sorted.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortKeyVendidos) {
        case 'nombre':
          valA = a.nombre.toLowerCase();
          valB = b.nombre.toLowerCase();
          break;
        case 'categoria':
          valA = a.categoria.toLowerCase();
          valB = b.categoria.toLowerCase();
          break;
        case 'marca':
          valA = a.marca.toLowerCase();
          valB = b.marca.toLowerCase();
          break;
        case 'unidades':
          valA = a.unidades_vendidas;
          valB = b.unidades_vendidas;
          break;
        case 'ingreso':
          valA = a.ingreso_total;
          valB = b.ingreso_total;
          break;
        case 'precio':
          valA = a.precio_venta_actual;
          valB = b.precio_venta_actual;
          break;
        case 'stock':
          valA = a.stock_actual;
          valB = b.stock_actual;
          break;
      }

      if (valA < valB) return sortDirVendidos === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirVendidos === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [mas_vendidos, sortKeyVendidos, sortDirVendidos]);


  return (
    <>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.sortableHeader} onClick={() => handleSortVendidos('nombre')}>
                <span className={styles.sortableHeaderContent}>
                  Producto
                  <span
                    className={`material-icons ${styles.sortIcon} ${sortKeyVendidos === 'nombre' ? styles.sortIconActive : ''}`}
                  >
                    {getSortIconVendidos('nombre')}
                  </span>
                </span>
              </th>
              <th>Codigo</th>
              <th className={styles.sortableHeader} onClick={() => handleSortVendidos('categoria')}>
                <span className={styles.sortableHeaderContent}>
                  Categoria
                  <span
                    className={`material-icons ${styles.sortIcon} ${sortKeyVendidos === 'categoria' ? styles.sortIconActive : ''}`}
                  >
                    {getSortIconVendidos('categoria')}
                  </span>
                </span>
              </th>
              <th className={styles.sortableHeader} onClick={() => handleSortVendidos('marca')}>
                <span className={styles.sortableHeaderContent}>
                  Marca
                  <span
                    className={`material-icons ${styles.sortIcon} ${sortKeyVendidos === 'marca' ? styles.sortIconActive : ''}`}
                  >
                    {getSortIconVendidos('marca')}
                  </span>
                </span>
              </th>
              <th
                className={`${styles.sortableHeader} ${styles.textRight}`}
                onClick={() => handleSortVendidos('unidades')}
              >
                <span className={styles.sortableHeaderContent}>
                  Uds. Vendidas
                  <span
                    className={`material-icons ${styles.sortIcon} ${sortKeyVendidos === 'unidades' ? styles.sortIconActive : ''}`}
                  >
                    {getSortIconVendidos('unidades')}
                  </span>
                </span>
              </th>
              <th
                className={`${styles.sortableHeader} ${styles.textRight}`}
                onClick={() => handleSortVendidos('ingreso')}
              >
                <span className={styles.sortableHeaderContent}>
                  Ingreso
                  <span
                    className={`material-icons ${styles.sortIcon} ${sortKeyVendidos === 'ingreso' ? styles.sortIconActive : ''}`}
                  >
                    {getSortIconVendidos('ingreso')}
                  </span>
                </span>
              </th>
              <th
                className={`${styles.sortableHeader} ${styles.textRight}`}
                onClick={() => handleSortVendidos('precio')}
              >
                <span className={styles.sortableHeaderContent}>
                  Precio Actual
                  <span
                    className={`material-icons ${styles.sortIcon} ${sortKeyVendidos === 'precio' ? styles.sortIconActive : ''}`}
                  >
                    {getSortIconVendidos('precio')}
                  </span>
                </span>
              </th>
              <th
                className={`${styles.sortableHeader} ${styles.textRight}`}
                onClick={() => handleSortVendidos('stock')}
              >
                <span className={styles.sortableHeaderContent}>
                  Stock
                  <span
                    className={`material-icons ${styles.sortIcon} ${sortKeyVendidos === 'stock' ? styles.sortIconActive : ''}`}
                  >
                    {getSortIconVendidos('stock')}
                  </span>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedVendidos.length === 0 ? (
              <tr>
                <td colSpan={8} className={styles.emptyMessage}>
                  No hay datos para el periodo seleccionado
                </td>
              </tr>
            ) : (
              sortedVendidos.map((prod) => (
                <tr key={prod.id_producto}>
                  <td style={{ fontWeight: 'var(--font-weight-semibold)' }}>{prod.nombre}</td>
                  <td className={styles.monoCell}>{prod.codigo}</td>
                  <td>{prod.categoria}</td>
                  <td>{prod.marca}</td>
                  <td className={`${styles.textRight} ${styles.monoCell}`}>{formatNumber(prod.unidades_vendidas)}</td>
                  <td className={`${styles.textRight} ${styles.monoCell}`}>
                    <MontoConBadge valor={formatCurrency(prod.ingreso_total)} moneda="ARS" />
                  </td>
                  <td className={`${styles.textRight} ${styles.monoCell}`}>
                    <MontoConBadge valor={formatCurrency(prod.precio_venta_actual)} moneda="USD" />
                  </td>
                  <td className={`${styles.textRight} ${styles.monoCell}`}>{prod.stock_actual}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </>
  );
});

// ============================================================================
// SUB-COMPONENTE: REPORTE DE CLIENTES
// ============================================================================

const ReporteClientesTab: React.FC<{ data: ReporteClientesResponse }> = memo(({ data }) => {
  const { top_clientes } = data;
  const [sortKey, setSortKey] = useState<ClientesSortKey>('monto');
  const [sortDir, setSortDir] = useState<SortDirReporte>('desc');

  const handleSort = (key: ClientesSortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const getSortIcon = (key: ClientesSortKey) => {
    if (sortKey !== key) return 'unfold_more';
    return sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward';
  };

  const sortedClientes = useMemo(() => {
    const sorted = [...top_clientes];
    sorted.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortKey) {
        case 'nombre':
          valA = a.nombre.toLowerCase();
          valB = b.nombre.toLowerCase();
          break;
        case 'email':
          valA = a.email.toLowerCase();
          valB = b.email.toLowerCase();
          break;
        case 'compras':
          valA = a.total_compras;
          valB = b.total_compras;
          break;
        case 'monto':
          valA = a.monto_ars;
          valB = b.monto_ars;
          break;
        case 'ultima_compra':
          valA = a.ultima_compra ? new Date(a.ultima_compra).getTime() : 0;
          valB = b.ultima_compra ? new Date(b.ultima_compra).getTime() : 0;
          break;
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [top_clientes, sortKey, sortDir]);

  return (
    <>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.sortableHeader} onClick={() => handleSort('nombre')}>
                <span className={styles.sortableHeaderContent}>
                  Cliente
                  <span
                    className={`material-icons ${styles.sortIcon} ${sortKey === 'nombre' ? styles.sortIconActive : ''}`}
                  >
                    {getSortIcon('nombre')}
                  </span>
                </span>
              </th>
              <th className={styles.sortableHeader} onClick={() => handleSort('email')}>
                <span className={styles.sortableHeaderContent}>
                  Email
                  <span
                    className={`material-icons ${styles.sortIcon} ${sortKey === 'email' ? styles.sortIconActive : ''}`}
                  >
                    {getSortIcon('email')}
                  </span>
                </span>
              </th>
              <th className={`${styles.sortableHeader} ${styles.textRight}`} onClick={() => handleSort('compras')}>
                <span className={styles.sortableHeaderContent}>
                  Compras
                  <span
                    className={`material-icons ${styles.sortIcon} ${sortKey === 'compras' ? styles.sortIconActive : ''}`}
                  >
                    {getSortIcon('compras')}
                  </span>
                </span>
              </th>
              <th className={`${styles.sortableHeader} ${styles.textRight}`} onClick={() => handleSort('monto')}>
                <span className={styles.sortableHeaderContent}>
                  Monto ARS
                  <span
                    className={`material-icons ${styles.sortIcon} ${sortKey === 'monto' ? styles.sortIconActive : ''}`}
                  >
                    {getSortIcon('monto')}
                  </span>
                </span>
              </th>
              <th className={styles.textRight}>Equiv. USD</th>
              <th className={styles.sortableHeader} onClick={() => handleSort('ultima_compra')}>
                <span className={styles.sortableHeaderContent}>
                  Ultima Compra
                  <span
                    className={`material-icons ${styles.sortIcon} ${sortKey === 'ultima_compra' ? styles.sortIconActive : ''}`}
                  >
                    {getSortIcon('ultima_compra')}
                  </span>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedClientes.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyMessage}>
                  No hay datos para el periodo seleccionado
                </td>
              </tr>
            ) : (
              sortedClientes.map((cliente) => (
                <tr key={cliente.id_cliente}>
                  <td style={{ fontWeight: 'var(--font-weight-semibold)' }}>{cliente.nombre}</td>
                  <td>{cliente.email}</td>
                  <td className={`${styles.textRight} ${styles.monoCell}`}>{formatNumber(cliente.total_compras)}</td>
                  <td className={`${styles.textRight} ${styles.monoCell}`}>
                    <MontoConBadge valor={formatCurrency(cliente.monto_ars)} moneda="ARS" />
                  </td>
                  <td className={`${styles.textRight} ${styles.monoCell}`}>
                    <MontoConBadge valor={formatUSD(cliente.monto_usd)} moneda="USD" />
                  </td>
                  <td>{formatDate(cliente.ultima_compra)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
});

// ============================================================================
// SUB-COMPONENTE: REPORTE DE CANCELACIONES
// ============================================================================

const ReporteCancelacionesTab: React.FC<{ data: ReporteCancelacionesResponse }> = memo(({ data }) => {
  const { datos } = data;
  const [sortKey, setSortKey] = useState<CancelacionesSortKey>('fecha');
  const [sortDir, setSortDir] = useState<SortDirReporte>('desc');

  const handleSort = (key: CancelacionesSortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const getSortIcon = (key: CancelacionesSortKey) => {
    if (sortKey !== key) return 'unfold_more';
    return sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward';
  };

  const sortedDatos = useMemo(() => {
    const sorted = [...datos];
    sorted.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortKey) {
        case 'nro_venta':
          valA = a.nro_venta;
          valB = b.nro_venta;
          break;
        case 'fecha':
          valA = new Date(a.fecha_cancelacion).getTime();
          valB = new Date(b.fecha_cancelacion).getTime();
          break;
        case 'monto':
          valA = a.monto_ars;
          valB = b.monto_ars;
          break;
        case 'motivo':
          valA = a.motivo.toLowerCase();
          valB = b.motivo.toLowerCase();
          break;
        case 'cancelado_por':
          valA = a.cancelado_por.toLowerCase();
          valB = b.cancelado_por.toLowerCase();
          break;
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [datos, sortKey, sortDir]);

  return (
    <>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.sortableHeader} onClick={() => handleSort('nro_venta')}>
                <span className={styles.sortableHeaderContent}>
                  Nro Venta
                  <span
                    className={`material-icons ${styles.sortIcon} ${sortKey === 'nro_venta' ? styles.sortIconActive : ''}`}
                  >
                    {getSortIcon('nro_venta')}
                  </span>
                </span>
              </th>
              <th className={styles.sortableHeader} onClick={() => handleSort('fecha')}>
                <span className={styles.sortableHeaderContent}>
                  Fecha
                  <span
                    className={`material-icons ${styles.sortIcon} ${sortKey === 'fecha' ? styles.sortIconActive : ''}`}
                  >
                    {getSortIcon('fecha')}
                  </span>
                </span>
              </th>
              <th className={`${styles.sortableHeader} ${styles.textRight}`} onClick={() => handleSort('monto')}>
                <span className={styles.sortableHeaderContent}>
                  Monto ARS
                  <span
                    className={`material-icons ${styles.sortIcon} ${sortKey === 'monto' ? styles.sortIconActive : ''}`}
                  >
                    {getSortIcon('monto')}
                  </span>
                </span>
              </th>
              <th className={styles.textRight}>Equiv. USD</th>
              <th className={styles.sortableHeader} onClick={() => handleSort('motivo')}>
                <span className={styles.sortableHeaderContent}>
                  Motivo
                  <span
                    className={`material-icons ${styles.sortIcon} ${sortKey === 'motivo' ? styles.sortIconActive : ''}`}
                  >
                    {getSortIcon('motivo')}
                  </span>
                </span>
              </th>
              <th className={styles.sortableHeader} onClick={() => handleSort('cancelado_por')}>
                <span className={styles.sortableHeaderContent}>
                  Cancelado por
                  <span
                    className={`material-icons ${styles.sortIcon} ${sortKey === 'cancelado_por' ? styles.sortIconActive : ''}`}
                  >
                    {getSortIcon('cancelado_por')}
                  </span>
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedDatos.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyMessage}>
                  No hay cancelaciones en el periodo seleccionado
                </td>
              </tr>
            ) : (
              sortedDatos.map((item, i) => (
                <tr key={i}>
                  <td className={styles.monoCell} style={{ color: 'var(--color-primary)' }}>
                    {item.nro_venta}
                  </td>
                  <td>{formatDate(item.fecha_cancelacion)}</td>
                  <td className={`${styles.textRight} ${styles.monoCell}`}>
                    <MontoConBadge valor={formatCurrency(item.monto_ars)} moneda="ARS" />
                  </td>
                  <td className={`${styles.textRight} ${styles.monoCell}`}>
                    <MontoConBadge valor={formatUSD(item.monto_usd)} moneda="USD" />
                  </td>
                  <td>{item.motivo}</td>
                  <td>{item.cancelado_por}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
});

export default Reportes;
