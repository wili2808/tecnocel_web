import React, { useState, useCallback, useEffect, useRef, memo, useMemo } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import envioAdminService from '../../../services/envioAdminService';
import { ESTADO_ENVIO_LABELS } from '../../../types/envio';
import { AdminSearch } from '../common';
import GestionEnviosModal from './GestionEnviosModal';
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

const LIMIT = 20;

const formatFecha = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const ESTADO_COLORS: Record<EstadoEnvio, string> = {
  pendiente: styles.estadoPendiente,
  en_preparacion: styles.estadoEnPreparacion,
  en_camino: styles.estadoEnCamino,
  entregado: styles.estadoEntregado,
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

interface GestionEnviosProps {
  onPendientesChange?: (count: number) => void;
  puedeGestionar?: boolean;
}

const GestionEnvios: React.FC<GestionEnviosProps> = memo(({ onPendientesChange, puedeGestionar = true }) => {
  const { showNotification } = useNotification();

  const [envios, setEnvios] = useState<EnvioAdminListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const [filtros, setFiltros] = useState<FiltrosEnviosAdmin>({});

  const [envioSeleccionado, setEnvioSeleccionado] = useState<EnvioAdminListItem | null>(null);

  const [columnOrder, setColumnOrder] = useState<string[]>([
    'nro_venta', 'cliente', 'direccion', 'fecha', 'estado', 'seguimiento', 'acciones'
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

  const cargarEnvios = useCallback(
    async (f: FiltrosEnviosAdmin, off: number) => {
      if (cargandoRef.current) return;
      cargandoRef.current = true;
      setCargando(true);
      setError(null);
      try {
        const result = await envioAdminService.listarEnvios({ ...f, limit: LIMIT, offset: off });
        setEnvios(result.data);
        setTotal(result.total);

        if (f.estado_envio === 'pendiente') {
          onPendientesChange?.(result.total);
        } else {
          envioAdminService
            .listarEnvios({ estado_envio: 'pendiente', limit: 1, offset: 0 })
            .then((r) => onPendientesChange?.(r.total))
            .catch(() => {
              /* no crítico */
            });
        }
      } catch {
        setError('Error al cargar los envíos');
        showNotification('Error al cargar los envíos', 'error');
      } finally {
        setCargando(false);
        cargandoRef.current = false;
      }
    },
    [onPendientesChange, showNotification],
  );

  useEffect(() => {
    cargarEnvios(filtros, offset);
  }, [filtros, offset, cargarEnvios]);



  const limpiarFiltros = () => {
    setOffset(0);
    setFiltros({});
  };

  const handleEstadoActualizado = () => {
    setEnvioSeleccionado(null);
    cargarEnvios(filtros, offset);
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
      id: 'direccion',
      header: 'Dirección destino',
      cell: info => {
        const e = info.row.original;
        return (
          <span className={styles.direccion}>
            {[e.envio_calle, e.envio_numero, e.envio_ciudad, e.envio_provincia]
              .filter(Boolean)
              .join(', ') || '—'}
          </span>
        );
      },
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
      header: 'Estado envío',
      cell: info => {
        const estado = info.getValue() as EstadoEnvio;
        return (
          <span className={`${styles.estadoBadge} ${ESTADO_COLORS[estado]}`}>
            {ESTADO_ENVIO_LABELS[estado]}
          </span>
        );
      },
    },
    {
      accessorKey: 'nro_seguimiento',
      id: 'seguimiento',
      header: 'Nro. seguimiento',
      cell: info => (
        <span className={styles.nroSeguimiento}>
          {info.getValue() ? (info.getValue() as string) : <em className={styles.sinDatos}>—</em>}
        </span>
      ),
    },
    {
      id: 'acciones',
      header: 'Acciones',
      cell: info => {
        const envio = info.row.original;
        return (
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              className={envio.estado_envio !== 'entregado' ? styles.btnPrimario : styles.btnSecundario}
              onClick={() => setEnvioSeleccionado(envio)}
              disabled={envio.estado_envio !== 'entregado' && !puedeGestionar}
              title={
                envio.estado_envio !== 'entregado'
                  ? !puedeGestionar
                    ? 'Sin permisos para gestionar envíos'
                    : 'Gestionar estado'
                  : 'Ver detalle del envío'
              }
            >
              {envio.estado_envio !== 'entregado' ? 'Gestionar' : 'Ver detalle'}
            </button>
          </div>
        );
      },
    }
  ], [puedeGestionar]);

  const table = useReactTable({
    data: envios,
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
      {/* Filtros */}
      <div className={styles.filtrosBar}>
        <select
          value={filtros.estado_envio ?? ''}
          onChange={(e) =>
            setFiltros((prev) => ({ ...prev, estado_envio: (e.target.value as EstadoEnvio) || undefined }))
          }
          className={styles.filtroSelect}
        >
          <option value="">Todos los estados</option>
          {(Object.keys(ESTADO_ENVIO_LABELS) as EstadoEnvio[]).map((est) => (
            <option key={est} value={est}>
              {ESTADO_ENVIO_LABELS[est]}
            </option>
          ))}
        </select>

        <AdminSearch
          value={filtros.search || ''}
          placeholder="Buscar por nro. venta o cliente..."
          onChange={(val) => {
            setFiltros((prev) => ({ ...prev, search: val || undefined }));
            setOffset(0);
          }}
        />

        <input
          type="date"
          value={filtros.fecha_inicio ?? ''}
          onChange={(e) => setFiltros((prev) => ({ ...prev, fecha_inicio: e.target.value || undefined }))}
          className={styles.filtroFecha}
        />
        <input
          type="date"
          value={filtros.fecha_fin ?? ''}
          onChange={(e) => setFiltros((prev) => ({ ...prev, fecha_fin: e.target.value || undefined }))}
          className={styles.filtroFecha}
        />

        <button onClick={limpiarFiltros} className={styles.btnLimpiar}>
          Limpiar
        </button>
      </div>

      {/* Tabla */}
      {cargando ? (
        <div className={styles.loadingMsg}>Cargando envíos...</div>
      ) : envios.length === 0 ? (
        <div className={styles.emptyMsg}>No se encontraron envíos a domicilio.</div>
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

      {/* Paginación */}
      {total > LIMIT && (
        <div className={styles.paginacion}>
          <span>
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()} ({total} envíos)
          </span>
          <div className={styles.paginacionBtns}>
            <button
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
              className={styles.btnPag}
            >
              ← Anterior
            </button>
            <button
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
              className={styles.btnPag}
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {envioSeleccionado && (
        <GestionEnviosModal
          envio={envioSeleccionado}
          onClose={() => setEnvioSeleccionado(null)}
          onActualizado={handleEstadoActualizado}
        />
      )}
    </div>
  );
});

export default GestionEnvios;
