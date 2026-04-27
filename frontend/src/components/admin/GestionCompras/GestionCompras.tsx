import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import adminCompraService from '../../../services/adminCompraService';
import reporteService from '../../../services/reporteService';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { useDebounce } from '../../../hooks/useDebounce';
import { AdminEmptyState, AdminSectionActions, AdminStatCard } from '../common';
import DetalleCompraModal from './DetalleCompraModal';
import AnularCompraModal from './AnularCompraModal';
import styles from './GestionCompras.module.css';
import type { CompraListItem, EstadisticasCompras, FiltrosComprasAdmin } from '../../../types';
import type { ProductoStockBajo } from '../../../types/reporte';

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import type { ColumnDef, PaginationState } from '@tanstack/react-table';

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

const LIMIT = 20;

type TabType = 'compras' | 'proveedores' | 'stock';

// Componente para cabeceras arrastrables (sin sorting, dado que la paginación es del lado del servidor y no hay sorting implementado backend)
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
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '4px' }}>
          {flexRender(header.column.columnDef.header, header.getContext())}
        </div>
      </div>
    </th>
  );
};

const GestionCompras: React.FC = memo(() => {
  const { tienePermiso } = useAuth();
  const puedeVer = tienePermiso('ver_compras');
  const puedeCrear = tienePermiso('crear_compra');
  const puedeEditar = tienePermiso('editar_compra');
  const { showNotification } = useNotification();

  // === Estado principal ===
  const [activeTab, setActiveTab] = useState<TabType>('compras');
  const [compras, setCompras] = useState<CompraListItem[]>([]);
  const [stats, setStats] = useState<EstadisticasCompras | null>(null);
  const [stockBajo, setStockBajo] = useState<ProductoStockBajo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoStock, setCargandoStock] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // === Filtros y búsqueda ===
  const [filtros, setFiltros] = useState<FiltrosComprasAdmin>({});
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);

  // === Paginación y TanStack (Compras) ===
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  
  const pagination = useMemo<PaginationState>(() => ({
    pageIndex: Math.floor(offset / LIMIT),
    pageSize: LIMIT,
  }), [offset]);

  const setPagination = useCallback((updater: any) => {
    const nextPagination = typeof updater === 'function' ? updater(pagination) : updater;
    setOffset(nextPagination.pageIndex * LIMIT);
  }, [pagination]);

  const [columnOrder, setColumnOrder] = useState<string[]>([
    'nro_compra', 'fecha', 'proveedor', 'comprobante', 'monto', 'items', 'estado', 'acciones'
  ]);

  const [stockColumnOrder, setStockColumnOrder] = useState<string[]>([
    'producto', 'stock_actual', 'stock_minimo', 'estado_stock'
  ]);

  // === Modales ===
  const [idDetalleAbierto, setIdDetalleAbierto] = useState<number | null>(null);
  const [mostrarRegistrar, setMostrarRegistrar] = useState(false);
  const [anularModal, setAnularModal] = useState<{ id: number; nro: string } | null>(null);

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
    setFiltros((prev) => ({
      ...prev,
      search: debouncedSearch || undefined,
    }));
  }, [debouncedSearch]);

  useEffect(() => {
    if (activeTab === 'compras') {
      cargarCompras();
    }
  }, [activeTab, cargarCompras]);

  const handleRegistrada = () => {
    setMostrarRegistrar(false);
    setOffset(0);
    cargarCompras();
    cargarStats();
  };

  const handleAnulada = () => {
    setAnularModal(null);
    setOffset(0);
    cargarCompras();
    cargarStats();
    showNotification('Compra anulada exitosamente', 'success');
  };

  const handleLimpiarFiltros = () => {
    setFiltros({});
    setSearchInput('');
    setOffset(0);
  };

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
    },
    {
      id: 'acciones',
      header: () => <div style={{ textAlign: 'right', width: '100%' }}>Acciones</div>,
      cell: info => {
        const compra = info.row.original;
        return (
          <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
            <button
              className={styles.actionBtn}
              title="Ver detalle"
              onClick={() => setIdDetalleAbierto(compra.id_compra)}
            >
              <span className="material-icons">visibility</span>
            </button>
            {compra.estado === 'activa' && puedeEditar && (
              <button
                className={styles.actionBtn}
                title="Anular"
                onClick={() => setAnularModal({ id: compra.id_compra, nro: compra.nro_compra })}
              >
                <span className="material-icons">delete</span>
              </button>
            )}
          </div>
        );
      },
    }
  ], [puedeEditar]);

  const comprasTable = useReactTable({
    data: compras,
    columns: comprasColumns,
    pageCount: Math.ceil(total / LIMIT),
    state: {
      pagination,
      columnOrder,
    },
    onPaginationChange: setPagination,
    onColumnOrderChange: setColumnOrder,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
  });

  // === Columnas TanStack para Stock ===
  const stockColumns = useMemo<ColumnDef<ProductoStockBajo>[]>(() => [
    {
      accessorKey: 'nombre',
      id: 'producto',
      header: 'Producto',
      cell: info => <span style={{ fontWeight: 600 }}>{info.getValue() as string}</span>,
    },
    {
      accessorKey: 'stock',
      id: 'stock_actual',
      header: () => <div style={{ textAlign: 'right', width: '100%' }}>Stock Actual</div>,
      cell: info => <div style={{ textAlign: 'right', fontWeight: 600 }}>{info.getValue() as number}</div>,
    },
    {
      accessorKey: 'stock_minimo',
      id: 'stock_minimo',
      header: () => <div style={{ textAlign: 'right', width: '100%' }}>Stock Mínimo</div>,
      cell: info => <div style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>{info.getValue() as number}</div>,
    },
    {
      id: 'estado_stock',
      header: 'Estado',
      cell: () => <span className={styles.badgeAnulada}>Crítico</span>,
    }
  ], []);

  const stockTable = useReactTable({
    data: stockBajo,
    columns: stockColumns,
    state: {
      columnOrder: stockColumnOrder,
    },
    onColumnOrderChange: setStockColumnOrder,
    getCoreRowModel: getCoreRowModel(),
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
      <AdminSectionActions
        lead={null}
        actions={
          puedeCrear ? (
            <button className={styles.crearButton} onClick={() => setMostrarRegistrar(true)} disabled={cargando}>
              <span className="material-icons">add</span>
              Nueva Compra
            </button>
          ) : null
        }
      />

      {/* Estadísticas */}
      {stats ? (
        <div className={styles.statsBar}>
          <AdminStatCard
            icon="today"
            label="Hoy"
            value={stats.compras_hoy}
            variant="flush"
            className={styles.statCard}
          />
          <AdminStatCard
            icon="attach_money"
            label="Gasto del mes"
            value={`$${parseFloat(stats.gasto_mes).toLocaleString('es-AR')}`}
            tone="warning"
            variant="flush"
            className={styles.statCard}
          />
          <AdminStatCard
            icon="warning"
            label="Stock Bajo"
            value={stockBajo.length}
            tone={stockBajo.length > 0 ? 'danger' : 'success'}
            variant="flush"
            className={styles.statCard}
          />
          <AdminStatCard
            icon="local_shipping"
            label="Proveedores"
            value="Activos"
            variant="flush"
            className={styles.statCard}
          />
        </div>
      ) : (
        <div className={styles.statsLoading} />
      )}

      {/* Tabs */}
      <div className={styles.tabsBar}>
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

      {/* Tab: Compras */}
      {activeTab === 'compras' && (
        <>
          {/* Filtros */}
          <div className={styles.filterBar}>
            <div className={styles.filterRow}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Fecha Desde</label>
                <input
                  type="date"
                  className={styles.filterInput}
                  value={filtros.fecha_inicio || ''}
                  onChange={(e) => {
                    setFiltros((prev) => ({ ...prev, fecha_inicio: e.target.value || undefined }));
                    setOffset(0);
                  }}
                />
              </div>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Fecha Hasta</label>
                <input
                  type="date"
                  className={styles.filterInput}
                  value={filtros.fecha_fin || ''}
                  onChange={(e) => {
                    setFiltros((prev) => ({ ...prev, fecha_fin: e.target.value || undefined }));
                    setOffset(0);
                  }}
                />
              </div>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Estado</label>
                <select
                  className={styles.filterSelect}
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
              </div>
              <div className={styles.filterGroupWide}>
                <label className={styles.filterLabel}>Buscar (Nro. Compra)</label>
                <input
                  type="text"
                  className={styles.filterInput}
                  placeholder="Ej: C-00001 o nombre proveedor"
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    setOffset(0);
                  }}
                />
              </div>
              <button className={styles.clearButton} onClick={handleLimpiarFiltros}>
                <span className="material-icons">clear</span>
                Limpiar
              </button>
            </div>
          </div>

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
                        <tr key={row.id}>
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
              <div className={styles.pagination}>
                <span>
                  Mostrando {comprasTable.getRowModel().rows.length} de {total} compras
                </span>
                <div className={styles.paginationControls}>
                  <button
                    className={styles.paginationBtn}
                    onClick={() => comprasTable.previousPage()}
                    disabled={!comprasTable.getCanPreviousPage()}
                  >
                    ← Anterior
                  </button>
                  <span>Página {comprasTable.getState().pagination.pageIndex + 1} de {comprasTable.getPageCount()}</span>
                  <button
                    className={styles.paginationBtn}
                    onClick={() => comprasTable.nextPage()}
                    disabled={!comprasTable.getCanNextPage()}
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
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
            <div className={styles.tableWrapper}>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndStock}>
                <table className={styles.table}>
                  <thead>
                    {stockTable.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        <SortableContext items={stockColumnOrder} strategy={horizontalListSortingStrategy}>
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
                    {stockTable.getRowModel().rows.map((row) => (
                      <tr key={row.id}>
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
          )}
        </div>
      )}

      {/* Modales */}
      {mostrarRegistrar && (
        <React.Suspense fallback={null}>
          <RegistrarCompraModal onClose={() => setMostrarRegistrar(false)} onRegistrada={handleRegistrada} />
        </React.Suspense>
      )}

      {idDetalleAbierto && (
        <DetalleCompraModal
          idCompra={idDetalleAbierto}
          onClose={() => setIdDetalleAbierto(null)}
          onAnularClick={(id, nro) => {
            setIdDetalleAbierto(null);
            setAnularModal({ id, nro });
          }}
        />
      )}

      {anularModal && (
        <AnularCompraModal
          idCompra={anularModal.id}
          nroCompra={anularModal.nro}
          onClose={() => setAnularModal(null)}
          onAnulada={handleAnulada}
        />
      )}
    </div>
  );
});

GestionCompras.displayName = 'GestionCompras';

export default GestionCompras;
