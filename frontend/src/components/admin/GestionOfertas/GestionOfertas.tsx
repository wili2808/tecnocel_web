/**
 * Componente GestionOfertas - CRUD completo de ofertas desde el admin
 * Lista, busca, crea, edita y elimina ofertas del sistema
 * Refactorizado con TanStack Table v8 y dnd-kit.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import adminOfertaService from '../../../services/adminOfertaService';
import OfertaForm from './OfertaForm';
import type { OfertaConConteo, OfertaConProductos } from '../../../types';
import {
  AdminEmptyState,
  AdminSectionActions,
  AdminSurface,
  AdminSearch,
} from '../common';
import styles from './GestionOfertas.module.css';

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import type { ColumnDef, SortingState, PaginationState } from '@tanstack/react-table';

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

type FiltroEstado = 'todas' | 'activas' | 'inactivas' | 'expiradas';

const ITEMS_PER_PAGE = 20;

/** Determina el estado visual de una oferta basado en activo y fechas */
const getEstadoOferta = (oferta: OfertaConConteo) => {
  if (!oferta.activo) return { label: 'Inactiva', className: styles.estadoInactiva };
  const now = new Date();
  const inicio = new Date(oferta.fecha_inicio);
  const fin = new Date(oferta.fecha_fin);
  if (now < inicio) return { label: 'Programada', className: styles.estadoProgramada };
  if (now > fin) return { label: 'Expirada', className: styles.estadoExpirada };
  return { label: 'Activa', className: styles.estadoActiva };
};

