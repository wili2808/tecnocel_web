import React, { useState, useCallback, useEffect, useRef, memo, useMemo } from 'react';
import envioAdminService from '../../../services/envioAdminService';
import { useNotification } from '../../../contexts/NotificationContext';
import { ESTADO_ENVIO_LABELS } from '../../../types/envio';
import { AdminSearch, AdminPagination, AdminSurface } from '../common';
import GestionRetirosModal from './GestionRetirosModal';
import styles from './GestionVentas.module.css';
import type { EnvioAdminListItem, FiltrosEnviosAdmin, EstadoEnvio } from '../../../types/envio';

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

const LIMIT = 10;

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const ESTADO_COLORS: Partial<Record<string, string>> = {
  pendiente: styles.estadoPendiente,
  no_aplica: styles.estadoPendiente,
  entregado: styles.estadoEntregado,
};

// 'no_aplica' es el estado legacy de retiros creados antes de la feature;
// se muestra como "Pendiente" para el personal del local
const getEstadoLabel = (estado: string): string => {
  if (estado === 'no_aplica') return ESTADO_ENVIO_LABELS.pendiente;
  return ESTADO_ENVIO_LABELS[estado as EstadoEnvio] ?? estado;
};

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

interface GestionRetirosProps {
  onPendientesChange?: (count: number) => void;
}

