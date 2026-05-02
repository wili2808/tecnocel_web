import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import adminCompraService from '../../../services/adminCompraService';
import reporteService from '../../../services/reporteService';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import {
  AdminEmptyState,
  AdminEntitySearchBar,
  AdminFilterPanel,
  AdminMetricsStrip,
  AdminPagination,
} from '../common';
import DetalleCompraModal from './DetalleCompraModal';
import styles from './GestionCompras.module.css';
import controlStyles from '../common/AdminControlStyles.module.css';
import type { CompraListItem, EstadisticasCompras, FiltrosComprasAdmin } from '../../../types';
import type { ProductoStockBajo } from '../../../types/reporte';

import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  getSortedRowModel,
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

// Componentes que requieren lazy loading (más adelante)
const RegistrarCompraModal = React.lazy(() => import('./RegistrarCompraModal'));
const GestionProveedores = React.lazy(() => import('./GestionProveedores'));

const LIMIT = 10;

type TabType = 'compras' | 'proveedores' | 'stock';

// Componente para cabeceras arrastrables con soporte de ordenamiento local
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
  };

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
          className={header.column.getCanSort() ? styles.sortableHeaderContent : ''}
          onClick={header.column.getToggleSortingHandler()}
          style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default', flex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          {flexRender(header.column.columnDef.header, header.getContext())}
          
          {header.column.getCanSort() && (
            <span
              className={`material-icons ${styles.sortIcon} ${header.column.getIsSorted() ? styles.sortIconActive : ''}`}
            >
              {{
                asc: 'arrow_upward',
                desc: 'arrow_downward',
              }[header.column.getIsSorted() as string] ?? 'unfold_more'}
            </span>
          )}
        </div>
      </div>
    </th>
  );
};

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
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [stockPagination, setStockPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  
  const [sorting, setSorting] = useState<SortingState>([]);
  const [stockSorting, setStockSorting] = useState<SortingState>([]);

  const pagination = useMemo<PaginationState>(() => ({
    pageIndex: Math.floor(offset / LIMIT),
    pageSize: LIMIT,
  }), [offset]);

  const setPagination = useCallback((updater: any) => {
    const nextPagination = typeof updater === 'function' ? updater(pagination) : updater;
    setOffset(nextPagination.pageIndex * LIMIT);
  }, [pagination]);

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
      const response = await adminCompraService.listarCompras(filtros, LIMIT, offset);

      setCompras(response.data);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar compras');
      setCompras([]);
    } finally {
      setCargando(false);
      cargandoRef.current = false;
    }
  }, [filtros, offset]);

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
    setOffset(0);
    cargarCompras();
    cargarStats();
  };

  const handleAnulada = () => {
    setOffset(0);
    cargarCompras();
    cargarStats();
    showNotification('Compra anulada exitosamente', 'success');
  };

  const handleLimpiarFiltros = () => {
    setFiltros({});
    setOffset(0);
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

  const comprasTable = useReactTable({
    data: compras,
    columns: comprasColumns,
    pageCount: Math.ceil(total / LIMIT),
    state: {
      pagination,
      columnOrder,
      sorting,
    },
    onPaginationChange: setPagination,
    onColumnOrderChange: setColumnOrder,
    onSortingChange: setSorting,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

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

  const stockTable = useReactTable({
    data: stockBajo,
    columns: stockColumns,
    state: { 
      columnOrder: stockColumnOrder,
      pagination: stockPagination,
      sorting: stockSorting,
    },
    onColumnOrderChange: setStockColumnOrder,
    onPaginationChange: setStockPagination,
    onSortingChange: setStockSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEndCompras = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setColumnOrder((order) => {
        const oldIndex = order.indexOf(active.id as string);
        const newIndex = order.indexOf(over.id as string);
        return arrayMove(order, oldIndex, newIndex);
      });
    }
  };

  const handleDragEndStock = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setStockColumnOrder((order) => {
        const oldIndex = order.indexOf(active.id as string);
        const newIndex = order.indexOf(over.id as string);
        return arrayMove(order, oldIndex, newIndex);
      });
    }
  };


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

  return (
    <div className={styles.container}>


      {/* Estadísticas */}
      {stats ? (
        <AdminMetricsStrip
          items={statsItems}
          className={styles.statsBar}
          itemClassName={styles.statCard}
        />
      ) : (
        <div className={styles.statsLoading} />
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border-color)', borderTop: '1px solid var(--border-color)', margin: 'var(--spacing-md) 0' }}>
        <div className={styles.tabsBar} style={{ border: 'none', margin: 0, marginBottom: '-1px', flex: 1, paddingBottom: '1px', overflowX: 'auto', overflowY: 'hidden' }}>
          <button
            className={`${styles.tab} ${activeTab === 'compras' ? styles.tabActive : ''}`}
            onClick={() => {
              setActiveTab('compras');
              setOffset(0);
            }}
          >
            <span className="material-icons">receipt_long</span>
            Compras
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'proveedores' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('proveedores')}
          >
            <span className="material-icons">business</span>
            Proveedores
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'stock' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('stock')}
          >
            <span className="material-icons">warning</span>
            Stock Bajo
            {stockBajo.length > 0 && <span className={styles.tabBadge}>{stockBajo.length}</span>}
          </button>
        </div>

        {activeTab === 'stock' && seleccionados.size > 0 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingBottom: '4px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '8px' }}>
              {seleccionados.size} seleccionado{seleccionados.size !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => setSeleccionados(new Set())}
              title="Limpiar selección"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <span className="material-icons" style={{ fontSize: '14px' }}>close</span>
              Limpiar
            </button>
            <button
              onClick={() => abrirCompraConSeleccion()}
              disabled={!puedeCrear}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', background: 'var(--color-primary)', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 600, color: 'white', cursor: !puedeCrear ? 'not-allowed' : 'pointer', opacity: !puedeCrear ? 0.6 : 1 }}
            >
              <span className="material-icons" style={{ fontSize: '14px' }}>shopping_cart</span>
              Ordenar compra
            </button>
          </div>
        )}
      </div>

      {/* Tab: Compras */}
      {activeTab === 'compras' && (
        <>
          {/* Barra de Filtros Premium de 2 Filas - Usando Sistema Global */}
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
                      setOffset(0);
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
                      setOffset(0);
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
                      setOffset(0);
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
                    setOffset(0);
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

          {/* Tabla */}
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
            <AdminEmptyState
              icon="hourglass_empty"
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
            <>
              <div className={styles.tableWrapper}>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndCompras}>
                  <table className={styles.table}>
                    <thead>
                      {comprasTable.getHeaderGroups().map(headerGroup => (
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
                      {comprasTable.getRowModel().rows.map((row) => (
                        <tr 
                          key={row.id}
                          onClick={() => setIdDetalleAbierto(row.original.id_compra)}
                          style={{ cursor: 'pointer' }}
                          className={styles.clickableRow}
                        >
                          {row.getVisibleCells().map(cell => (
                            <td key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </DndContext>
              </div>

              {/* Paginación (Servidor) */}
              <AdminPagination
                total={total}
                limit={LIMIT}
                offset={offset}
                onPageChange={setOffset}
                itemLabel="compras"
              />
            </>
          )}
        </>
      )}

      {/* Tab: Proveedores */}
      {activeTab === 'proveedores' && (
        <React.Suspense fallback={<div className={styles.loading}>Cargando...</div>}>
          <GestionProveedores />
        </React.Suspense>
      )}

      {/* Tab: Stock Bajo */}
      {activeTab === 'stock' && (
        <div className={styles.tabContent}>
          {cargandoStock ? (
            <AdminEmptyState
              icon="hourglass_empty"
              title="Cargando alertas de stock"
              message="Analizando inventario para detectar productos por debajo del mínimo..."
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
              {/* Barra flotante de compra rápida eliminada */}

              <div className={styles.tableWrapper}>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndStock}>
                  <table className={styles.table}>
                    <thead>
                      {stockTable.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          <SortableContext items={stockColumnOrder} strategy={horizontalListSortingStrategy}>
                            {headerGroup.headers.map((header) =>
                              header.column.id === 'sel' ? (
                                <th key={header.id} className={styles.sortableHeader} style={{ width: '40px' }}>
                                  {flexRender(header.column.columnDef.header, header.getContext())}
                                </th>
                              ) : (
                                <DraggableTableHeader key={header.id} header={header} />
                              )
                            )}
                          </SortableContext>
                        </tr>
                      ))}
                    </thead>
                  <tbody>
                    {stockTable.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        style={{
                          backgroundColor: seleccionados.has(row.original.id_producto)
                            ? 'color-mix(in srgb, var(--color-primary, #6366f1) 8%, transparent)'
                            : undefined,
                          cursor: 'pointer',
                          transition: 'background-color 0.15s',
                        }}
                        onClick={() => toggleSeleccion(row.original)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            onClick={cell.column.id === 'accion' ? (e) => e.stopPropagation() : undefined}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                </DndContext>
              </div>
              <AdminPagination
                total={stockBajo.length}
                limit={stockPagination.pageSize}
                offset={stockPagination.pageIndex * stockPagination.pageSize}
                onPageChange={(newOffset) => {
                  setStockPagination(prev => ({
                    ...prev,
                    pageIndex: Math.floor(newOffset / prev.pageSize)
                  }));
                }}
                itemLabel="productos"
              />
            </>
          )}
        </div>
      )}

      {/* Modales */}
      {mostrarRegistrar && (
        <React.Suspense fallback={null}>
          <RegistrarCompraModal
            onClose={() => {
              setMostrarRegistrar(false);
              setStockParaCompra([]);
            }}
            onRegistrada={handleRegistrada}
            productosIniciales={stockParaCompra.length > 0 ? stockParaCompra : undefined}
          />
        </React.Suspense>
      )}

      {idDetalleAbierto && (
        <DetalleCompraModal
          idCompra={idDetalleAbierto}
          onClose={() => setIdDetalleAbierto(null)}
          onAnulada={handleAnulada}
        />
      )}
    </div>
  );
});

GestionCompras.displayName = 'GestionCompras';

export default GestionCompras;
