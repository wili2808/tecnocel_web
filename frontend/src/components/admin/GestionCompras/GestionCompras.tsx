import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import adminCompraService from '../../../services/adminCompraService';
import reporteService from '../../../services/reporteService';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import {
  AdminEmptyState,
  AdminLoading,
  AdminEntitySearchBar,
  AdminFilterPanel,
  AdminMetricsStrip,
  AdminDataTable,
  AdminTabs,
} from '../common';
import type { AdminTabConfig } from '../common';
import DetalleCompraModal from './DetalleCompraModal';
import styles from './GestionCompras.module.css';
import controlStyles from '../common/AdminControlStyles.module.css';
import type { CompraListItem, EstadisticasCompras, FiltrosComprasAdmin } from '../../../types';
import type { ProductoStockBajo } from '../../../types/reporte';

import type { ColumnDef, PaginationState, SortingState } from '@tanstack/react-table';

// Componentes que requieren lazy loading (más adelante)
const RegistrarCompraModal = React.lazy(() => import('./RegistrarCompraModal'));
const GestionProveedores = React.lazy(() => import('./GestionProveedores'));

const LIMIT = 10;

type TabType = 'compras' | 'proveedores' | 'stock';

const GestionCompras: React.FC = memo(() => {
  const { tienePermiso } = useAuth();
  const puedeVer = tienePermiso('ver_compras');
  const puedeCrear = tienePermiso('crear_compra');
  const { showNotification } = useNotification();

  // === Estado principal ===
  const [activeTab, setActiveTab] = useState<TabType>('compras');
  const [compras, setCompras] = useState<CompraListItem[]>([]);
  const [stats, setStats] = useState<EstadisticasCompras | null>(null);
  const [stockBajo, setStockBajo] = useState<ProductoStockBajo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoStock, setCargandoStock] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // === Selección de stock bajo ===
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [stockParaCompra, setStockParaCompra] = useState<ProductoStockBajo[]>([]);

  // === Filtros y búsqueda ===
  const [filtros, setFiltros] = useState<FiltrosComprasAdmin>({});

  // === Paginación y TanStack (Compras) ===
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: LIMIT });
  const [total, setTotal] = useState(0);
  const [stockPagination, setStockPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [stockSorting, setStockSorting] = useState<SortingState>([]);
  const [stockSearchTerm, setStockSearchTerm] = useState('');

  const [columnOrder, setColumnOrder] = useState<string[]>([
    'nro_compra', 'fecha', 'proveedor', 'comprobante', 'monto', 'items', 'estado'
  ]);

  const [stockColumnOrder, setStockColumnOrder] = useState<string[]>([
    'sel', 'producto', 'stock_actual', 'stock_minimo', 'deficit', 'costo', 'estado_stock', 'accion'
  ]);

  // === Modales ===
  const [idDetalleAbierto, setIdDetalleAbierto] = useState<number | null>(null);
  const [mostrarRegistrar, setMostrarRegistrar] = useState(false);

  // === Refs ===
  const cargandoRef = useRef(false);

  // === Funciones ===
  const cargarStats = useCallback(async () => {
    try {
      const response = await adminCompraService.obtenerEstadisticas();
      setStats(response.data);
    } catch (err) {
      console.error('Error al cargar estadísticas:', err);
    }
  }, []);

  const cargarStockBajo = useCallback(async () => {
    try {
      setCargandoStock(true);
      const response = await reporteService.obtenerReporteProductos();
      setStockBajo(response.stock_bajo);
    } catch (err) {
      console.error('Error al cargar stock bajo:', err);
    } finally {
      setCargandoStock(false);
    }
  }, []);

  const cargarCompras = useCallback(async () => {
    if (cargandoRef.current) return;
    cargandoRef.current = true;

    try {
      setCargando(true);
      setError(null);
      const off = pagination.pageIndex * pagination.pageSize;
      const response = await adminCompraService.listarCompras(filtros, pagination.pageSize, off);

      setCompras(response.data);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar compras');
      setCompras([]);
    } finally {
      setCargando(false);
      cargandoRef.current = false;
    }
  }, [filtros, pagination]);

  // === Efectos ===
  useEffect(() => {
    cargarStats();
    cargarStockBajo();
  }, [cargarStats, cargarStockBajo]);


  useEffect(() => {
    if (activeTab === 'compras') {
      cargarCompras();
    }
  }, [activeTab, cargarCompras]);

  const handleRegistrada = () => {
    setMostrarRegistrar(false);
    setSeleccionados(new Set());
    setStockParaCompra([]);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
    cargarCompras();
    cargarStats();
  };

  const handleAnulada = () => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
    cargarCompras();
    cargarStats();
    showNotification('Compra anulada exitosamente', 'success');
  };

  const handleLimpiarFiltros = () => {
    setFiltros({});
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  };

  const statsItems = useMemo(() => {
    if (!stats) return [];

    const stockTone: 'danger' | 'success' = stockBajo.length > 0 ? 'danger' : 'success';

    return [
      {
        icon: 'today',
        label: 'Hoy',
        value: stats.compras_hoy,
      },
      {
        icon: 'attach_money',
        label: 'Gasto del mes',
        value: `$${parseFloat(stats.gasto_mes).toLocaleString('es-AR')}`,
        tone: 'warning' as const,
      },
      {
        icon: 'warning',
        label: 'Stock Bajo',
        value: stockBajo.length,
        tone: stockTone,
      },
      {
        icon: 'local_shipping',
        label: 'Proveedores',
        value: 'Activos',
      },
    ];
  }, [stats, stockBajo.length]);

  // === Columnas TanStack para Compras ===
  const comprasColumns = useMemo<ColumnDef<CompraListItem>[]>(() => [
    {
      accessorKey: 'nro_compra',
      id: 'nro_compra',
      header: 'Nro. Compra',
      cell: info => <span style={{ fontWeight: 600 }}>{info.getValue() as string}</span>,
    },
    {
      accessorFn: row => new Date(row.fecha_compra).getTime(),
      id: 'fecha',
      header: 'Fecha',
      cell: info => new Date(info.row.original.fecha_compra).toLocaleDateString('es-AR', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
      }),
    },
    {
      accessorKey: 'nombre_proveedor',
      id: 'proveedor',
      header: 'Proveedor',
      cell: info => info.getValue() as string,
    },
    {
      accessorKey: 'comprobante',
      id: 'comprobante',
      header: 'Comprobante',
      cell: info => <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{info.getValue() as string}</span>,
    },
    {
      accessorFn: row => parseFloat(row.precio_total),
      id: 'monto',
      header: () => <div style={{ textAlign: 'right', width: '100%' }}>Monto</div>,
      cell: info => (
        <div style={{ textAlign: 'right', fontWeight: 600 }}>
          ${(info.getValue() as number).toLocaleString('es-AR')}
        </div>
      ),
    },
    {
      accessorKey: 'cantidad_items',
      id: 'items',
      header: () => <div style={{ textAlign: 'center', width: '100%' }}>Items</div>,
      cell: info => (
        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
          {info.getValue() as number}
        </div>
      ),
    },
    {
      accessorKey: 'estado',
      id: 'estado',
      header: 'Estado',
      cell: info => {
        const estado = info.getValue() as string;
        return (
          <span className={estado === 'activa' ? styles.badgeActiva : styles.badgeAnulada}>
            {estado === 'activa' ? 'Activa' : 'Anulada'}
          </span>
        );
      },
    }
  ], []);


  // === Helpers de selección de stock bajo ===
  const toggleSeleccion = useCallback((p: ProductoStockBajo) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(p.id_producto)) {
        next.delete(p.id_producto);
      } else {
        next.add(p.id_producto);
      }
      return next;
    });
  }, []);

  const toggleTodos = useCallback(() => {
    setSeleccionados((prev) =>
      prev.size === stockBajo.length
        ? new Set()
        : new Set(stockBajo.map((p) => p.id_producto))
    );
  }, [stockBajo]);

  const abrirCompraConSeleccion = useCallback((extras?: ProductoStockBajo[]) => {
    const lista = extras ?? stockBajo.filter((p) => seleccionados.has(p.id_producto));
    setStockParaCompra(lista);
    setMostrarRegistrar(true);
  }, [seleccionados, stockBajo]);

  const stockFiltrado = useMemo(() => {
    if (!stockSearchTerm) return stockBajo;
    const lower = stockSearchTerm.toLowerCase();
    return stockBajo.filter(p => 
      p.nombre.toLowerCase().includes(lower) || 
      (p.codigo && p.codigo.toLowerCase().includes(lower))
    );
  }, [stockBajo, stockSearchTerm]);

  // === Columnas TanStack para Stock ===
  const stockColumns = useMemo<ColumnDef<ProductoStockBajo>[]>(() => [
    {
      id: 'sel',
      enableSorting: false,
      header: () => (
        <input
          type="checkbox"
          title="Seleccionar todos"
          checked={seleccionados.size === stockBajo.length && stockBajo.length > 0}
          onChange={toggleTodos}
          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
        />
      ),
      cell: (info) => (
        <input
          type="checkbox"
          checked={seleccionados.has(info.row.original.id_producto)}
          onChange={() => toggleSeleccion(info.row.original)}
          onClick={(e) => e.stopPropagation()}
          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
        />
      ),
    },
    {
      accessorKey: 'nombre',
      id: 'producto',
      header: 'Producto',
      cell: (info) => (
        <div>
          <span style={{ fontWeight: 600 }}>{info.getValue() as string}</span>
          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            {info.row.original.codigo || '—'}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'stock',
      id: 'stock_actual',
      header: () => <div style={{ textAlign: 'right', width: '100%' }}>Stock Actual</div>,
      cell: (info) => (
        <div style={{ textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>
          {info.getValue() as number}
        </div>
      ),
    },
    {
      accessorKey: 'stock_minimo',
      id: 'stock_minimo',
      header: () => <div style={{ textAlign: 'right', width: '100%' }}>Mínimo</div>,
      cell: (info) => (
        <div style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>
          {info.getValue() as number}
        </div>
      ),
    },
    {
      id: 'deficit',
      header: () => <div style={{ textAlign: 'right', width: '100%' }}>Déficit</div>,
      cell: (info) => {
        const p = info.row.original;
        const deficit = Math.max(0, p.stock_minimo - p.stock);
        return (
          <div style={{ textAlign: 'right', fontWeight: 700, color: '#d97706' }}>+{deficit}</div>
        );
      },
    },
    {
      id: 'costo',
      header: () => <div style={{ textAlign: 'right', width: '100%' }}>Costo Unit.</div>,
      cell: (info) => {
        const pc = Number(info.row.original.precio_compra) || 0;
        return (
          <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            ${pc.toFixed(2)}
          </div>
        );
      },
    },
    {
      id: 'estado_stock',
      header: 'Estado',
      cell: () => <span className={styles.badgeAnulada}>Crítico</span>,
    },
    {
      id: 'accion',
      header: '',
      enableSorting: false,
      cell: (info) => (
        <button
          className={styles.actionBtn}
          title="Ordenar compra de este producto"
          onClick={(e) => { e.stopPropagation(); abrirCompraConSeleccion([info.row.original]); }}
          disabled={!puedeCrear}
        >
          <span className="material-icons" style={{ fontSize: '16px' }}>shopping_cart</span>
        </button>
      ),
    },
  ], [seleccionados, stockBajo, puedeCrear, toggleSeleccion, toggleTodos, abrirCompraConSeleccion]);



  // === Render ===
  if (!puedeVer) {
    return (
      <div className={styles.container}>
        <AdminEmptyState
          icon="lock"
          title="Sin acceso a compras"
          message="Tu usuario no tiene permisos para revisar compras ni proveedores desde esta sección."
          tone="warning"
        />
      </div>
    );
  }

  const comprasTabs = useMemo<AdminTabConfig[]>(() => [
    { id: 'compras', icon: 'receipt_long', label: 'Compras' },
    { id: 'proveedores', icon: 'business', label: 'Proveedores' },
    { id: 'stock', icon: 'warning', label: 'Stock Bajo', badge: stockBajo.length > 0 ? stockBajo.length : undefined },
  ], [stockBajo.length]);

  return (
    <div className={styles.container}>
      {/* Estadísticas */}
      <AdminMetricsStrip
        items={statsItems}
        loading={!stats}
        className={styles.statsBar}
        itemClassName={styles.statCard}
        columns={4}
      />

      {/* Tabs */}
      <AdminTabs 
        tabs={comprasTabs} 
        activeTab={activeTab} 
        onChange={(id) => {
          setActiveTab(id as TabType);
          if (id === 'compras') setPagination(prev => ({ ...prev, pageIndex: 0 }));
        }}
        hasMarginTop={true}
      />

      {/* Tab: Compras */}
      {activeTab === 'compras' && (
        <>
          <AdminFilterPanel>
            <AdminFilterPanel.Row variant="top">
              <AdminFilterPanel.Group>
                <AdminFilterPanel.Label>Fecha Desde</AdminFilterPanel.Label>
                  <input
                    type="date"
                    className={controlStyles.field}
                    value={filtros.fecha_inicio || ''}
                    onChange={(e) => {
                      setFiltros((prev) => ({ ...prev, fecha_inicio: e.target.value || undefined }));
                      setPagination(prev => ({ ...prev, pageIndex: 0 }));
                    }}
                  />
              </AdminFilterPanel.Group>
              <AdminFilterPanel.Group>
                <AdminFilterPanel.Label>Fecha Hasta</AdminFilterPanel.Label>
                  <input
                    type="date"
                    className={controlStyles.field}
                    value={filtros.fecha_fin || ''}
                    onChange={(e) => {
                      setFiltros((prev) => ({ ...prev, fecha_fin: e.target.value || undefined }));
                      setPagination(prev => ({ ...prev, pageIndex: 0 }));
                    }}
                  />
              </AdminFilterPanel.Group>
              <AdminFilterPanel.Group>
                <AdminFilterPanel.Label>Estado</AdminFilterPanel.Label>
                  <select
                    className={controlStyles.field}
                    value={filtros.estado || ''}
                    onChange={(e) => {
                      setFiltros((prev) => ({
                        ...prev,
                        estado: (e.target.value as 'activa' | 'anulada') || undefined,
                      }));
                      setPagination(prev => ({ ...prev, pageIndex: 0 }));
                    }}
                  >
                    <option value="">Todas</option>
                    <option value="activa">Activa</option>
                    <option value="anulada">Anulada</option>
                  </select>
              </AdminFilterPanel.Group>
            </AdminFilterPanel.Row>

            <AdminFilterPanel.Row variant="bottom">
              <AdminFilterPanel.Grow>
                <AdminEntitySearchBar
                  searchValue={filtros.search || ''}
                  searchPlaceholder="Ej: C-00001 o nombre proveedor"
                  onSearchChange={(val) => {
                    setFiltros((prev) => ({ ...prev, search: val || undefined }));
                    setPagination(prev => ({ ...prev, pageIndex: 0 }));
                  }}
                  searchLabel="Búsqueda"
                  primaryActionLabel={puedeCrear ? 'Nueva Compra' : undefined}
                  primaryActionIcon="add_box"
                  onPrimaryAction={puedeCrear ? () => setMostrarRegistrar(true) : undefined}
                  primaryActionDisabled={cargando}
                  primaryActionHidden={!puedeCrear}
                />
              </AdminFilterPanel.Grow>
              <AdminFilterPanel.Actions>
                <button className={controlStyles.secondaryButton} onClick={handleLimpiarFiltros}>
                  <span className="material-icons">backspace</span>
                  <span>Limpiar</span>
                </button>
              </AdminFilterPanel.Actions>
            </AdminFilterPanel.Row>
          </AdminFilterPanel>

          {error ? (
            <AdminEmptyState
              icon="error_outline"
              title="No pudimos cargar las compras"
              message={error}
              actionLabel="Reintentar"
              onAction={cargarCompras}
              tone="danger"
              className={styles.errorState}
            />
          ) : cargando ? (
            <AdminLoading
              variant="panel"
              title="Cargando compras"
              message="Estamos obteniendo el historial de compras y sus métricas de abastecimiento."
              className={styles.loadingState}
            />
          ) : compras.length === 0 ? (
            <AdminEmptyState
              icon="inventory_2"
              title="No hay compras registradas"
              message="Todavía no se encontraron compras para los filtros actuales."
              className={styles.loadingState}
            />
          ) : (
            <AdminDataTable
              data={compras}
              columns={comprasColumns}
              sorting={sorting}
              onSortingChange={setSorting}
              columnOrder={columnOrder}
              onColumnOrderChange={setColumnOrder}
              pagination={pagination}
              onPaginationChange={setPagination}
              totalItems={total}
              itemLabel="compras"
              onRowClick={(row) => setIdDetalleAbierto(row.id_compra)}
              isLoading={cargando}
              emptyMessage="No se encontraron compras para los filtros aplicados"
            />
          )}
        </>
      )}

      {/* Tab: Proveedores */}
      {activeTab === 'proveedores' && (
        <React.Suspense fallback={<AdminLoading variant="compact" title="Cargando proveedores…" />}>
          <GestionProveedores />
        </React.Suspense>
      )}

      {/* Tab: Stock Bajo */}
      {activeTab === 'stock' && (
        <div className={styles.tabContent}>
          {cargandoStock ? (
            <AdminLoading
              variant="panel"
              title="Cargando alertas de stock"
              message="Analizando inventario para detectar productos por debajo del mínimo…"
              className={styles.loadingState}
            />
          ) : stockBajo.length === 0 ? (
            <AdminEmptyState
              icon="check_circle"
              title="Todo en orden"
              message="No hay productos con stock bajo en este momento."
              tone="neutral"
              className={styles.loadingState}
            />
          ) : (
            <>
              <AdminFilterPanel>
                <AdminFilterPanel.Row variant="bottom">
                  <AdminFilterPanel.Grow>
                    <AdminEntitySearchBar
                      searchValue={stockSearchTerm}
                      onSearchChange={setStockSearchTerm}
                      searchPlaceholder="Buscar por nombre o código..."
                      searchLabel="Búsqueda de Alertas"
                      primaryActionLabel={seleccionados.size > 0 ? `Comprar seleccionados (${seleccionados.size})` : 'Seleccionar productos'}
                      primaryActionIcon="shopping_cart"
                      onPrimaryAction={() => abrirCompraConSeleccion()}
                      primaryActionDisabled={!puedeCrear || seleccionados.size === 0}
                    />
                  </AdminFilterPanel.Grow>
                </AdminFilterPanel.Row>
              </AdminFilterPanel>

              <AdminDataTable
                data={stockFiltrado}
                columns={stockColumns}
                sorting={stockSorting}
                onSortingChange={setStockSorting}
                columnOrder={stockColumnOrder}
                onColumnOrderChange={setStockColumnOrder}
                pagination={stockPagination}
                onPaginationChange={setStockPagination}
                totalItems={stockFiltrado.length}
                itemLabel="productos"
                isLoading={cargandoStock}
                manualPagination={false}
                onRowClick={toggleSeleccion}
                emptyMessage={stockSearchTerm ? `No se encontraron resultados para "${stockSearchTerm}"` : "No hay productos con stock bajo en este momento."}
              />
            </>
          )}
        </div>
      )}

      {/* Modales */}
      {idDetalleAbierto && (
        <DetalleCompraModal
          idCompra={idDetalleAbierto}
          onClose={() => setIdDetalleAbierto(null)}
          onAnulada={handleAnulada}
        />
      )}

      {mostrarRegistrar && (
        <React.Suspense fallback={<AdminLoading variant="compact" title="Cargando formulario…" />}>
          <RegistrarCompraModal
            onClose={() => {
              setMostrarRegistrar(false);
              setStockParaCompra([]);
            }}
            onRegistrada={handleRegistrada}
            productosIniciales={stockParaCompra}
          />
        </React.Suspense>
      )}
    </div>
  );
});

export default GestionCompras;