/** Formatea una fecha ISO a formato legible */
const formatFecha = (fecha: string) => {
  return new Date(fecha).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
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

const GestionOfertas = () => {
  const { tienePermiso } = useAuth();
  const { showNotification } = useNotification();
  const puedeVer = tienePermiso('ver_ofertas');
  const puedeCrear = tienePermiso('crear_oferta');
  const puedeEditar = tienePermiso('editar_oferta');
  const puedeEliminar = tienePermiso('eliminar_oferta');

  // Estado del modal
  const [showCrearForm, setShowCrearForm] = useState(false);
  const [editandoOferta, setEditandoOferta] = useState<OfertaConProductos | null>(null);
  const [modoModal, setModoModal] = useState<'crear' | 'editar'>('crear');

  // Estado de la lista
  const [allOfertas, setAllOfertas] = useState<OfertaConConteo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Búsqueda, filtros y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todas');

  // Estados TanStack
  const [sorting, setSorting] = useState<SortingState>([{ id: 'nombre_oferta', desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: ITEMS_PER_PAGE });
  const [columnOrder, setColumnOrder] = useState<string[]>([
    'nombre_oferta', 'tipo_descuento', 'valor_descuento', 'fecha_inicio', 'fecha_fin', 'productos', 'activo'
  ]);

  // 1. Filtrar por búsqueda y estado
  const filteredOfertas = useMemo(() => {
    let result = allOfertas;

    // Filtro por búsqueda (nombre)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(o => o.nombre_oferta.toLowerCase().includes(term));
    }

    // Filtro por estado
    if (filtroEstado !== 'todas') {
      result = result.filter(o => {
        const estado = getEstadoOferta(o);
        switch (filtroEstado) {
          case 'activas': return estado.label === 'Activa';
          case 'inactivas': return estado.label === 'Inactiva';
          case 'expiradas': return estado.label === 'Expirada';
          default: return true;
        }
      });
    }

    return result;
  }, [allOfertas, searchTerm, filtroEstado]);

  const cargarOfertas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminOfertaService.listarOfertas();
      setAllOfertas(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar ofertas');
      showNotification(err.message || 'Error al cargar ofertas', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    cargarOfertas();
  }, [cargarOfertas]);

  const handleEditarOferta = useCallback(async (oferta: OfertaConConteo) => {
    if (!puedeEditar) {
      showNotification('No tienes permisos para editar ofertas', 'error');
      return;
    }
    try {
      const data = await adminOfertaService.obtenerOferta(oferta.id_oferta);
      setEditandoOferta(data);
      setModoModal('editar');
      setShowCrearForm(true);
    } catch {
      showNotification('Error al cargar oferta para editar', 'error');
    }
  }, [puedeEditar, showNotification]);

  const handleEliminarOferta = useCallback(async (id: number, nombre: string) => {
    if (!puedeEliminar) {
      showNotification('No tienes permisos para eliminar ofertas', 'error');
      return;
    }

    if (!confirm(`¿Estás seguro de desactivar la oferta "${nombre}"?`)) {
      return;
    }

    try {
      await adminOfertaService.eliminarOferta(id);
      showNotification('Oferta desactivada exitosamente', 'success');
      setShowCrearForm(false);
      setEditandoOferta(null);
      cargarOfertas();
    } catch (err: any) {
      showNotification(err.message || 'Error al eliminar oferta', 'error');
    }
  }, [puedeEliminar, showNotification, cargarOfertas]);

  const handleGuardado = () => {
    setShowCrearForm(false);
    setEditandoOferta(null);
    setModoModal('crear');
    cargarOfertas();
  };

  const handleCancelar = () => {
    setShowCrearForm(false);
    setEditandoOferta(null);
    setModoModal('crear');
  };

  // --- Columnas ---
  const columns = useMemo<ColumnDef<OfertaConConteo>[]>(() => [
    {
      accessorKey: 'nombre_oferta',
      id: 'nombre_oferta',
      header: 'Nombre',
      cell: info => info.getValue() as string,
    },
    {
      accessorKey: 'tipo_descuento',
      id: 'tipo_descuento',
      header: 'Tipo',
      cell: info => (
        <span className={styles.tipoBadge}>
          {info.getValue() === 'porcentaje' ? 'Porcentaje' : 'Monto Fijo'}
        </span>
      ),
    },
    {
      accessorKey: 'valor_descuento',
      id: 'valor_descuento',
      header: 'Valor',
      cell: info => {
        const oferta = info.row.original;
        return (
          <span className={styles.valorCell}>
            {oferta.tipo_descuento === 'porcentaje'
              ? `${oferta.valor_descuento}%`
              : `$ ${oferta.valor_descuento}`
            }
          </span>
        );
      },
    },
    {
      accessorFn: row => new Date(row.fecha_inicio).getTime(),
      id: 'fecha_inicio',
      header: 'Inicio',
      cell: info => formatFecha(info.row.original.fecha_inicio),
    },
    {
      accessorFn: row => new Date(row.fecha_fin).getTime(),
      id: 'fecha_fin',
      header: 'Fin',
      cell: info => formatFecha(info.row.original.fecha_fin),
    },
    {
      id: 'productos',
      header: 'Productos',
      enableSorting: false,
      cell: info => (
        <span className={styles.productosCount}>
          {info.row.original.productos_count ?? '-'}
        </span>
      )
    },
    {
      accessorFn: row => row.activo ? 1 : 0,
      id: 'activo',
      header: 'Estado',
      cell: info => {
        const estado = getEstadoOferta(info.row.original);
        return (
          <span className={`${styles.estadoBadge} ${estado.className}`}>
            {estado.label}
          </span>
        );
      }
    }
  ], []);

  const table = useReactTable({
    data: filteredOfertas,
    columns,
    state: {
      sorting,
      pagination,
      columnOrder,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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

  // Vista de lista
  if (!puedeVer) {
    return (
      <div className={styles.container}>
        <AdminEmptyState
          icon="lock"
          title="Sin acceso a ofertas"
          message="No tienes permisos para administrar promociones, vigencias ni descuentos."
          tone="warning"
        />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <AdminSectionActions
        lead={null}
        actions={(
          <button
            className={styles.crearButton}
            onClick={() => {
              setModoModal('crear');
              setEditandoOferta(null);
              setShowCrearForm(true);
            }}
            disabled={!puedeCrear}
            title={!puedeCrear ? 'Sin permisos para crear ofertas' : undefined}
          >
            <span className="material-icons">add_box</span>
            <span>Nueva Oferta</span>
          </button>
        )}
      />

      {/* Barra de búsqueda y filtro */}
      <AdminSurface className={styles.filterShell} tone="muted">
        <div className={styles.filterRow}>
            <AdminSearch
              value={searchTerm}
              placeholder="Buscar por nombre de oferta..."
              onChange={(val) => { 
                setSearchTerm(val); 
                table.setPageIndex(0); 
              }}
              delay={0}
            />
          <select
            value={filtroEstado}
            onChange={(e) => { 
              setFiltroEstado(e.target.value as FiltroEstado); 
              table.setPageIndex(0); 
            }}
            className={styles.filterSelect}
          >
            <option value="todas">Todas</option>
            <option value="activas">Activas</option>
            <option value="inactivas">Inactivas</option>
            <option value="expiradas">Expiradas</option>
          </select>
        </div>
      </AdminSurface>

      {/* Estado de carga */}
      {loading && (
        <AdminEmptyState
          icon="hourglass_empty"
          title="Cargando ofertas"
          message="Estamos recuperando las campañas y descuentos disponibles."
          className={styles.stateBlock}
        />
      )}

      {/* Error */}
      {error && !loading && (
        <AdminEmptyState
          icon="error_outline"
          title="No pudimos cargar las ofertas"
          message={error}
          actionLabel="Reintentar"
          onAction={cargarOfertas}
          tone="danger"
          className={styles.stateBlock}
        />
      )}

      {/* Tabla de ofertas */}
      {!loading && !error && (
        <>
          <div className={styles.tableInfo}>
            <span>{filteredOfertas.length} oferta{filteredOfertas.length !== 1 ? 's' : ''} encontrada{filteredOfertas.length !== 1 ? 's' : ''}</span>
          </div>

          <div className={styles.tableWrapper}>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <table className={styles.table}>
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                        {headerGroup.headers.map(header => (
                          <DraggableTableHeader 
                            key={header.id} 
                            header={header} 
                            className={header.column.getCanSort() ? styles.sortableHeader : undefined}
                          />
                        ))}
                      </SortableContext>
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className={styles.emptyMessage}>
                        {searchTerm || filtroEstado !== 'todas'
                          ? 'No se encontraron ofertas con los filtros aplicados'
                          : 'No hay ofertas registradas'}
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr 
                        key={row.id}
                        onClick={() => handleEditarOferta(row.original)}
                        className={styles.clickableRow}
                      >
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id} className={cell.column.id === 'valor_descuento' ? styles.valorCell : undefined}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </DndContext>
          </div>

          {/* Paginación */}
          {table.getPageCount() > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className={styles.pageButton}
              >
                <span className="material-icons">chevron_left</span>
              </button>
              <span className={styles.pageInfo}>
                Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
              </span>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className={styles.pageButton}
              >
                <span className="material-icons">chevron_right</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal para crear/editar oferta */}
      {showCrearForm && (
        <OfertaForm
          oferta={editandoOferta}
          onCancelar={handleCancelar}
          onGuardado={handleGuardado}
          onEliminar={editandoOferta ? () => handleEliminarOferta(editandoOferta.id_oferta, editandoOferta.nombre_oferta) : undefined}
          modo={modoModal}
          isModal={true}
        />
      )}
    </div>
  );
};

export default GestionOfertas;
