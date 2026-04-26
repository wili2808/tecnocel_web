import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { MENU_PERMISOS } from '../../../constants/menuPermisos';
import adminApi from '../../../api/axiosAdminConfig';
import adminCompraService from '../../../services/adminCompraService';
import envioAdminService from '../../../services/envioAdminService';
import reporteService from '../../../services/reporteService';
import adminVentaService from '../../../services/adminVentaService';
import styles from './DashboardAdmin.module.css';
import type {
  CompraListItem,
  EstadisticasCompras,
  EstadisticasVentas,
  ReporteClientesResponse,
  ReporteProductosResponse,
  ReporteVendedoresResponse,
  ReporteVentasResumen,
  VentaListItem,
} from '../../../types';

interface DashboardAdminProps {
  onNavigate: (section: string) => void;
}

interface StatsGenerales {
  usuarios_sistema: number;
  clientes_registrados: number;
  productos_activos: number;
}

interface TipoCambioInfo {
  valor: number;
  fyh_actualizacion: string | null;
}

interface DashboardData {
  general: StatsGenerales | null;
  ventasStats: EstadisticasVentas | null;
  comprasStats: EstadisticasCompras | null;
  ventasResumen: ReporteVentasResumen | null;
  productosReporte: ReporteProductosResponse | null;
  clientesReporte: ReporteClientesResponse | null;
  vendedoresReporte: ReporteVendedoresResponse | null;
  enviosPendientes: number;
  retirosPendientes: number;
  tipoCambio: TipoCambioInfo | null;
  recentVentas: VentaListItem[];
  recentCompras: CompraListItem[];
}

interface MetricCardData {
  label: string;
  value: string;
  icon: string;
  detail: string;
  tone: 'primary' | 'success' | 'warning' | 'neutral';
}

interface PriorityItem {
  title: string;
  value: string;
  description: string;
  icon: string;
  tone: 'success' | 'warning' | 'danger' | 'info';
}

interface InsightItem {
  label: string;
  value: string;
  hint: string;
}

interface ActivityItem {
  id: string;
  title: string;
  meta: string;
  amount: string;
  icon: string;
  timestamp: number;
  tone: 'venta' | 'compra';
}

interface ModuleSummary {
  id: string;
  label: string;
  icon: string;
  summary: string;
}

const INITIAL_DATA: DashboardData = {
  general: null,
  ventasStats: null,
  comprasStats: null,
  ventasResumen: null,
  productosReporte: null,
  clientesReporte: null,
  vendedoresReporte: null,
  enviosPendientes: 0,
  retirosPendientes: 0,
  tipoCambio: null,
  recentVentas: [],
  recentCompras: [],
};

const MODULE_SUMMARIES: Record<string, string> = {
  dashboard: 'Vista operativa del negocio y del alcance del rol actual.',
  productos: 'Catálogo, marcas, categorías, características y control de stock.',
  usuarios: 'Usuarios internos, roles del sistema y capacidad operativa del equipo.',
  clientes: 'Base de clientes, estado de cuentas y seguimiento comercial.',
  ofertas: 'Campañas comerciales, vigencias y productos promocionados.',
  compras: 'Compras a proveedores, abastecimiento y reposición del catálogo.',
  ventas: 'Ventas web/manuales, envíos, retiros y configuración comercial.',
  reportes: 'Lectura analítica del negocio con exportación y comparativas.',
  permisos: 'Gobernanza de acceso y seguridad operativa.',
};

const toMonthDateRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);

  const format = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    fecha_inicio: format(start),
    fecha_fin: format(now),
  };
};

const formatNumber = (value: number): string => new Intl.NumberFormat('es-AR').format(value);

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatCompactCurrency = (value: number): string =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

