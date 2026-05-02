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
import {
  AdminEmptyState,
  AdminEntitySearchBar,
  AdminFilterPanel,
  AdminMetricsStrip,
  AdminDataTable,
  AdminTabs,
} from '../common';
import type { AdminTabConfig } from '../common';
import styles from './GestionVentas.module.css';
import controlStyles from '../common/AdminControlStyles.module.css';
import type { VentaListItem, EstadisticasVentas, FiltrosVentasAdmin } from '../../../types/venta';


import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table';

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

const formatIngresoUsd = (n: number) => {
  if (n >= 1_000_000) return `USD ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `USD ${(n / 1_000).toFixed(1)}K`;
  return `USD ${formatMonto(n)}`;
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

// ── Componente ────────────────────────────────────────────────────────────────

const GestionVentas: React.FC = () => {
  const { tienePermiso } = useAuth();
  const puedeVer = tienePermiso('ver_ventas');
  const puedeVerEnvios = tienePermiso('ver_envios');
  const puedeVerRetiros = tienePermiso('ver_retiros');
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
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: LIMIT });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'fecha', desc: true }]);
  const [columnOrder, setColumnOrder] = useState<string[]>([
    'nro_venta', 'fecha', 'vendedor', 'cliente', 'items', 'total_pagado', 'metodo', 'tipo', 'estado'
  ]);


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
    async (f: FiltrosVentasAdmin, pIndex: number) => {
      if (cargandoRef.current) return;
      cargandoRef.current = true;
      setCargando(true);
      setError(null);
      try {
        const off = pIndex * pagination.pageSize;
        const res = await adminVentaService.listarVentas(f, pagination.pageSize, off);
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
    [pagination.pageSize, showNotification],
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
    cargarVentas(filtros, pagination.pageIndex);
  }, [cargarVentas, filtros, pagination.pageIndex, pagination.pageSize]);

  // ── Limpiar filtros ────────────────────────────────────────────────────────
  const limpiarFiltros = () => {
    setFiltros({});
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  };

  // ── Refresh tras acciones ──────────────────────────────────────────────────
  const refreshTodo = () => {
    cargarVentas(filtros, pagination.pageIndex);
    cargarStats();
  };

  const statsItems = useMemo(() => [
    {
      icon: 'today',
      label: 'Ventas hoy',
      value: stats?.ventas_hoy ?? 0,
    },
    {
      icon: 'date_range',
      label: 'Esta semana',
      value: stats?.ventas_semana ?? 0,
    },
    {
      icon: 'calendar_month',
      label: 'Este mes',
      value: stats?.ventas_mes ?? 0,
    },
    {
      icon: 'payments',
      label: 'Ingresos del mes',
      value: formatIngresoUsd((stats?.ingresos_mes ?? 0) / tipoCambio),
      tone: 'success' as const,
    },
  ], [stats, tipoCambio]);

  const ventasTabs = useMemo<AdminTabConfig[]>(() => {
    const items: AdminTabConfig[] = [
      { id: 'ventas', icon: 'receipt_long', label: 'Ventas' }
    ];
    if (puedeVerEnvios) {
      items.push({ id: 'envios', icon: 'local_shipping', label: 'Envíos', badge: enviosPendientes > 0 ? enviosPendientes : undefined });
    }
    if (puedeVerRetiros) {
      items.push({ id: 'retiros', icon: 'store', label: 'Retiros', badge: retirosPendientes > 0 ? retirosPendientes : undefined });
    }
    return items;
  }, [puedeVerEnvios, enviosPendientes, puedeVerRetiros, retirosPendientes]);

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
      <AdminMetricsStrip
        items={statsItems}
        loading={cargandoStats}
        className={styles.statsBar}
        itemClassName={styles.statCard}
      />

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

      {/* Tabs */}
      <AdminTabs 
        tabs={ventasTabs} 
        activeTab={activeTab} 
        onChange={(id) => setActiveTab(id as any)} 
        hasMarginTop={true}
      />

      {activeTab === 'envios' && puedeVerEnvios && (
        <GestionEnvios onPendientesChange={setEnviosPendientes} />
      )}

      {activeTab === 'retiros' && puedeVerRetiros && (
        <GestionRetiros onPendientesChange={setRetirosPendientes} />
      )}

      {activeTab === 'ventas' && (
        <>
          {/* Filtros Premium de 2 Filas - Usando Sistema Global */}
          <AdminFilterPanel>
            <AdminFilterPanel.Row variant="top">
              <AdminFilterPanel.Group>
                <AdminFilterPanel.Label>Desde</AdminFilterPanel.Label>
                <input
                  type="date"
                  className={controlStyles.field}
                  value={filtros.fecha_inicio || ''}
                  onChange={(e) => setFiltros((prev) => ({ ...prev, fecha_inicio: e.target.value || undefined }))}
                />
              </AdminFilterPanel.Group>
              <AdminFilterPanel.Group>
                <AdminFilterPanel.Label>Hasta</AdminFilterPanel.Label>
                <input
                  type="date"
                  className={controlStyles.field}
                  value={filtros.fecha_fin || ''}
                  onChange={(e) => setFiltros((prev) => ({ ...prev, fecha_fin: e.target.value || undefined }))}
                />
              </AdminFilterPanel.Group>
              <AdminFilterPanel.Group>
                <AdminFilterPanel.Label>Vendedor</AdminFilterPanel.Label>
                <select
                  className={controlStyles.field}
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
              </AdminFilterPanel.Group>
              <AdminFilterPanel.Group>
                <AdminFilterPanel.Label>Estado</AdminFilterPanel.Label>
                <select
                  className={controlStyles.field}
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
              </AdminFilterPanel.Group>
              <AdminFilterPanel.Group>
                <AdminFilterPanel.Label>Tipo</AdminFilterPanel.Label>
                <select
                  className={controlStyles.field}
                  value={filtros.tipo_venta || ''}
                  onChange={(e) =>
                    setFiltros((prev) => ({ ...prev, tipo_venta: e.target.value as FiltrosVentasAdmin['tipo_venta'] }))
                  }
                >
                  <option value="">Todos</option>
                  <option value="web">Web</option>
                  <option value="manual">Manual</option>
                </select>
              </AdminFilterPanel.Group>
              <AdminFilterPanel.Group>
                <AdminFilterPanel.Label>Método pago</AdminFilterPanel.Label>
                <select
                  className={controlStyles.field}
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
              </AdminFilterPanel.Group>
            </AdminFilterPanel.Row>

            <AdminFilterPanel.Row variant="bottom">
              <AdminFilterPanel.Grow>
                <AdminEntitySearchBar
                  searchValue={filtros.search || ''}
                  searchPlaceholder="N° venta, cliente..."
                  onSearchChange={(val) => {
                    setFiltros((prev) => ({ ...prev, search: val || undefined }));
                    setPagination(prev => ({ ...prev, pageIndex: 0 }));
                  }}
                  searchLabel="Búsqueda"
                  primaryActionLabel={puedeCrear ? 'Registrar Venta' : undefined}
                  primaryActionIcon="add_box"
                  onPrimaryAction={puedeCrear ? () => setMostrarRegistrar(true) : undefined}
                  primaryActionHidden={!puedeCrear}
                />
              </AdminFilterPanel.Grow>
              <AdminFilterPanel.Actions>
                <button className={controlStyles.secondaryButton} onClick={limpiarFiltros}>
                  <span className="material-icons">backspace</span>
                  <span>Limpiar</span>
                </button>
              </AdminFilterPanel.Actions>
            </AdminFilterPanel.Row>
          </AdminFilterPanel>

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
              onAction={() => cargarVentas(filtros, pagination.pageIndex)}
              tone="danger"
              className={styles.errorState}
            />
          ) : (
            <AdminDataTable
              data={ventas}
              columns={columns}
              sorting={sorting}
              onSortingChange={setSorting}
              columnOrder={columnOrder}
              onColumnOrderChange={setColumnOrder}
              pagination={pagination}
              onPaginationChange={setPagination}
              totalItems={total}
              itemLabel="ventas"
              onRowClick={(row) => setIdDetalleAbierto(row.id_venta)}
              isLoading={cargando}
              emptyMessage="No hay ventas que coincidan con los filtros aplicados"
            />
          )}
        </>
      )}

      {/* Modales */}
      {idDetalleAbierto && (
        <DetalleVentaModal
          idVenta={idDetalleAbierto}
          onClose={() => setIdDetalleAbierto(null)}
          onCancelada={refreshTodo}
        />
      )}

      {mostrarRegistrar && (
        <RegistrarVentaModal
          tipoCambioUsd={tipoCambio}
          onClose={() => setMostrarRegistrar(false)}
          onRegistrada={refreshTodo}
        />
      )}

      {cancelacionModal && (
        <CancelacionModal
          idVenta={cancelacionModal.id}
          nroVenta={cancelacionModal.nro}
          onClose={() => setCancelacionModal(null)}
          onCancelada={refreshTodo}
        />
      )}
    </div>
  );
};

export default GestionVentas;