const GestionRetiros: React.FC<GestionRetirosProps> = memo(({ onPendientesChange }) => {
  const { showNotification } = useNotification();

  const [retiros, setRetiros] = useState<EnvioAdminListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const [filtros, setFiltros] = useState<Omit<FiltrosEnviosAdmin, 'tipo_entrega'>>({});

  const [retiroSeleccionado, setRetiroSeleccionado] = useState<EnvioAdminListItem | null>(null);

  const [columnOrder, setColumnOrder] = useState<string[]>([
    'nro_venta', 'cliente', 'fecha', 'estado'
  ]);

  const pagination = useMemo<PaginationState>(() => ({
    pageIndex: Math.floor(offset / LIMIT),
    pageSize: LIMIT,
  }), [offset]);

  const setPagination = useCallback((updater: any) => {
    const nextPagination = typeof updater === 'function' ? updater(pagination) : updater;
    setOffset(nextPagination.pageIndex * LIMIT);
  }, [pagination]);

  const cargandoRef = useRef(false);

  const cargarRetiros = useCallback(
    async (f: Omit<FiltrosEnviosAdmin, 'tipo_entrega'>, off: number) => {
      if (cargandoRef.current) return;
      cargandoRef.current = true;
      setCargando(true);
      setError(null);
      try {
        const result = await envioAdminService.listarRetiros({ ...f, limit: LIMIT, offset: off });
        setRetiros(result.data);
        setTotal(result.total);

        if (f.estado_envio === 'pendiente') {
          onPendientesChange?.(result.total);
        } else {
          envioAdminService
            .listarRetiros({ estado_envio: 'pendiente', limit: 1, offset: 0 })
            .then((r) => onPendientesChange?.(r.total))
            .catch(() => {
              /* no crítico */
            });
        }
      } catch {
        setError('Error al cargar los retiros');
        showNotification('Error al cargar los retiros', 'error');
      } finally {
        setCargando(false);
        cargandoRef.current = false;
      }
    },
    [onPendientesChange, showNotification],
  );

  useEffect(() => {
    cargarRetiros(filtros, offset);
  }, [filtros, offset, cargarRetiros]);



  const limpiarFiltros = () => {
    setOffset(0);
    setFiltros({});
  };

  const handleEntregado = () => {
    setRetiroSeleccionado(null);
    cargarRetiros(filtros, offset);
  };

  // === Columnas TanStack ===
  const columns = useMemo<ColumnDef<EnvioAdminListItem>[]>(() => [
    {
      accessorKey: 'nro_venta',
      id: 'nro_venta',
      header: 'Nro. Venta',
      cell: info => <strong>#{info.getValue() as string}</strong>,
    },
    {
      accessorKey: 'nombre_cliente',
      id: 'cliente',
      header: 'Cliente',
      cell: info => info.getValue() ? (info.getValue() as string) : <em className={styles.sinDatos}>Sin cliente</em>,
    },
    {
      accessorKey: 'fyh_creacion',
      id: 'fecha',
      header: 'Fecha venta',
      cell: info => formatFecha(info.getValue() as string),
    },
    {
      accessorKey: 'estado_envio',
      id: 'estado',
      header: 'Estado retiro',
      cell: info => {
        const estado = info.getValue() as string;
        return (
          <span className={`${styles.estadoBadge} ${ESTADO_COLORS[estado] ?? ''}`}>
            {getEstadoLabel(estado)}
          </span>
        );
      },
    },
  ], []);

  const table = useReactTable({
    data: retiros,
    columns,
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

  if (error) return <div className={styles.errorMsg}>{error}</div>;

  return (
    <div>
      {/* Filtros - Usando Sistema Global */}
      <AdminSurface className="admin-filter-shell" tone="muted">
        <div className="admin-filter-rows">
          <div className="admin-filter-row-top">
            <div className="admin-filter-group">
              <label className="admin-filter-label">Desde</label>
              <input
                type="date"
                value={filtros.fecha_inicio ?? ''}
                onChange={(e) => setFiltros((prev) => ({ ...prev, fecha_inicio: e.target.value || undefined }))}
                className={styles.filterInput}
              />
            </div>
            <div className="admin-filter-group">
              <label className="admin-filter-label">Hasta</label>
              <input
                type="date"
                value={filtros.fecha_fin ?? ''}
                onChange={(e) => setFiltros((prev) => ({ ...prev, fecha_fin: e.target.value || undefined }))}
                className={styles.filterInput}
              />
            </div>
            <div className="admin-filter-group">
              <label className="admin-filter-label">Estado</label>
              <select
                value={filtros.estado_envio ?? ''}
                onChange={(e) =>
                  setFiltros((prev) => ({ ...prev, estado_envio: (e.target.value as EstadoEnvio) || undefined }))
                }
                className={styles.filterSelect}
              >
                <option value="">Todos los estados</option>
                <option value="pendiente">{ESTADO_ENVIO_LABELS.pendiente}</option>
                <option value="entregado">{ESTADO_ENVIO_LABELS.entregado}</option>
              </select>
            </div>
          </div>

          <div className="admin-search-form">
            <div className="admin-search-wrapper">
              <label className="admin-filter-label">Búsqueda</label>
              <AdminSearch
                value={filtros.search || ''}
                placeholder="Buscar por nro. venta o cliente..."
                onChange={(val) => {
                  setFiltros((prev) => ({ ...prev, search: val || undefined }));
                  setOffset(0);
                }}
              />
            </div>
            <div className="admin-action-row">
              <button onClick={limpiarFiltros} className={styles.clearButton}>
                <span className="material-icons">backspace</span>
                <span>Limpiar</span>
              </button>
            </div>
          </div>
        </div>
      </AdminSurface>

      {/* Tabla */}
      {cargando ? (
        <div className={styles.loadingMsg}>Cargando retiros...</div>
      ) : retiros.length === 0 ? (
        <div className={styles.emptyMsg}>No se encontraron pedidos de retiro en tienda.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <table className={styles.tabla}>
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
                {table.getRowModel().rows.map((row) => (
                  <tr 
                    key={row.id}
                    onClick={() => setRetiroSeleccionado(row.original)}
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
      )}

      {/* Paginación */}
      <AdminPagination
        total={total}
        limit={LIMIT}
        offset={offset}
        onPageChange={setOffset}
        itemLabel="retiros"
      />

      {/* Modal */}
      {retiroSeleccionado && (
        <GestionRetirosModal
          retiro={retiroSeleccionado}
          onClose={() => setRetiroSeleccionado(null)}
          onEntregado={handleEntregado}
        />
      )}
    </div>
  );
});

export default GestionRetiros;