const formatDateTime = (value: string): string =>
  new Date(value).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatRelativeDate = (value: Date): string =>
  value.toLocaleString('es-AR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

const DashboardAdmin = ({ onNavigate: _onNavigate }: DashboardAdminProps) => {
  const { user, isAdmin, tienePermiso } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const monthRange = useMemo(() => toMonthDateRange(), []);

  const userName = user && 'nombres' in user ? user.nombres : 'Equipo';
  const roleName = user && 'rolNombre' in user ? user.rolNombre : 'Sistema';
  const permissionCount = user && 'permisos' in user ? (user.permisos?.length ?? 0) : 0;

  const canViewVentas = tienePermiso('ver_ventas');
  const canViewCompras = tienePermiso('ver_compras');
  const canViewEnvios = tienePermiso('ver_envios');
  const canViewReportes = tienePermiso('ver_reportes');
  const canViewConfig = tienePermiso('ver_configuracion');

  useEffect(() => {
    let active = true;

    const cargarDashboard = async () => {
      setLoading(true);
      setError(null);

      const nextData: DashboardData = {
        ...INITIAL_DATA,
        recentVentas: [],
        recentCompras: [],
      };

      const requests: Promise<unknown>[] = [
        adminApi.get<StatsGenerales>('/usuarios/admin/dashboard-stats').then((response) => {
          nextData.general = response.data;
        }),
      ];

      if (canViewVentas) {
        requests.push(
          adminVentaService.obtenerEstadisticas().then((data) => {
            nextData.ventasStats = data;
          }),
        );
        requests.push(
          adminVentaService.listarVentas({}, 4, 0).then((response) => {
            nextData.recentVentas = response.ventas;
          }),
        );
      }

      if (canViewCompras) {
        requests.push(
          adminCompraService.obtenerEstadisticas().then((response) => {
            nextData.comprasStats = response.data;
          }),
        );
        requests.push(
          adminCompraService.listarCompras({}, 4, 0).then((response) => {
            nextData.recentCompras = response.data;
          }),
        );
      }

      if (canViewReportes) {
        requests.push(
          reporteService.obtenerReporteVentas(monthRange).then((data) => {
            nextData.ventasResumen = data.resumen;
          }),
        );
        requests.push(
          reporteService.obtenerReporteProductos({ ...monthRange, limite: 5 }).then((data) => {
            nextData.productosReporte = data;
          }),
        );
        requests.push(
          reporteService.obtenerReporteClientes({ ...monthRange, limite: 5 }).then((data) => {
            nextData.clientesReporte = data;
          }),
        );
        requests.push(
          reporteService.obtenerReporteVendedores({ ...monthRange, limite: 5 }).then((data) => {
            nextData.vendedoresReporte = data;
          }),
        );
      }

      if (canViewEnvios) {
        requests.push(
          envioAdminService.listarEnvios({ estado_envio: 'pendiente', limit: 1, offset: 0 }).then((response) => {
            nextData.enviosPendientes = response.total;
          }),
        );
        requests.push(
          envioAdminService.listarRetiros({ estado_envio: 'pendiente', limit: 1, offset: 0 }).then((response) => {
            nextData.retirosPendientes = response.total;
          }),
        );
      }

      if (canViewConfig) {
        requests.push(
          adminVentaService.getTipoCambio().then((data) => {
            nextData.tipoCambio = data;
          }),
        );
      }

      const results = await Promise.allSettled(requests);
      const hasData = results.some((result) => result.status === 'fulfilled');

      if (!active) {
        return;
      }

      setDashboardData(nextData);
      setLastUpdated(new Date());
      setLoading(false);

      if (!hasData) {
        setError('No se pudo cargar la información operativa del dashboard.');
      }
    };

    void cargarDashboard();

    return () => {
      active = false;
    };
  }, [canViewCompras, canViewConfig, canViewEnvios, canViewReportes, canViewVentas, monthRange]);

  const enabledModules = useMemo<ModuleSummary[]>(() => {
    return MENU_PERMISOS.filter((option) => {
      if (option.id === 'dashboard') return false;
      if (option.id === 'permisos') return isAdmin;
      if (option.permisosRequeridos.length === 0) return true;
      return option.permisosRequeridos.every((permiso) => tienePermiso(permiso));
    }).map((option) => ({
      id: option.id,
      icon: option.icon,
      label: option.label,
      summary: MODULE_SUMMARIES[option.id] ?? 'Módulo disponible para la operación del rol actual.',
    }));
  }, [isAdmin, tienePermiso]);

  const gastoMes = dashboardData.comprasStats ? parseFloat(dashboardData.comprasStats.gasto_mes) || 0 : 0;
  const ingresosMes = dashboardData.ventasStats?.ingresos_mes ?? 0;
  const balanceEstimado = ingresosMes - gastoMes;
  const stockBajoCount = dashboardData.productosReporte?.stock_bajo.length ?? 0;

  const primaryMetrics = useMemo<MetricCardData[]>(() => {
    const metrics: MetricCardData[] = [];

    if (dashboardData.ventasStats) {
      metrics.push({
        label: 'Ingresos del mes',
        value: formatCompactCurrency(dashboardData.ventasStats.ingresos_mes),
        icon: 'payments',
        detail: `${formatNumber(dashboardData.ventasStats.ventas_mes)} ventas cerradas`,
        tone: 'primary',
      });
      metrics.push({
        label: 'Ventas del mes',
        value: formatNumber(dashboardData.ventasStats.ventas_mes),
        icon: 'receipt_long',
        detail: `${formatNumber(dashboardData.ventasStats.ventas_hoy)} realizadas hoy`,
        tone: 'success',
      });
    }

    if (dashboardData.comprasStats) {
      metrics.push({
        label: 'Compras a proveedores',
        value: formatCompactCurrency(gastoMes),
        icon: 'shopping_cart',
        detail: `${formatNumber(dashboardData.comprasStats.compras_mes)} compras activas este mes`,
        tone: 'warning',
      });
    }

    if (dashboardData.ventasStats && dashboardData.comprasStats) {
      metrics.push({
        label: 'Balance operativo',
        value: formatCompactCurrency(balanceEstimado),
        icon: balanceEstimado >= 0 ? 'trending_up' : 'trending_down',
        detail: balanceEstimado >= 0 ? 'Margen mensual favorable' : 'Compras por encima del ingreso mensual',
        tone: balanceEstimado >= 0 ? 'success' : 'warning',
      });
    } else if (dashboardData.general) {
      metrics.push({
        label: 'Productos activos',
        value: formatNumber(dashboardData.general.productos_activos),
        icon: 'inventory_2',
        detail: stockBajoCount > 0 ? `${stockBajoCount} con stock comprometido` : 'Catálogo estable',
        tone: 'neutral',
      });
    }

    return metrics.slice(0, 4);
  }, [
    balanceEstimado,
    dashboardData.comprasStats,
    dashboardData.general,
    dashboardData.ventasStats,
    gastoMes,
    stockBajoCount,
  ]);

  const priorityItems = useMemo<PriorityItem[]>(() => {
    const items: PriorityItem[] = [];

    if (dashboardData.enviosPendientes > 0) {
      items.push({
        title: 'Envíos pendientes',
        value: formatNumber(dashboardData.enviosPendientes),
        description: 'Pedidos con entrega a domicilio esperando gestión.',
        icon: 'local_shipping',
        tone: 'warning',
      });
    }

    if (dashboardData.retirosPendientes > 0) {
      items.push({
        title: 'Retiros en tienda',
        value: formatNumber(dashboardData.retirosPendientes),
        description: 'Órdenes listas o por preparar para retiro presencial.',
        icon: 'storefront',
        tone: 'info',
      });
    }

    if (stockBajoCount > 0) {
      items.push({
        title: 'Stock bajo',
        value: formatNumber(stockBajoCount),
        description: 'Productos críticos detectados por el reporte comercial.',
        icon: 'inventory',
        tone: stockBajoCount >= 5 ? 'danger' : 'warning',
      });
    }

    if (dashboardData.ventasResumen) {
      items.push({
        title: 'Ticket promedio',
        value: formatCurrency(dashboardData.ventasResumen.ticket_promedio),
        description: 'Valor promedio por venta en el periodo actual.',
        icon: 'sell',
        tone: 'success',
      });
    }

    if (items.length === 0) {
      items.push({
        title: 'Operación estable',
        value: 'Sin alertas',
        description: 'No se detectaron pendientes críticos con tus permisos actuales.',
        icon: 'verified',
        tone: 'success',
      });
    }

    return items.slice(0, 4);
  }, [dashboardData.enviosPendientes, dashboardData.retirosPendientes, dashboardData.ventasResumen, stockBajoCount]);

  const commercialInsights = useMemo<InsightItem[]>(() => {
    const insights: InsightItem[] = [];

    if (dashboardData.ventasResumen) {
      insights.push({
        label: 'Canal dominante',
        value:
          dashboardData.ventasResumen.ventas_web >= dashboardData.ventasResumen.ventas_manual
            ? 'Venta web'
            : 'Venta manual',
        hint: `${formatNumber(dashboardData.ventasResumen.ventas_web)} web / ${formatNumber(dashboardData.ventasResumen.ventas_manual)} manuales`,
      });
      insights.push({
        label: 'Método más usado',
        value: dashboardData.ventasResumen.metodo_mas_usado,
        hint: 'Preferencia de cobro del periodo activo.',
      });
    }

    if (dashboardData.vendedoresReporte?.resumen.vendedor_top_ventas) {
      insights.push({
        label: 'Top vendedor',
        value: dashboardData.vendedoresReporte.resumen.vendedor_top_ventas,
        hint: 'Mayor volumen de ventas en el periodo.',
      });
    }

    if (dashboardData.clientesReporte) {
      insights.push({
        label: 'Clientes con compra',
        value: formatNumber(dashboardData.clientesReporte.resumen.clientes_con_compras),
        hint: `Sobre ${formatNumber(dashboardData.clientesReporte.resumen.clientes_totales)} registrados`,
      });
    }

    return insights;
  }, [dashboardData.clientesReporte, dashboardData.ventasResumen, dashboardData.vendedoresReporte]);

  const operationInsights = useMemo<InsightItem[]>(() => {
    const insights: InsightItem[] = [];

    if (dashboardData.general) {
      insights.push({
        label: 'Clientes registrados',
        value: formatNumber(dashboardData.general.clientes_registrados),
        hint: 'Base actual en la plataforma.',
      });
      insights.push({
        label: 'Usuarios internos',
        value: formatNumber(dashboardData.general.usuarios_sistema),
        hint: 'Equipo con acceso al panel administrativo.',
      });
    }

    if (dashboardData.productosReporte?.mas_vendidos[0]) {
      insights.push({
        label: 'Producto líder',
        value: dashboardData.productosReporte.mas_vendidos[0].nombre,
        hint: `${formatNumber(dashboardData.productosReporte.mas_vendidos[0].unidades_vendidas)} unidades vendidas`,
      });
    }

    if (dashboardData.tipoCambio) {
      insights.push({
        label: 'Cotización USD',
        value: `${dashboardData.tipoCambio.valor.toLocaleString('es-AR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} ARS`,
        hint: dashboardData.tipoCambio.fyh_actualizacion
          ? `Actualizada ${formatDateTime(dashboardData.tipoCambio.fyh_actualizacion)}`
          : 'Sin fecha de actualización registrada',
      });
    }

    return insights;
  }, [dashboardData.general, dashboardData.productosReporte, dashboardData.tipoCambio]);

  const activityItems = useMemo<ActivityItem[]>(() => {
    const ventas = dashboardData.recentVentas.map<ActivityItem>((venta) => ({
      id: `venta-${venta.id_venta}`,
      title: `Venta ${venta.nro_venta}`,
      meta: `${venta.nombre_cliente || 'Mostrador'} · ${formatDateTime(venta.fyh_creacion)}`,
      amount: formatCurrency(venta.total_pagado),
      icon: 'receipt_long',
      timestamp: new Date(venta.fyh_creacion).getTime(),
      tone: 'venta',
    }));

    const compras = dashboardData.recentCompras.map<ActivityItem>((compra) => ({
      id: `compra-${compra.id_compra}`,
      title: `Compra ${compra.nro_compra}`,
      meta: `${compra.nombre_proveedor} · ${formatDateTime(compra.fyh_creacion)}`,
      amount: formatCurrency(parseFloat(compra.precio_total) || 0),
      icon: 'shopping_cart',
      timestamp: new Date(compra.fyh_creacion).getTime(),
      tone: 'compra',
    }));

    return [...ventas, ...compras].sort((a, b) => b.timestamp - a.timestamp).slice(0, 6);
  }, [dashboardData.recentCompras, dashboardData.recentVentas]);

  const loadingMetrics = [0, 1, 2, 3];

  return (
    <section className={styles.dashboard}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>Centro operativo</span>
          <h1 className={styles.title}>Dashboard administrativo</h1>
          <p className={styles.subtitle}>
            {userName}, este tablero resume el estado comercial, operativo y de acceso de tu sesión actual sin duplicar
            la navegación del sidebar.
          </p>

          <div className={styles.heroMeta}>
            <span className={styles.roleBadge}>
              <span className="material-icons">shield</span>
              {roleName}
            </span>
            <span className={styles.metaPill}>
              <span className="material-icons">grid_view</span>
              {enabledModules.length} módulos activos
            </span>
            <span className={styles.metaPill}>
              <span className="material-icons">key</span>
              {isAdmin ? 'Acceso total' : `${permissionCount} permisos asignados`}
            </span>
          </div>
        </div>

        <div className={styles.heroAside}>
          <div className={styles.heroStat}>
            <span className={styles.heroStatLabel}>Actualización</span>
            <strong className={styles.heroStatValue}>
              {lastUpdated ? formatRelativeDate(lastUpdated) : 'Cargando'}
            </strong>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.heroStatLabel}>Productos activos</span>
            <strong className={styles.heroStatValue}>
              {dashboardData.general ? formatNumber(dashboardData.general.productos_activos) : '—'}
            </strong>
          </div>
          <div className={styles.heroStat}>
            <span className={styles.heroStatLabel}>Foco inmediato</span>
            <strong className={styles.heroStatValue}>{priorityItems[0]?.title ?? 'Operación estable'}</strong>
          </div>
        </div>
      </header>

      {error && (
        <div className={styles.alertBanner}>
          <span className="material-icons">error_outline</span>
          <span>{error}</span>
        </div>
      )}

      <section className={styles.metricsGrid}>
        {loading
          ? loadingMetrics.map((item) => <div key={item} className={styles.metricSkeleton} />)
          : primaryMetrics.map((metric) => (
              <article key={metric.label} className={`${styles.metricCard} ${styles[`metric${metric.tone}`]}`}>
                <div className={styles.metricHeader}>
                  <span className={styles.metricLabel}>{metric.label}</span>
                  <span className={`material-icons ${styles.metricIcon}`}>{metric.icon}</span>
                </div>
                <strong className={styles.metricValue}>{metric.value}</strong>
                <span className={styles.metricDetail}>{metric.detail}</span>
              </article>
            ))}
      </section>

      <section className={styles.priorityGrid}>
        {priorityItems.map((item) => (
          <article key={item.title} className={`${styles.priorityCard} ${styles[`priority${item.tone}`]}`}>
            <div className={styles.priorityIcon}>
              <span className="material-icons">{item.icon}</span>
            </div>
            <div className={styles.priorityBody}>
              <span className={styles.priorityTitle}>{item.title}</span>
              <strong className={styles.priorityValue}>{item.value}</strong>
              <span className={styles.priorityDescription}>{item.description}</span>
            </div>
          </article>
        ))}
      </section>

      <section className={styles.panelGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Negocio</span>
              <h2 className={styles.panelTitle}>Pulso comercial</h2>
            </div>
            <span className={`material-icons ${styles.panelIcon}`}>insights</span>
          </div>

          <div className={styles.panelList}>
            {commercialInsights.length > 0 ? (
              commercialInsights.map((item) => (
                <div key={item.label} className={styles.listItem}>
                  <span className={styles.listLabel}>{item.label}</span>
                  <strong className={styles.listValue}>{item.value}</strong>
                  <span className={styles.listHint}>{item.hint}</span>
                </div>
              ))
            ) : (
              <p className={styles.emptyState}>Tu rol no tiene suficiente lectura comercial para esta sección.</p>
            )}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Operación</span>
              <h2 className={styles.panelTitle}>Salud del sistema</h2>
            </div>
            <span className={`material-icons ${styles.panelIcon}`}>monitoring</span>
          </div>

          <div className={styles.panelList}>
            {operationInsights.length > 0 ? (
              operationInsights.map((item) => (
                <div key={item.label} className={styles.listItem}>
                  <span className={styles.listLabel}>{item.label}</span>
                  <strong className={styles.listValue}>{item.value}</strong>
                  <span className={styles.listHint}>{item.hint}</span>
                </div>
              ))
            ) : (
              <p className={styles.emptyState}>No hay indicadores operativos adicionales disponibles para tu sesión.</p>
            )}
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Rol</span>
              <h2 className={styles.panelTitle}>Tu alcance hoy</h2>
            </div>
            <span className={`material-icons ${styles.panelIcon}`}>admin_panel_settings</span>
          </div>

          <div className={styles.moduleList}>
            {enabledModules.map((module) => (
              <div key={module.id} className={styles.moduleItem}>
                <div className={styles.moduleIcon}>
                  <span className="material-icons">{module.icon}</span>
                </div>
                <div className={styles.moduleContent}>
                  <strong className={styles.moduleTitle}>{module.label}</strong>
                  <span className={styles.moduleSummary}>{module.summary}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className={styles.activityPanel}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.panelEyebrow}>Movimiento</span>
            <h2 className={styles.panelTitle}>Actividad reciente</h2>
          </div>
          <span className={`material-icons ${styles.panelIcon}`}>history</span>
        </div>

        {activityItems.length > 0 ? (
          <div className={styles.activityList}>
            {activityItems.map((item) => (
              <article key={item.id} className={styles.activityItem}>
                <div className={`${styles.activityMarker} ${styles[`activity${item.tone}`]}`}>
                  <span className="material-icons">{item.icon}</span>
                </div>
                <div className={styles.activityContent}>
                  <strong className={styles.activityTitle}>{item.title}</strong>
                  <span className={styles.activityMeta}>{item.meta}</span>
                </div>
                <strong className={styles.activityAmount}>{item.amount}</strong>
              </article>
            ))}
          </div>
        ) : (
          <p className={styles.emptyState}>Todavía no hay movimientos recientes visibles con los permisos actuales.</p>
        )}
      </section>
    </section>
  );
};

export default DashboardAdmin;
