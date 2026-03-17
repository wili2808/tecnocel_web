import React, { memo, useState, useCallback, useEffect, useMemo } from 'react';
import styles from './Reportes.module.css';
import { reporteService } from '../../../services/reporteService';
import adminApi from '../../../api/axiosAdminConfig';
import type {
  ReporteTab,
  FiltrosReporte,
  FiltrosReporteVentas,
  ReporteVentasResponse,
  ReporteProductosResponse,
  ReporteClientesResponse,
  ReporteCancelacionesResponse,
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

const TABS: TabConfig[] = [
  { id: 'ventas', label: 'Ventas', icon: 'point_of_sale' },
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

  // Vendedores para el filtro
  const [vendedores, setVendedores] = useState<{ id_usuario: number; nombres: string }[]>([]);
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState<number | 'null' | undefined>(undefined);

  // Cargar datos según pestaña activa
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      switch (activeTab) {
        case 'ventas': {
          const filtrosVentas: FiltrosReporteVentas = {
            ...filtros,
            ...(vendedorSeleccionado !== undefined && { id_vendedor: vendedorSeleccionado }),
          };
          const data = await reporteService.obtenerReporteVentas(filtrosVentas);
          setVentasData(data);
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
  }, [activeTab, filtros, vendedorSeleccionado]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Cargar lista de vendedores al montar (una sola vez)
  // vendedores se usa en el dropdown de filtro (tarea siguiente)
  useEffect(() => {
    adminApi.get('/usuarios/admin/usuarios')
      .then((res) => {
        const lista: { id_usuario: number; nombres: string }[] = res.data?.data?.usuarios ?? res.data?.usuarios ?? [];
        setVendedores(lista);
      })
      .catch(() => {
        // No bloqueante: si falla, el dropdown queda sin opciones de usuario
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = useCallback((tab: ReporteTab) => {
    setActiveTab(tab);
  }, []);

  const handleFiltroChange = useCallback((campo: keyof FiltrosReporte, valor: string) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }, []);

  const handleLimpiarFiltros = useCallback(() => {
    setFiltros({ ...getDefaultDates(), agrupacion: 'dia' });
    setVendedorSeleccionado(undefined);
  }, []);

  const handleExportar = useCallback(async () => {
    setExporting(true);
    try {
      const filtrosExportar = activeTab === 'ventas'
        ? { ...filtros, ...(vendedorSeleccionado !== undefined && { id_vendedor: vendedorSeleccionado }) }
        : filtros;
      // Cast necesario: exportarCSV acepta FiltrosReporte, pero el objeto puede incluir id_vendedor
      // en runtime Axios lo serializa correctamente como query param
      await reporteService.exportarCSV(activeTab, filtrosExportar as FiltrosReporte);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al exportar');
    } finally {
      setExporting(false);
    }
  }, [activeTab, filtros, vendedorSeleccionado]);

  // Opciones para el dropdown de vendedor (preparado para el filterBar)
  const vendedoresOptions = useMemo(
    () => vendedores.map((v) => ({ value: v.id_usuario, label: v.nombres })),
    [vendedores],
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>
              <span className="material-icons">assessment</span>
              Reportes
            </h1>
            <p className={styles.subtitle}>Analiza el rendimiento del negocio con reportes detallados</p>
          </div>
          <button className={styles.exportButton} onClick={handleExportar} disabled={exporting || loading}>
            <span className="material-icons">download</span>
            {exporting ? 'Exportando...' : 'Exportar CSV'}
          </button>
        </div>
      </div>

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
      <div className={styles.filterBar} data-vendedores={vendedoresOptions.length}>
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

      {/* Estado de carga/error */}
      {loading && (
        <div className={styles.loading}>
          <span className="material-icons">hourglass_empty</span>
          Cargando reporte...
        </div>
      )}

      {error && !loading && (
        <div className={styles.error}>
          <span className="material-icons">error_outline</span>
          <p>{error}</p>
          <button className={styles.retryButton} onClick={cargarDatos}>
            Reintentar
          </button>
        </div>
      )}

      {/* Contenido del reporte */}
      {!loading && !error && (
        <>
          {activeTab === 'ventas' && ventasData && <ReporteVentasTab data={ventasData} />}
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
  const { resumen, datos } = data;
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
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            <span className="material-icons">receipt_long</span>
            Total ventas
          </span>
          <span className={styles.kpiValue}>{formatNumber(resumen.total_ventas)}</span>
          <span className={styles.kpiSub}>
            ARS: {resumen.ventas_ars} | USD: {resumen.ventas_usd}
          </span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            <span className="material-icons">payments</span>
            Ingresos ARS
          </span>
          <span className={styles.kpiValue}>{formatCurrency(resumen.ingresos_ars)}</span>
          <span className={styles.kpiSub}>{formatUSD(resumen.ingresos_usd)}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            <span className="material-icons">confirmation_number</span>
            Ticket promedio
          </span>
          <span className={styles.kpiValue}>{formatCurrency(resumen.ticket_promedio)}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            <span className="material-icons">credit_card</span>
            Metodo mas usado
          </span>
          <span className={styles.kpiValue} style={{ fontSize: 'var(--font-size-lg)' }}>
            {resumen.metodo_mas_usado}
          </span>
        </div>
      </div>

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
// SUB-COMPONENTE: REPORTE DE PRODUCTOS
// ============================================================================

const ReporteProductosTab: React.FC<{ data: ReporteProductosResponse }> = memo(({ data }) => {
  const { resumen, mas_vendidos, stock_bajo } = data;
  const [sortKeyVendidos, setSortKeyVendidos] = useState<ProductosSortKey>('unidades');
  const [sortDirVendidos, setSortDirVendidos] = useState<SortDirReporte>('desc');
  const [sortKeyStock, setSortKeyStock] = useState<ProductosStockSortKey>('stock_actual');
  const [sortDirStock, setSortDirStock] = useState<SortDirReporte>('asc');

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

  const handleSortStock = (key: ProductosStockSortKey) => {
    if (sortKeyStock === key) {
      setSortDirStock((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKeyStock(key);
      setSortDirStock('asc');
    }
  };

  const getSortIconStock = (key: ProductosStockSortKey) => {
    if (sortKeyStock !== key) return 'unfold_more';
    return sortDirStock === 'asc' ? 'arrow_upward' : 'arrow_downward';
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

  const sortedStockBajo = useMemo(() => {
    const sorted = [...stock_bajo];
    sorted.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      switch (sortKeyStock) {
        case 'nombre':
          valA = a.nombre.toLowerCase();
          valB = b.nombre.toLowerCase();
          break;
        case 'stock_actual':
          valA = a.stock;
          valB = b.stock;
          break;
        case 'stock_minimo':
          valA = a.stock_minimo;
          valB = b.stock_minimo;
          break;
      }

      if (valA < valB) return sortDirStock === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirStock === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [stock_bajo, sortKeyStock, sortDirStock]);

  return (
    <>
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            <span className="material-icons">category</span>
            Productos vendidos
          </span>
          <span className={styles.kpiValue}>{formatNumber(resumen.productos_distintos_vendidos)}</span>
          <span className={styles.kpiSub}>productos distintos</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            <span className="material-icons">inventory</span>
            Unidades totales
          </span>
          <span className={styles.kpiValue}>{formatNumber(resumen.unidades_totales)}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            <span className="material-icons">attach_money</span>
            Ingreso total
          </span>
          <span className={styles.kpiValue}>{formatCurrency(resumen.ingreso_total_productos)}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            <span className="material-icons">warning</span>
            Stock bajo
          </span>
          <span className={styles.kpiValue}>{formatNumber(stock_bajo.length)}</span>
          <span className={styles.kpiSub}>productos con alerta</span>
        </div>
      </div>

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

      {stock_bajo.length > 0 && (
        <div className={styles.stockAlert}>
          <h3 className={styles.stockAlertTitle}>
            <span className="material-icons">warning</span>
            Productos con stock bajo
          </h3>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.sortableHeader} onClick={() => handleSortStock('nombre')}>
                    <span className={styles.sortableHeaderContent}>
                      Producto
                      <span
                        className={`material-icons ${styles.sortIcon} ${sortKeyStock === 'nombre' ? styles.sortIconActive : ''}`}
                      >
                        {getSortIconStock('nombre')}
                      </span>
                    </span>
                  </th>
                  <th
                    className={`${styles.sortableHeader} ${styles.textRight}`}
                    onClick={() => handleSortStock('stock_actual')}
                  >
                    <span className={styles.sortableHeaderContent}>
                      Stock Actual
                      <span
                        className={`material-icons ${styles.sortIcon} ${sortKeyStock === 'stock_actual' ? styles.sortIconActive : ''}`}
                      >
                        {getSortIconStock('stock_actual')}
                      </span>
                    </span>
                  </th>
                  <th
                    className={`${styles.sortableHeader} ${styles.textRight}`}
                    onClick={() => handleSortStock('stock_minimo')}
                  >
                    <span className={styles.sortableHeaderContent}>
                      Stock Minimo
                      <span
                        className={`material-icons ${styles.sortIcon} ${sortKeyStock === 'stock_minimo' ? styles.sortIconActive : ''}`}
                      >
                        {getSortIconStock('stock_minimo')}
                      </span>
                    </span>
                  </th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {sortedStockBajo.map((prod) => (
                  <tr key={prod.id_producto}>
                    <td style={{ fontWeight: 'var(--font-weight-semibold)' }}>{prod.nombre}</td>
                    <td className={`${styles.textRight} ${styles.monoCell}`}>{prod.stock}</td>
                    <td className={`${styles.textRight} ${styles.monoCell}`}>{prod.stock_minimo}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${prod.stock === 0 ? styles.badgeDanger : styles.badgeWarning}`}
                      >
                        {prod.stock === 0 ? 'Sin stock' : 'Bajo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
});

// ============================================================================
// SUB-COMPONENTE: REPORTE DE CLIENTES
// ============================================================================

const ReporteClientesTab: React.FC<{ data: ReporteClientesResponse }> = memo(({ data }) => {
  const { resumen, top_clientes } = data;
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
      <div className={styles.kpiGrid} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            <span className="material-icons">person_add</span>
            Clientes nuevos
          </span>
          <span className={styles.kpiValue}>{formatNumber(resumen.clientes_nuevos_periodo)}</span>
          <span className={styles.kpiSub}>en el periodo</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            <span className="material-icons">shopping_bag</span>
            Con compras
          </span>
          <span className={styles.kpiValue}>{formatNumber(resumen.clientes_con_compras)}</span>
          <span className={styles.kpiSub}>clientes activos</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            <span className="material-icons">groups</span>
            Total registrados
          </span>
          <span className={styles.kpiValue}>{formatNumber(resumen.clientes_totales)}</span>
        </div>
      </div>

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
  const { resumen, datos } = data;
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
      <div className={styles.kpiGrid} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            <span className="material-icons">cancel</span>
            Total cancelaciones
          </span>
          <span className={styles.kpiValue}>{formatNumber(resumen.total_cancelaciones)}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            <span className="material-icons">money_off</span>
            Monto cancelado
          </span>
          <span className={styles.kpiValue}>{formatCurrency(resumen.monto_ars)}</span>
          <span className={styles.kpiSub}>{formatUSD(resumen.monto_usd)}</span>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>
            <span className="material-icons">percent</span>
            Tasa de cancelacion
          </span>
          <span className={styles.kpiValue}>{resumen.tasa_cancelacion}%</span>
          <span className={styles.kpiSub}>del total de ventas</span>
        </div>
      </div>

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

